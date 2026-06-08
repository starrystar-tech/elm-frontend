<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import * as NotifyMessageApi from '@/api/system/notify/message'
import { useUserStoreWithOut } from '@/store/modules/user'
import { propTypes } from '@/utils/propTypes'

defineOptions({ name: 'Message' })

defineProps({
    color: propTypes.string.def('')
})

const { push } = useRouter()
const userStore = useUserStoreWithOut()
const popoverVisible = ref(false)
const activeCategory = ref('')
const loading = ref(false)
const unreadCount = ref(0)
const list = ref<NotifyMessageApi.NotifyMessageVO[]>([])
const categories = ref<NotifyMessageApi.ReminderCategorySummaryVO[]>([])
let unreadTimer: ReturnType<typeof setInterval> | undefined

const loadPanelSummary = async () => {
    const data = await NotifyMessageApi.getReminderMessagePanelSummary()
    unreadCount.value = Number(data?.totalUnreadCount || 0)
    categories.value = data?.categories || []
}

const loadList = async () => {
    loading.value = true
    try {
        list.value = await NotifyMessageApi.getUnreadNotifyMessageList(
            activeCategory.value || undefined,
            10
        )
    } finally {
        loading.value = false
    }
}

const handleShow = async () => {
    await Promise.all([loadPanelSummary(), loadList()])
}

const handleCategoryChange = async (category = '') => {
    activeCategory.value = category
    await loadList()
}

const handleRead = async (item: NotifyMessageApi.NotifyMessageVO) => {
    await NotifyMessageApi.updateNotifyMessageRead(item.id)
    await Promise.all([loadPanelSummary(), loadList()])
}

const goMyList = () => {
    popoverVisible.value = false
    push({
        name: 'MyNotifyMessage'
    })
}

onMounted(() => {
    loadPanelSummary()
    unreadTimer = setInterval(
        () => {
            if (userStore.getIsSetUser) {
                loadPanelSummary()
                return
            }
            unreadCount.value = 0
        },
        1000 * 60 * 2
    )
})

onBeforeUnmount(() => {
    if (unreadTimer) {
        clearInterval(unreadTimer)
    }
})
</script>

<template>
    <div class="message">
        <ElPopover
            v-model:visible="popoverVisible"
            :width="420"
            placement="bottom"
            trigger="click"
            @show="handleShow"
        >
            <template #reference>
                <ElBadge :hidden="unreadCount <= 0" :value="unreadCount > 99 ? '99+' : unreadCount">
                    <Icon :size="18" class="cursor-pointer" icon="ep:bell" :color="color" />
                </ElBadge>
            </template>

            <div class="message-panel">
                <div class="message-panel__header">
                    <span class="message-panel__title">消息提醒</span>
                    <span class="message-panel__count">未读 {{ unreadCount }}</span>
                </div>

                <div class="message-panel__categories">
                    <button
                        :class="['message-panel__category', !activeCategory && 'is-active']"
                        type="button"
                        @click="handleCategoryChange('')"
                    >
                        全部
                    </button>
                    <button
                        v-for="item in categories"
                        :key="item.category"
                        :class="[
                            'message-panel__category',
                            activeCategory === item.category && 'is-active'
                        ]"
                        type="button"
                        @click="handleCategoryChange(item.category)"
                    >
                        {{ item.categoryName }}
                        <span v-if="item.unreadCount" class="message-panel__category-count">
                            {{ item.unreadCount }}
                        </span>
                    </button>
                </div>

                <el-scrollbar v-loading="loading" class="message-list">
                    <template v-if="list.length">
                        <div
                            v-for="item in list"
                            :key="item.id"
                            class="message-item"
                            @click="handleRead(item)"
                        >
                            <span class="message-item__dot"></span>
                            <div class="message-item__content">
                                <div class="message-item__meta">
                                    <span class="message-item__category">{{
                                        item.categoryName || '提醒'
                                    }}</span>
                                    <span class="message-item__date">
                                        {{ formatDate(item.triggerTime || item.createTime) }}
                                    </span>
                                </div>
                                <div class="message-item__title">
                                    {{ item.displayContent }}
                                </div>
                            </div>
                        </div>
                    </template>
                    <div v-else class="message-empty">暂无未读消息</div>
                </el-scrollbar>

                <div class="message-panel__footer">
                    <XButton preIcon="ep:view" title="查看全部" type="primary" @click="goMyList" />
                </div>
            </div>
        </ElPopover>
    </div>
</template>

<style lang="scss" scoped>
.el-badge {
    display: flex;
}

.message-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.message-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.message-panel__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.message-panel__count {
    font-size: 12px;
    color: var(--el-color-danger);
}

.message-panel__categories {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.message-panel__category {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: 1px solid var(--el-border-color);
    border-radius: 999px;
    background: var(--el-bg-color);
    color: var(--el-text-color-regular);
    cursor: pointer;
    transition: all 0.2s ease;
}

.message-panel__category.is-active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
}

.message-panel__category-count {
    min-width: 18px;
    padding: 0 4px;
    border-radius: 999px;
    background: var(--el-color-danger);
    font-size: 12px;
    line-height: 18px;
    color: #fff;
    text-align: center;
}

.message-list {
    height: 360px;
}

.message-item {
    display: flex;
    gap: 10px;
    padding: 12px 4px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    cursor: pointer;
}

.message-item:last-child {
    border-bottom: none;
}

.message-item__dot {
    width: 8px;
    height: 8px;
    margin-top: 7px;
    border-radius: 50%;
    background: var(--el-color-danger);
    flex-shrink: 0;
}

.message-item__content {
    min-width: 0;
    flex: 1;
}

.message-item__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
}

.message-item__category {
    font-size: 12px;
    color: var(--el-color-primary);
}

.message-item__date {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
}

.message-item__title {
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-primary);
    word-break: break-all;
}

.message-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 13px;
    color: var(--el-text-color-secondary);
}

.message-panel__footer {
    display: flex;
    justify-content: flex-end;
}
</style>
