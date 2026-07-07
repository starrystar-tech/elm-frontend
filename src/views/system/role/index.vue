<template>
    <ContentWrap>
        <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
        <div class="action-btn-wrap">
            <BaseButton v-if="canCreate" type="primary" @click="openForm('create')"
                >新增</BaseButton
            >
            <BaseButton v-if="canExport" :loading="exportLoading" @click="handleExport">
                导出
            </BaseButton>
            <BaseButton
                v-if="canDelete"
                type="danger"
                :disabled="checkedIds.length === 0"
                @click="handleDeleteBatch"
            >
                批量删除
            </BaseButton>
        </div>
        <Table
            v-model:currentPage="tableObject.currentPage"
            v-model:pageSize="tableObject.pageSize"
            :columns="tableColumns"
            :data="tableObject.tableList"
            :loading="tableObject.loading"
            :pagination="{ total: tableObject.total }"
            selection
            @register="tableRegister"
            @selection-change="handleRowCheckboxChange"
        />
    </ContentWrap>

    <RoleForm ref="formRef" @success="tableMethods.getList" />
    <RoleAssignMenuForm ref="assignMenuFormRef" @success="tableMethods.getList" />
    <RoleDataPermissionForm ref="dataPermissionFormRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as RoleApi from '@/api/system/role'
import RoleForm from './RoleForm.vue'
import RoleAssignMenuForm from './RoleAssignMenuForm.vue'
import RoleDataPermissionForm from './RoleDataPermissionForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'SystemRole' })

const canCreate = hasPermission(['system:role:create'])
const canUpdate = hasPermission(['system:role:update'])
const canDelete = hasPermission(['system:role:delete'])
const canExport = hasPermission(['system:role:export'])
const canAssignMenu = hasPermission(['system:permission:assign-role-menu'])
const canAssignDataScope = hasPermission(['system:permission:assign-role-data-scope'])

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'name',
        label: '角色名称',
        component: 'Input',
        componentProps: {
            placeholder: '请输入角色名称',
            clearable: true,
            style: { width: '240px' }
        }
    },
    {
        field: 'code',
        label: '角色标识',
        component: 'Input',
        componentProps: {
            placeholder: '请输入角色标识',
            clearable: true,
            style: { width: '240px' }
        }
    },
    {
        field: 'status',
        label: '状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择状态',
            clearable: true,
            options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
            style: { width: '240px' }
        }
    },
    {
        field: 'createTime',
        label: '创建时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            startPlaceholder: '开始日期',
            endPlaceholder: '结束日期',
            defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
            style: { width: '240px' }
        }
    }
])

const checkedIds = ref<number[]>([])
const message = useMessage()
const formRef = ref<InstanceType<typeof RoleForm>>()
const assignMenuFormRef = ref<InstanceType<typeof RoleAssignMenuForm>>()
const dataPermissionFormRef = ref<InstanceType<typeof RoleDataPermissionForm>>()

const openForm = (type: string, id?: number) => {
    formRef.value?.open(type, id)
}

const openAssignMenuForm = (row: RoleApi.RoleVO) => {
    assignMenuFormRef.value?.open(row)
}

const openDataPermissionForm = (row: RoleApi.RoleVO) => {
    dataPermissionFormRef.value?.open(row)
}

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<RoleApi.RoleVO>({
    getListApi: async (params) => await RoleApi.getRolePage(params),
    delListApi: async (id) => await RoleApi.deleteRole(id as number),
    exportListApi: async (params) => await RoleApi.exportRole(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(params)
}

const handleRowCheckboxChange = (rows: RoleApi.RoleVO[]) => {
    checkedIds.value = rows.map((row) => row.id)
}

const handleDelete = async (id: number) => {
    await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
    try {
        await message.delConfirm()
        await RoleApi.deleteRoleList(checkedIds.value)
        checkedIds.value = []
        message.success('删除成功')
        await tableMethods.getList()
    } catch {}
}

const handleExport = async () => {
    await tableMethods.exportList('角色数据.xls')
}

const tableColumns = reactive<TableColumn[]>([
    { field: 'id', label: '角色编号' },
    { field: 'name', label: '角色名称' },
    {
        field: 'type',
        label: '角色类型',
        width: '100px',
        slots: {
            default: (data) => <DictTag type={DICT_TYPE.SYSTEM_ROLE_TYPE} value={data.row.type} />
        }
    },
    { field: 'code', label: '角色标识' },
    { field: 'sort', label: '显示顺序' },
    { field: 'remark', label: '备注' },
    {
        field: 'status',
        label: '状态',
        slots: {
            default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
        }
    },
    { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '220px',
        slots: {
            default: (data) => {
                const row = data.row as RoleApi.RoleVO
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
                        {canAssignMenu ? (
                            <BaseButton link type="primary" onClick={() => openAssignMenuForm(row)}>
                                菜单权限
                            </BaseButton>
                        ) : null}
                        {canDelete ? (
                            <BaseButton link type="danger" onClick={() => handleDelete(row.id)}>
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
