<template>
    <ContentWrap>
        <div class="action-btn-wrap">
            <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
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

    <HeadteacherForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { useTable } from '@/hooks/web/useTable'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { hasPermission } from '@/directives/permission/hasPermi'
import * as HeadteacherApi from '@/api/crm/allocation/headteacher'
import HeadteacherForm from './HeadteacherForm.vue'

defineOptions({ name: 'CrmHeadteacherAllocation' })

const message = useMessage()
const canCreate = hasPermission(['crm:headteacher:create'])
const canUpdate = hasPermission(['crm:headteacher:update'])
const canDelete = hasPermission(['crm:headteacher:delete'])
const formRef = ref<InstanceType<typeof HeadteacherForm>>()

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<HeadteacherApi.HeadteacherAllocationRespVO>({
    getListApi: async (params) => await HeadteacherApi.getHeadteacherAllocationPage(params),
    delListApi: async (id) => await HeadteacherApi.deleteHeadteacherAllocation(Number(id))
})

const openForm = (type: 'create' | 'update', row?: HeadteacherApi.HeadteacherAllocationRespVO) => {
    formRef.value?.open(type, row?.id)
}

const getScopeValueDisplay = (row: HeadteacherApi.HeadteacherAllocationRespVO) => {
    if (row.scopeType === HeadteacherApi.HEADTEACHER_SCOPE_TYPE.ALL) {
        return row.scopeTypeName || '全公司'
    }
    return row.scopeValueDisplay || '--'
}

const handleDelete = async (id?: number) => {
    if (!id) return
    try {
        await message.delConfirm()
        await HeadteacherApi.deleteHeadteacherAllocation(id)
        message.success('删除成功')
        await tableMethods.getList()
    } catch {}
}

const tableColumns = computed<TableColumn[]>(() => [
    {
        field: 'headteacherName',
        label: '班主任',
        minWidth: '140px',
        slots: { default: (data) => <span>{data.row.headteacherName || '-'}</span> }
    },
    {
        field: 'projectName',
        label: '负责项目',
        minWidth: '160px',
        slots: { default: (data) => <span>{data.row.projectName || '-'}</span> }
    },
    {
        field: 'scopeTypeName',
        label: '负责类型',
        width: '120px',
        slots: { default: (data) => <span>{data.row.scopeTypeName || '-'}</span> }
    },
    {
        field: 'scopeValueDisplay',
        label: '负责范围',
        minWidth: '220px',
        slots: { default: (data) => <span>{getScopeValueDisplay(data.row)}</span> }
    },
    {
        field: 'updater',
        label: '更新人',
        width: '120px',
        slots: { default: (data) => <span>{data.row.updaterName || data.row.updater || '-'}</span> }
    },
    {
        field: 'updateTime',
        label: '更新时间',
        minWidth: '170px',
        formatter: (row: any, column: any, value: any) => dateFormatter(row, column, value)
    },
    {
        field: 'action',
        label: '操作',
        width: '160px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <>
                    {canUpdate ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => openForm('update', data.row)}
                        >
                            编辑
                        </BaseButton>
                    ) : null}
                    {canDelete ? (
                        <BaseButton link type="danger" onClick={() => handleDelete(data.row.id)}>
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
