<template>
    <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
    <div class="action-btn-wrap">
        <el-button v-if="canCreate" type="primary" @click="openDialog('create')"
            >新增线路</el-button
        >
    </div>
    <Table
        v-model:currentPage="tableObject.currentPage"
        v-model:pageSize="tableObject.pageSize"
        :columns="tableColumns"
        :data="tableObject.tableList"
        :loading="tableObject.loading"
        :pagination="{ total: tableObject.total }"
        row-key="id"
        @register="tableRegister"
    />
    <OutboundRouteForm ref="formRef" @success="tableMethods.getList()" />
</template>

<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue'
import { ElTag } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { hasPermission } from '@/directives/permission/hasPermi'
import * as OutboundRouteApi from '@/api/system/call/router'
import type { FormSchema } from '@/types/form'
import OutboundRouteForm from './OutboundRouteForm.vue'

defineOptions({ name: 'OutboundRouteManager' })

const message = useMessage()
const formRef = ref()
const keyword = ref('')

interface RouteSearchParams {
    keyword?: string
}

const canCreate = hasPermission(['system:outbound-route:create'])
const canUpdate = hasPermission(['system:outbound-route:update'])
const canDelete = hasPermission(['system:outbound-route:delete'])

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'keyword',
        label: '线路',
        component: 'Input',
        componentProps: {
            placeholder: '请输入线路名称/号码前缀',
            clearable: true,
            style: {
                width: '260px'
            }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<OutboundRouteApi.OutboundRouteVO>({
    getListApi: async (params) =>
        await OutboundRouteApi.getOutboundRoutePage({
            ...params,
            keyword: keyword.value.trim() || undefined
        })
})

const setSearchParams = (params: RouteSearchParams = {}) => {
    keyword.value = params.keyword?.trim() || ''
    tableMethods.setSearchParams({ keyword: keyword.value || undefined })
}

const openDialog = async (type: 'create' | 'update', id?: number) => {
    formRef.value?.open(type, id)
}

const handleDelete = async (row: OutboundRouteApi.OutboundRouteVO) => {
    await message.confirm(`确认删除线路“${row.name}”吗？`)
    await OutboundRouteApi.deleteOutboundRoute(row.id!)
    message.success('删除成功')
    tableMethods.getList()
}

const handleToggleStatus = async (row: OutboundRouteApi.OutboundRouteVO) => {
    const nextStatus = row.status === 0 ? 1 : 0
    await OutboundRouteApi.updateOutboundRoute({
        id: row.id,
        name: row.name,
        numberPrefix: row.numberPrefix,
        status: nextStatus
    })
    message.success(nextStatus === 0 ? '启用成功' : '禁用成功')
    tableMethods.getList()
}

const tableColumns = reactive<TableColumn[]>([
    { field: 'id', label: '编号', width: '90px' },
    { field: 'name', label: '线路名称', minWidth: '180px' },
    { field: 'numberPrefix', label: '号码前缀', minWidth: '160px' },
    {
        field: 'status',
        label: '状态',
        width: '100px',
        slots: {
            default: (data) => (
                <ElTag type={data.row.status === 0 ? 'success' : 'info'}>
                    {data.row.status === 0 ? '启用' : '禁用'}
                </ElTag>
            )
        }
    },
    { field: 'createTime', label: '创建时间', formatter: dateFormatter, width: '180px' },
    {
        field: 'action',
        label: '操作',
        width: '220px',
        slots: {
            default: (data) => (
                <>
                    {canUpdate ? (
                        <BaseButton
                            type="primary"
                            link
                            onClick={() => openDialog('update', data.row.id)}
                        >
                            编辑
                        </BaseButton>
                    ) : null}
                    {canUpdate ? (
                        <BaseButton
                            type="primary"
                            link
                            onClick={() => handleToggleStatus(data.row)}
                        >
                            {data.row.status === 0 ? '禁用' : '启用'}
                        </BaseButton>
                    ) : null}
                    {canDelete ? (
                        <BaseButton type="danger" link onClick={() => handleDelete(data.row)}>
                            删除
                        </BaseButton>
                    ) : null}
                </>
            )
        }
    }
])

onMounted(() => {
    tableMethods.getList()
})
</script>

<style scoped>
.action-btn-wrap {
    margin-top: -6px;
}
</style>
