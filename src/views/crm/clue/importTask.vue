<template>
    <ContentWrap>
        <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />

        <div class="mb-12px flex items-center justify-between gap-12px flex-wrap action-btn-wrap">
            <div class="flex gap-8px flex-wrap">
                <BaseButton plain @click="tableMethods.getList">刷新</BaseButton>
            </div>
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
</template>

<script setup lang="tsx">
import { computed, reactive } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import * as ClueApi from '@/api/crm/clue'

defineOptions({ name: 'CrmClueImportTask' })

const statusOptions = [
    { label: '处理中', value: 1 },
    { label: '已完成', value: 2 }
]

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'fileName',
        label: '文件名',
        component: 'Input',
        componentProps: {
            placeholder: '请输入文件名',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'status',
        label: '任务状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择任务状态',
            clearable: true,
            options: statusOptions,
            style: { width: '180px' }
        }
    },
    {
        field: 'creator',
        label: '创建人',
        component: 'Input',
        componentProps: {
            placeholder: '请输入创建人',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'createTimeRange',
        label: '创建时间',
        component: 'DatePicker',
        componentProps: {
            type: 'datetimerange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            startPlaceholder: '开始时间',
            endPlaceholder: '结束时间',
            style: { width: '220px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ClueApi.ClueImportTaskVO>({
    getListApi: async (params) => await ClueApi.getClueImportTaskPage(params as ClueApi.ClueImportTaskPageReqVO)
})

const setSearchParams = (params: Record<string, any>) => {
    const { createTimeRange, ...rest } = params
    tableMethods.setSearchParams({
        ...rest,
        beginCreateTime: createTimeRange?.[0],
        endCreateTime: createTimeRange?.[1]
    })
}

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'id', label: '任务编号', width: '100px' },
    { field: 'fileName', label: '文件名', minWidth: '220px' },
    {
        field: 'status',
        label: '任务状态',
        width: '110px',
        slots: {
            default: (data) => (
                <span>
                    {statusOptions.find((item) => item.value === data.row.status)?.label || '-'}
                </span>
            )
        }
    },
    { field: 'totalCount', label: '导入总数', width: '100px' },
    { field: 'successCount', label: '成功数', width: '100px' },
    { field: 'failCount', label: '失败数', width: '100px' },
    { field: 'startedAt', label: '开始处理时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'finishedAt', label: '处理完成时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'creator', label: '创建人', width: '120px' },
    { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter }
])

onMounted(() => {
    tableMethods.getList()
})
</script>
