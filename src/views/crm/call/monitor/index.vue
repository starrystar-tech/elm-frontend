<template>
    <div class="call-monitor-page">
        <ContentWrap>
            <Search :schema="searchSchema" @search="setSearchParams" @reset="resetSearchParams" />
            <div class="action-btn-wrap">
                <BaseButton plain @click="handleExport">导出</BaseButton>
            </div>
            <Table
                v-model:currentPage="tableObject.currentPage"
                v-model:pageSize="tableObject.pageSize"
                :columns="tableColumns"
                :data="tableObject.tableList"
                :loading="tableObject.loading"
                :pagination="{ total: tableObject.total }"
                @register="tableRegister"
            />
        </ContentWrap>
    </div>
</template>

<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue'
import { Search } from '@/components/Search'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { Table, type TableColumn } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import * as UserApi from '@/api/system/user'
import * as DeptApi from '@/api/system/dept'
import * as OutboundCallRecordApi from '@/api/system/call/record'

defineOptions({ name: 'CrmCallMonitor' })

const message = useMessage()
const deptUserOptions = ref<{ label: string; value: string }[]>([])

const defaultSearchParams = {
    deptUserKeyword: undefined as string | undefined,
    dateRange: undefined as string[] | undefined
}

const searchParams = ref({ ...defaultSearchParams })

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'dateRange',
        label: '通话日期',
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
        field: 'deptUserKeyword',
        label: '部门/用户',
        component: 'Select',
        componentProps: {
            placeholder: '请选择部门或用户',
            clearable: true,
            options: deptUserOptions.value,
            style: { width: '220px' }
        }
    }
])

const formatDurationClock = (durationSeconds?: number) => {
    const totalSeconds = Math.max(0, Math.floor(durationSeconds || 0))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<OutboundCallRecordApi.CallMonitorVO>({
    getListApi: async (params) =>
        await OutboundCallRecordApi.getCallMonitorPage(
            params as OutboundCallRecordApi.CallMonitorPageReqVO
        )
})

const tableColumns = reactive<TableColumn[]>([
    { field: 'userName', label: '用户', minWidth: '120px' },
    { field: 'departmentName', label: '所在部门', minWidth: '140px' },
    { field: 'outgoingCalls', label: '呼出次数', minWidth: '100px' },
    { field: 'outgoingCustomers', label: '呼出客户数', minWidth: '110px' },
    {
        field: 'outgoingDurationSeconds',
        label: '呼出总时长',
        minWidth: '120px',
        formatter: (_row: unknown, _column: unknown, cellValue: number) =>
            formatDurationClock(cellValue)
    },
    {
        field: 'averageOutgoingDurationSeconds',
        label: '平均呼出时长',
        minWidth: '130px',
        formatter: (_row: unknown, _column: unknown, cellValue: number) =>
            formatDurationClock(cellValue)
    },
    { field: 'answeredCalls', label: '接听次数', minWidth: '100px' },
    { field: 'answeredCustomers', label: '接听客户数', minWidth: '110px' },
    {
        field: 'answeredDurationSeconds',
        label: '接听总时长',
        minWidth: '120px',
        formatter: (_row: unknown, _column: unknown, cellValue: number) =>
            formatDurationClock(cellValue)
    },
    {
        field: 'averageAnsweredDurationSeconds',
        label: '平均接听时长',
        minWidth: '130px',
        formatter: (_row: unknown, _column: unknown, cellValue: number) =>
            formatDurationClock(cellValue)
    }
])

const setSearchParams = (params: Recordable) => {
    searchParams.value = {
        deptUserKeyword: params.deptUserKeyword || undefined,
        dateRange: params.dateRange?.length ? params.dateRange : undefined
    }
    tableMethods.setSearchParams(buildPageParams(searchParams.value))
}

const resetSearchParams = () => {
    searchParams.value = { ...defaultSearchParams }
    tableMethods.setSearchParams(buildPageParams({}))
}

const buildPageParams = (params: typeof defaultSearchParams) => {
    const deptUserKeyword = params.deptUserKeyword
    const result: OutboundCallRecordApi.CallMonitorPageReqVO = {}
    if (deptUserKeyword?.startsWith('dept:')) {
        result.deptId = Number(deptUserKeyword.slice(5))
    } else if (deptUserKeyword?.startsWith('user:')) {
        result.userId = Number(deptUserKeyword.slice(5))
    }
    if (params.dateRange?.length) {
        result.beginCreateTime = `${params.dateRange[0]} 00:00:00`
        result.endCreateTime = `${params.dateRange[1]} 23:59:59`
    }
    return result
}

const loadDeptUserOptions = async () => {
    const [users, depts] = await Promise.all([UserApi.getSimpleUserList(), DeptApi.getSimpleDeptList()])
    const deptEntries = (depts || []).map((item) => ({
        label: `部门 / ${item.name}`,
        value: `dept:${item.id}`
    }))
    const userEntries = (users || []).map((item) => ({
        label: `用户 / ${item.nickname || item.username}`,
        value: `user:${item.id}`
    }))
    deptUserOptions.value = [...deptEntries, ...userEntries]
    const target = searchSchema.find((item) => item.field === 'deptUserKeyword')
    if (target?.componentProps) {
        target.componentProps.options = deptUserOptions.value
    }
}

const handleExport = async () => {
    await OutboundCallRecordApi.createCallMonitorExportTask({
        ...buildPageParams(searchParams.value)
    })
    message.success('导出任务已创建，请到下载中心查看')
}

onMounted(async () => {
    await loadDeptUserOptions()
    await tableMethods.getList()
})
</script>
