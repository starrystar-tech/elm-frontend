<template>
    <ContentWrap>
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
    </ContentWrap>
    <ImportTaskFailDialog ref="failDialogRef" />
    <ImportTaskLogDialog ref="logDialogRef" />
</template>

<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElLink } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import * as ClueApi from '@/api/crm/clue'
import * as UserApi from '@/api/system/user'
import ImportTaskFailDialog from './ImportTaskFailDialog.vue'
import ImportTaskLogDialog from './ImportTaskLogDialog.vue'

defineOptions({ name: 'CrmClueImportTask' })

const logDialogRef = ref<InstanceType<typeof ImportTaskLogDialog>>()
const failDialogRef = ref<InstanceType<typeof ImportTaskFailDialog>>()
const userOptions = ref<{ label: string; value: number }[]>([])

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
        component: 'Select',
        componentProps: {
            placeholder: '请选择创建人',
            clearable: true,
            filterable: true,
            options: [],
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
    getListApi: async (params) =>
        await ClueApi.getClueImportTaskPage(params as ClueApi.ClueImportTaskPageReqVO)
})

const updateSchemaOptions = (field: string, options: { label: string; value: number }[]) => {
    const target = searchSchema.find((item) => item.field === field)
    if (target?.componentProps) {
        target.componentProps.options = options
    }
}

const setSearchParams = (params: Record<string, any>) => {
    const { createTimeRange, ...rest } = params
    tableMethods.setSearchParams({
        ...rest,
        creator:
            rest.creator === undefined || rest.creator === null || rest.creator === ''
                ? undefined
                : String(rest.creator),
        beginCreateTime: createTimeRange?.[0],
        endCreateTime: createTimeRange?.[1]
    })
}

const loadUserOptions = async () => {
    const users = await UserApi.getSimpleUserList()
    userOptions.value = (users || []).map((item) => ({
        label: item.nickname || item.username,
        value: item.id
    }))
    updateSchemaOptions('creator', userOptions.value)
}

const openAllocLogDialog = async (taskId: number) => {
    await logDialogRef.value?.open(taskId)
}

const openFailDialog = async (taskId: number) => {
    await failDialogRef.value?.open(taskId)
}

const tableColumns = computed<TableColumn[]>(() => [
    // { field: 'id', label: '任务编号', width: '100px' },
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
    { field: 'successCount', label: '导入成功数', width: '100px' },
    {
        field: 'failCount',
        label: '导入失败数',
        width: '100px',
        slots: {
            default: (data) =>
                Number(data.row.failCount || 0) > 0 ? (
                    <ElLink
                        underline={false}
                        type="danger"
                        onClick={() => openFailDialog(data.row.id)}
                    >
                        {data.row.failCount}
                    </ElLink>
                ) : (
                    <span>{data.row.failCount || 0}</span>
                )
        }
    },
    { field: 'startedAt', label: '开始处理时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'finishedAt', label: '处理完成时间', minWidth: '170px', formatter: dateFormatter },
    {
        field: 'creatorName',
        label: '创建人',
        width: '120px',
        slots: {
            default: (data) => <span>{data.row.creatorName || data.row.creator || '--'}</span>
        }
    },
    { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '120px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <BaseButton link type="primary" onClick={() => openAllocLogDialog(data.row.id)}>
                    导入日志
                </BaseButton>
            )
        }
    }
])

onMounted(() => {
    loadUserOptions()
    tableMethods.getList()
})
</script>
