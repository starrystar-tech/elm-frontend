<template>
    <el-row :gutter="15">
        <el-col :span="5" :xs="24">
            <ContentWrap>
                <DeptTree @node-click="handleDeptNodeClick" />
            </ContentWrap>
        </el-col>
        <el-col :span="19" :xs="24">
            <ContentWrap>
                <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
                <div class="mb-10px">
                    <BaseButton v-if="canCreate" type="primary" @click="openForm('create')"
                        >新增</BaseButton
                    >
                    <BaseButton v-if="canImport" type="primary" plain @click="handleImport"
                        >导入</BaseButton
                    >
                    <BaseButton
                        v-if="canExport"
                        type="primary" plain
                        :loading="exportLoading"
                        @click="handleExport"
                    >
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
        </el-col>
    </el-row>

    <UserForm ref="formRef" @success="tableMethods.getList" />
    <UserImportForm ref="importFormRef" @success="tableMethods.getList" />
    <UserAssignRoleForm ref="assignRoleFormRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElButton, ElSwitch } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { checkPermi } from '@/utils/permission'
import { dateFormatter } from '@/utils/formatTime'
import { CommonStatusEnum } from '@/utils/constants'
import * as UserApi from '@/api/system/user'
import UserForm from './UserForm.vue'
import UserImportForm from './UserImportForm.vue'
import UserAssignRoleForm from './UserAssignRoleForm.vue'
import DeptTree from './DeptTree.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'SystemUser' })

const canCreate = hasPermission(['system:user:create'])
const canImport = hasPermission(['system:user:import'])
const canExport = hasPermission(['system:user:export'])
const canDelete = hasPermission(['system:user:delete'])

const message = useMessage()

const deptId = ref<number | undefined>(undefined)
const checkedIds = ref<number[]>([])

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'username',
        label: '用户名称',
        component: 'Input',
        componentProps: {
            placeholder: '请输入用户名称',
            clearable: true,
            style: { width: '240px' }
        }
    },
    {
        field: 'mobile',
        label: '手机号码',
        component: 'Input',
        componentProps: {
            placeholder: '请输入手机号码',
            clearable: true,
            style: { width: '240px' }
        }
    },
    {
        field: 'status',
        label: '状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择用户状态',
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
            type: 'datetimerange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            startPlaceholder: '开始日期',
            endPlaceholder: '结束日期',
            style: { width: '240px' }
        }
    }
])

const formRef = ref<InstanceType<typeof UserForm>>()
const importFormRef = ref<InstanceType<typeof UserImportForm>>()
const assignRoleFormRef = ref<InstanceType<typeof UserAssignRoleForm>>()

const openForm = (type: string, id?: number) => {
    formRef.value?.open(type, id)
}

const handleImport = () => {
    importFormRef.value?.open()
}

const handleRole = (row: UserApi.UserVO) => {
    assignRoleFormRef.value?.open(row)
}

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<UserApi.UserVO>({
    getListApi: async (params) => await UserApi.getUserPage({ ...params, deptId: deptId.value }),
    delListApi: async (id) => await UserApi.deleteUser(id as number),
    exportListApi: async (params) => await UserApi.exportUser({ ...params, deptId: deptId.value })
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams({ ...params, deptId: deptId.value })
}

const handleDeptNodeClick = async (row: any) => {
    deptId.value = row?.id
    tableMethods.setSearchParams({ deptId: deptId.value })
}

const handleStatusChange = async (row: UserApi.UserVO) => {
    try {
        const text = row.status === CommonStatusEnum.ENABLE ? '启用' : '停用'
        await message.confirm(`确认要"${text}""${row.username}"用户吗?`)
        await UserApi.updateUserStatus(row.id, row.status)
        await tableMethods.getList()
    } catch {
        row.status =
            row.status === CommonStatusEnum.ENABLE
                ? CommonStatusEnum.DISABLE
                : CommonStatusEnum.ENABLE
    }
}

const handleExport = async () => {
    await tableMethods.exportList('用户数据.xls')
}

const handleDelete = async (id: number) => {
    await tableMethods.delList(id, false)
}

const handleRowCheckboxChange = (rows: UserApi.UserVO[]) => {
    checkedIds.value = rows.map((row) => row.id)
}

const handleDeleteBatch = async () => {
    try {
        await message.delConfirm()
        await UserApi.deleteUserList(checkedIds.value)
        checkedIds.value = []
        message.success('删除成功')
        await tableMethods.getList()
    } catch {}
}

const handleResetPwd = async (row: UserApi.UserVO) => {
    try {
        const result = await message.prompt(`请输入"${row.username}"的新密码`, '提醒')
        const password = result.value
        await UserApi.resetUserPassword(row.id, password)
        message.success(`修改成功，新密码是：${password}`)
    } catch {}
}

const handleCommand = (command: string, row: UserApi.UserVO) => {
    switch (command) {
        case 'handleDelete':
            handleDelete(row.id)
            break
        case 'handleResetPwd':
            handleResetPwd(row)
            break
        case 'handleRole':
            handleRole(row)
            break
    }
}

const tableColumns = reactive<TableColumn[]>([
    { field: 'id', label: '用户编号' },
    { field: 'username', label: '用户名称', showOverflowTooltip: true },
    { field: 'nickname', label: '用户昵称', showOverflowTooltip: true },
    {
        field: 'userLevel',
        label: '用户等级',
        width: '100px',
        slots: {
            default: (data) => (
                <DictTag type={'system_user_level'} value={data.row.userLevel || data.row.level} />
            )
        }
    },
    { field: 'deptName', label: '部门', showOverflowTooltip: true },
    { field: 'mobile', label: '手机号码', width: '120px' },
    {
        field: 'status',
        label: '状态',
        slots: {
            default: (data) => (
                <ElSwitch
                    modelValue={data.row.status}
                    activeValue={0}
                    inactiveValue={1}
                    disabled={!checkPermi(['system:user:update'])}
                    onChange={(value: number) => {
                        data.row.status = value
                        handleStatusChange(data.row as UserApi.UserVO)
                    }}
                />
            )
        }
    },
    { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '220px',
        slots: {
            default: (data) => {
                const row = data.row as UserApi.UserVO
                return (
                    <div class="flex items-center justify-center">
                        {checkPermi(['system:user:update']) ? (
                            <BaseButton
                                link
                                type="primary"
                                onClick={() => openForm('update', row.id)}
                            >
                                修改
                            </BaseButton>
                        ) : null}
                        {checkPermi([
                            'system:user:delete',
                            'system:user:update-password',
                            'system:permission:assign-user-role'
                        ]) ? (
                            <ElDropdown
                                trigger="click"
                                onCommand={(command: string) => handleCommand(command, row)}
                                v-slots={{
                                    default: () => (
                                        <ElButton link type="primary">
                                            更多
                                        </ElButton>
                                    ),
                                    dropdown: () => (
                                        <ElDropdownMenu>
                                            {checkPermi(['system:user:delete']) ? (
                                                <ElDropdownItem command="handleDelete">
                                                    删除
                                                </ElDropdownItem>
                                            ) : null}
                                            {checkPermi(['system:user:update-password']) ? (
                                                <ElDropdownItem command="handleResetPwd">
                                                    重置密码
                                                </ElDropdownItem>
                                            ) : null}
                                            {checkPermi(['system:permission:assign-user-role']) ? (
                                                <ElDropdownItem command="handleRole">
                                                    分配角色
                                                </ElDropdownItem>
                                            ) : null}
                                        </ElDropdownMenu>
                                    )
                                }}
                            />
                        ) : null}
                    </div>
                )
            }
        }
    }
])

onMounted(() => {
    tableMethods.getList()
})
</script>

<style lang="scss" scoped>
.system-user-dept-panel {
    min-height: calc(100vh - 180px);
}
</style>
