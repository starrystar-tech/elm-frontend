<template>
    <div class="call-monitor-page">
        <ContentWrap>
            <Search :schema="searchSchema" @search="setSearchParams" @reset="resetSearchParams" />
            <div class="action-btn-wrap">
                <BaseButton plain @click="handleExport">导出</BaseButton>
            </div>
            <Table
                :columns="tableColumns"
                :data="tableData"
                :loading="false"
                :pagination="{ total: tableData.length }"
            />
        </ContentWrap>
    </div>
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { Search } from '@/components/Search'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { Table, type TableColumn } from '@/components/Table'
import type { FormSchema } from '@/types/form'
import {
    aggregateCallMonitorRows,
    callDeptUserOptions,
    callRecordMocks,
    formatDurationClock,
    toDateOnly
} from '../mock'

defineOptions({ name: 'CrmCallMonitor' })

const message = useMessage()

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
            options: callDeptUserOptions,
            style: { width: '220px' }
        }
    }
])

const filteredRecords = computed(() => {
    return callRecordMocks.filter((item) => {
        const deptUserKeyword = searchParams.value.deptUserKeyword
        const dateRange = searchParams.value.dateRange
        const dateOnly = toDateOnly(item.date)
        const matchesDeptOrUser =
            !deptUserKeyword ||
            item.userName === deptUserKeyword ||
            item.departmentName === deptUserKeyword
        const matchesDate =
            !dateRange?.length || (dateOnly >= dateRange[0] && dateOnly <= dateRange[1])
        return matchesDeptOrUser && matchesDate
    })
})

const tableData = computed(() => aggregateCallMonitorRows(filteredRecords.value))

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
}

const resetSearchParams = () => {
    searchParams.value = { ...defaultSearchParams }
}

const handleExport = () => {
    if (!tableData.value.length) {
        message.warning('暂无可导出的数据')
        return
    }

    const headers = [
        '用户',
        '所在部门',
        '呼出次数',
        '呼出客户数',
        '呼出总时长',
        '平均呼出时长',
        '接听次数',
        '接听客户数',
        '接听总时长',
        '平均接听时长'
    ]
    const rows = tableData.value.map((item) => [
        item.userName,
        item.departmentName,
        item.outgoingCalls,
        item.outgoingCustomers,
        formatDurationClock(item.outgoingDurationSeconds),
        formatDurationClock(item.averageOutgoingDurationSeconds),
        item.answeredCalls,
        item.answeredCustomers,
        formatDurationClock(item.answeredDurationSeconds),
        formatDurationClock(item.averageAnsweredDurationSeconds)
    ])
    const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '通话监控.csv'
    link.click()
    URL.revokeObjectURL(url)
    message.success('导出成功')
}
</script>
