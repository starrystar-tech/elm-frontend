<template>
    <el-row :gutter="15">
        <el-col :span="5" :xs="24">
            <ContentWrap>
                <DeptTree @node-click="handleDeptNodeClick" />
            </ContentWrap>
        </el-col>
        <el-col :span="19" :xs="24">
            <ContentWrap>
                <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
                <div class="action-btn-wrap">
                    <BaseButton
                        v-if="canUpdate"
                        type="primary"
                        plain
                        :disabled="checkedRows.length === 0"
                        @click="openBatchDialog"
                    >
                        批量修改
                    </BaseButton>
                    <BaseButton
                        v-if="canUpdate"
                        plain
                        type="primary"
                        :disabled="checkedRows.length === 0"
                        @click="handleBatchStatus(true)"
                    >
                        批量启用
                    </BaseButton>
                    <BaseButton
                        v-if="canUpdate"
                        plain
                        type="primary"
                        :disabled="checkedRows.length === 0"
                        @click="handleBatchStatus(false)"
                    >
                        批量停用
                    </BaseButton>
                    <el-alert
                        title="已报名的客户不占用名额上限"
                        type="warning"
                        effect="light"
                        :closable="false"
                        class="limit-tip-alert"
                    />
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
                    @selection-change="handleSelectionChange"
                />
            </ContentWrap>
        </el-col>
    </el-row>

    <LimitConfigForm
        v-model="editVisible"
        title="修改上限配置"
        :loading="editLoading"
        :form-data="editForm"
        :rules="formRules"
        @submit="submitEdit"
    />

    <LimitConfigForm
        v-model="batchVisible"
        title="批量修改上限配置"
        :loading="batchLoading"
        :form-data="batchForm"
        :rules="formRules"
        @submit="submitBatch"
    />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import type { FormSchema } from '@/types/form'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { hasPermission } from '@/directives/permission/hasPermi'
import { useTable } from '@/hooks/web/useTable'
import * as AllocationLimitApi from '@/api/crm/allocation/limit'
import DeptTree from '@/views/system/user/DeptTree.vue'
import LimitConfigForm from './LimitConfigForm.vue'

defineOptions({ name: 'CrmAllocationLimit' })

const message = useMessage()
const canUpdate = hasPermission(['system:allocation-user-limit:update'])

const deptId = ref<number | undefined>()
const checkedRows = ref<AllocationLimitApi.AllocationUserLimitVO[]>([])

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'enabled',
        label: '状态',
        component: 'Select',
        componentProps: {
            clearable: true,
            placeholder: '请选择状态',
            options: [
                { label: '启用', value: true },
                { label: '停用', value: false }
            ],
            style: { width: '220px' }
        }
    },
    {
        field: 'keyword',
        label: '用户',
        component: 'Input',
        componentProps: {
            clearable: true,
            placeholder: '请输入姓名/账号',
            style: { width: '240px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<AllocationLimitApi.AllocationUserLimitVO>({
    getListApi: async (params) =>
        await AllocationLimitApi.getAllocationUserLimitPage({ ...params, deptId: deptId.value })
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams({ ...params, deptId: deptId.value })
}

const handleDeptNodeClick = (row: any) => {
    deptId.value = row?.id
    tableMethods.setSearchParams({ ...(tableObject.params || {}), deptId: deptId.value })
}

const handleSelectionChange = (rows: AllocationLimitApi.AllocationUserLimitVO[]) => {
    checkedRows.value = rows || []
}

const formatLimit = (current?: number, unlimited?: boolean, limit?: number) => {
    return `${current || 0}/${unlimited ? '不限' : (limit ?? 0)}`
}

const editVisible = ref(false)
const editLoading = ref(false)
const currentEditUserId = ref<number>()

const createEmptyConfig = () => ({
    userId: 0,
    enabled: true,
    totalCustomerLimitUnlimited: false,
    totalCustomerLimit: 0,
    firstConsultCustomerLimitUnlimited: false,
    firstConsultCustomerLimit: 0,
    repurchaseCustomerLimitUnlimited: false,
    repurchaseCustomerLimit: 0,
    dailyFirstConsultReceiveLimitUnlimited: false,
    dailyFirstConsultReceiveLimit: 0,
    dailyRepurchaseReceiveLimitUnlimited: false,
    dailyRepurchaseReceiveLimit: 0,
    remark: ''
})

const editForm = ref<AllocationLimitApi.AllocationUserLimitVO>(createEmptyConfig())
const batchForm = ref<AllocationLimitApi.AllocationUserLimitVO>(createEmptyConfig())

const formRules = reactive({
    totalCustomerLimit: [{ required: true, message: '请输入总客户上限', trigger: 'blur' }],
    firstConsultCustomerLimit: [{ required: true, message: '请输入首咨客户上限', trigger: 'blur' }],
    repurchaseCustomerLimit: [{ required: true, message: '请输入复购客户上限', trigger: 'blur' }],
    dailyFirstConsultReceiveLimit: [
        { required: true, message: '请输入每日首咨领取上限', trigger: 'blur' }
    ],
    dailyRepurchaseReceiveLimit: [
        { required: true, message: '请输入每日复购领取上限', trigger: 'blur' }
    ]
})

const openEditDialog = async (row: AllocationLimitApi.AllocationUserLimitVO) => {
    currentEditUserId.value = row.userId
    editLoading.value = true
    editVisible.value = true
    try {
        const detail = await AllocationLimitApi.getAllocationUserLimit(row.userId)
        editForm.value = {
            ...createEmptyConfig(),
            ...detail,
            userId: row.userId
        }
    } finally {
        editLoading.value = false
    }
}

const submitEdit = async () => {
    if (!currentEditUserId.value) return
    editLoading.value = true
    try {
        await AllocationLimitApi.saveAllocationUserLimit({
            ...editForm.value,
            userId: currentEditUserId.value,
            totalCustomerLimitUnlimited: false,
            firstConsultCustomerLimitUnlimited: false,
            repurchaseCustomerLimitUnlimited: false,
            dailyFirstConsultReceiveLimitUnlimited: false,
            dailyRepurchaseReceiveLimitUnlimited: false,
            totalCustomerLimit: Number(editForm.value.totalCustomerLimit || 0),
            firstConsultCustomerLimit: Number(editForm.value.firstConsultCustomerLimit || 0),
            repurchaseCustomerLimit: Number(editForm.value.repurchaseCustomerLimit || 0),
            dailyFirstConsultReceiveLimit: Number(
                editForm.value.dailyFirstConsultReceiveLimit || 0
            ),
            dailyRepurchaseReceiveLimit: Number(editForm.value.dailyRepurchaseReceiveLimit || 0)
        })
        message.success('保存成功')
        editVisible.value = false
        await tableMethods.getList()
    } finally {
        editLoading.value = false
    }
}

const batchVisible = ref(false)
const batchLoading = ref(false)

const openBatchDialog = () => {
    batchForm.value = createEmptyConfig()
    batchVisible.value = true
}

const submitBatch = async () => {
    const userIds = checkedRows.value.map((item) => item.userId).filter(Boolean) as number[]
    if (userIds.length === 0) return
    batchLoading.value = true
    try {
        await AllocationLimitApi.batchUpdateAllocationUserLimit({
            userIds,
            config: {
                ...batchForm.value,
                totalCustomerLimitUnlimited: false,
                firstConsultCustomerLimitUnlimited: false,
                repurchaseCustomerLimitUnlimited: false,
                dailyFirstConsultReceiveLimitUnlimited: false,
                dailyRepurchaseReceiveLimitUnlimited: false,
                totalCustomerLimit: Number(batchForm.value.totalCustomerLimit || 0),
                firstConsultCustomerLimit: Number(batchForm.value.firstConsultCustomerLimit || 0),
                repurchaseCustomerLimit: Number(batchForm.value.repurchaseCustomerLimit || 0),
                dailyFirstConsultReceiveLimit: Number(
                    batchForm.value.dailyFirstConsultReceiveLimit || 0
                ),
                dailyRepurchaseReceiveLimit: Number(
                    batchForm.value.dailyRepurchaseReceiveLimit || 0
                )
            }
        })
        message.success('批量修改成功')
        batchVisible.value = false
        checkedRows.value = []
        await tableMethods.getList()
    } finally {
        batchLoading.value = false
    }
}

const handleBatchStatus = async (enabled: boolean) => {
    const userIds = checkedRows.value.map((item) => item.userId).filter(Boolean) as number[]
    if (userIds.length === 0) return
    await AllocationLimitApi.updateAllocationUserLimitStatus({ userIds, enabled })
    message.success(enabled ? '批量启用成功' : '批量停用成功')
    checkedRows.value = []
    await tableMethods.getList()
}

const handleSingleStatus = async (row: AllocationLimitApi.AllocationUserLimitVO) => {
    await AllocationLimitApi.updateAllocationUserLimitStatus({
        userIds: [row.userId],
        enabled: !row.enabled
    })
    message.success(!row.enabled ? '启用成功' : '停用成功')
    await tableMethods.getList()
}

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'id', label: 'ID', width: '80px' },
    {
        field: 'enabled',
        label: '状态',
        width: '90px',
        slots: {
            default: (data) => (
                <el-tag type={data.row.enabled ? 'success' : 'info'}>
                    {data.row.enabled ? '启用' : '停用'}
                </el-tag>
            )
        }
    },
    { field: 'userName', label: '姓名', minWidth: '110px' },
    { field: 'account', label: '账号', minWidth: '120px' },
    {
        field: 'userLevel',
        label: '用户等级',
        width: '90px',
        slots: { default: (data) => <span>{data.row.userLevel || '-'}</span> }
    },
    {
        field: 'totalCustomerLimit',
        label: '客户数/上限',
        minWidth: '120px',
        slots: {
            default: (data) =>
                formatLimit(
                    data.row.totalCustomerCurrentCount,
                    data.row.totalCustomerLimitUnlimited,
                    data.row.totalCustomerLimit
                )
        }
    },
    {
        field: 'firstConsultCustomerLimit',
        label: '首咨客户/上限',
        minWidth: '130px',
        slots: {
            default: (data) =>
                formatLimit(
                    data.row.firstConsultCustomerCurrentCount,
                    data.row.firstConsultCustomerLimitUnlimited,
                    data.row.firstConsultCustomerLimit
                )
        }
    },
    {
        field: 'repurchaseCustomerLimit',
        label: '复购客户/上限',
        minWidth: '130px',
        slots: {
            default: (data) =>
                formatLimit(
                    data.row.repurchaseCustomerCurrentCount,
                    data.row.repurchaseCustomerLimitUnlimited,
                    data.row.repurchaseCustomerLimit
                )
        }
    },
    {
        field: 'dailyFirstConsultReceiveLimit',
        label: '每日首咨领取/上限',
        minWidth: '150px',
        slots: {
            default: (data) =>
                formatLimit(
                    data.row.dailyFirstConsultReceivedCount,
                    data.row.dailyFirstConsultReceiveLimitUnlimited,
                    data.row.dailyFirstConsultReceiveLimit
                )
        }
    },
    {
        field: 'dailyRepurchaseReceiveLimit',
        label: '每日复购领取/上限',
        minWidth: '150px',
        slots: {
            default: (data) =>
                formatLimit(
                    data.row.dailyRepurchaseReceivedCount,
                    data.row.dailyRepurchaseReceiveLimitUnlimited,
                    data.row.dailyRepurchaseReceiveLimit
                )
        }
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
                        <BaseButton link type="primary" onClick={() => openEditDialog(data.row)}>
                            修改
                        </BaseButton>
                    ) : null}
                    {canUpdate ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => handleSingleStatus(data.row)}
                        >
                            {data.row.enabled ? '禁用' : '启用'}
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
    margin-bottom: 10px;
}

:deep(.limit-tip-alert) {
    margin-top: 12px;
}
</style>
