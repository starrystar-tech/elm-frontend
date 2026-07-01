<template>
    <ContentWrap>
        <Search
            :schema="searchSchema"
            :model="queryParams"
            :remove-no-value-item="false"
            @reset="resetSearchParams"
            @search="setSearchParams"
        >
            <template #headteacherUserId>
                <el-select
                    v-model="queryParams.headteacherUserId"
                    clearable
                    filterable
                    placeholder="请选择班主任"
                    style="width: 220px"
                >
                    <el-option
                        v-for="item in headteacherOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </template>
            <template #applyProjectId>
                <ProductTypeSelect
                    v-model="queryParams.applyProjectId"
                    placeholder="请选择报考项目"
                    style="width: 220px"
                />
            </template>
        </Search>
        <div class="p-16px">
            <el-row :gutter="16" class="mb-16px">
                <el-col :span="8">
                    <div class="stats-card">
                        <span>服务学员</span>
                        <strong>{{ courseTotals.studentCount }}</strong>
                    </div>
                </el-col>
                <el-col :span="8">
                    <div class="stats-card stats-card--success">
                        <span>已开课</span>
                        <strong>{{ courseTotals.startedCourseStudentCount }}</strong>
                    </div>
                </el-col>
                <el-col :span="8">
                    <div class="stats-card stats-card--warning">
                        <span>未开课</span>
                        <strong>{{ courseTotals.notStartedCourseStudentCount }}</strong>
                    </div>
                </el-col>
            </el-row>

            <el-row :gutter="16">
                <el-col :span="12">
                    <el-card shadow="never">
                        <template #header>
                            <div class="stats-section-title">班主任学员开课统计</div>
                        </template>
                        <el-skeleton :loading="loading" animated>
                            <Echart :height="320" :options="courseChartOptions" />
                        </el-skeleton>
                        <el-table
                            v-loading="loading"
                            :data="courseStatsList"
                            class="mt-16px"
                            border
                        >
                            <el-table-column
                                prop="headteacherUserName"
                                label="班主任"
                                min-width="120"
                            />
                            <el-table-column prop="studentCount" label="学员总数" min-width="100" />
                            <el-table-column
                                prop="startedCourseStudentCount"
                                label="已开课"
                                min-width="100"
                            />
                            <el-table-column
                                prop="notStartedCourseStudentCount"
                                label="未开课"
                                min-width="100"
                            />
                        </el-table>
                    </el-card>
                </el-col>
                <el-col :span="12">
                    <el-card shadow="never">
                        <template #header>
                            <div class="stats-section-title">报考项目年度服务学员统计</div>
                        </template>
                        <el-skeleton :loading="loading" animated>
                            <Echart :height="320" :options="projectChartOptions" />
                        </el-skeleton>
                        <el-table
                            v-loading="loading"
                            :data="projectStatsList"
                            class="mt-16px"
                            border
                        >
                            <el-table-column
                                prop="headteacherUserName"
                                label="班主任"
                                min-width="120"
                            />
                            <el-table-column prop="projectName" label="报考项目" min-width="140" />
                            <el-table-column
                                prop="studentCount"
                                label="服务学员数"
                                min-width="110"
                            />
                        </el-table>
                    </el-card>
                </el-col>
            </el-row>
        </div>
    </ContentWrap>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import * as HeadteacherApi from '@/api/crm/allocation/headteacher'
import * as StudentCenterApi from '@/api/crm/studentCenter'
import { ContentWrap } from '@/components/ContentWrap'
import ProductTypeSelect from '@/components/ProductTypeSelect.vue'
import { Search } from '@/components/Search'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'CrmCustomerStats' })

interface StatsSearchParams {
    enrollTimes: string[]
    enrollYear: string
    headteacherUserId?: number
    applyProjectId?: number
}

const pad = (value: number) => String(value).padStart(2, '0')

const formatDateTime = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
        date.getHours()
    )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

const createDefaultSearchParams = (): StatsSearchParams => {
    const now = new Date()
    return {
        enrollTimes: [
            formatDateTime(new Date(now.getFullYear(), 0, 1, 0, 0, 0)),
            formatDateTime(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59))
        ],
        enrollYear: String(now.getFullYear()),
        headteacherUserId: undefined,
        applyProjectId: undefined
    }
}

const queryParams = reactive<StatsSearchParams>(createDefaultSearchParams())
const loading = ref(false)
const headteacherOptions = ref<{ label: string; value: number }[]>([])
const courseStatsList = ref<StudentCenterApi.StudentCourseStatsRespVO[]>([])
const projectStatsList = ref<StudentCenterApi.StudentProjectYearlyStatsRespVO[]>([])

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'enrollTimes',
        label: '报名时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
            startPlaceholder: '开始时间',
            endPlaceholder: '结束时间',
            style: { width: '260px' }
        }
    },
    {
        field: 'enrollYear',
        label: '报名年份',
        component: 'DatePicker',
        componentProps: {
            type: 'year',
            valueFormat: 'YYYY',
            placeholder: '请选择报名年份',
            style: { width: '160px' }
        }
    },
    {
        field: 'headteacherUserId',
        label: '班主任',
        component: 'Input',
        componentProps: {
            style: { width: '220px' }
        }
    },
    {
        field: 'applyProjectId',
        label: '报考项目',
        component: 'Input',
        componentProps: {
            style: { width: '220px' }
        }
    }
])

const courseTotals = computed(() =>
    courseStatsList.value.reduce<{
        studentCount: number
        startedCourseStudentCount: number
        notStartedCourseStudentCount: number
    }>(
        (totals, item) => ({
            studentCount: totals.studentCount + Number(item.studentCount || 0),
            startedCourseStudentCount:
                totals.startedCourseStudentCount + Number(item.startedCourseStudentCount || 0),
            notStartedCourseStudentCount:
                totals.notStartedCourseStudentCount + Number(item.notStartedCourseStudentCount || 0)
        }),
        {
            studentCount: 0,
            startedCourseStudentCount: 0,
            notStartedCourseStudentCount: 0
        }
    )
)

const courseChartOptions = reactive<EChartsOption>({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0 },
    grid: { left: 24, right: 24, bottom: 24, top: 48, containLabel: true },
    dataset: {
        dimensions: [
            'headteacherUserName',
            'startedCourseStudentCount',
            'notStartedCourseStudentCount'
        ],
        source: []
    },
    xAxis: { type: 'category' },
    yAxis: { type: 'value', name: '学员数' },
    series: [
        { type: 'bar', name: '已开课' },
        { type: 'bar', name: '未开课' }
    ]
}) as EChartsOption

const projectChartOptions = reactive<EChartsOption>({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 24, right: 24, bottom: 24, top: 24, containLabel: true },
    dataset: {
        dimensions: ['displayName', 'studentCount'],
        source: []
    },
    xAxis: { type: 'value', name: '服务学员数' },
    yAxis: { type: 'category' },
    series: [{ type: 'bar', name: '服务学员数' }]
}) as EChartsOption

const setDatasetSource = (option: EChartsOption, source: Record<string, unknown>[]) => {
    const dataset = option.dataset
    if (dataset && !Array.isArray(dataset)) {
        dataset.source = source
    }
}

const buildCourseParams = (): StudentCenterApi.StudentCourseStatsReqVO => {
    const [beginEnrollTime, endEnrollTime] = queryParams.enrollTimes || []
    return {
        beginEnrollTime,
        endEnrollTime,
        headteacherUserId: queryParams.headteacherUserId || undefined
    }
}

const buildProjectParams = (): StudentCenterApi.StudentProjectYearlyStatsReqVO => ({
    enrollYear: Number(queryParams.enrollYear || new Date().getFullYear()),
    headteacherUserId: queryParams.headteacherUserId || undefined,
    applyProjectId: queryParams.applyProjectId || undefined
})

const loadData = async () => {
    loading.value = true
    try {
        const [courseStats, projectStats] = await Promise.all([
            StudentCenterApi.getStudentCourseStats(buildCourseParams()),
            StudentCenterApi.getApplyProjectYearlyStats(buildProjectParams())
        ])
        courseStatsList.value = courseStats || []
        projectStatsList.value = projectStats || []
        setDatasetSource(courseChartOptions, courseStatsList.value as Record<string, unknown>[])
        setDatasetSource(
            projectChartOptions,
            projectStatsList.value.map((item) => ({
                ...item,
                displayName: `${item.headteacherUserName || '--'} / ${item.projectName || '--'}`
            }))
        )
    } finally {
        loading.value = false
    }
}

const setSearchParams = async (params: Partial<StatsSearchParams>) => {
    Object.assign(queryParams, params)
    await loadData()
}

const resetSearchParams = async () => {
    Object.assign(queryParams, createDefaultSearchParams())
    await loadData()
}

const loadHeadteacherOptions = async () => {
    const list = await HeadteacherApi.getHeadteacherSimpleList()
    headteacherOptions.value = (list || []).map((item) => ({
        label: item.nickname || item.username,
        value: item.id
    }))
}

onMounted(async () => {
    await loadHeadteacherOptions()
    await loadData()
})
</script>

<style scoped lang="scss">
.stats-card {
    padding: 18px 20px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: linear-gradient(135deg, #f8fafc 0%, #eef6ff 100%);
}

.stats-card span {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 13px;
}

.stats-card strong {
    display: block;
    margin-top: 8px;
    color: var(--el-text-color-primary);
    font-size: 28px;
    line-height: 1;
}

.stats-card--success {
    background: linear-gradient(135deg, #f6fffb 0%, #e7f8ef 100%);
}

.stats-card--warning {
    background: linear-gradient(135deg, #fffaf2 0%, #fff0d9 100%);
}

.stats-section-title {
    font-weight: 600;
    color: var(--el-text-color-primary);
}
</style>
