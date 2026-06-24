<template>
    <div class="quality-layout" v-loading="loading">
        <aside class="member-panel panel">
            <div class="panel-toolbar">
                <WeworkCorpSelect v-model="selectedCorpId" />
                <WeworkStaffSelect
                    :model-value="staffFilterUserId"
                    :corp-id="selectedCorpId"
                    @update:model-value="handleStaffSelectChange"
                />
                <!-- <el-input v-model="memberKeyword" placeholder="搜索成员" size="small" clearable /> -->
            </div>
            <div class="member-list">
                <button
                    v-for="member in filteredMembers"
                    :key="member.id"
                    class="member-item"
                    :class="{ active: member.id === selectedMemberId }"
                    @click="handleMemberClick(member.id)"
                >
                    <el-avatar v-if="member.avatar" :size="30" :src="member.avatar" />
                    <div v-else class="member-avatar" :style="{ background: member.color }">{{
                        member.name.slice(0, 1)
                    }}</div>
                    <div class="member-meta">
                        <div class="member-name">{{ member.name }}</div>
                        <div class="member-desc">会话 {{ member.sessionCount }}</div>
                    </div>
                </button>
            </div>
        </aside>

        <section class="session-panel panel">
            <el-tabs v-model="activeSessionTab" class="session-tabs">
                <el-tab-pane
                    v-for="tab in sessionTabs"
                    :key="tab.value"
                    :label="tab.label"
                    :name="tab.value"
                />
            </el-tabs>
            <div class="panel-toolbar">
                <el-input
                    v-model="sessionKeyword"
                    placeholder="搜索好友/群聊"
                    size="small"
                    clearable
                />
            </div>
            <div class="session-list">
                <button
                    v-for="session in filteredSessions"
                    :key="session.msgId"
                    class="session-item"
                    :class="{ active: session.msgId === selectedSessionId }"
                    @click="selectedSessionId = session.msgId"
                >
                    <div class="session-avatar" :style="{ background: session.gradient }">
                        <img
                            v-if="session.avatar"
                            :src="session.avatar"
                            alt=""
                            class="avatar-image"
                        />
                        <template v-else>{{ session.title.slice(0, 1) }}</template>
                        <span v-if="session.badge" class="session-badge">{{ session.badge }}</span>
                    </div>
                    <div class="session-meta">
                        <div class="session-head">
                            <span class="session-title">{{ session.title }}</span>
                            <span class="session-time">{{ session.timeLabel }}</span>
                        </div>
                        <div class="session-preview">{{ session.preview }}</div>
                    </div>
                </button>
            </div>
        </section>

        <section class="chat-panel panel">
            <div class="chat-toolbar">
                <div class="chat-title">
                    <div
                        class="chat-avatar"
                        :style="{ background: selectedSession?.gradient || fallbackGradient }"
                    >
                        <img
                            v-if="selectedSession?.avatar"
                            :src="selectedSession.avatar"
                            alt=""
                            class="avatar-image"
                        />
                        <template v-else>{{
                            selectedSession?.title?.slice(0, 1) || '会'
                        }}</template>
                    </div>
                    <div>
                        <div
                            class="chat-name text-ellipsis overflow-hidden max-w-50"
                            :title="selectedSession?.title || '企微会话'"
                            >{{ selectedSession?.title || '企微会话' }}</div
                        >
                        <div class="chat-subtitle">{{
                            selectedSession?.subtitle || '选择左侧会话查看聊天记录'
                        }}</div>
                    </div>
                </div>
                <div class="chat-filters">
                    <el-select v-model="messageTypeFilter" size="small" class="filter-control">
                        <el-option label="全部类型" value="" />
                        <el-option label="文本" value="text" />
                        <el-option label="图片" value="image" />
                        <el-option label="视频" value="video" />
                        <el-option label="文件" value="file" />
                        <el-option label="语音" value="voice" />
                        <el-option label="音频" value="audio" />
                    </el-select>
                    <el-input
                        v-model="messageKeyword"
                        placeholder="搜索聊天记录"
                        size="small"
                        clearable
                        class="filter-control"
                    />
                    <el-date-picker
                        v-model="dateRange"
                        type="daterange"
                        style="width: 150px"
                        unlink-panels
                        range-separator="-"
                        clearable
                        @clear="dateRange = []"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                        size="small"
                        value-format="YYYY-MM-DD"
                        class="date-range"
                    />
                </div>
            </div>

            <div ref="chatMessagesRef" class="chat-messages">
                <template v-if="displayMessages.length">
                    <div v-for="message in displayMessages" :key="message.id">
                        <div v-if="message.showTime" class="time-divider"
                            ><span>{{ message.dividerLabel }}</span></div
                        >
                        <div
                            class="message-row"
                            :class="{ outbound: message.direction === 'outbound' }"
                        >
                            <div
                                v-if="message.direction === 'inbound'"
                                class="bubble-avatar"
                                :style="{ background: message.avatarColor }"
                            >
                                <img
                                    v-if="message.avatar"
                                    :src="message.avatar"
                                    alt=""
                                    class="avatar-image"
                                />
                                <template v-else>{{ message.sender.slice(0, 1) }}</template>
                            </div>
                            <div class="bubble-wrap">
                                <div class="bubble-meta" :class="message.roleClass">
                                    <span class="bubble-sender">{{ message.sender }}</span>
                                    <span class="bubble-time">{{ message.timeLabel }}</span>
                                </div>
                                <div
                                    class="bubble"
                                    :class="[message.direction, `bubble-${message.msgType}`]"
                                >
                                    <template
                                        v-if="message.msgType === 'image' && message.media?.url"
                                    >
                                        <el-image
                                            :src="message.media.url"
                                            :preview-src-list="[message.media.url]"
                                            fit="cover"
                                            class="media-image"
                                            preview-teleported
                                        />
                                    </template>
                                    <template v-else-if="message.msgType === 'image'">
                                        <div class="media-image-fallback">
                                            <div class="media-image-fallback-title"
                                                >图片消息未成功加载</div
                                            >
                                            <div class="media-image-fallback-desc">
                                                {{ message.media?.debugMessage || message.content }}
                                            </div>
                                        </div>
                                    </template>
                                    <template
                                        v-else-if="
                                            message.msgType === 'video' && message.media?.url
                                        "
                                    >
                                        <video
                                            :src="message.media.url"
                                            controls
                                            preload="metadata"
                                            class="media-video"
                                        ></video>
                                    </template>
                                    <template
                                        v-else-if="
                                            ['voice', 'audio'].includes(message.msgType) &&
                                            message.media?.url
                                        "
                                    >
                                        <div class="media-audio-card">
                                            <div class="media-audio-title">{{
                                                message.media?.name || '语音消息'
                                            }}</div>
                                            <WxVoicePlayer :url="message.media.url" />
                                        </div>
                                    </template>
                                    <template
                                        v-else-if="
                                            message.msgType === 'file' &&
                                            (message.media?.url || message.media?.name)
                                        "
                                    >
                                        <a
                                            class="media-file-card"
                                            :href="message.media?.url || undefined"
                                            :download="message.media?.name || true"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <div class="media-file-name">{{
                                                message.media?.name || '文件'
                                            }}</div>
                                            <div class="media-file-meta">
                                                {{ formatFileMeta(message.media) }}
                                            </div>
                                        </a>
                                    </template>
                                    <template v-else>{{ message.content }}</template>
                                </div>
                            </div>
                            <div
                                v-if="message.direction === 'outbound'"
                                class="bubble-avatar"
                                :style="{ background: message.avatarColor }"
                            >
                                <img
                                    v-if="message.avatar"
                                    :src="message.avatar"
                                    alt=""
                                    class="avatar-image"
                                />
                                <template v-else>{{ message.sender.slice(0, 1) }}</template>
                            </div>
                        </div>
                    </div>
                </template>
                <el-empty v-else description="当前筛选条件下暂无聊天记录" />
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import * as WeworkChatApi from '@/api/crm/wework/chat'
import WeworkCorpSelect from '@/components/WeworkCorpSelect/index.vue'
import WeworkStaffSelect from '@/components/WeworkStaffSelect/index.vue'
import WxVoicePlayer from '@/views/mp/components/wx-voice-play/main.vue'
import { formatChatTime, resolveTimestamp } from '@/utils/formatTime'

const fallbackGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #5b8cff 0%, #36c8ff 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
]

const route = useRoute()
const loading = ref(false)
const selectedCorpId = ref('')
const selectedMemberId = ref('')
const staffFilterUserId = ref('')
const selectedSessionId = ref('')
const initialized = ref(false)
const memberKeyword = ref('')
const sessionKeyword = ref('')
const messageKeyword = ref('')
const messageTypeFilter = ref('')
const activeSessionTab = ref<'all' | 'single' | 'group'>('all')
const dateRange = ref<string[]>([])
const chatMessagesRef = ref<HTMLDivElement>()
const qualityData = ref<WeworkChatApi.WeworkChatQualityRespVO>({
    corpList: [],
    memberList: [],
    sessionList: [],
    messageList: []
})

const sessionTabs = [
    { label: '全部', value: 'all' },
    { label: '单聊', value: 'single' },
    { label: '群聊', value: 'group' }
] as const

const filteredMembers = computed(() =>
    qualityData.value.memberList
        .filter((item) => item.name.includes(memberKeyword.value.trim()))
        .map((item, index) => ({
            ...item,
            id: item.userId,
            color: gradients[index % gradients.length]
        }))
)

const filteredSessions = computed(() =>
    qualityData.value.sessionList
        .filter(
            (item) => !selectedMemberId.value || item.staffUserIds?.includes(selectedMemberId.value)
        )
        .filter((item) =>
            activeSessionTab.value === 'all' ? true : item.sessionType === activeSessionTab.value
        )
        .filter((item) => `${item.title}${item.preview}`.includes(sessionKeyword.value.trim()))
        .map((item, index) => ({
            ...item,
            type: item.sessionType,
            badge: item.sessionType === 'group' ? '群聊' : '',
            gradient: gradients[index % gradients.length],
            timeLabel: formatChatTime(item.msgTime)
        }))
)

const selectedSession = computed(
    () =>
        filteredSessions.value.find((item) => item.msgId === selectedSessionId.value) ||
        filteredSessions.value[0]
)

const displayMessages = computed(() =>
    qualityData.value.messageList
        .filter((item) => !selectedMemberId.value || item.senderUserId === selectedMemberId.value)
        .filter((item) => !messageTypeFilter.value || item.msgType === messageTypeFilter.value)
        .filter(
            (item) =>
                !messageKeyword.value.trim() || item.content.includes(messageKeyword.value.trim())
        )
        .filter((item) => {
            if (dateRange.value.length !== 2) return true
            const date = resolveTimestamp(item.msgTime)?.format('YYYY-MM-DD')
            if (!date) return false
            return date >= dateRange.value[0] && date <= dateRange.value[1]
        })
        .map((item, index) => ({
            ...item,
            id: `${item.msgId}-${index}`,
            timeLabel: formatChatTime(item.msgTime),
            dividerLabel: resolveTimestamp(item.msgTime)?.format('YYYY-MM-DD HH:mm') || '-',
            avatarColor: gradients[index % gradients.length],
            roleClass: item.direction === 'outbound' ? 'staff-role' : 'customer-role',
            showTime:
                index === 0 ||
                resolveTimestamp(item.msgTime)?.format('YYYY-MM-DD HH:mm') !==
                    resolveTimestamp(qualityData.value.messageList[index - 1]?.msgTime)?.format(
                        'YYYY-MM-DD HH:mm'
                    )
        }))
)

const scrollChatToBottom = async () => {
    await nextTick()
    const container = chatMessagesRef.value
    if (!container) return
    container.scrollTop = container.scrollHeight
}

const parseQueryTimestamp = (value: unknown) => {
    const timestamp = Number(Array.isArray(value) ? value[0] : value)
    return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : undefined
}

const findFirstSessionIdByMember = (memberId: string) =>
    qualityData.value.sessionList
        .filter((item) => item.staffUserIds?.includes(memberId))
        .filter((item) =>
            activeSessionTab.value === 'all' ? true : item.sessionType === activeSessionTab.value
        )
        .filter((item) => `${item.title}${item.preview}`.includes(sessionKeyword.value.trim()))
        .map((item) => item.msgId)[0]

const handleMemberClick = (memberId: string) => {
    selectedMemberId.value = memberId
    const firstSessionId = findFirstSessionIdByMember(memberId)
    if (firstSessionId && firstSessionId !== selectedSessionId.value) {
        selectedSessionId.value = firstSessionId
    }
}

const handleStaffSelectChange = (memberId: string) => {
    staffFilterUserId.value = memberId || ''
    selectedMemberId.value = ''
}

const loadQualityView = async () => {
    loading.value = true
    try {
        const params: WeworkChatApi.WeworkChatQualityReqVO = {
            corpId: selectedCorpId.value || undefined,
            fromUser: staffFilterUserId.value || undefined,
            msgId: selectedSessionId.value || undefined,
            sessionType: activeSessionTab.value === 'all' ? undefined : activeSessionTab.value,
            keyword: sessionKeyword.value || undefined,
            msgType: messageTypeFilter.value || undefined,
            beginMsgTime: dateRange.value[0]
                ? dayjs(dateRange.value[0]).startOf('day').unix()
                : undefined,
            endMsgTime: dateRange.value[1]
                ? dayjs(dateRange.value[1]).endOf('day').unix()
                : undefined
        }
        const resp = await WeworkChatApi.getWeworkChatQualityView(params)
        qualityData.value = resp
        if (!selectedCorpId.value && resp.corpList.length)
            selectedCorpId.value = resp.corpList[0].corpId
        if (!selectedSessionId.value && resp.sessionList.length)
            selectedSessionId.value = resp.sessionList[0].msgId
        else await scrollChatToBottom()
    } finally {
        loading.value = false
    }
}

watch(selectedCorpId, () => {
    if (!initialized.value) return
    staffFilterUserId.value = ''
    selectedMemberId.value = ''
    selectedSessionId.value = ''
})
watch(selectedSessionId, () => {
    scrollChatToBottom()
})
watch([staffFilterUserId, activeSessionTab, dateRange], () => {
    if (!initialized.value) return
    selectedSessionId.value = ''
})
watch([selectedCorpId, staffFilterUserId, selectedSessionId, activeSessionTab, dateRange], () => {
    if (!initialized.value) return
    loadQualityView()
})
watch(displayMessages, () => {
    scrollChatToBottom()
})
onMounted(() => {
    const queryCorpId = String(route.query.corpId || '')
    const queryFromUser = String(route.query.fromUser || '')
    const queryMsgId = String(route.query.msgId || '')
    const beginMsgTime = parseQueryTimestamp(route.query.beginMsgTime)
    const endMsgTime = parseQueryTimestamp(route.query.endMsgTime)
    if (queryCorpId) selectedCorpId.value = queryCorpId
    if (queryFromUser) {
        staffFilterUserId.value = queryFromUser
    }
    if (queryMsgId) selectedSessionId.value = queryMsgId
    if (beginMsgTime && endMsgTime) {
        dateRange.value = [
            dayjs.unix(beginMsgTime).format('YYYY-MM-DD'),
            dayjs.unix(endMsgTime).format('YYYY-MM-DD')
        ]
    }
    initialized.value = true
    loadQualityView()
})

const formatFileMeta = (media?: { size?: number; duration?: number; mimeType?: string }) => {
    const parts: string[] = []
    if (media?.size) {
        if (media.size >= 1024 * 1024) {
            parts.push(`${(media.size / 1024 / 1024).toFixed(1)} MB`)
        } else if (media.size >= 1024) {
            parts.push(`${(media.size / 1024).toFixed(1)} KB`)
        } else {
            parts.push(`${media.size} B`)
        }
    }
    if (media?.duration) {
        parts.push(`${media.duration}s`)
    }
    if (media?.mimeType) {
        parts.push(media.mimeType)
    }
    return parts.join(' · ') || '点击查看'
}
</script>

<style scoped lang="scss">
.quality-layout {
    display: grid;
    grid-template-columns: 132px 240px minmax(0, 1fr);
    gap: 0;
    height: 100%;
    min-height: 0;
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    overflow: hidden;
    background: #f5f5f5;
}

.panel {
    background: #fff;
    min-width: 0;
    min-height: 0;
}
.member-panel,
.session-panel {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--el-border-color-light);
}
.panel-toolbar {
    padding: 10px;
    border-bottom: 1px solid var(--el-border-color-light);
    display: grid;
    gap: 10px;
}
.member-list,
.session-list,
.chat-messages {
    min-height: 0;
    overflow: auto;
}
.member-list,
.session-list {
    flex: 1;
}
.member-item,
.session-item,
.session-tab {
    border: none;
    background: transparent;
    cursor: pointer;
}
.member-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 10px;
    border-left: 3px solid transparent;
    text-align: left;
}
.member-item.active {
    background: #e6f4ff;
    border-left-color: #409eff;
}
.member-avatar,
.chat-avatar,
.bubble-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 600;
    border-radius: 999px;
}
.member-avatar {
    width: 30px;
    height: 30px;
    font-size: 13px;
}
.avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
}
.member-name,
.session-title,
.chat-name {
    font-weight: 500;
    color: #303133;
}
.member-desc,
.session-preview,
.chat-subtitle,
.bubble-sender,
.session-time {
    font-size: 12px;
    color: #909399;
}
.session-tabs {
    padding: 0 12px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: #fff;
}

:deep(.session-tabs .el-tabs__header) {
    margin: 0;
}

:deep(.session-tabs .el-tabs__nav-wrap::after) {
    display: none;
}

:deep(.session-tabs .el-tabs__item) {
    height: 44px;
    line-height: 44px;
}
.session-item {
    width: 100%;
    display: flex;
    gap: 12px;
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
}
.session-item.active {
    background: #f5f7fa;
}
.session-avatar,
.chat-avatar {
    width: 38px;
    height: 38px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    font-weight: 600;
}
.session-badge {
    position: absolute;
    right: -4px;
    bottom: -4px;
    padding: 1px 5px;
    border-radius: 999px;
    font-size: 10px;
    background: #409eff;
    border: 1px solid #fff;
}
.session-meta {
    flex: 1;
    min-width: 0;
}
.session-head {
    display: flex;
    justify-content: space-between;
    gap: 8px;
}
.session-title,
.session-preview {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
.chat-panel {
    display: flex;
    flex-direction: column;
    background: #eef3f7;
    min-height: 0;
}
.chat-toolbar {
    padding: 12px 14px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}
.chat-title,
.chat-filters {
    display: flex;
    align-items: center;
    gap: 12px;
}
.chat-avatar {
    width: 40px;
    height: 40px;
}
.filter-control {
    width: 140px;
}
.date-range {
    width: 250px;
}
.chat-messages {
    flex: 1;
    min-height: 0;
    padding: 18px 22px 26px;
    background:
        radial-gradient(circle at top right, rgba(167, 219, 255, 0.22), transparent 28%),
        linear-gradient(180deg, #f7f8fb 0%, #edf3f7 100%);
}
.time-divider {
    text-align: center;
    margin: 16px 0;
}
.time-divider span {
    display: inline-block;
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(121, 132, 156, 0.68);
    color: #fff;
    font-size: 12px;
}
.message-row {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    align-items: flex-end;
}
.message-row.outbound {
    justify-content: flex-end;
}
.bubble-avatar {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    box-shadow: 0 8px 18px rgba(69, 97, 130, 0.16);
}
.bubble-wrap {
    max-width: min(68%, 720px);
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.message-row.outbound .bubble-wrap {
    align-items: flex-end;
}
.bubble-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    padding: 0 4px;
}
.message-row.outbound .bubble-meta {
    justify-content: flex-end;
}
.bubble-time {
    color: #8f9aae;
}
.bubble-meta.customer-role .bubble-sender {
    color: #5b677d;
    font-weight: 600;
}
.bubble-meta.staff-role .bubble-sender {
    color: #2d6fd2;
    font-weight: 600;
}
.bubble {
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.6;
    box-shadow: 0 10px 24px rgba(31, 53, 92, 0.08);
    word-break: break-word;
    border: 1px solid transparent;
}
.bubble.inbound {
    background: linear-gradient(180deg, #ffffff 0%, #f5f7fb 100%);
    color: #2a3347;
    border-color: rgba(194, 203, 217, 0.6);
    border-bottom-left-radius: 6px;
}
.bubble.outbound {
    background: linear-gradient(135deg, #d9ecff 0%, #b9daff 100%);
    color: #1f4f92;
    border-color: rgba(111, 168, 255, 0.45);
    border-bottom-right-radius: 6px;
}
.media-image {
    width: min(260px, 42vw);
    max-height: 320px;
    border-radius: 14px;
    overflow: hidden;
    display: block;
    background: rgba(255, 255, 255, 0.5);
}
.media-image-fallback {
    width: min(260px, 42vw);
    min-height: 110px;
    padding: 14px;
    border-radius: 14px;
    background: linear-gradient(180deg, #fff8f1 0%, #ffe8d4 100%);
    color: #8a4b19;
}
.media-image-fallback-title {
    font-weight: 600;
    margin-bottom: 6px;
}
.media-image-fallback-desc {
    font-size: 12px;
    line-height: 1.5;
    word-break: break-word;
}
.media-video {
    width: min(320px, 46vw);
    max-height: 320px;
    border-radius: 14px;
    display: block;
    background: #000;
}
.media-audio-card,
.media-file-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 220px;
}
.media-audio-title,
.media-file-name {
    font-weight: 600;
}
.media-audio {
    width: min(320px, 46vw);
}
.media-file-card {
    text-decoration: none;
    color: inherit;
    padding: 2px 0;
}
.media-file-meta {
    font-size: 12px;
    color: #7f8ba0;
}
.bubble-file {
    min-width: 220px;
}
</style>
