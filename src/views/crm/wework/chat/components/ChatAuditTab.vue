<template>
  <div class="audit-layout">
    <aside class="corp-panel">
      <div class="corp-title">企业微信</div>
      <button v-for="corp in corpOptions" :key="corp.value" class="corp-item" :class="{ active: corp.value === selectedCorpId }" @click="selectCorp(corp.value)">
        {{ corp.label }}
      </button>
    </aside>

    <section class="audit-main" v-loading="loading">
      <div class="audit-tabs">
        <button v-for="tab in tabs" :key="tab.value" class="audit-tab" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'employee'" class="audit-card">
        <div class="filter-grid">
          <el-input v-model="employeeFilters.user" placeholder="请选择用户" />
          <el-input v-model="employeeFilters.wework" placeholder="请选择员工企微" />
          <el-input v-model="employeeFilters.dept" placeholder="请选择部门" />
          <el-input v-model="employeeFilters.keyword" placeholder="关键字" />
        </div>
        <div class="audit-actions"><BaseButton @click="loadAuditPage">查询</BaseButton></div>
        <el-table :data="employeeRows" stripe>
          <el-table-column prop="user" label="用户" min-width="120" />
          <el-table-column prop="department" label="所属部门" min-width="140" />
          <el-table-column prop="wework" label="员工企微" min-width="180" />
          <el-table-column prop="archiveStatus" label="存档状态" width="120" />
          <el-table-column prop="friendCount" label="企微好友数" width="120" />
          <el-table-column prop="singleChatCount" label="今日单聊会话数" width="140" />
          <el-table-column prop="groupChatCount" label="今日群聊会话数" width="140" />
          <el-table-column prop="lastActiveTimeText" label="最后活跃时间" width="180" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }"><el-button link type="primary" @click="openContext(row.user)">会话详情</el-button></template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else class="audit-card">
        <div class="filter-grid">
          <el-input v-model="contentFilters.keyword" placeholder="请输入聊天内容关键词" />
          <el-select v-model="contentFilters.senderType" placeholder="发送人类型">
            <el-option label="全部类型" value="" />
            <el-option label="员工" value="员工" />
            <el-option label="客户" value="客户" />
          </el-select>
          <el-date-picker v-model="contentFilters.timeRange" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" />
        </div>
        <div class="audit-actions"><BaseButton @click="loadAuditPage">查询</BaseButton></div>
        <el-table :data="contentRows" stripe>
          <el-table-column prop="senderType" label="发送人类型" width="120" />
          <el-table-column prop="sender" label="发送人" min-width="160" />
          <el-table-column prop="receiver" label="接收对象" min-width="180" />
          <el-table-column prop="chatTimeText" label="聊天时间" width="180" />
          <el-table-column prop="content" label="聊天内容" min-width="320" show-overflow-tooltip />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }"><el-button link type="primary" @click="openContext(row.content)">查看上下文</el-button></template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <el-drawer v-model="drawerVisible" title="会话上下文" size="520px">
      <div class="context-drawer">
        <div class="context-block inbound">客户：{{ drawerSeed }}，我这边先确认一下情况。</div>
        <div class="context-block outbound">顾问：好的，我把最近的会话记录和处理动作都同步给你。</div>
        <div class="context-block inbound">客户：收到，麻烦继续跟进。</div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { BaseButton } from '@/components/Button'
import * as WeworkChatApi from '@/api/crm/wework/chat'

const loading = ref(false)
const selectedCorpId = ref('')
const activeTab = ref<'employee' | 'content'>('employee')
const drawerVisible = ref(false)
const drawerSeed = ref('')
const corpOptions = ref<{ value: string; label: string }[]>([])
const employeeRows = ref<any[]>([])
const contentRows = ref<any[]>([])

const employeeFilters = ref({ user: '', wework: '', dept: '', keyword: '' })
const contentFilters = ref({ keyword: '', senderType: '', timeRange: [] as string[] })

const tabs = [
  { label: '按员工查询', value: 'employee' },
  { label: '按聊天内容查询', value: 'content' }
] as const

const selectCorp = (corpId: string) => {
  selectedCorpId.value = corpId
}

const openContext = (seed: string) => {
  drawerSeed.value = seed
  drawerVisible.value = true
}

const loadAuditPage = async () => {
  loading.value = true
  try {
    const isEmployee = activeTab.value === 'employee'
    const params: WeworkChatApi.WeworkChatAuditReqVO = {
      pageNo: 1,
      pageSize: 100,
      corpId: selectedCorpId.value || undefined,
      auditMode: isEmployee ? 'employee' : 'content',
      keyword: isEmployee ? employeeFilters.value.keyword || undefined : contentFilters.value.keyword || undefined,
      fromUser: isEmployee ? employeeFilters.value.user || undefined : undefined,
      department: isEmployee ? employeeFilters.value.dept || undefined : undefined,
      senderType: !isEmployee ? contentFilters.value.senderType || undefined : undefined,
      beginMsgTime: !isEmployee && contentFilters.value.timeRange[0] ? dayjs(contentFilters.value.timeRange[0]).unix() : undefined,
      endMsgTime: !isEmployee && contentFilters.value.timeRange[1] ? dayjs(contentFilters.value.timeRange[1]).unix() : undefined
    }
    const resp = await WeworkChatApi.getWeworkChatAuditPage(params)
    const rows = (resp.list || []).map((item) => ({
      ...item,
      lastActiveTimeText: item.lastActiveTime ? dayjs.unix(item.lastActiveTime).format('YYYY-MM-DD HH:mm:ss') : '-',
      chatTimeText: item.chatTime ? dayjs.unix(item.chatTime).format('YYYY-MM-DD HH:mm:ss') : '-'
    }))
    if (isEmployee) {
      employeeRows.value = rows
      if (!corpOptions.value.length) {
        corpOptions.value = Array.from(new Set(rows.map((item) => item.corpId).filter(Boolean))).map((corpId) => ({ value: corpId, label: corpId }))
      }
    } else {
      contentRows.value = rows
      if (!corpOptions.value.length) {
        corpOptions.value = Array.from(new Set(rows.map((item) => item.corpId).filter(Boolean))).map((corpId) => ({ value: corpId, label: corpId }))
      }
    }
    if (!selectedCorpId.value && corpOptions.value.length) selectedCorpId.value = corpOptions.value[0].value
  } finally {
    loading.value = false
  }
}

watch([activeTab, selectedCorpId], loadAuditPage)
onMounted(loadAuditPage)
</script>

<style scoped lang="scss">
.audit-layout { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 8px; }
.corp-panel, .audit-card { background: #fff; border: 1px solid var(--el-border-color-light); border-radius: 8px; }
.corp-panel { padding: 8px; min-height: 640px; }
.corp-title { margin-bottom: 12px; font-weight: 500; }
.corp-item, .audit-tab { border: none; background: transparent; cursor: pointer; }
.corp-item { width: 100%; margin-bottom: 6px; padding: 9px 12px; border-radius: 6px; text-align: left; color: #606266; }
.corp-item.active { background: #b4c5f5; color: #303133; }
.audit-tabs { display: flex; gap: 24px; margin-bottom: 12px; }
.audit-tab { padding: 4px 0 10px; color: #606266; }
.audit-tab.active { color: #409eff; box-shadow: inset 0 -2px 0 #409eff; }
.audit-card { padding: 16px; }
.filter-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.audit-actions { display: flex; justify-content: flex-end; margin-bottom: 16px; }
.context-drawer { display: grid; gap: 12px; }
.context-block { padding: 12px 14px; border-radius: 8px; line-height: 1.6; }
.context-block.inbound { background: #f5f7fa; }
.context-block.outbound { margin-left: 60px; background: #e6f4ff; }
</style>
