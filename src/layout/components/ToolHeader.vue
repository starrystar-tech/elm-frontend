<script lang="tsx">
import { defineComponent, computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElBadge, ElButton, ElInput } from 'element-plus'
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
import {
    getExportTaskReminderSummary,
    markExportTaskCenterViewed
} from '@/api/system/exportTask'
import { getUserProfile, updateUserOutboundStatus } from '@/api/system/user/profile'
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
const hasExportTaskPermission = computed(() => checkPermi(['system:export-task:query']))

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
        let exportTaskTimer: number | undefined
        const messageApi = useMessage()

        const outboundSignedIn = computed(() => outboundStatus.value === 1)
        const outboundStatusLabel = computed(() =>
            outboundSignedIn.value ? '外呼已签入' : '外呼已签出'
        )
        const outboundStatusActionLabel = computed(() => (outboundSignedIn.value ? '签出' : '签入'))

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

        const openExportTaskCenter = async () => {
            await markExportTaskCenterViewed()
            newExportTaskCount.value = 0
            await push({ name: 'SystemExportTaskCenter' })
        }

        const loadOutboundProfile = async () => {
            try {
                const profile = await getUserProfile()
                outboundStatus.value = profile?.outboundStatus === 1 ? 1 : 0
            } catch (error) {
                console.warn('[ToolHeader] load outbound profile failed', error)
                outboundStatus.value = 0
            }
        }

        const toggleOutboundStatus = async () => {
            if (outboundStatusLoading.value) {
                return
            }
            const nextStatus = outboundSignedIn.value ? 0 : 1
            outboundStatusLoading.value = true
            try {
                await updateUserOutboundStatus({ outboundStatus: nextStatus })
                outboundStatus.value = nextStatus
                messageApi.success(nextStatus === 1 ? '已签入外呼' : '已签出外呼')
            } catch (error: any) {
                messageApi.error(error?.message || '更新外呼状态失败')
            } finally {
                outboundStatusLoading.value = false
            }
        }

        onMounted(() => {
            loadOutboundProfile()
            checkExportTaskBadge()
            exportTaskTimer = window.setInterval(() => {
                checkExportTaskBadge()
            }, 1000 * 15)
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
                            onKeypadInput={syncDialerCursor}
                        >
                            <div
                                class="outbound-toolbar__reference"
                                onMousedown={(event: MouseEvent) => {
                                    event.stopPropagation()
                                    dialerRef.value?.holdOpen?.()
                                }}
                            >
                                <button
                                    type="button"
                                    class={[
                                        'outbound-toolbar__status',
                                        outboundSignedIn.value ? 'is-signed-in' : 'is-signed-out'
                                    ]}
                                    onMousedown={(event: MouseEvent) => {
                                        event.stopPropagation()
                                        dialerRef.value?.holdOpen?.()
                                    }}
                                    onClick={(event: MouseEvent) => {
                                        event.stopPropagation()
                                        dialerRef.value?.openDialer?.()
                                        toggleOutboundStatus()
                                    }}
                                    disabled={outboundStatusLoading.value}
                                >
                                    <span class="outbound-toolbar__status-dot"></span>
                                    <span class="outbound-toolbar__status-text">
                                        {outboundStatusLabel.value}
                                    </span>
                                    <span class="outbound-toolbar__status-action">
                                        {outboundStatusLoading.value
                                            ? '...'
                                            : outboundStatusActionLabel.value}
                                    </span>
                                </button>
                                <ElInput
                                    v-model={dialerMobile.value}
                                    ref={dialerInputRef}
                                    class="outbound-toolbar__input"
                                    placeholder="输入手机号"
                                    clearable
                                    maxlength={11}
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
                                    disabled={!outboundSignedIn.value}
                                    loading={dialerRef.value?.dialing}
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

    &__status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 152px;
        height: 36px;
        padding: 0 12px;
        border: none;
        border-radius: 999px;
        font-size: 12px;
        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        cursor: pointer;

        &:disabled {
            cursor: wait;
            opacity: 0.88;
        }

        &:not(:disabled):hover {
            transform: translateY(-1px);
        }

        &.is-signed-in {
            color: #0f5132;
            background: linear-gradient(
                135deg,
                rgba(220, 252, 231, 0.98),
                rgba(187, 247, 208, 0.9)
            );
            box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.18);
        }

        &.is-signed-out {
            color: #7c2d12;
            background: linear-gradient(
                135deg,
                rgba(255, 237, 213, 0.98),
                rgba(254, 215, 170, 0.9)
            );
            box-shadow: inset 0 0 0 1px rgba(249, 115, 22, 0.18);
        }
    }

    &__status-dot {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        flex: none;
        background: currentColor;
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.35);
    }

    &__status-text {
        font-weight: 600;
        letter-spacing: 0.01em;
    }

    &__status-action {
        margin-left: auto;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.72);
        color: rgba(15, 23, 42, 0.72);
        font-size: 11px;
        font-weight: 600;
    }

    &__input {
        width: 180px;

        :deep(.el-input__wrapper) {
            border-radius: 999px;
            box-shadow: none;
            background: rgba(255, 255, 255, 0.92);
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

:global(.dark) {
    .outbound-toolbar {
        background: rgba(30, 41, 59, 0.78);
    }
}
</style>
