<template>
  <div class="quality-layout" v-loading="loading">
    <aside class="member-panel panel">
      <div class="panel-toolbar">
        <el-select v-model="selectedCorpId" placeholder="选择企业" size="small">
          <el-option v-for="corp in corpOptions" :key="corp.value" :label="corp.label" :value="corp.value" />
        </el-select>
        <el-input v-model="memberKeyword" placeholder="搜索成员" size="small" clearable />
      </div>
      <div class="member-list">
        <button
          v-for="member in filteredMembers"
          :key="member.id"
          class="member-item"
          :class="{ active: member.id === selectedMemberId }"
          @click="selectedMemberId = member.id"
        >
          <div class="member-avatar" :style="{ background: member.color }">{{ member.name.slice(0, 1) }}</div>
          <div class="member-meta">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-desc">会话 {{ member.sessionCount }}</div>
          </div>
        </button>
      </div>
    </aside>

    <section class="session-panel panel">
      <div class="session-tabs">
        <button
          v-for="tab in sessionTabs"
          :key="tab.value"
          class="session-tab"
          :class="{ active: activeSessionTab === tab.value }"
          @click="activeSessionTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
      <div class="panel-toolbar">
        <el-input v-model="sessionKeyword" placeholder="搜索好友/群聊" size="small" clearable />
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
            {{ session.title.slice(0, 1) }}
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
          <div class="chat-avatar" :style="{ background: selectedSession?.gradient || fallbackGradient }">
            {{ selectedSession?.title?.slice(0, 1) || '会' }}
          </div>
          <div>
            <div class="chat-name">{{ selectedSession?.title || '企微会话' }}</div>
            <div class="chat-subtitle">{{ selectedSession?.subtitle || '选择左侧会话查看聊天记录' }}</div>
          </div>
        </div>
        <div class="chat-filters">
          <el-select v-model="messageTypeFilter" size="small" class="filter-control">
            <el-option label="全部类型" value="" />
            <el-option label="文本" value="text" />
            <el-option label="图片" value="image" />
            <el-option label="视频" value="video" />
            <el-option label="文件" value="file" />
          </el-select>
          <el-input v-model="messageKeyword" placeholder="搜索聊天记录" size="small" clearable class="filter-control" />
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            unlink-panels
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            value-format="YYYY-MM-DD"
            class="date-range"
          />
        </div>
      </div>

      <div class="chat-messages">
        <template v-if="displayMessages.length">
          <div v-for="message in displayMessages" :key="message.id">
            <div v-if="message.showTime" class="time-divider"><span>{{ message.timeLabel }}</span></div>
            <div class="message-row" :class="{ outbound: message.direction === 'outbound' }">
              <div v-if="message.direction === 'inbound'" class="bubble-avatar" :style="{ background: message.avatarColor }">
                {{ message.sender.slice(0, 1) }}
              </div>
              <div class="bubble-wrap">
                <div class="bubble-sender">{{ message.sender }}</div>
                <div class="bubble" :class="message.direction">{{ message.content }}</div>
              </div>
              <div v-if="message.direction === 'outbound'" class="bubble-avatar" :style="{ background: message.avatarColor }">
                {{ message.sender.slice(0, 1) }}
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
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import * as WeworkChatApi from '@/api/crm/wework/chat'

const fallbackGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
]

const loading = ref(false)
const selectedCorpId = ref('')
const selectedMemberId = ref('')
const selectedSessionId = ref('')
const memberKeyword = ref('')
const sessionKeyword = ref('')
const messageKeyword = ref('')
const messageTypeFilter = ref('')
const activeSessionTab = ref<'all' | 'single' | 'group'>('all')
const dateRange = ref<string[]>([])
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

const corpOptions = computed(() =>
  qualityData.value.corpList.map((corp) => ({ value: corp.corpId, label: corp.corpName || corp.corpId }))
)

const filteredMembers = computed(() =>
  qualityData.value.memberList
    .filter((item) => item.name.includes(memberKeyword.value.trim()))
    .map((item, index) => ({ ...item, id: item.userId, color: gradients[index % gradients.length] }))
)

const filteredSessions = computed(() =>
  qualityData.value.sessionList
    .filter((item) => (activeSessionTab.value === 'all' ? true : item.sessionType === activeSessionTab.value))
    .filter((item) => `${item.title}${item.preview}`.includes(sessionKeyword.value.trim()))
    .map((item, index) => ({
      ...item,
      type: item.sessionType,
      badge: item.sessionType === 'group' ? '群聊' : '',
      gradient: gradients[index % gradients.length],
      timeLabel: item.msgTime ? dayjs.unix(item.msgTime).format('MM/DD') : '-'
    }))
)

const selectedSession = computed(() => filteredSessions.value.find((item) => item.msgId === selectedSessionId.value) || filteredSessions.value[0])

const displayMessages = computed(() =>
  qualityData.value.messageList
    .filter((item) => !messageTypeFilter.value || item.msgType === messageTypeFilter.value)
    .filter((item) => !messageKeyword.value.trim() || item.content.includes(messageKeyword.value.trim()))
    .filter((item) => {
      if (dateRange.value.length !== 2) return true
      const date = dayjs.unix(item.msgTime).format('YYYY-MM-DD')
      return date >= dateRange.value[0] && date <= dateRange.value[1]
    })
    .map((item, index) => ({
      ...item,
      id: `${item.msgId}-${index}`,
      timeLabel: item.msgTime ? dayjs.unix(item.msgTime).format('MM-DD HH:mm') : '-',
      avatarColor: gradients[index % gradients.length],
      showTime: index === 0
    }))
)

const loadQualityView = async () => {
  loading.value = true
  try {
    const params: WeworkChatApi.WeworkChatQualityReqVO = {
      corpId: selectedCorpId.value || undefined,
      fromUser: selectedMemberId.value || undefined,
      msgId: selectedSessionId.value || undefined,
      sessionType: activeSessionTab.value === 'all' ? undefined : activeSessionTab.value,
      keyword: sessionKeyword.value || undefined,
      msgType: messageTypeFilter.value || undefined,
      beginMsgTime: dateRange.value[0] ? dayjs(dateRange.value[0]).startOf('day').unix() : undefined,
      endMsgTime: dateRange.value[1] ? dayjs(dateRange.value[1]).endOf('day').unix() : undefined
    }
    const resp = await WeworkChatApi.getWeworkChatQualityView(params)
    qualityData.value = resp
    if (!selectedCorpId.value && resp.corpList.length) selectedCorpId.value = resp.corpList[0].corpId
    if (!selectedMemberId.value && resp.memberList.length) selectedMemberId.value = resp.memberList[0].userId
    if (!selectedSessionId.value && resp.sessionList.length) selectedSessionId.value = resp.sessionList[0].msgId
  } finally {
    loading.value = false
  }
}

watch([selectedCorpId, selectedMemberId, selectedSessionId, activeSessionTab, dateRange], loadQualityView)
onMounted(loadQualityView)
</script>

<style scoped lang="scss">
.quality-layout {
  display: grid;
  grid-template-columns: 132px 240px minmax(0, 1fr);
  gap: 0;
  min-height: 720px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  overflow: hidden;
  background: #f5f5f5;
}

.panel { background: #fff; min-width: 0; }
.member-panel, .session-panel { border-right: 1px solid var(--el-border-color-light); }
.panel-toolbar { padding: 10px; border-bottom: 1px solid var(--el-border-color-light); display: grid; gap: 10px; }
.member-list, .session-list, .chat-messages { overflow: auto; }
.member-list, .session-list { height: calc(720px - 69px); }
.member-item, .session-item, .session-tab { border: none; background: transparent; cursor: pointer; }
.member-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 12px 10px; border-left: 3px solid transparent; text-align: left; }
.member-item.active { background: #e6f4ff; border-left-color: #409eff; }
.member-avatar, .chat-avatar, .bubble-avatar { display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 600; border-radius: 999px; }
.member-avatar { width: 30px; height: 30px; font-size: 13px; }
.member-name, .session-title, .chat-name { font-weight: 500; color: #303133; }
.member-desc, .session-preview, .chat-subtitle, .bubble-sender, .session-time { font-size: 12px; color: #909399; }
.session-tabs { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 1px solid var(--el-border-color-light); }
.session-tab { padding: 12px 0; font-size: 13px; color: #606266; }
.session-tab.active { color: #409eff; background: #f5f7fa; }
.session-item { width: 100%; display: flex; gap: 12px; padding: 12px; text-align: left; border-bottom: 1px solid #f0f0f0; }
.session-item.active { background: #f5f7fa; }
.session-avatar, .chat-avatar { width: 38px; height: 38px; position: relative; display: flex; align-items: center; justify-content: center; border-radius: 999px; font-weight: 600; }
.session-badge { position: absolute; right: -4px; bottom: -4px; padding: 1px 5px; border-radius: 999px; font-size: 10px; background: #409eff; border: 1px solid #fff; }
.session-meta { flex: 1; min-width: 0; }
.session-head { display: flex; justify-content: space-between; gap: 8px; }
.session-title, .session-preview { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.chat-panel { display: flex; flex-direction: column; background: #e8e8e8; }
.chat-toolbar { padding: 12px 14px; border-bottom: 1px solid var(--el-border-color-light); background: #fff; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.chat-title, .chat-filters { display: flex; align-items: center; gap: 12px; }
.chat-avatar { width: 40px; height: 40px; }
.filter-control { width: 140px; }
.date-range { width: 250px; }
.chat-messages { flex: 1; padding: 16px; }
.time-divider { text-align: center; margin-bottom: 16px; }
.time-divider span { display: inline-block; padding: 4px 12px; border-radius: 999px; background: #d0d3d8; color: #fff; font-size: 12px; }
.message-row { display: flex; gap: 12px; margin-bottom: 16px; align-items: flex-start; }
.message-row.outbound { justify-content: flex-end; }
.bubble-avatar { width: 36px; height: 36px; flex-shrink: 0; }
.bubble-wrap { max-width: 420px; }
.message-row.outbound .bubble-wrap { text-align: right; }
.bubble { display: inline-block; margin-top: 4px; padding: 9px 12px; border-radius: 6px; font-size: 13px; line-height: 1.5; }
.bubble.inbound { background: #fff; color: #303133; }
.bubble.outbound { background: #409eff; color: #fff; }
</style>
