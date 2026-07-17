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
const previewVisible = ref(false)
const previewList = ref<NotifyMessageApi.NotifyMessageVO[]>([])
const previewCount = ref(0)
let unreadTimer: ReturnType<typeof setInterval> | undefined
let previewTimer: ReturnType<typeof setTimeout> | undefined
let lastPreviewSignature = ''

const clearPreviewTimer = () => {
    if (previewTimer) {
        clearTimeout(previewTimer)
        previewTimer = undefined
    }
}

const startPreviewTimer = () => {
    clearPreviewTimer()
    previewTimer = window.setTimeout(() => {
        previewVisible.value = false
    }, 6000)
}

const buildPreviewSignature = (messages: NotifyMessageApi.NotifyMessageVO[]) =>
    messages
        .slice(0, 5)
        .map((item) => `${item.id}:${item.readStatus}:${item.triggerTime || item.createTime}`)
        .join('|')

const showPreviewPanel = (messages: NotifyMessageApi.NotifyMessageVO[], count: number) => {
    if (!count || !messages.length) {
        return
    }
    const signature = buildPreviewSignature(messages)
    if (signature === lastPreviewSignature) {
        return
    }
    lastPreviewSignature = signature
    previewCount.value = count
    previewList.value = messages.slice(0, 3)
    previewVisible.value = true
    startPreviewTimer()
}

const loadPanelSummary = async (showNewPreview = false) => {
    const data = await NotifyMessageApi.getReminderMessagePanelSummary()
    unreadCount.value = Number(data?.totalUnreadCount || 0)
    categories.value = data?.categories || []
    if (!userStore.getIsSetUser) {
        return
    }
    if (unreadCount.value <= 0) {
        previewVisible.value = false
        lastPreviewSignature = ''
        return
    }
    const messages = await NotifyMessageApi.getUnreadNotifyMessageList(undefined, 10)
    if (showNewPreview || unreadCount.value > 0) {
        showPreviewPanel(messages, unreadCount.value)
    }
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
    previewVisible.value = false
    push({
        name: 'MyNotifyMessage'
    })
}

const closePreview = () => {
    clearPreviewTimer()
    previewVisible.value = false
}

onMounted(() => {
    loadPanelSummary(true)
    unreadTimer = setInterval(
        () => {
            if (userStore.getIsSetUser) {
                loadPanelSummary(true)
                return
            }
            unreadCount.value = 0
            previewVisible.value = false
        },
        1000 * 60 * 2
    )
})

onBeforeUnmount(() => {
    if (unreadTimer) {
        clearInterval(unreadTimer)
    }
    clearPreviewTimer()
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

        <Teleport to="body">
            <transition name="message-preview-slide">
                <div
                    v-show="previewVisible"
                    class="message-preview"
                    @mouseenter="clearPreviewTimer"
                    @mouseleave="startPreviewTimer"
                >
                    <div class="message-preview__header">
                        <div class="message-preview__title">
                            <Icon icon="ep:bell-filled" :size="16" />
                            <span>消息提醒</span>
                        </div>
                        <div class="message-preview__actions">
                            <el-tag type="danger" effect="light" round>
                                未处理 {{ previewCount > 99 ? '99+' : previewCount }}
                            </el-tag>
                            <el-button link type="primary" @click="goMyList">查看全部</el-button>
                            <button
                                class="message-preview__close"
                                type="button"
                                aria-label="关闭消息提醒"
                                @click="closePreview"
                            >
                                <Icon icon="ep:close" :size="14" />
                            </button>
                        </div>
                    </div>
                    <div class="message-preview__body">
                        <div
                            v-for="item in previewList"
                            :key="item.id"
                            class="message-preview__item"
                        >
                            <div class="message-preview__dot"></div>
                            <div class="message-preview__content">
                                <div class="message-preview__meta">
                                    <span class="message-preview__category">
                                        {{ item.categoryName || '提醒' }}
                                    </span>
                                    <span class="message-preview__date">
                                        {{ formatDate(item.triggerTime || item.createTime) }}
                                    </span>
                                </div>
                                <div class="message-preview__text">
                                    {{ item.displayContent }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </Teleport>
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
    padding: 12px 8px;
    border-radius: 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    cursor: pointer;
    transition:
        background-color 0.2s ease,
        transform 0.2s ease;
}

.message-item:hover {
    background: var(--el-fill-color-light);
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

.message-preview {
    position: fixed;
    top: calc(var(--top-tool-height, 56px) + 12px);
    right: 16px;
    z-index: 10000;
    width: 360px;
    padding: 14px 14px 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow:
        0 14px 36px rgba(15, 23, 42, 0.14),
        0 2px 8px rgba(15, 23, 42, 0.06);
    backdrop-filter: blur(10px);
}

.message-preview__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.message-preview__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.message-preview__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.message-preview__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    transition:
        background-color 0.2s ease,
        color 0.2s ease,
        transform 0.2s ease;
}

.message-preview__close:hover {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
}

.message-preview__body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: none;
    overflow: hidden;
}

.message-preview__item {
    display: flex;
    gap: 10px;
    padding: 10px 8px;
    border-radius: 10px;
    transition:
        background-color 0.2s ease,
        transform 0.2s ease;
}

.message-preview__item:hover {
    background: var(--el-fill-color-light);
}

.message-preview__dot {
    width: 8px;
    height: 8px;
    margin-top: 7px;
    border-radius: 50%;
    background: var(--el-color-danger);
    flex-shrink: 0;
}

.message-preview__content {
    min-width: 0;
    flex: 1;
}

.message-preview__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
}

.message-preview__category {
    font-size: 12px;
    color: var(--el-color-primary);
}

.message-preview__date {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
}

.message-preview__text {
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-primary);
    word-break: break-all;
}

.message-preview-slide-enter-active,
.message-preview-slide-leave-active {
    transition:
        transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
        opacity 0.24s ease,
        filter 0.24s ease;
    will-change: transform, opacity;
}

.message-preview-slide-enter-from,
.message-preview-slide-leave-to {
    opacity: 0;
    filter: blur(2px);
}

.message-preview-slide-enter-from {
    transform: translateX(48px) scale(0.98);
}

.message-preview-slide-leave-to {
    transform: translateX(56px) scale(0.98);
}
</style>
