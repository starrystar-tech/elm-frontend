<template>
  <div class="analysis-layout">
    <aside class="corp-panel">
      <div class="corp-title">企业微信</div>
      <button v-for="corp in corpOptions" :key="corp.value" class="corp-item" :class="{ active: corp.value === selectedCorpId }" @click="selectedCorpId = corp.value">
        {{ corp.label }}
      </button>
    </aside>

    <section class="analysis-main" v-loading="loading">
      <div class="analysis-tabs">
        <button v-for="tab in tabs" :key="tab.value" class="analysis-tab" :class="{ active: activeTab === tab.value }" @click="activeTab = tab.value">
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab !== 'setting'" class="card-block">
        <div class="filter-row">
          <el-date-picker v-model="dateRange" type="daterange" unlink-panels start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
          <el-input v-model="keyword" :placeholder="activeTab === 'word' ? '请选择敏感词' : '请选择敏感行为'" />
          <el-select v-model="senderType" placeholder="发送人类型">
            <el-option label="全部类型" value="" />
            <el-option label="员工" value="员工" />
            <el-option label="客户" value="客户" />
          </el-select>
          <el-input v-model="customerKeyword" placeholder="请输入客户" />
        </div>

        <div class="chart-grid">
          <div class="chart-card">
            <div class="chart-title">{{ activeTab === 'word' ? '发送次数' : '操作次数' }}</div>
            <div class="line-chart">
              <div v-for="item in trendData" :key="item.label" class="line-point">
                <div class="line-bar" :style="{ height: `${Math.max(item.count * 12, 8)}px` }"></div>
                <div class="line-value">{{ item.count }}</div>
                <div class="line-label">{{ item.label }}</div>
              </div>
            </div>
          </div>
          <div class="chart-card donut-card">
            <div class="donut-legend"><span class="legend-dot"></span>{{ dominantLabel }}</div>
            <div class="donut-shell">
              <div class="donut-ring" :style="{ background: donutBackground }">
                <div class="donut-inner">{{ dominantValue }}</div>
              </div>
            </div>
          </div>
        </div>

        <el-table :data="tableRows" stripe>
          <el-table-column prop="user" label="用户" min-width="120" />
          <el-table-column prop="sender" label="发送人" min-width="180" />
          <el-table-column prop="senderType" label="发送人类型" width="120" />
          <el-table-column prop="receiver" label="接收对象" min-width="180" />
          <el-table-column prop="rule" :label="activeTab === 'word' ? '敏感词' : '敏感行为'" width="140" />
          <el-table-column prop="content" label="发送内容" min-width="280" show-overflow-tooltip />
          <el-table-column prop="timeText" label="发送时间" width="180" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }"><el-button link type="primary" @click="openContext(row.content)">查看上下文</el-button></template>
          </el-table-column>
        </el-table>
      </div>

      <div v-else class="card-block">
        <div class="setting-list">
          <div v-for="item in monitorSettings" :key="item.title" class="setting-item">
            <div>
              <div class="setting-title">{{ item.title }}</div>
              <div class="setting-desc">{{ item.desc }}</div>
            </div>
            <el-switch v-model="item.enabled" />
          </div>
        </div>
      </div>
    </section>

    <el-drawer v-model="drawerVisible" title="聊天上下文" size="520px">
      <div class="context-drawer">
        <div class="context-block inbound">客户：{{ drawerContent }}</div>
        <div class="context-block outbound">顾问：该条内容已进入会话分析，正在进一步核查。</div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import * as WeworkChatApi from '@/api/crm/wework/chat'

const activeTab = ref<'word' | 'behavior' | 'setting'>('word')
const selectedCorpId = ref('')
const dateRange = ref<string[]>([])
const keyword = ref('')
const senderType = ref('')
const customerKeyword = ref('')
const loading = ref(false)
const drawerVisible = ref(false)
const drawerContent = ref('')
const detailData = ref<WeworkChatApi.WeworkChatAnalysisDetailRespVO>({ corpList: [], trendList: [], ruleCountList: [], rows: [] })

const tabs = [
  { label: '敏感词分析', value: 'word' },
  { label: '敏感行为分析', value: 'behavior' },
  { label: '监控设置', value: 'setting' }
] as const

const monitorSettings = reactive([
  { title: '敏感词告警', desc: '命中敏感词后在列表中留痕并通知主管', enabled: true },
  { title: '超时未回复', desc: '客户长时间未收到回复时触发分析任务', enabled: true },
  { title: '好友删除提醒', desc: '成员删除或被删除后进入异常行为分析', enabled: false }
])

const corpOptions = computed(() => detailData.value.corpList.map((corp) => ({ value: corp.corpId, label: corp.corpName || corp.corpId })))
const trendData = computed(() => detailData.value.trendList.slice(0, 8))
const tableRows = computed(() => detailData.value.rows.map((item) => ({ ...item, timeText: item.msgTime ? dayjs.unix(item.msgTime).format('YYYY-MM-DD HH:mm:ss') : '-' })))
const dominantLabel = computed(() => detailData.value.ruleCountList[0]?.ruleName || (activeTab.value === 'word' ? '课程优惠' : '超时未回复'))
const dominantValue = computed(() => detailData.value.ruleCountList[0]?.count || 0)
const donutBackground = computed(() => `conic-gradient(#409eff 0 ${Math.min((dominantValue.value || 1) * 24, 320)}deg, #e8e8e8 0 360deg)`)

const openContext = (content: string) => {
  drawerContent.value = content
  drawerVisible.value = true
}

const loadAnalysisDetail = async () => {
  if (activeTab.value === 'setting') return
  loading.value = true
  try {
    const resp = await WeworkChatApi.getWeworkChatAnalysisDetail({
      corpId: selectedCorpId.value || undefined,
      analysisMode: activeTab.value,
      keyword: keyword.value || undefined,
      senderType: senderType.value || undefined,
      customerKeyword: customerKeyword.value || undefined,
      beginMsgTime: dateRange.value[0] ? dayjs(dateRange.value[0]).startOf('day').unix() : undefined,
      endMsgTime: dateRange.value[1] ? dayjs(dateRange.value[1]).endOf('day').unix() : undefined
    })
    detailData.value = resp
    if (!selectedCorpId.value && resp.corpList.length) selectedCorpId.value = resp.corpList[0].corpId
  } finally {
    loading.value = false
  }
}

watch([activeTab, selectedCorpId, dateRange], loadAnalysisDetail)
onMounted(loadAnalysisDetail)
</script>

<style scoped lang="scss">
.analysis-layout { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 8px; }
.corp-panel, .card-block { background: #fff; border: 1px solid var(--el-border-color-light); border-radius: 8px; }
.corp-panel { padding: 8px; min-height: 640px; }
.corp-title { margin-bottom: 12px; font-weight: 500; }
.corp-item, .analysis-tab { border: none; background: transparent; cursor: pointer; }
.corp-item { width: 100%; margin-bottom: 6px; padding: 9px 12px; border-radius: 6px; text-align: left; color: #606266; }
.corp-item.active { background: #b4c5f5; color: #303133; }
.analysis-tabs { display: flex; gap: 24px; margin-bottom: 12px; }
.analysis-tab { padding: 4px 0 10px; color: #606266; }
.analysis-tab.active { color: #409eff; box-shadow: inset 0 -2px 0 #409eff; }
.card-block { padding: 16px; }
.filter-row { display: grid; grid-template-columns: 280px 1fr 160px 200px; gap: 12px; margin-bottom: 16px; }
.chart-grid { display: grid; grid-template-columns: 1fr 280px; gap: 16px; margin-bottom: 16px; }
.chart-card { padding: 16px; background: #fff; border: 1px solid var(--el-border-color-light); border-radius: 8px; }
.chart-title { margin-bottom: 16px; font-size: 13px; color: #606266; }
.line-chart { height: 180px; display: grid; grid-template-columns: repeat(8, 1fr); gap: 12px; align-items: end; }
.line-point { display: flex; flex-direction: column; align-items: center; justify-content: end; gap: 6px; height: 100%; }
.line-bar { width: 20px; min-height: 12px; border-radius: 999px 999px 4px 4px; background: linear-gradient(180deg, #6fb6ff 0%, #409eff 100%); }
.line-value, .line-label { font-size: 12px; color: #909399; }
.donut-card { display: flex; flex-direction: column; align-items: center; justify-content: center; }
.donut-legend { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
.legend-dot { width: 12px; height: 12px; border-radius: 3px; background: #409eff; }
.donut-shell { display: flex; align-items: center; justify-content: center; }
.donut-ring { width: 150px; height: 150px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.donut-inner { width: 94px; height: 94px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 600; }
.setting-list { display: grid; gap: 12px; }
.setting-item { display: flex; align-items: center; justify-content: space-between; padding: 16px; border: 1px solid var(--el-border-color-light); border-radius: 8px; }
.setting-title { font-weight: 500; margin-bottom: 4px; }
.setting-desc { color: #909399; font-size: 12px; }
.context-drawer { display: grid; gap: 12px; }
.context-block { padding: 12px 14px; border-radius: 8px; line-height: 1.6; }
.context-block.inbound { background: #f5f7fa; }
.context-block.outbound { margin-left: 60px; background: #e6f4ff; }
</style>
