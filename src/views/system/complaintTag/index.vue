<template>
    <ContentWrap>
        <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />

        <div class="action-btn-wrap">
            <BaseButton v-if="canCreate" type="primary" @click="openForm('create')"
                >新增</BaseButton
            >
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

    <ComplaintTagForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as ComplaintTagApi from '@/api/system/complaintTag'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import ComplaintTagForm from './ComplaintTagForm.vue'

defineOptions({ name: 'SystemComplaintTag' })

const canCreate = hasPermission(['system:complaint-tag:create'])
const canUpdate = hasPermission(['system:complaint-tag:update'])
const canDelete = hasPermission(['system:complaint-tag:delete'])

const formRef = ref<InstanceType<typeof ComplaintTagForm>>()

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'name',
        label: '标签名称',
        component: 'Input',
        componentProps: {
            clearable: true,
            placeholder: '请输入标签名称',
            style: { width: '220px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ComplaintTagApi.ComplaintTagVO>({
    getListApi: async (params) => await ComplaintTagApi.getComplaintTagPage(params),
    delListApi: async (id) => await ComplaintTagApi.deleteComplaintTag(id as number)
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
    formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
    await tableMethods.delList(id, false)
}

const tableColumns = reactive<TableColumn[]>([
    { field: 'name', label: '标签名称', minWidth: '220px' },
    { field: 'sort', label: '排序', width: '90px' },
    {
        field: 'createTime',
        label: '创建时间',
        minWidth: '180px',
        formatter: dateFormatter
    },
    {
        field: 'action',
        label: '操作',
        width: '160px',
        fixed: 'right',
        slots: {
            default: (data) => {
                const row = data.row as ComplaintTagApi.ComplaintTagVO
                return (
                    <>
                        {canUpdate ? (
                            <BaseButton
                                link
                                type="primary"
                                onClick={() => openForm('update', row.id)}
                            >
                                编辑
                            </BaseButton>
                        ) : null}
                        {canDelete ? (
                            <BaseButton link type="danger" onClick={() => handleDelete(row.id!)}>
                                删除
                            </BaseButton>
                        ) : null}
                    </>
                )
            }
        }
    }
])

onMounted(() => {
    tableMethods.getList()
})
</script>

<style scoped>
.action-btn-wrap {
    margin-bottom: 10px;
}
</style>
