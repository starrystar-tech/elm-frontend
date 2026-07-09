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
                <div class="action-btn-wrap">
                    <BaseButton v-if="canCreate" type="primary" @click="openForm('create')"
                        >新增</BaseButton
                    >
                    <BaseButton
                        v-if="canExport"
                        plain
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
                    <BaseButton
                        v-if="canUpdate"
                        plain
                        :disabled="checkedIds.length === 0"
                        @click="openBatchUpdateForm"
                    >
                        批量修改复制次数
                    </BaseButton>
                    <!-- <BaseButton plain @click="handleSetDeptPermission">设置部门权限</BaseButton> -->
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
                <div v-if="currentDeptPermission" class="permission-panel">
                    <div class="permission-header">
                        <div class="title">部门权限 - {{ currentDeptPermission.name }}</div>
                        <BaseButton type="primary" plain @click="openDeptPermissionForm"
                            >修改部门权限</BaseButton
                        >
                    </div>
                    <div class="scope-block">
                        <div class="scope-block__label">校区权限</div>
                        <div class="scope-block__content">
                            <template v-if="currentDeptPermission.campuses?.length">
                                <span
                                    v-for="item in currentDeptPermission.campuses"
                                    :key="`campus-${item.id}`"
                                    class="scope-tag scope-tag--green"
                                >
                                    {{ item.name }}
                                </span>
                            </template>
                            <span v-else class="scope-empty">--</span>
                        </div>
                    </div>
                    <div class="scope-block">
                        <div class="scope-block__label">管辖地域</div>
                        <div class="scope-block__content">
                            <template v-if="areaGroupRows.length">
                                <div
                                    v-for="group in areaGroupRows"
                                    :key="`area-group-${group.parent}`"
                                    class="scope-area-group"
                                >
                                    <div class="scope-area-group__name">{{ group.parent }}</div>
                                    <div class="scope-area-group__tags">
                                        <span
                                            v-for="item in group.list"
                                            :key="`area-${item.id}`"
                                            class="scope-tag scope-tag--blue"
                                        >
                                            {{ item.name }}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    v-if="areaGroups.length > areaGroupRows.length"
                                    class="scope-more"
                                    @click="areaExpanded = !areaExpanded"
                                >
                                    {{ areaExpanded ? '收起' : '展开更多' }}
                                </div>
                            </template>
                            <span v-else class="scope-empty">--</span>
                        </div>
                    </div>
                    <div class="scope-block">
                        <div class="scope-block__label">管辖产品</div>
                        <div class="scope-block__content">
                            <template v-if="currentDeptPermission.categories?.length">
                                <span
                                    v-for="item in currentDeptPermission.categories"
                                    :key="`category-${item.id}`"
                                    class="scope-tag scope-tag--orange"
                                >
                                    {{ item.name }}
                                </span>
                            </template>
                            <span v-else class="scope-empty">--</span>
                        </div>
                    </div>
                </div>
            </ContentWrap>
        </el-col>
    </el-row>

    <UserForm ref="formRef" @success="tableMethods.getList" />
    <UserDetail ref="detailRef" />
    <UserImportForm ref="importFormRef" @success="handleImportSuccess" />
    <UserAssignRoleForm ref="assignRoleFormRef" @success="tableMethods.getList" />
    <UserPermissionForm ref="permissionFormRef" @success="tableMethods.getList" />
    <DeptPermissionForm ref="deptPermissionFormRef" @success="handleDeptPermissionSuccess" />

    <Dialog v-model="batchUpdateVisible" title="批量修改复制次数" width="420px">
        <el-form :model="batchUpdateForm" label-width="120px">
            <el-form-item label="批量复制次数" required>
                <el-input-number
                    v-model="batchUpdateForm.mobileCopyLimitTimes"
                    :min="0"
                    :controls="false"
                    style="width: 100%"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="batchUpdateVisible = false">取消</el-button>
            <el-button type="primary" :loading="batchUpdateSaving" @click="handleBatchUpdate">
                确定
            </el-button>
        </template>
    </Dialog>

    <Dialog v-model="uploadResultVisible" title="用户上传结果" width="720px">
        <el-empty v-if="!lastImportResult" description="暂无上传记录" />
        <template v-else>
            <el-descriptions :column="1" border>
                <el-descriptions-item label="新增成功">
                    {{ lastImportResult.createUsernames.length }} 人
                </el-descriptions-item>
                <el-descriptions-item label="更新成功">
                    {{ lastImportResult.updateUsernames.length }} 人
                </el-descriptions-item>
                <el-descriptions-item label="更新失败">
                    {{ Object.keys(lastImportResult.failureUsernames).length }} 人
                </el-descriptions-item>
            </el-descriptions>
        </template>
        <template #footer>
            <el-button type="primary" @click="uploadResultVisible = false">关闭</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElButton, ElSwitch } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { checkPermi } from '@/utils/permission'
import { dateFormatter } from '@/utils/formatTime'
import { CommonStatusEnum } from '@/utils/constants'
import * as UserApi from '@/api/system/user'
import * as DeptApi from '@/api/system/dept'
import * as RoleApi from '@/api/system/role'
import UserForm from './UserForm.vue'
import UserDetail from './UserDetail.vue'
import UserImportForm from './UserImportForm.vue'
import UserAssignRoleForm from './UserAssignRoleForm.vue'
import UserPermissionForm from './UserPermissionForm.vue'
import DeptPermissionForm from './DeptPermissionForm.vue'
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
const canUpdate = hasPermission(['system:user:update'])

const message = useMessage()

const deptId = ref<number | undefined>(undefined)
const checkedIds = ref<number[]>([])
const showAll = ref(true)
const uploadResultVisible = ref(false)
const lastImportResult = ref<any | null>(null)
const batchUpdateVisible = ref(false)
const batchUpdateSaving = ref(false)
const batchUpdateForm = reactive({
    mobileCopyLimitTimes: undefined as number | undefined
})

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'keyword',
        label: '用户名称',
        component: 'Input',
        componentProps: {
            placeholder: '请输入姓名或登录帐号',
            clearable: true,
            style: { width: '200px' }
        }
    },
    {
        field: 'status',
        label: '用户状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择用户状态',
            clearable: true,
            options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
            style: { width: '200px' }
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
            style: { width: '200px' }
        }
    }
])

const formRef = ref<InstanceType<typeof UserForm>>()
const detailRef = ref<InstanceType<typeof UserDetail>>()
const importFormRef = ref<InstanceType<typeof UserImportForm>>()
const assignRoleFormRef = ref<InstanceType<typeof UserAssignRoleForm>>()
const permissionFormRef = ref<InstanceType<typeof UserPermissionForm>>()
const deptPermissionFormRef = ref<InstanceType<typeof DeptPermissionForm>>()
const currentDeptPermission = ref<DeptApi.DeptVO | null>(null)
const roleList = ref<RoleApi.RoleVO[]>([])
const roleNameMap = computed(() => {
    const map = new Map<number, string>()
    roleList.value.forEach((item) => {
        map.set(Number(item.id), item.name)
    })
    return map
})

const openForm = (type: string, id?: number) => {
    formRef.value?.open(type, id, type === 'create' ? deptId.value : undefined)
}

const handleImport = () => {
    importFormRef.value?.open()
}

const handleShowUploadResult = () => {
    uploadResultVisible.value = true
}

const loadRoleList = async () => {
    roleList.value = await RoleApi.getSimpleRoleList()
}

const handleImportSuccess = (result?: any) => {
    if (result) {
        lastImportResult.value = result
    }
    tableMethods.getList()
}

const handleRole = (row: UserApi.UserVO) => {
    assignRoleFormRef.value?.open(row)
}

const handleDetail = (row: UserApi.UserVO) => {
    detailRef.value?.open(row.id)
}

const openPermissionForm = (row?: UserApi.UserVO) => {
    const target = row
    if (!target) {
        message.warning('请先勾选一个用户')
        return
    }
    permissionFormRef.value?.open(target)
}

const openDeptPermissionForm = () => {
    if (!deptId.value || !currentDeptPermission.value) {
        message.warning('请先选择一个部门')
        return
    }
    deptPermissionFormRef.value?.open(currentDeptPermission.value)
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
    const mappedParams = {
        ...params,
        keyword: params.keyword || undefined,
        username: undefined,
        mobile: undefined,
        nickname: undefined,
        deptId: deptId.value
    }
    delete mappedParams.deptKeyword
    tableMethods.setSearchParams(mappedParams)
}

const handleDeptNodeClick = async (row: any) => {
    deptId.value = row?.id
    if (deptId.value) {
        currentDeptPermission.value = await DeptApi.getDept(deptId.value)
    } else {
        currentDeptPermission.value = null
    }
    tableMethods.setSearchParams({ deptId: deptId.value })
}

const handleToggleShowAll = async (val: boolean) => {
    if (val) {
        tableMethods.setSearchParams({ deptId: deptId.value, status: undefined })
        return
    }
    tableMethods.setSearchParams({ deptId: deptId.value, status: CommonStatusEnum.ENABLE })
}

const handleSetDeptPermission = () => {
    openDeptPermissionForm()
}

const handleDeptPermissionSuccess = async () => {
    if (deptId.value) {
        currentDeptPermission.value = await DeptApi.getDept(deptId.value)
    }
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

const openBatchUpdateForm = () => {
    batchUpdateForm.mobileCopyLimitTimes = undefined
    batchUpdateVisible.value = true
}

const handleBatchUpdate = async () => {
    if (
        batchUpdateForm.mobileCopyLimitTimes === undefined ||
        batchUpdateForm.mobileCopyLimitTimes === null
    ) {
        message.warning('请输入批量复制次数')
        return
    }
    batchUpdateSaving.value = true
    try {
        await UserApi.batchUpdateUser({
            ids: checkedIds.value,
            mobileCopyLimitTimes: batchUpdateForm.mobileCopyLimitTimes
        })
        message.success('修改成功')
        batchUpdateVisible.value = false
        await tableMethods.getList()
    } finally {
        batchUpdateSaving.value = false
    }
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
        case 'handlePermission':
            openPermissionForm(row)
            break
    }
}

const textCell = (value?: string | number) => value || '--'
const getRoleNames = (row: UserApi.UserVO) => {
    const roleIds = row.roleIds || []
    if (!roleIds.length) return '--'
    return (
        roleIds
            .map((id) => roleNameMap.value.get(Number(id)))
            .filter(Boolean)
            .join('、') || '--'
    )
}
const areaExpanded = ref(false)
const areaGroups = computed(() => {
    const areaList = currentDeptPermission.value?.areas || []
    const groupMap = new Map<string, { parent: string; list: any[] }>()
    areaList.forEach((item: any) => {
        const parent = item.parentName || '其他'
        if (!groupMap.has(parent)) {
            groupMap.set(parent, { parent, list: [] })
        }
        groupMap.get(parent)!.list.push({
            id: item.id,
            name: item.name || item.displayName || item.id
        })
    })
    return Array.from(groupMap.values())
})
const areaGroupRows = computed(() =>
    areaExpanded.value ? areaGroups.value : areaGroups.value.slice(0, 2)
)

const tableColumns = reactive<TableColumn[]>([
    { field: 'nickname', label: '姓名', minWidth: 100, fixed: 'left' },
    { field: 'username', label: '登录账号', minWidth: 130, fixed: 'left' },
    {
        field: 'roleIds',
        label: '角色',
        minWidth: 140,
        showOverflowTooltip: true,
        slots: {
            default: (data) => <span>{getRoleNames(data.row as UserApi.UserVO)}</span>
        }
    },
    {
        field: 'userLevel',
        label: '等级',
        width: 90,
        slots: {
            default: (data) => (
                <DictTag type={'system_user_level'} value={data.row.userLevel || data.row.level} />
            )
        }
    },
    {
        field: 'status',
        label: '状态',
        width: 80,
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
    {
        field: 'wechatBindInfo',
        label: '绑定企微',
        minWidth: 220,
        slots: {
            default: (data) => {
                const raw = (data.row.wechatBindInfo || '').trim()
                if (!raw) return <span>--</span>
                const items = raw
                    .split('；')
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .map((item) => {
                        const parts = item.split('-')
                        if (parts.length < 2) return { name: item, corp: '' }
                        return {
                            corp: parts[0].trim(),
                            name: parts.slice(1).join('-').trim()
                        }
                    })
                return (
                    <div>
                        {items.map((item, idx) => (
                            <div key={`${item.name}-${item.corp}-${idx}`}>
                                <span>{item.name || '--'}@</span>
                                <span style={{ color: '#fa8c16' }}>{item.corp || '--'}</span>
                            </div>
                        ))}
                    </div>
                )
            }
        }
    },
    {
        field: 'expireTime',
        label: '到期时间',
        minWidth: 120,
        formatter: dateFormatter
    },
    { field: 'createTime', label: '创建时间', width: 180, formatter: dateFormatter },
    { field: 'deptName', label: '所属部门', minWidth: 120, showOverflowTooltip: true },
    {
        field: 'campusNames',
        label: '校区权限',
        minWidth: 180,
        formatter: (_, __, value) => textCell(value)
    },
    {
        field: 'areaNames',
        label: '管辖地区',
        minWidth: 220,
        formatter: (_, __, value) => textCell(value)
    },
    {
        field: 'categoryNames',
        label: '管辖产品',
        minWidth: 220,
        formatter: (_, __, value) => textCell(value)
    },
    {
        field: 'sessionArchiveDeptNames',
        label: '会话存档管辖部门',
        minWidth: 220,
        formatter: (_, __, value) => textCell(value)
    },
    // {
    //     field: 'callNo',
    //     label: '呼叫工号',
    //     width: 100,
    //     formatter: (_, __, value) => textCell(value)
    // },
    // {
    //     field: 'callExt',
    //     label: '呼叫分机',
    //     width: 100,
    //     formatter: (_, __, value) => textCell(value)
    // },
    {
        field: 'mobileCopyLimitTimes',
        label: '批量复制次数',
        width: 120,
        formatter: (_, __, value) => (value === null || value === undefined ? '--' : value)
    },
    {
        field: 'action',
        label: '操作',
        width: '160px',
        fixed: 'right',
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
                        <BaseButton link type="primary" onClick={() => handleDetail(row)}>
                            详情
                        </BaseButton>
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
                                            {checkPermi(['system:user:update']) ? (
                                                <ElDropdownItem command="handlePermission">
                                                    数据权限
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

onMounted(async () => {
    await Promise.all([loadRoleList(), tableMethods.getList()])
})
</script>

<style lang="scss" scoped>
.top-action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
    }
}

.permission-panel {
    margin-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
    padding: 14px;
}

.permission-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    .title {
        font-size: 14px;
        font-weight: 600;
    }
}

.scope-block {
    border-top: 1px solid var(--el-border-color-lighter);
    padding: 14px 0;
}

.scope-block:first-of-type {
    border-top: none;
}

.scope-block__label {
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 10px;
}

.scope-block__content {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.scope-tag {
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 10px;
    border-radius: 14px;
    font-size: 12px;
    border: 1px solid transparent;
}

.scope-tag--green {
    color: #52a822;
    background: #f2faeb;
    border-color: #9ed972;
}

.scope-tag--blue {
    color: #2a6df5;
    background: #eef4ff;
    border-color: #a9c4ff;
}

.scope-tag--orange {
    color: #d97706;
    background: #fff6e8;
    border-color: #f6c37a;
}

.scope-empty {
    color: var(--el-text-color-secondary);
}

.scope-area-group {
    width: 100%;
    display: flex;
    gap: 12px;
    align-items: center;
}

.scope-area-group__name {
    min-width: 56px;
    color: var(--el-text-color-primary);
}

.scope-area-group__tags {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.scope-more {
    cursor: pointer;
    color: var(--el-color-primary);
    font-size: 12px;
}
</style>
