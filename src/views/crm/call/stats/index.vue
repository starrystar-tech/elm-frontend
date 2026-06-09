<template>
    <div class="call-stats-page">
        <ContentWrap>
            <Search :schema="searchSchema" @search="setSearchParams" @reset="resetSearchParams" />
        </ContentWrap>

        <ContentWrap class="mt-16px">
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
                                <span class="call-stats-overview__legend-value">
                                    {{ item.value }}，占比{{ item.percentage }}%
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

        <ContentWrap class="mt-16px">
            <div class="call-stats-trend p-16px">
                <div class="call-stats-trend__title">通话量/通话时长趋势</div>
                <Echart :height="360" :options="trendChartOptions" />
            </div>
        </ContentWrap>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import { Search } from '@/components/Search'
import { ContentWrap } from '@/components/ContentWrap'
import type { FormSchema } from '@/types/form'
import {
    CALL_STATUS_COLORS,
    callDeptUserOptions,
    callRecordMocks,
    formatDurationText,
    toDateOnly
} from '../mock'

defineOptions({ name: 'CrmCallStats' })

const defaultSearchParams = {
    deptUserKeyword: undefined as string | undefined,
    callType: undefined as string | undefined,
    dateRange: undefined as string[] | undefined
}

const searchParams = ref({ ...defaultSearchParams })

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'deptUserKeyword',
        label: '部门/用户',
        component: 'Select',
        componentProps: {
            placeholder: '请选择部门或用户',
            clearable: true,
            options: callDeptUserOptions,
            style: { width: '220px' }
        }
    },
    {
        field: 'dateRange',
        label: '日期',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD',
            startPlaceholder: '开始日期',
            endPlaceholder: '结束日期',
            style: { width: '240px' }
        }
    },
    {
        field: 'callType',
        label: '通话类型',
        component: 'Select',
        componentProps: {
            placeholder: '请选择通话类型',
            clearable: true,
            options: [
                { label: '呼出', value: '呼出' },
                { label: '接听', value: '接听' }
            ],
            style: { width: '180px' }
        }
    }
])

const filteredRecords = computed(() => {
    return callRecordMocks.filter((item) => {
        const deptUserKeyword = searchParams.value.deptUserKeyword
        const callType = searchParams.value.callType
        const dateRange = searchParams.value.dateRange
        const dateOnly = toDateOnly(item.date)
        const matchesDeptOrUser =
            !deptUserKeyword ||
            item.userName === deptUserKeyword ||
            item.departmentName === deptUserKeyword
        const matchesCallType = !callType || item.callType === callType
        const matchesDate =
            !dateRange?.length || (dateOnly >= dateRange[0] && dateOnly <= dateRange[1])
        return matchesDeptOrUser && matchesCallType && matchesDate
    })
})

const pieLegendItems = computed(() => {
    const total = filteredRecords.value.length || 1
    return Object.entries(CALL_STATUS_COLORS)
        .map(([name, color]) => {
            const value = filteredRecords.value.filter((item) => item.status === name).length
            return {
                name,
                color,
                value,
                percentage: value ? Math.round((value / total) * 100) : 0
            }
        })
        .filter((item) => item.value > 0)
})

const summaryCards = computed(() => {
    const answeredRecords = filteredRecords.value.filter((item) => item.status === '已接通')
    const unansweredCount = filteredRecords.value.length - answeredRecords.length
    const connectedMobiles = new Set(answeredRecords.map((item) => item.mobile))
    const totalDurationSeconds = answeredRecords.reduce(
        (sum, item) => sum + item.durationSeconds,
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
        const date = toDateOnly(item.date)
        if (!grouped.has(date)) {
            grouped.set(date, {
                answeredCount: 0,
                unansweredCount: 0,
                customerSet: new Set<string>(),
                durationSeconds: 0
            })
        }
        const target = grouped.get(date)!
        if (item.status === '已接通') {
            target.answeredCount += 1
            target.customerSet.add(item.mobile)
            target.durationSeconds += item.durationSeconds
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

    return {
        color: ['#52c41a', '#fa8c16', '#1890ff', '#722ed1'],
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            top: 0,
            right: 0
        },
        grid: {
            left: 24,
            right: 32,
            top: 48,
            bottom: 24,
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: dates
        },
        yAxis: [
            {
                type: 'value',
                name: '数量',
                minInterval: 1
            },
            {
                type: 'value',
                name: '时长(分)'
            }
        ],
        series: [
            {
                name: '已接通',
                type: 'bar',
                barMaxWidth: 18,
                data: answeredCounts
            },
            {
                name: '未接通',
                type: 'bar',
                barMaxWidth: 18,
                data: unansweredCounts
            },
            {
                name: '已通话客户',
                type: 'bar',
                barMaxWidth: 18,
                data: customerCounts
            },
            {
                name: '通话时长',
                type: 'line',
                yAxisIndex: 1,
                smooth: true,
                data: durationMinutes
            }
        ]
    }
})

const setSearchParams = (params: Recordable) => {
    searchParams.value = {
        deptUserKeyword: params.deptUserKeyword || undefined,
        callType: params.callType || undefined,
        dateRange: params.dateRange?.length ? params.dateRange : undefined
    }
}

const resetSearchParams = () => {
    searchParams.value = { ...defaultSearchParams }
}
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
    min-width: 84px;
    font-weight: 500;
    color: #374151;
}

.call-stats-overview__legend-value {
    color: #6b7280;
    font-size: 13px;
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
