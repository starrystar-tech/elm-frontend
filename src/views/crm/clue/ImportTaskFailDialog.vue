<template>
    <Dialog
        v-model="dialogVisible"
        title="导入名片失败明细"
        width="1200px"
        class="search-table-dialog"
    >
        <div class="list-tabs-compact-in-pane">
            <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
            <Table
                v-model:currentPage="tableObject.currentPage"
                v-model:pageSize="tableObject.pageSize"
                :columns="tableColumns"
                :data="tableObject.tableList"
                :loading="tableObject.loading"
                :pagination="{ total: tableObject.total }"
                @register="tableRegister"
            />
        </div>
    </Dialog>
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import * as ClueApi from '@/api/crm/clue'

defineOptions({ name: 'ImportTaskFailDialog' })

const dialogVisible = ref(false)
const currentTaskId = ref<number>()

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'customerName',
        label: '客户名称',
        component: 'Input',
        componentProps: {
            placeholder: '请输入客户名称',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'phone',
        label: '联系电话',
        component: 'Input',
        componentProps: {
            placeholder: '请输入联系电话',
            clearable: true,
            style: { width: '220px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ClueApi.ClueImportTaskItemVO>({
    getListApi: async (params) =>
        await ClueApi.getClueImportTaskFailItemPage({
            ...(params as ClueApi.ClueImportTaskItemPageReqVO),
            taskId: Number(currentTaskId.value)
        })
})

const setSearchParams = (params: Record<string, any>) => {
    tableMethods.setSearchParams({
        ...params,
        taskId: Number(currentTaskId.value)
    })
}

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'customerName', label: '客户名称', width: '120px' },
    { field: 'phone', label: '联系电话', width: '140px' },
    { field: 'phone2', label: '联系电话2', width: '140px' },
    { field: 'wechat', label: '微信', width: '140px' },
    { field: 'qq', label: 'QQ', width: '120px' },
    { field: 'project', label: '项目', minWidth: '120px' },
    { field: 'source', label: '来源', minWidth: '120px' },
    { field: 'city', label: '城市', width: '100px' },
    { field: 'district', label: '区县', width: '100px' },
    {
        field: 'status',
        label: '导入结果',
        width: '100px',
        slots: {
            default: (data) => <span>{data.row.status || '--'}</span>
        }
    },
    { field: 'failReason', label: '失败原因', minWidth: '180px' },
    { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter }
])

const open = async (taskId: number) => {
    currentTaskId.value = taskId
    dialogVisible.value = true
    await tableMethods.setSearchParams({ taskId })
    await tableMethods.getList()
}

defineExpose({ open })
</script>
