<template>
    <div class="call-stats-page">
        <ContentWrap>
            <Search :model="searchParams" @search="setSearchParams" @reset="resetSearchParams">
                <el-form-item label="部门" prop="deptId">
                    <DeptSelector
                        v-model="searchParams.deptId"
                        placeholder="请选择部门"
                        style="width: 220px"
                    />
                </el-form-item>
                <el-form-item label="员工" prop="userId">
                    <el-input
                        v-model="selectedUserName"
                        clearable
                        placeholder="请选择员工"
                        style="width: 220px"
                        @click="openUserSelect"
                        @clear="clearSelectedUser"
                    />
                </el-form-item>
                <el-form-item label="日期" prop="dateRange">
                    <el-date-picker
                        v-model="searchParams.dateRange"
                        type="daterange"
                        value-format="YYYY-MM-DD HH:mm:ss"
                        start-placeholder="开始时间"
                        end-placeholder="结束时间"
                        :default-time="dateRangeDefaultTime"
                        style="width: 240px"
                    />
                </el-form-item>
                <el-form-item label="通话类型" prop="callType">
                    <el-select
                        v-model="searchParams.callType"
                        clearable
                        placeholder="请选择通话类型"
                        style="width: 220px"
                    >
                        <el-option label="公网外呼" :value="1" />
                        <el-option label="内部通话" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item label="线路" prop="outboundRouteId">
                    <OutboundRouteSelect
                        v-model="searchParams.outboundRouteId"
                        placeholder="请选择线路"
                        style="width: 220px"
                    />
                </el-form-item>
                <el-form-item label-width="0">
                    <el-button type="primary" @click="setSearchParams(searchParams)">
                        <Icon class="mr-5px" icon="ep:search" />
                        查询
                    </el-button>
                    <el-button @click="resetSearchParams">
                        <Icon class="mr-5px" icon="ep:refresh" />
                        重置
                    </el-button>
                </el-form-item>
            </Search>
        </ContentWrap>

        <ContentWrap class="mt-16px" v-loading="loading">
            <div class="call-stats-overview p-16px">
                <div class="call-stats-overview__chart">
                    <div class="call-stats-overview__title">通话概览</div>
                    <div class="call-stats-overview__chart-grid">
                        <div class="call-stats-overview__pie">
                            <Echart :height="260" :options="pieChartOptions" />
                        </div>
                        <div class="call-stats-overview__legend">
                            <div
                                v-for="item in pieLegendItems"
                                :key="item.name"
                                class="call-stats-overview__legend-item"
                            >
                                <span
                                    class="call-stats-overview__legend-dot"
                                    :style="{ backgroundColor: item.color }"
                                ></span>
                                <span class="call-stats-overview__legend-name">{{
                                    item.name
                                }}</span>
                                <div class="call-stats-overview__legend-bar-wrap">
                                    <div
                                        class="call-stats-overview__legend-bar"
                                        :style="{
                                            width: item.percentage + '%',
                                            backgroundColor: item.color
                                        }"
                                    ></div>
                                </div>
                                <span class="call-stats-overview__legend-value">
                                    {{ item.value }} ({{ item.percentage }}%)
                                </span>
                            </div>
                        </div>
                        <div class="call-stats-overview__metrics">
                            <div
                                v-for="item in summaryCards"
                                :key="item.label"
                                class="call-stats-overview__metric-card"
                            >
                                <div class="call-stats-overview__metric-label">{{
                                    item.label
                                }}</div>
                                <div
                                    class="call-stats-overview__metric-value"
                                    :style="{ color: item.color }"
                                >
                                    {{ item.value }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ContentWrap>

        <ContentWrap class="mt-16px" v-loading="loading">
            <div class="call-stats-trend p-16px">
                <div class="call-stats-trend__title">通话量/通话时长趋势</div>
                <Echart :height="360" :options="trendChartOptions" />
            </div>
        </ContentWrap>
        <UserSelectForm ref="userSelectFormRef" @confirm="handleUserSelectConfirm" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import { Search } from '@/components/Search'
import { ContentWrap } from '@/components/ContentWrap'
import OutboundRouteSelect from '@/components/OutboundRouteSelect.vue'
import * as OutboundCallRecordApi from '@/api/system/call/record'
import type { UserVO } from '@/api/system/user'
import UserSelectForm from '@/components/UserSelectForm/index.vue'
import DeptSelector from '@/views/system/dept/components/DeptSelector.vue'

defineOptions({ name: 'CrmCallStats' })

const defaultSearchParams = {
    deptId: undefined as number | undefined,
    userId: undefined as number | undefined,
    outboundRouteId: undefined as number | undefined,
    callType: undefined as number | undefined,
    dateRange: undefined as string[] | undefined
}

const searchParams = reactive({ ...defaultSearchParams })
const recordList = ref<OutboundCallRecordApi.OutboundCallRecordVO[]>([])
const loading = ref(false)
const selectedUserName = ref('')
const userSelectFormRef = ref<InstanceType<typeof UserSelectForm>>()
const dateRangeDefaultTime = [new Date(2000, 0, 1, 0, 0, 0), new Date(2000, 0, 1, 23, 59, 59)]

const CALL_STATUS_COLORS: Record<string, string> = {
    已接通: '#52c41a',
    发起中: '#13c2c2',
    已提交: '#1890ff',
    失败: '#eb2f96',
    无人接听: '#fa8c16',
    忙线: '#722ed1',
    已挂断: '#f5222d'
}

const formatDurationText = (durationSeconds?: number) => {
    const totalSeconds = Math.max(0, Math.floor(durationSeconds || 0))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}分${String(seconds).padStart(2, '0')}秒`
}

const toDateOnly = (value?: string | number | number[] | Date) => {
    if (!value) return ''
    if (Array.isArray(value)) {
        const [year, month, day] = value
        if (!year || !month || !day) return ''
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
    if (value instanceof Date) {
        const year = value.getFullYear()
        const month = String(value.getMonth() + 1).padStart(2, '0')
        const day = String(value.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }
    if (typeof value === 'number') {
        const strValue = String(value)
        const multiplier = strValue.length === 10 ? 1000 : 1
        const date = new Date(value * multiplier)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }
    const strValue = String(value)
    if (/^\d{10,13}$/.test(strValue)) {
        const timestamp = parseInt(strValue, 10)
        const multiplier = strValue.length === 10 ? 1000 : 1
        const date = new Date(timestamp * multiplier)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }
    return strValue.slice(0, 10)
}

const loadRecordList = async () => {
    loading.value = true
    try {
        const data = await OutboundCallRecordApi.getOutboundCallRecordList({
            deptId: searchParams.deptId,
            userId: searchParams.userId,
            outboundRouteId: searchParams.outboundRouteId,
            callType: searchParams.callType,
            createTime: searchParams.dateRange
        })
        recordList.value = data || []
    } finally {
        loading.value = false
    }
}

const filteredRecords = computed(() => {
    return recordList.value
})

const pieLegendItems = computed(() => {
    const total = filteredRecords.value.length || 1
    const grouped = filteredRecords.value.reduce<Record<string, number>>((result, item) => {
        const statusName = item.statusDesc || '未知'
        result[statusName] = (result[statusName] || 0) + 1
        return result
    }, {})
    return Object.entries(grouped)
        .map(([name, value]) => {
            return {
                name,
                color: CALL_STATUS_COLORS[name] || '#8c8c8c',
                value,
                percentage: value ? Math.round((value / total) * 100) : 0
            }
        })
        .filter((item) => item.value > 0)
})

const summaryCards = computed(() => {
    const answeredRecords = filteredRecords.value.filter((item) => item.status === 30)
    const unansweredCount = filteredRecords.value.length - answeredRecords.length
    const connectedMobiles = new Set(answeredRecords.map((item) => item.calleeMobile))
    const totalDurationSeconds = answeredRecords.reduce(
        (sum, item) => sum + (item.durationSeconds || 0),
        0
    )
    return [
        { label: '已接通次数', value: String(answeredRecords.length), color: '#52c41a' },
        { label: '未接通次数', value: String(unansweredCount), color: '#fa8c16' },
        { label: '已通话客户数', value: String(connectedMobiles.size), color: '#1890ff' },
        { label: '通话总时长', value: formatDurationText(totalDurationSeconds), color: '#722ed1' }
    ]
})

const pieChartOptions = computed<EChartsOption>(() => {
    const total = filteredRecords.value.length
    return {
        color: pieLegendItems.value.map((item) => item.color),
        tooltip: {
            trigger: 'item',
            formatter: '{b}<br/>{c} 次 ({d}%)'
        },
        title: {
            text: String(total),
            subtext: '总通话',
            left: 'center',
            top: '40%',
            textStyle: {
                fontSize: 28,
                fontWeight: 700,
                color: '#1f2937'
            },
            subtextStyle: {
                fontSize: 13,
                color: '#6b7280',
                lineHeight: 22
            }
        },
        series: [
            {
                type: 'pie',
                radius: ['56%', '76%'],
                center: ['50%', '50%'],
                avoidLabelOverlap: false,
                label: { show: false },
                data: pieLegendItems.value.map((item) => ({
                    name: item.name,
                    value: item.value
                }))
            }
        ]
    }
})

const trendChartOptions = computed<EChartsOption>(() => {
    const grouped = new Map<
        string,
        {
            answeredCount: number
            unansweredCount: number
            customerSet: Set<string>
            durationSeconds: number
        }
    >()
    filteredRecords.value.forEach((item) => {
        const date = toDateOnly(item.createTime)
        if (!date) return
        if (!grouped.has(date)) {
            grouped.set(date, {
                answeredCount: 0,
                unansweredCount: 0,
                customerSet: new Set<string>(),
                durationSeconds: 0
            })
        }
        const target = grouped.get(date)!
        if (item.status === 30) {
            target.answeredCount += 1
            target.customerSet.add(item.calleeMobile)
            target.durationSeconds += item.durationSeconds || 0
        } else {
            target.unansweredCount += 1
        }
    })

    const dates = Array.from(grouped.keys()).sort()
    const answeredCounts = dates.map((date) => grouped.get(date)?.answeredCount || 0)
    const unansweredCounts = dates.map((date) => grouped.get(date)?.unansweredCount || 0)
    const customerCounts = dates.map((date) => grouped.get(date)?.customerSet.size || 0)
    const durationMinutes = dates.map((date) =>
        Number(((grouped.get(date)?.durationSeconds || 0) / 60).toFixed(1))
    )

    const xAxisFormatter = (value: string) => {
        if (!value) return ''
        const parts = value.split('-')
        if (parts.length === 3) {
            return `${parts[1]}-${parts[2]}`
        }
        return value
    }

    return {
        color: ['#52c41a', '#fa8c16', '#1890ff', '#722ed1'],
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            padding: [12, 16],
            textStyle: {
                color: '#f8fafc',
                fontSize: 13
            },
            axisPointer: {
                type: 'cross',
                lineStyle: {
                    color: 'rgba(148, 163, 184, 0.4)'
                }
            },
            formatter: (params: any) => {
                if (!Array.isArray(params)) return ''
                let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0]?.axisValue || ''}</div>`
                params.forEach((item: any) => {
                    const marker = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:8px;"></span>`
                    const unit = item.seriesName === '通话时长' ? '分' : '次'
                    result += `<div style="display:flex;align-items:center;margin:4px 0;">${marker}${item.seriesName}：<span style="font-weight:600;margin-left:4px;">${item.value}${unit}</span></div>`
                })
                return result
            }
        },
        legend: {
            top: 0,
            right: 0,
            itemWidth: 14,
            itemHeight: 14,
            itemGap: 24,
            textStyle: {
                color: '#4b5563',
                fontSize: 13
            }
        },
        grid: {
            left: 56,
            right: 56,
            top: 48,
            bottom: dates.length > 15 ? 72 : 56,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates,
            axisLine: {
                lineStyle: {
                    color: '#e5e7eb'
                }
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                color: '#6b7280',
                fontSize: dates.length > 20 ? 10 : 12,
                rotate: dates.length > 15 ? 45 : dates.length > 7 ? 30 : 0,
                interval: dates.length > 30 ? 3 : dates.length > 20 ? 2 : dates.length > 10 ? 1 : 0,
                formatter: xAxisFormatter
            }
        },
        yAxis: [
            {
                type: 'value',
                name: '数量',
                nameTextStyle: {
                    color: '#6b7280',
                    fontSize: 12,
                    padding: [0, 0, 0, 40]
                },
                minInterval: 1,
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    color: '#6b7280',
                    fontSize: 12
                },
                splitLine: {
                    lineStyle: {
                        color: '#f3f4f6',
                        type: 'dashed'
                    }
                }
            },
            {
                type: 'value',
                name: '时长(分)',
                nameTextStyle: {
                    color: '#6b7280',
                    fontSize: 12,
                    padding: [0, 40, 0, 0]
                },
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                axisLabel: {
                    color: '#6b7280',
                    fontSize: 12
                },
                splitLine: {
                    show: false
                }
            }
        ],
        series: [
            {
                name: '已接通',
                type: 'bar',
                barMaxWidth: 18,
                itemStyle: {
                    borderRadius: [4, 4, 0, 0]
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 8,
                        shadowColor: 'rgba(82, 196, 26, 0.3)'
                    }
                },
                data: answeredCounts
            },
            {
                name: '未接通',
                type: 'bar',
                barMaxWidth: 18,
                itemStyle: {
                    borderRadius: [4, 4, 0, 0]
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 8,
                        shadowColor: 'rgba(250, 140, 22, 0.3)'
                    }
                },
                data: unansweredCounts
            },
            {
                name: '已通话客户',
                type: 'bar',
                barMaxWidth: 18,
                itemStyle: {
                    borderRadius: [4, 4, 0, 0]
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 8,
                        shadowColor: 'rgba(24, 144, 255, 0.3)'
                    }
                },
                data: customerCounts
            },
            {
                name: '通话时长',
                type: 'line',
                yAxisIndex: 1,
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: {
                    width: 3
                },
                itemStyle: {
                    borderWidth: 2,
                    borderColor: '#fff'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(114, 46, 209, 0.25)' },
                            { offset: 1, color: 'rgba(114, 46, 209, 0.02)' }
                        ]
                    }
                },
                emphasis: {
                    scale: true,
                    itemStyle: {
                        shadowBlur: 12,
                        shadowColor: 'rgba(114, 46, 209, 0.4)'
                    }
                },
                data: durationMinutes
            }
        ]
    }
})

const setSearchParams = (params: Recordable) => {
    searchParams.deptId = params.deptId || undefined
    searchParams.userId = params.userId || undefined
    searchParams.outboundRouteId = params.outboundRouteId || undefined
    searchParams.callType = params.callType || undefined
    searchParams.dateRange = params.dateRange?.length ? params.dateRange : undefined
    void loadRecordList()
}

const resetSearchParams = () => {
    clearSelectedUser()
    searchParams.deptId = undefined
    searchParams.outboundRouteId = undefined
    searchParams.callType = undefined
    searchParams.dateRange = undefined
    void loadRecordList()
}

const openUserSelect = () => {
    const selectedList = searchParams.userId
        ? [{ id: searchParams.userId, nickname: selectedUserName.value }]
        : []
    userSelectFormRef.value?.open(0, selectedList, { title: '选择员工', multiple: false })
}

const handleUserSelectConfirm = (_id: any, userList: UserVO[]) => {
    const user = userList?.[0]
    searchParams.userId = user?.id
    selectedUserName.value = user?.nickname || user?.username || ''
}

const clearSelectedUser = () => {
    searchParams.userId = undefined
    selectedUserName.value = ''
}

onMounted(loadRecordList)
</script>

<style scoped lang="scss">
.call-stats-page {
    min-height: calc(100vh - 140px);
}

.call-stats-overview__title,
.call-stats-trend__title {
    margin-bottom: 18px;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
}

.call-stats-overview__chart-grid {
    display: grid;
    grid-template-columns: 320px minmax(280px, 1fr) 320px;
    gap: 24px;
    align-items: center;
}

.call-stats-overview__pie {
    padding: 12px 0;
}

.call-stats-overview__legend {
    display: grid;
    gap: 14px;
}

.call-stats-overview__legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: linear-gradient(180deg, #fafcff 0%, #f4f7fb 100%);
    border: 1px solid #eef2f7;
    border-radius: 12px;
}

.call-stats-overview__legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    flex: 0 0 auto;
}

.call-stats-overview__legend-name {
    min-width: 60px;
    font-weight: 500;
    color: #374151;
    font-size: 13px;
}

.call-stats-overview__legend-bar-wrap {
    flex: 1;
    height: 6px;
    background: #e5e7eb;
    border-radius: 999px;
    overflow: hidden;
}

.call-stats-overview__legend-bar {
    height: 100%;
    border-radius: 999px;
    transition: width 0.3s ease;
}

.call-stats-overview__legend-value {
    min-width: 80px;
    color: #6b7280;
    font-size: 12px;
    text-align: right;
}

.call-stats-overview__metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.call-stats-overview__metric-card {
    padding: 18px 20px;
    border-radius: 16px;
    background:
        radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 38%),
        linear-gradient(180deg, #fbfdff 0%, #f3f7fc 100%);
    border: 1px solid #edf2f8;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.call-stats-overview__metric-label {
    margin-bottom: 10px;
    font-size: 13px;
    color: #6b7280;
}

.call-stats-overview__metric-value {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.2;
}

@media (max-width: 1280px) {
    .call-stats-overview__chart-grid {
        grid-template-columns: 1fr;
    }

    .call-stats-overview__pie {
        max-width: 360px;
        margin: 0 auto;
    }
}

@media (max-width: 768px) {
    .call-stats-overview__metrics {
        grid-template-columns: 1fr;
    }
}
</style>
