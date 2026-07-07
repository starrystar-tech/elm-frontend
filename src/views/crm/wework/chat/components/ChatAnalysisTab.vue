<template>
    <div class="analysis-layout">
        <aside class="corp-panel">
            <button
                v-for="corp in corpOptions"
                :key="corp.value"
                class="corp-item"
                :class="{ active: corp.value === selectedCorpId }"
                @click="selectedCorpId = corp.value"
            >
                {{ corp.label }}
            </button>
        </aside>

        <section class="analysis-main" v-loading="loading">
            <div class="analysis-tabs pt-10px">
                <button
                    v-for="tab in tabs"
                    :key="tab.value"
                    class="analysis-tab"
                    :class="{ active: activeTab === tab.value }"
                    @click="activeTab = tab.value"
                >
                    {{ tab.label }}
                </button>
            </div>

            <div v-if="activeTab !== 'setting'" class="card-block">
                <div class="filter-row">
                    <el-date-picker
                        v-model="dateRange"
                        type="daterange"
                        unlink-panels
                        style="width: 100%"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                        value-format="YYYY-MM-DD"
                    />
                    <el-input
                        v-model="keyword"
                        :placeholder="activeTab === 'word' ? '请选择敏感词' : '请选择敏感行为'"
                    />
                    <el-select v-model="senderType" placeholder="发送人类型">
                        <el-option label="全部类型" value="" />
                        <el-option label="员工" value="员工" />
                        <el-option label="客户" value="客户" />
                    </el-select>
                    <el-input v-model="customerKeyword" placeholder="请输入客户" />
                </div>
                <div class="filter-actions">
                    <el-button type="primary" @click="handleSearch">查询</el-button>
                    <el-button @click="handleReset">重置</el-button>
                </div>

                <div class="chart-grid">
                    <div class="chart-card">
                        <div class="chart-title">{{
                            activeTab === 'word' ? '发送次数' : '操作次数'
                        }}</div>
                        <div class="line-chart">
                            <div v-for="item in trendData" :key="item.label" class="line-point">
                                <div
                                    class="line-bar"
                                    :style="{ height: `${Math.max(item.count * 12, 8)}px` }"
                                ></div>
                                <div class="line-value">{{ item.count }}</div>
                                <div class="line-label">{{ item.label }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="chart-card donut-card">
                        <div class="donut-legend"
                            ><span class="legend-dot"></span>{{ dominantLabel }}</div
                        >
                        <div class="donut-shell">
                            <div class="donut-ring" :style="{ background: donutBackground }">
                                <div class="donut-inner">{{ dominantValue }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <el-table :data="tableRows" stripe>
                    <el-table-column label="发送人" min-width="200">
                        <template #default="{ row }">
                            <div class="sender-cell">
                                <div class="sender-avatar">
                                    <img
                                        v-if="row.senderAvatar"
                                        :src="row.senderAvatar"
                                        alt=""
                                        class="sender-avatar-image"
                                    />
                                    <span v-else class="sender-avatar-text">{{
                                        row.sender?.slice(0, 1) || '员'
                                    }}</span>
                                </div>
                                <span class="sender-name">{{ row.sender }}</span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="senderType" label="发送人类型" width="120" />
                    <el-table-column prop="receiver" label="接收对象" min-width="180" />
                    <el-table-column
                        prop="rule"
                        :label="activeTab === 'word' ? '敏感词' : '敏感行为'"
                        width="140"
                    />
                    <el-table-column
                        prop="content"
                        label="发送内容"
                        min-width="280"
                        show-overflow-tooltip
                    />
                    <el-table-column prop="timeText" label="发送时间" width="180" />
                    <el-table-column label="操作" width="120" fixed="right">
                        <template #default="{ row }"
                            ><el-button link type="primary" @click="openContext(row)"
                                >查看上下文</el-button
                            ></template
                        >
                    </el-table-column>
                </el-table>
            </div>

            <div v-else class="card-block">
                <div v-loading="settingLoading" class="setting-section">
                    <div class="setting-card">
                        <div class="setting-card-header">
                            <h3 class="setting-card-title">敏感词管理</h3>
                            <el-button type="primary" @click="openSensitiveWordDialog()"
                                >新建敏感词</el-button
                            >
                        </div>
                        <el-table :data="sensitiveWordList" stripe>
                            <el-table-column prop="word" label="敏感词" min-width="160" />
                            <el-table-column label="匹配词" min-width="220">
                                <template #default="{ row }">
                                    <div class="tag-list">
                                        <el-tag
                                            v-for="item in row.matchWords"
                                            :key="item"
                                            type="primary"
                                            effect="light"
                                        >
                                            {{ item }}
                                        </el-tag>
                                        <span v-if="!row.matchWords.length" class="empty-text"
                                            >--</span
                                        >
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="scope" label="监控范围" min-width="220" />
                            <el-table-column label="操作" width="140">
                                <template #default="{ row }">
                                    <el-button
                                        link
                                        type="primary"
                                        @click="openSensitiveWordDialog(row)"
                                        >编辑</el-button
                                    >
                                    <el-button
                                        link
                                        type="danger"
                                        @click="handleDeleteSensitiveWord(row.id)"
                                        >删除</el-button
                                    >
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>

                    <div class="setting-card">
                        <div class="setting-card-header">
                            <h3 class="setting-card-title">敏感行为管理</h3>
                            <el-button
                                type="primary"
                                :loading="savingSetting"
                                @click="saveBehaviorSetting"
                                >保存设置</el-button
                            >
                        </div>

                        <div class="setting-form-item">
                            <div class="setting-form-label">监控范围：</div>
                            <div class="setting-form-content">
                                <el-radio-group v-model="behaviorSetting.scopeType">
                                    <el-radio label="all">全部企业</el-radio>
                                    <el-radio label="partial">指定企业</el-radio>
                                </el-radio-group>
                                <el-select
                                    v-if="behaviorSetting.scopeType === 'partial'"
                                    v-model="behaviorSetting.corps"
                                    multiple
                                    collapse-tags
                                    collapse-tags-tooltip
                                    placeholder="请选择企业"
                                    class="corp-select"
                                >
                                    <el-option
                                        v-for="corp in corpOptions"
                                        :key="corp.value"
                                        :label="corp.label"
                                        :value="corp.value"
                                    />
                                </el-select>
                            </div>
                        </div>

                        <div class="setting-block">
                            <div class="setting-block-title">开启后，员工有以下行为会进行记录</div>
                            <div class="behavior-grid">
                                <div
                                    v-for="item in behaviorSetting.actions"
                                    :key="item.key"
                                    class="behavior-item"
                                >
                                    <el-switch v-model="item.enabled" />
                                    <span>{{ item.label }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="setting-block">
                            <div class="setting-block-title">
                                设置后，员工如符合“超时未回复”规则会进行记录
                                <span class="setting-block-tip">（仅监控开通会话存档的成员）</span>
                            </div>

                            <div class="timeout-card">
                                <div class="timeout-rule">
                                    <span>超过</span>
                                    <el-input-number
                                        v-model="behaviorSetting.timeoutMinutes"
                                        :min="1"
                                        :max="999"
                                    />
                                    <span>分钟，未回复客户</span>
                                </div>

                                <div class="time-group-list">
                                    <div
                                        v-for="(group, index) in behaviorSetting.monitorTimeGroups"
                                        :key="group.id"
                                        class="time-group-row"
                                    >
                                        <span class="time-group-label">监控时间：</span>
                                        <el-select
                                            v-model="group.weekdays"
                                            multiple
                                            collapse-tags
                                            collapse-tags-tooltip
                                            placeholder="请选择工作日"
                                            class="weekday-select"
                                        >
                                            <el-option
                                                v-for="item in weekdayOptions"
                                                :key="item"
                                                :label="item"
                                                :value="item"
                                            />
                                        </el-select>
                                        <el-time-select
                                            v-model="group.startTime"
                                            start="00:00"
                                            step="00:30"
                                            end="23:30"
                                            placeholder="开始时间"
                                        />
                                        <span class="time-separator">-</span>
                                        <el-time-select
                                            v-model="group.endTime"
                                            start="00:00"
                                            step="00:30"
                                            end="23:30"
                                            placeholder="结束时间"
                                        />
                                        <el-button
                                            circle
                                            plain
                                            type="danger"
                                            :disabled="
                                                behaviorSetting.monitorTimeGroups.length === 1
                                            "
                                            @click="removeMonitorTimeGroup(index)"
                                        >
                                            <Icon icon="ep:close" />
                                        </el-button>
                                    </div>
                                </div>

                                <el-button
                                    plain
                                    class="add-time-button"
                                    @click="addMonitorTimeGroup"
                                >
                                    <Icon icon="ep:plus" class="mr-4px" />
                                    添加监控时间
                                </el-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <el-dialog
            v-model="wordDialogVisible"
            :title="wordForm.id ? '编辑敏感词' : '新建敏感词'"
            width="520px"
        >
            <el-form label-width="92px">
                <el-form-item label="敏感词">
                    <el-input v-model="wordForm.word" placeholder="请输入敏感词" />
                </el-form-item>
                <el-form-item label="匹配词">
                    <el-input
                        v-model="wordForm.matchWordsText"
                        type="textarea"
                        :rows="3"
                        placeholder="多个匹配词用逗号分隔"
                    />
                </el-form-item>
                <el-form-item label="监控范围">
                    <el-radio-group v-model="wordForm.corpScopeType">
                        <el-radio label="all">全部企业</el-radio>
                        <el-radio label="partial">指定企业</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="wordForm.corpScopeType === 'partial'" label="指定企业">
                    <el-select
                        v-model="wordForm.corpIds"
                        multiple
                        collapse-tags
                        collapse-tags-tooltip
                        placeholder="请选择企业"
                        style="width: 100%"
                    >
                        <el-option
                            v-for="corp in corpOptions"
                            :key="corp.value"
                            :label="corp.label"
                            :value="corp.value"
                        />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="wordDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="savingWord" @click="submitSensitiveWord"
                    >确定</el-button
                >
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import * as WeworkChatApi from '@/api/crm/wework/chat'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { resolveTimestamp } from '@/utils/formatTime'

const activeTab = ref<'word' | 'behavior' | 'setting'>('word')
const selectedCorpId = ref('')
const dateRange = ref<string[]>([])
const keyword = ref('')
const senderType = ref('')
const customerKeyword = ref('')
const loading = ref(false)
const settingLoading = ref(false)
const savingSetting = ref(false)
const savingWord = ref(false)
const message = useMessage()
const router = useRouter()
const tagsViewStore = useTagsViewStore()
const corpList = ref<WeworkChatApi.WeworkChatAnalysisDetailRespVO['corpList']>([])
const detailData = ref<WeworkChatApi.WeworkChatAnalysisDetailRespVO>({
    corpList: [],
    trendList: [],
    ruleCountList: [],
    rows: []
})

const tabs = [
    { label: '敏感词分析', value: 'word' },
    { label: '敏感行为分析', value: 'behavior' },
    { label: '监控设置', value: 'setting' }
] as const

const sensitiveWordList = reactive([
    {
        id: 1,
        word: '快发红包',
        matchWords: [] as string[],
        scope: '全部企业',
        corpScopeType: 'all',
        corpIds: [] as string[]
    }
])

const weekdayOptions = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
let monitorTimeSeed = 2
const behaviorSetting = reactive({
    scopeType: 'all',
    corps: [] as string[],
    actions: [
        { key: 'redPacket', label: '发红包', enabled: false },
        { key: 'card', label: '发名片', enabled: false },
        { key: 'deleteFriend', label: '删除好友', enabled: true },
        { key: 'deletedByFriend', label: '被好友删除', enabled: true }
    ],
    timeoutMinutes: 2,
    monitorTimeGroups: [
        { id: 1, weekdays: ['周一', '周三'], startTime: '09:00', endTime: '18:00' },
        { id: 2, weekdays: [] as string[], startTime: '', endTime: '' }
    ]
})
const wordDialogVisible = ref(false)
const wordForm = reactive({
    id: undefined as number | undefined,
    word: '',
    matchWordsText: '',
    corpScopeType: 'all',
    corpIds: [] as string[]
})

const corpOptions = computed(() =>
    corpList.value.map((corp) => ({
        value: corp.corpId,
        label: corp.corpName || corp.corpId
    }))
)
const trendData = computed(() => detailData.value.trendList.slice(0, 8))
const tableRows = computed(() =>
    detailData.value.rows.map((item) => ({
        ...item,
        timeText: resolveTimestamp(item.msgTime)?.format('YYYY-MM-DD HH:mm:ss') || '-'
    }))
)
const dominantLabel = computed(
    () =>
        detailData.value.ruleCountList[0]?.ruleName ||
        (activeTab.value === 'word' ? '课程优惠' : '超时未回复')
)
const dominantValue = computed(() => detailData.value.ruleCountList[0]?.count || 0)
const donutBackground = computed(
    () =>
        `conic-gradient(#409eff 0 ${Math.min((dominantValue.value || 1) * 24, 320)}deg, #e8e8e8 0 360deg)`
)

const openContext = (row: { corpId?: string; fromUser?: string }) => {
    const targetRoute = router.resolve({
        name: 'CrmWeworkChatAuditDetail',
        query: {
            openKey: `${Date.now()}`,
            corpId: row.corpId || selectedCorpId.value || undefined,
            fromUser: row.fromUser || undefined
        }
    })
    targetRoute.meta = {
        ...targetRoute.meta,
        title: '会话详情'
    }
    tagsViewStore.addView(targetRoute as any)
    router.push(targetRoute)
}

const addMonitorTimeGroup = () => {
    monitorTimeSeed += 1
    behaviorSetting.monitorTimeGroups.push({
        id: monitorTimeSeed,
        weekdays: [],
        startTime: '',
        endTime: ''
    })
}

const removeMonitorTimeGroup = (index: number) => {
    if (behaviorSetting.monitorTimeGroups.length === 1) return
    behaviorSetting.monitorTimeGroups.splice(index, 1)
}

const mergeCorpList = (list: WeworkChatApi.WeworkChatAnalysisDetailRespVO['corpList']) => {
    const merged = [...corpList.value, ...(list || [])]
    corpList.value = merged.filter(
        (item, index) => merged.findIndex((corp) => corp.corpId === item.corpId) === index
    )
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
            beginMsgTime: dateRange.value[0]
                ? dayjs(dateRange.value[0]).startOf('day').unix()
                : undefined,
            endMsgTime: dateRange.value[1]
                ? dayjs(dateRange.value[1]).endOf('day').unix()
                : undefined
        })
        detailData.value = resp
        mergeCorpList(resp.corpList || [])
        if (!selectedCorpId.value && corpList.value.length)
            selectedCorpId.value = corpList.value[0].corpId
    } finally {
        loading.value = false
    }
}

const handleSearch = async () => {
    await loadAnalysisDetail()
}

const handleReset = async () => {
    dateRange.value = []
    keyword.value = ''
    senderType.value = ''
    customerKeyword.value = ''
    await loadAnalysisDetail()
}

const loadMonitorSetting = async () => {
    if (activeTab.value !== 'setting') return
    settingLoading.value = true
    try {
        const resp = await WeworkChatApi.getWeworkChatMonitorSetting()
        mergeCorpList(resp.corpList || [])
        sensitiveWordList.splice(
            0,
            sensitiveWordList.length,
            ...(resp.sensitiveWords || []).map((item) => ({
                id: item.id,
                word: item.word,
                matchWords: item.matchWords || [],
                scope: item.scopeText,
                corpScopeType: item.corpScopeType,
                corpIds: item.corpIds || []
            }))
        )
        behaviorSetting.scopeType = resp.behaviorSetting?.corpScopeType || 'all'
        behaviorSetting.corps = resp.behaviorSetting?.corpIds || []
        behaviorSetting.timeoutMinutes = resp.behaviorSetting?.timeoutMinutes || 2
        behaviorSetting.actions = (resp.behaviorSetting?.actions || []).map((item) => ({ ...item }))
        behaviorSetting.monitorTimeGroups =
            (resp.behaviorSetting?.monitorTimeGroups || []).map((item) => ({
                id: item.id || ++monitorTimeSeed,
                weekdays: item.weekdays || [],
                startTime: item.startTime || '',
                endTime: item.endTime || ''
            })) || []
        if (!behaviorSetting.monitorTimeGroups.length) {
            addMonitorTimeGroup()
        }
    } finally {
        settingLoading.value = false
    }
}

const buildBehaviorPayload = (): WeworkChatApi.WeworkChatMonitorSettingSaveReqVO => ({
    behaviorSetting: {
        corpScopeType: behaviorSetting.scopeType,
        corpIds: behaviorSetting.scopeType === 'partial' ? [...behaviorSetting.corps] : [],
        actions: behaviorSetting.actions.map((item) => ({
            key: item.key,
            label: item.label,
            enabled: item.enabled
        })),
        timeoutMinutes: behaviorSetting.timeoutMinutes,
        monitorTimeGroups: behaviorSetting.monitorTimeGroups.map((item) => ({
            id: item.id,
            weekdays: [...item.weekdays],
            startTime: item.startTime,
            endTime: item.endTime
        }))
    }
})

const saveBehaviorSetting = async () => {
    savingSetting.value = true
    try {
        await WeworkChatApi.saveWeworkChatMonitorSetting(buildBehaviorPayload())
        message.success('保存成功')
        await loadMonitorSetting()
    } finally {
        savingSetting.value = false
    }
}

const openSensitiveWordDialog = (row?: {
    id: number
    word: string
    matchWords: string[]
    corpScopeType: string
    corpIds: string[]
}) => {
    wordForm.id = row?.id
    wordForm.word = row?.word || ''
    wordForm.matchWordsText = row?.matchWords?.join(',') || ''
    wordForm.corpScopeType = row?.corpScopeType || 'all'
    wordForm.corpIds = row?.corpIds ? [...row.corpIds] : []
    wordDialogVisible.value = true
}

const submitSensitiveWord = async () => {
    const payload: WeworkChatApi.WeworkChatSensitiveWordSaveReqVO = {
        id: wordForm.id,
        word: wordForm.word.trim(),
        matchWords: wordForm.matchWordsText
            .split(/[，,]/)
            .map((item) => item.trim())
            .filter(Boolean),
        corpScopeType: wordForm.corpScopeType,
        corpIds: wordForm.corpScopeType === 'partial' ? [...wordForm.corpIds] : []
    }
    savingWord.value = true
    try {
        if (payload.id) {
            await WeworkChatApi.updateWeworkChatSensitiveWord(payload)
        } else {
            await WeworkChatApi.createWeworkChatSensitiveWord(payload)
        }
        message.success('保存成功')
        wordDialogVisible.value = false
        await loadMonitorSetting()
    } finally {
        savingWord.value = false
    }
}

const handleDeleteSensitiveWord = async (id: number) => {
    await message.delConfirm('确认删除该敏感词吗？')
    await WeworkChatApi.deleteWeworkChatSensitiveWord(id)
    message.success('删除成功')
    await loadMonitorSetting()
}

watch(selectedCorpId, loadAnalysisDetail)
watch(activeTab, async () => {
    if (activeTab.value === 'setting') {
        await loadMonitorSetting()
        return
    }
    await loadAnalysisDetail()
})
onMounted(async () => {
    await loadAnalysisDetail()
})
</script>

<style scoped lang="scss">
.analysis-layout {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    gap: 8px;
}
.corp-panel,
.card-block {
    background: #fff;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
}
.corp-panel {
    padding: 8px;
    min-height: 640px;
}
.corp-title {
    margin-bottom: 12px;
    font-weight: 500;
}
.corp-item,
.analysis-tab {
    border: none;
    background: transparent;
    cursor: pointer;
}
.corp-item {
    width: 100%;
    margin-bottom: 6px;
    padding: 9px 12px;
    border-radius: 6px;
    text-align: left;
    color: #606266;
}
.corp-item.active {
    background: #b4c5f5;
    color: #303133;
}
.analysis-tabs {
    display: flex;
    gap: 24px;
    margin-bottom: 12px;
}
.analysis-tab {
    padding: 4px 0 10px;
    color: #606266;
}
.analysis-tab.active {
    color: #409eff;
    box-shadow: inset 0 -2px 0 #409eff;
}
.card-block {
    padding: 16px;
}
.filter-row {
    display: grid;
    grid-template-columns: 280px 1fr 160px 200px;
    gap: 12px;
    margin-bottom: 12px;
}
.filter-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-bottom: 16px;
}
.chart-grid {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 16px;
    margin-bottom: 16px;
}
.chart-card {
    padding: 16px;
    background: #fff;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
}
.chart-title {
    margin-bottom: 16px;
    font-size: 13px;
    color: #606266;
}
.line-chart {
    height: 180px;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 12px;
    align-items: end;
}
.line-point {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: end;
    gap: 6px;
    height: 100%;
}
.line-bar {
    width: 20px;
    min-height: 12px;
    border-radius: 999px 999px 4px 4px;
    background: linear-gradient(180deg, #6fb6ff 0%, #409eff 100%);
}
.line-value,
.line-label {
    font-size: 12px;
    color: #909399;
}
.donut-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
.donut-legend {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
}
.legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    background: #409eff;
}
.donut-shell {
    display: flex;
    align-items: center;
    justify-content: center;
}
.donut-ring {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.donut-inner {
    width: 94px;
    height: 94px;
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 600;
}
.setting-section {
    display: grid;
    gap: 24px;
}
.setting-card {
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background: #fff;
    overflow: hidden;
}
.setting-card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}
.setting-card-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}
.setting-form-item {
    padding: 20px 20px 0;
    display: flex;
    align-items: flex-start;
    gap: 12px;
}
.setting-form-label {
    min-width: 72px;
    line-height: 32px;
    color: #606266;
    font-weight: 500;
}
.setting-form-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.corp-select {
    width: 420px;
    max-width: 100%;
}
.setting-block {
    padding: 20px;
}
.setting-block + .setting-block {
    padding-top: 0;
}
.setting-block-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 14px;
    font-weight: 500;
    color: #303133;
}
.setting-block-title::before {
    content: '';
    width: 4px;
    height: 14px;
    border-radius: 2px;
    background: #409eff;
}
.setting-block-tip {
    font-size: 12px;
    color: #909399;
    font-weight: 400;
}
.behavior-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 28px;
    font-size: 14px;
    padding-left: 12px;
}
.behavior-item {
    display: flex;
    align-items: center;
    gap: 8px;
}
.timeout-card {
    padding: 18px;
    border-radius: 8px;
    background: #fff;
    border: 1px solid var(--el-border-color-lighter);
}
.timeout-rule {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    margin-bottom: 24px;
    color: #606266;
}
.time-group-list {
    display: grid;
    gap: 16px;
    font-size: 14px;
}
.time-group-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: nowrap;
    overflow-x: auto;
}
.time-group-label {
    min-width: 72px;
    color: #606266;
    flex-shrink: 0;
}
.weekday-select {
    width: 240px;
    flex-shrink: 0;
}
.time-separator {
    color: #909399;
    flex-shrink: 0;
}
.add-time-button {
    margin-top: 12px;
    border-style: dashed;
}
.tag-list {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
}
.empty-text {
    color: #909399;
}
.sender-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}
.sender-avatar {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    color: #909399;
    overflow: hidden;
    flex-shrink: 0;
}
.sender-avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.sender-name {
    color: #303133;
    font-weight: 500;
}
.sender-avatar-text {
    font-size: 13px;
    font-weight: 600;
}
</style>
