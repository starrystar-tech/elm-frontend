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
    getExportTaskCenterViewedAt,
    getExportTaskPage,
    markExportTaskCenterViewed
} from '@/api/system/exportTask'
import ToolHeaderDialer from './ToolHeaderDialer.vue'
import ToolHeaderBrowserPhone from './ToolHeaderBrowserPhone.vue'

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
        const hasNewExportTask = ref(false)
        let exportTaskTimer: number | undefined

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
                hasNewExportTask.value = false
                return
            }
            try {
                const data = await getExportTaskPage({
                    pageNo: 1,
                    pageSize: 20,
                    status: 2
                })
                const list = data?.list || []
                const lastViewedAt = getExportTaskCenterViewedAt()
                if (!lastViewedAt) {
                    hasNewExportTask.value = list.length > 0
                    return
                }
                const lastViewedTime = new Date(lastViewedAt).getTime()
                hasNewExportTask.value = list.some((item) => {
                    const taskTime = item.finishedAt || item.createTime
                    return !!taskTime && new Date(taskTime).getTime() > lastViewedTime
                })
            } catch {
                hasNewExportTask.value = false
            }
        }

        const openExportTaskCenter = async () => {
            markExportTaskCenterViewed()
            hasNewExportTask.value = false
            await push({ name: 'SystemExportTaskCenter' })
        }

        onMounted(() => {
            checkExportTaskBadge()
            exportTaskTimer = window.setInterval(() => {
                checkExportTaskBadge()
            }, 1000 * 60)
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
                            onKeypadInput={syncDialerCursor}
                        >
                            <ElInput
                                v-model={dialerMobile.value}
                                ref={dialerInputRef}
                                class="outbound-toolbar__input"
                                placeholder="输入手机号"
                                clearable
                                maxlength={11}
                                onKeydown={(event: KeyboardEvent) => {
                                    if (event.key === 'Enter') {
                                        dialerRef.value?.handleDial()
                                    }
                                }}
                            />
                        </ToolHeaderDialer>
                        <ElButton
                            type="primary"
                            class="outbound-toolbar__button"
                            loading={dialerRef.value?.dialing}
                            onClick={() => dialerRef.value?.handleDial()}
                        >
                            呼叫
                        </ElButton>
                    </div>
                    {hasTenantVisitPermission.value ? <TenantVisit /> : undefined}
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
                    <ToolHeaderBrowserPhone />
                    {hasExportTaskPermission.value ? (
                        <ElBadge isDot={hasNewExportTask.value} class="header-icon-badge">
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
    gap: 10px;
    margin-right: 12px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(10px);

    &__input {
        width: 180px;
    }

    &__button {
        border-radius: 999px;
    }
}

.header-icon-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
