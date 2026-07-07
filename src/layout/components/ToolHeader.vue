<script lang="tsx">
import { defineComponent, computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElBadge, ElButton, ElInput, ElPopover } from 'element-plus'
import { Message } from '@/layout/components//Message'
import { Collapse } from '@/layout/components/Collapse'
import { UserInfo } from '@/layout/components/UserInfo'
import { Screenfull } from '@/layout/components/Screenfull'
import { Breadcrumb } from '@/layout/components/Breadcrumb'
import { SizeDropdown } from '@/layout/components/SizeDropdown'
import { LocaleDropdown } from '@/layout/components/LocaleDropdown'
import RouterSearch from '@/components/RouterSearch/index.vue'
import TenantVisit from '@/layout/components/TenantVisit/index.vue'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'
import { checkPermi } from '@/utils/permission'
import { getExportTaskReminderSummary, markExportTaskCenterViewed } from '@/api/system/exportTask'
import { getOtherSettingConfig } from '@/api/crm/otherSettingConfig'
import { updateUserOutboundStatus, updateUserProfile } from '@/api/system/user/profile'
import { getOutboundRouteSimpleList, type OutboundRouteVO } from '@/api/system/call/router'
import { useBrowserPhone } from '@/hooks/web/useBrowserPhone'
import { useOutboundDial } from '@/hooks/web/useOutboundDial'
import { useEmitt } from '@/hooks/web/useEmitt'
import ToolHeaderDialer from './ToolHeaderDialer.vue'

const { getPrefixCls, variables } = useDesign()

const prefixCls = getPrefixCls('tool-header')

const appStore = useAppStore()

// 面包屑
const breadcrumb = computed(() => appStore.getBreadcrumb)

// 折叠图标
const hamburger = computed(() => appStore.getHamburger)

// 全屏图标
const screenfull = computed(() => appStore.getScreenfull)

// 搜索图片
const search = computed(() => appStore.search)

// 尺寸图标
const size = computed(() => appStore.getSize)

// 布局
const layout = computed(() => appStore.getLayout)

// 多语言图标
const locale = computed(() => appStore.getLocale)

// 消息图标
const message = computed(() => appStore.getMessage)

// 租户切换权限
const hasTenantVisitPermission = computed(
    () => import.meta.env.VITE_APP_TENANT_ENABLE === 'true' && checkPermi(['system:tenant:visit'])
)
const hasExportTaskPermission = ref(true)
const hasOtherSettingConfigPermission = computed(() =>
    checkPermi(['crm:other-setting-config:query'])
)

export default defineComponent({
    name: 'ToolHeader',
    setup() {
        const { push } = useRouter()
        const dialerMobile = ref('')
        const dialerRef = ref<InstanceType<typeof ToolHeaderDialer>>()
        const dialerInputRef = ref()
        const newExportTaskCount = ref(0)
        const outboundStatus = ref(0)
        const outboundStatusLoading = ref(false)
        const outboundRouteSaving = ref(false)
        const outboundRoutePopoverVisible = ref(false)
        const outboundRouteOptions = ref<OutboundRouteVO[]>([])
        const selectedOutboundRouteId = ref<number | undefined>()
        const systemOutboundRouteId = ref<number | undefined>()
        let exportTaskTimer: number | undefined
        const messageApi = useMessage()
        const {
            profile,
            browserLoading,
            browserRegistered,
            browserStatus,
            activeCall,
            incomingCall,
            browserHangupPending,
            browserCallStarting,
            formattedCallDuration,
            connectBrowserPhone,
            disconnectBrowserPhone,
            hangupBrowserCall,
            applyBrowserPhoneCredentials,
            reloadProfile
        } = useBrowserPhone()
        const { dialing: outboundDialing, dialOutboundMobile } = useOutboundDial()

        const resolveSeatExtension = () => {
            const seat = String(profile.callExt || profile.callNo || '').trim()
            return /^\d+$/.test(seat) ? seat : ''
        }

        const ensureSeatBound = async () => {
            await reloadProfile()
            const seat = resolveSeatExtension()
            if (!seat) {
                throw new Error('当前未绑定坐席，请联系管理员绑定坐席')
            }
            applyBrowserPhoneCredentials({
                username: seat,
                password: String(profile.callPassword || '').trim()
            })
            return seat
        }

        const outboundSignedIn = computed(
            () => outboundStatus.value === 1 && browserRegistered.value
        )
        const outboundStatusLabel = computed(() => {
            if (browserStatus.value === '通话中') return '通话中'
            if (browserStatus.value === '呼叫中') return '呼叫中'
            if (browserStatus.value === '来电响铃') return '来电响铃'
            if (browserStatus.value === '挂断中') return '挂断中'
            if (
                browserStatus.value === '已挂断' ||
                browserStatus.value === '对方已挂断' ||
                browserStatus.value === '来电已取消'
            ) {
                return browserStatus.value
            }
            return outboundSignedIn.value ? '已连接' : '未连接'
        })
        const outboundStatusActionLabel = computed(() => (outboundSignedIn.value ? '签出' : '签入'))
        const availableOutboundRouteOptions = computed(() => {
            const currentId =
                Number(
                    selectedOutboundRouteId.value ||
                        profile.outboundRouteId ||
                        systemOutboundRouteId.value ||
                        0
                ) || 0
            return outboundRouteOptions.value.filter(
                (item) =>
                    (item.status === 0 || Number(item.id) === currentId) &&
                    Number(item.id) !== Number(systemOutboundRouteId.value || 0)
            )
        })
        const effectiveOutboundRouteId = computed(
            () => selectedOutboundRouteId.value || systemOutboundRouteId.value
        )
        const effectiveOutboundRoute = computed(() =>
            outboundRouteOptions.value.find(
                (item) => Number(item.id) === Number(effectiveOutboundRouteId.value)
            )
        )
        const outboundRouteTriggerText = computed(
            () => effectiveOutboundRoute.value?.name || '系统默认线路'
        )
        const dialerStatusType = computed(() => {
            if (browserStatus.value === '通话中') return 'inCall'
            if (browserStatus.value === '呼叫中' || browserStatus.value === '来电响铃')
                return 'ringing'
            if (browserStatus.value === '挂断中') return 'dialing'
            if (
                browserStatus.value === '已挂断' ||
                browserStatus.value === '对方已挂断' ||
                browserStatus.value === '来电已取消'
            ) {
                return 'hungup'
            }
            if (browserStatus.value === '已注册') return 'registered'
            if (browserStatus.value === '连接失败') return 'failed'
            return 'idle'
        })
        const dialerStatusMessage = computed(() => {
            if (browserStatus.value === '通话中') {
                return dialerMobile.value ? `正在与 ${dialerMobile.value} 通话` : '当前通话已接通'
            }
            if (browserStatus.value === '呼叫中') {
                return dialerMobile.value ? `正在呼叫 ${dialerMobile.value}` : '正在等待对方接听'
            }
            if (browserStatus.value === '来电响铃') {
                return '当前有来电等待接听，请使用来电浮层处理'
            }
            if (browserStatus.value === '挂断中') {
                return '挂断请求已发送，等待对端确认'
            }
            if (browserStatus.value === '已挂断') {
                return '通话已挂断'
            }
            if (browserStatus.value === '对方已挂断') {
                return '手机端已挂断，通话已结束'
            }
            if (browserStatus.value === '来电已取消') {
                return '对方已取消来电'
            }
            if (outboundSignedIn.value) {
                return '浏览器分机已注册，支持电脑端通话'
            }
            return resolveSeatExtension()
                ? `点击签入后，将自动注册浏览器分机 ${resolveSeatExtension()}`
                : '当前未绑定坐席，签入前请联系管理员绑定'
        })

        const syncDialerCursor = async () => {
            await nextTick()
            const inputInstance = dialerInputRef.value as any
            const inputEl = inputInstance?.input as HTMLInputElement | undefined
            inputInstance?.focus?.()
            if (inputEl) {
                const position = dialerMobile.value.length
                inputEl.setSelectionRange(position, position)
            }
        }

        const checkExportTaskBadge = async () => {
            if (!hasExportTaskPermission.value) {
                newExportTaskCount.value = 0
                return
            }
            try {
                const data = await getExportTaskReminderSummary()
                newExportTaskCount.value = Number(data?.unreadCount || 0)
            } catch {
                newExportTaskCount.value = 0
            }
        }

        useEmitt({
            name: 'refresh-export-task-reminder',
            callback: checkExportTaskBadge
        })

        const openExportTaskCenter = async () => {
            await markExportTaskCenterViewed()
            newExportTaskCount.value = 0
            await push({ name: 'SystemExportTaskCenter' })
        }

        const loadOutboundProfile = async () => {
            try {
                const [routeList, otherConfig] = await Promise.all([
                    getOutboundRouteSimpleList(),
                    hasOtherSettingConfigPermission.value
                        ? getOtherSettingConfig()
                        : Promise.resolve(undefined),
                    reloadProfile()
                ])
                outboundRouteOptions.value = routeList || []
                systemOutboundRouteId.value = otherConfig?.outboundRouteId
                outboundStatus.value = profile.outboundStatus === 1 ? 1 : 0
                selectedOutboundRouteId.value = profile.outboundRouteId
                const seat = resolveSeatExtension()
                applyBrowserPhoneCredentials({
                    username: seat,
                    password: String(profile.callPassword || '').trim()
                })
                if (
                    outboundStatus.value === 1 &&
                    seat &&
                    !browserRegistered.value &&
                    !browserLoading.value
                ) {
                    await connectBrowserPhone()
                }
            } catch (error) {
                console.warn('[ToolHeader] load outbound profile failed', error)
                outboundStatus.value = 0
            }
        }

        const handleOutboundRouteChange = async (value?: number) => {
            if (outboundRouteSaving.value) {
                return
            }
            outboundRouteSaving.value = true
            try {
                const nextValue = value && value !== systemOutboundRouteId.value ? value : undefined
                await updateUserProfile({ outboundRouteId: nextValue })
                profile.outboundRouteId = nextValue
                selectedOutboundRouteId.value = nextValue
                outboundRoutePopoverVisible.value = false
                messageApi.success(nextValue ? '外呼线路已切换' : '已切换为系统默认线路')
            } catch (error: any) {
                selectedOutboundRouteId.value = profile.outboundRouteId
                messageApi.error(error?.message || '更新外呼线路失败')
            } finally {
                outboundRouteSaving.value = false
            }
        }

        const toggleOutboundStatus = async () => {
            if (outboundStatusLoading.value) {
                return
            }
            const nextStatus = outboundSignedIn.value ? 0 : 1
            outboundStatusLoading.value = true
            try {
                if (nextStatus === 1) {
                    await ensureSeatBound()
                    await connectBrowserPhone()
                    await updateUserOutboundStatus({ outboundStatus: nextStatus })
                } else {
                    await disconnectBrowserPhone(true)
                    await updateUserOutboundStatus({ outboundStatus: nextStatus })
                }
                outboundStatus.value = nextStatus
                profile.outboundStatus = nextStatus
                messageApi.success(nextStatus === 1 ? '已签入外呼' : '已签出外呼')
            } catch (error: any) {
                messageApi.error(error?.message || '更新外呼状态失败')
            } finally {
                outboundStatusLoading.value = false
            }
        }

        const handleBrowserDial = async () => {
            await dialOutboundMobile(dialerMobile.value)
        }

        const handleBrowserHangup = async () => {
            if (
                (!activeCall.value && !incomingCall.value && browserStatus.value !== '呼叫中') ||
                browserHangupPending.value
            ) {
                return
            }
            await hangupBrowserCall()
        }

        onMounted(() => {
            loadOutboundProfile()
            checkExportTaskBadge()
            exportTaskTimer = window.setInterval(() => {
                checkExportTaskBadge()
            }, 1000 * 30)
        })

        onBeforeUnmount(() => {
            if (exportTaskTimer) {
                window.clearInterval(exportTaskTimer)
            }
        })

        return () => (
            <div
                id={`${variables.namespace}-tool-header`}
                class={[
                    prefixCls,
                    'h-[var(--top-tool-height)] relative px-[var(--top-tool-p-x)] flex items-center justify-between',
                    'dark:bg-[var(--el-bg-color)]'
                ]}
            >
                {layout.value !== 'top' ? (
                    <div class="h-full flex items-center">
                        {hamburger.value && layout.value !== 'cutMenu' ? (
                            <Collapse
                                class="custom-hover"
                                color="var(--top-header-text-color)"
                            ></Collapse>
                        ) : undefined}
                        {breadcrumb.value ? (
                            <Breadcrumb class="lt-md:hidden"></Breadcrumb>
                        ) : undefined}
                    </div>
                ) : undefined}
                <div class="h-full flex items-center">
                    <div class="outbound-toolbar lt-lg:hidden">
                        <ToolHeaderDialer
                            ref={dialerRef}
                            v-model={dialerMobile.value}
                            outboundEnabled={outboundSignedIn.value}
                            dialing={browserLoading.value}
                            statusText={outboundStatusLabel.value}
                            statusType={dialerStatusType.value}
                            statusMessage={dialerStatusMessage.value}
                            durationText={formattedCallDuration.value}
                            showDuration={browserStatus.value === '通话中'}
                            onKeypadInput={syncDialerCursor}
                            onDial={handleBrowserDial}
                            onHangup={handleBrowserHangup}
                        >
                            <div class="outbound-toolbar__reference">
                                <div
                                    class={[
                                        'outbound-toolbar__group',
                                        outboundSignedIn.value ? 'is-signed-in' : 'is-signed-out'
                                    ]}
                                >
                                    <ElPopover
                                        visible={outboundRoutePopoverVisible.value}
                                        trigger="click"
                                        placement="bottom"
                                        width={220}
                                        popperClass="outbound-toolbar__route-popper"
                                        onUpdate:visible={(value: boolean) => {
                                            outboundRoutePopoverVisible.value = value
                                        }}
                                    >
                                        {{
                                            reference: () => (
                                                <button
                                                    type="button"
                                                    class="outbound-toolbar__route-trigger"
                                                    onMousedown={(event: MouseEvent) => {
                                                        event.stopPropagation()
                                                    }}
                                                    onClick={(event: MouseEvent) => {
                                                        event.stopPropagation()
                                                    }}
                                                >
                                                    <Icon
                                                        class="outbound-toolbar__route-icon"
                                                        icon="svg-icon:route"
                                                        size={14}
                                                    />
                                                    <span class="outbound-toolbar__route-name">
                                                        {outboundRouteTriggerText.value}
                                                    </span>
                                                </button>
                                            ),
                                            default: () => (
                                                <div class="outbound-toolbar__route-menu">
                                                    {systemOutboundRouteId.value ? (
                                                        <button
                                                            type="button"
                                                            class={[
                                                                'outbound-toolbar__route-option',
                                                                !selectedOutboundRouteId.value &&
                                                                    'is-active'
                                                            ]}
                                                            onClick={() =>
                                                                handleOutboundRouteChange(
                                                                    systemOutboundRouteId.value
                                                                )
                                                            }
                                                        >
                                                            <strong>
                                                                {outboundRouteOptions.value.find(
                                                                    (item) =>
                                                                        Number(item.id) ===
                                                                        Number(
                                                                            systemOutboundRouteId.value
                                                                        )
                                                                )?.name || '未配置'}
                                                            </strong>
                                                            <span>系统默认</span>
                                                        </button>
                                                    ) : undefined}
                                                    {availableOutboundRouteOptions.value.map(
                                                        (item) => (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                class={[
                                                                    'outbound-toolbar__route-option',
                                                                    Number(
                                                                        selectedOutboundRouteId.value
                                                                    ) === Number(item.id) &&
                                                                        'is-active'
                                                                ]}
                                                                onClick={() =>
                                                                    handleOutboundRouteChange(
                                                                        item.id
                                                                    )
                                                                }
                                                            >
                                                                <span>{item.name}</span>
                                                                {Number(
                                                                    systemOutboundRouteId.value
                                                                ) === Number(item.id) ? (
                                                                    <em>默认</em>
                                                                ) : undefined}
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            )
                                        }}
                                    </ElPopover>
                                    <button
                                        type="button"
                                        class="outbound-toolbar__status-action"
                                        onMousedown={(event: MouseEvent) => {
                                            event.stopPropagation()
                                            dialerRef.value?.holdOpen?.()
                                        }}
                                        onClick={(event: MouseEvent) => {
                                            event.stopPropagation()
                                            dialerRef.value?.openDialer?.()
                                            toggleOutboundStatus()
                                        }}
                                        disabled={
                                            outboundStatusLoading.value || browserLoading.value
                                        }
                                    >
                                        {outboundStatusLoading.value
                                            ? '...'
                                            : outboundStatusActionLabel.value}
                                    </button>
                                </div>
                                <ElInput
                                    v-model={dialerMobile.value}
                                    ref={dialerInputRef}
                                    class="outbound-toolbar__input"
                                    placeholder="输入手机号"
                                    clearable
                                    maxlength={20}
                                    onMousedown={(event: MouseEvent) => {
                                        event.stopPropagation()
                                        dialerRef.value?.holdOpen?.()
                                    }}
                                    onFocus={() => {
                                        dialerRef.value?.holdOpen?.(800)
                                        dialerRef.value?.openDialer?.()
                                    }}
                                    onKeydown={(event: KeyboardEvent) => {
                                        if (event.key === 'Enter') {
                                            dialerRef.value?.handleDial()
                                        }
                                    }}
                                />
                                <ElButton
                                    type="primary"
                                    class="outbound-toolbar__button"
                                    disabled={
                                        !outboundSignedIn.value ||
                                        browserCallStarting.value ||
                                        outboundDialing.value
                                    }
                                    loading={browserLoading.value || outboundDialing.value}
                                    onMousedown={(event: MouseEvent) => {
                                        event.stopPropagation()
                                        dialerRef.value?.holdOpen?.(1200)
                                    }}
                                    onClick={(event: MouseEvent) => {
                                        event.stopPropagation()
                                        dialerRef.value?.holdOpen?.(1200)
                                        dialerRef.value?.openDialer?.()
                                        dialerRef.value?.handleDial()
                                    }}
                                >
                                    呼叫
                                </ElButton>
                            </div>
                        </ToolHeaderDialer>
                    </div>
                    {/* {hasTenantVisitPermission.value ? <TenantVisit /> : undefined} */}
                    {screenfull.value ? (
                        <Screenfull
                            class="custom-hover"
                            color="var(--top-header-text-color)"
                        ></Screenfull>
                    ) : undefined}
                    {search.value ? (
                        <RouterSearch isModal={false} color="var(--top-header-text-color)" />
                    ) : undefined}
                    {size.value ? (
                        <SizeDropdown
                            class="custom-hover"
                            color="var(--top-header-text-color)"
                        ></SizeDropdown>
                    ) : undefined}
                    {locale.value ? (
                        <LocaleDropdown
                            class="custom-hover"
                            color="var(--top-header-text-color)"
                        ></LocaleDropdown>
                    ) : undefined}
                    {message.value ? (
                        <Message
                            class="custom-hover"
                            color="var(--top-header-text-color)"
                        ></Message>
                    ) : undefined}
                    {hasExportTaskPermission.value ? (
                        <ElBadge
                            hidden={newExportTaskCount.value <= 0}
                            value={newExportTaskCount.value > 99 ? '99+' : newExportTaskCount.value}
                            class="header-icon-badge"
                        >
                            <div
                                class="custom-hover header-icon-button"
                                onClick={openExportTaskCenter}
                            >
                                <Icon
                                    size={18}
                                    title="下载中心"
                                    class="cursor-pointer"
                                    icon="svg-icon:download"
                                    color="var(--top-header-text-color)"
                                />
                            </div>
                        </ElBadge>
                    ) : undefined}
                    <UserInfo></UserInfo>
                </div>
            </div>
        )
    }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-tool-header;

.#{$prefix-cls} {
    transition: left var(--transition-time-02);
}

.outbound-toolbar {
    display: flex;
    align-items: center;
    gap: 0;
    margin-right: 12px;
    padding: 6px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(245, 247, 250, 0.9));
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow:
        0 10px 24px rgba(15, 23, 42, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(14px);

    &__reference {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    &__group {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 36px;
        padding: 0 6px 0 8px;
        border-radius: 999px;

        &.is-signed-in {
            background: linear-gradient(
                135deg,
                rgba(220, 252, 231, 0.98),
                rgba(187, 247, 208, 0.9)
            );
            box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.18);
        }

        &.is-signed-out {
            background: linear-gradient(
                135deg,
                rgba(255, 247, 237, 0.92),
                rgba(255, 237, 213, 0.82)
            );
            box-shadow: inset 0 0 0 1px rgba(249, 115, 22, 0.1);
        }
    }

    &__status-dot {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        flex: none;
        background: #909399;
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.35);
    }

    &__status-action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 68px;
        height: 28px;
        padding: 0 14px;
        border: none;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.72);
        color: rgba(15, 23, 42, 0.72);
        font-size: 12px;
        font-weight: 600;

        &:disabled {
            cursor: wait;
            opacity: 0.88;
        }
    }

    &__input {
        width: 180px;

        :deep(.el-input__wrapper) {
            border-radius: 999px;
            box-shadow: none;
            background: rgba(255, 255, 255, 0.92);
        }
    }

    &__route-trigger {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 28px;
        max-width: 180px;
        padding: 0 10px 0 2px;
        border: none;
        border-radius: 999px;
        background: transparent;
        color: rgba(51, 65, 85, 0.88);
        cursor: pointer;
    }

    &__route-icon {
        color: rgba(71, 85, 105, 0.82);
    }

    &__route-name {
        max-width: 132px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        font-weight: 600;
    }

    &__route-menu {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    &__route-option {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
        padding: 10px 12px;
        border: 1px solid rgba(148, 163, 184, 0.22);
        border-radius: 12px;
        background: #fff;
        color: #334155;
        cursor: pointer;

        &.is-active {
            border-color: rgba(37, 99, 235, 0.26);
            background: rgba(239, 246, 255, 0.92);
            color: #1d4ed8;
        }

        span {
            color: #64748b;
        }

        strong,
        em {
            font-style: normal;
            font-size: 12px;
            color: inherit;
            opacity: 0.8;
        }
    }

    &__button {
        min-width: 74px;
        border: none;
        border-radius: 999px;
        background: linear-gradient(135deg, #1d4ed8, #0284c7);
        box-shadow: 0 10px 18px rgba(2, 132, 199, 0.24);

        &.is-disabled,
        &[disabled] {
            background: linear-gradient(135deg, #94a3b8, #cbd5e1);
            box-shadow: none;
        }
    }
}

.header-icon-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    :deep(.el-badge__content) {
        border: none;
        box-shadow: 0 6px 14px rgba(239, 68, 68, 0.28);
    }
}

.header-icon-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

:global(.outbound-toolbar__route-popper) {
    z-index: 5001 !important;
    padding: 10px !important;
}

:global(.dark) {
    .outbound-toolbar {
        background: rgba(30, 41, 59, 0.78);
    }
}
</style>
