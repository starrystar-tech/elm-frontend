<template>
    <ContentWrap>
        <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />

        <div class="mb-12px flex items-center justify-between gap-12px flex-wrap action-btn-wrap">
            <div class="flex gap-8px flex-wrap">
                <BaseButton
                    type="primary"
                    :disabled="selectionList.length === 0"
                    @click="assignDialogVisible = true"
                    >批量分配</BaseButton
                >
                <BaseButton :disabled="selectionList.length === 0" @click="silentDialogVisible = true"
                    >批量静默</BaseButton
                >
                <BaseButton :disabled="selectionList.length !== 2" plain @click="openMergeDialog"
                    >合并</BaseButton
                >
            </div>
        </div>

        <Table
            v-model:currentPage="tableObject.currentPage"
            v-model:pageSize="tableObject.pageSize"
            :columns="tableColumns"
            :data="tableObject.tableList"
            :loading="tableObject.loading"
            :pagination="{ total: tableObject.total }"
            row-key="id"
            selection
            reserve-selection
            @register="tableRegister"
            @selection-change="handleSelectionChange"
        />
    </ContentWrap>

    <Dialog v-model="assignDialogVisible" title="批量分配数据" width="420px">
        <el-form label-width="90px">
            <el-form-item label="归属人" required>
                <el-select
                    v-model="assignForm.ownerId"
                    filterable
                    placeholder="请选择归属人"
                    style="width: 100%"
                >
                    <el-option
                        v-for="item in userOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="所属部门">
                <el-input :model-value="selectedDeptName" disabled />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="assignDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleBatchAssign">确定</el-button>
        </template>
    </Dialog>

    <Dialog v-model="silentDialogVisible" title="批量静默" width="520px">
        <el-form :model="silentForm" label-width="90px">
            <el-form-item label="静默原因" required>
                <el-input v-model="silentForm.silentReason" placeholder="请输入静默原因" />
            </el-form-item>
            <el-form-item label="静默天数" required>
                <el-input-number
                    v-model="silentForm.silentDays"
                    :min="1"
                    controls-position="right"
                    style="width: 100%"
                />
            </el-form-item>
            <el-form-item label="备注">
                <el-input
                    v-model="silentForm.remark"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入备注"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="silentDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleBatchSilent">确定</el-button>
        </template>
    </Dialog>

    <Dialog v-model="mergeDialogVisible" title="线索合并" width="520px">
        <el-form label-width="90px">
            <el-form-item label="保留线索">
                <el-radio-group v-model="mergeForm.keepClueId">
                    <el-radio v-for="item in selectionList" :key="item.id" :label="item.id">
                        {{ item.name || item.mobile || item.id }}
                    </el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="合并备注">
                <el-input
                    v-model="mergeForm.remark"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入合并备注"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="mergeDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleMerge">确定</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import * as ClueApi from '@/api/crm/clue'
import * as UserApi from '@/api/system/user'
import * as DeptApi from '@/api/system/dept'

defineOptions({ name: 'CrmClueAllocation' })

const message = useMessage()
const userOptions = ref<{ label: string; value: number; deptId?: number }[]>([])
const deptOptions = ref<DeptApi.DeptVO[]>([])
const selectionList = ref<ClueApi.ClueVO[]>([])
const assignDialogVisible = ref(false)
const silentDialogVisible = ref(false)
const mergeDialogVisible = ref(false)

const assignForm = reactive({ ownerId: undefined as number | undefined })
const silentForm = reactive({ silentReason: '', silentDays: 7, remark: '' })
const mergeForm = reactive({ keepClueId: undefined as number | undefined, remark: '' })

const statusOptions = [
    { label: '跟进中', value: 2 },
    { label: '已成交', value: 3 },
    { label: '静默', value: 6 }
]
const assignModeOptions = [
    { label: '自动', value: 1 },
    { label: '手动', value: 2 }
]
const allocationTypeOptions = [
    { label: '自动分配', value: 1 },
    { label: '手动分配', value: 2 },
    { label: '自己创建', value: 3 },
    { label: '公海领取', value: 4 },
    { label: '主管调配', value: 5 },
    { label: '无效再分配', value: 6 },
    { label: '批量分配', value: 7 },
    { label: '复购系统分配', value: 8 }
]

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'mobile',
        label: '联系电话',
        component: 'Input',
        componentProps: {
            placeholder: '请输入联系电话',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'customer',
        label: '客户',
        component: 'Input',
        componentProps: {
            placeholder: '请输入客户编号/姓名',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'currentOwnerId',
        label: '归属人',
        component: 'Select',
        componentProps: {
            placeholder: '请选择归属人',
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px' }
        }
    },
    {
        field: 'status',
        label: '状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择状态',
            clearable: true,
            options: statusOptions,
            style: { width: '220px' }
        }
    },
    {
        field: 'assignMode',
        label: '分配方式',
        component: 'Select',
        componentProps: {
            placeholder: '请选择分配方式',
            clearable: true,
            options: assignModeOptions,
            style: { width: '220px' }
        }
    },
    {
        field: 'allocationType',
        label: '分配类型',
        component: 'Select',
        componentProps: {
            placeholder: '请选择分配类型',
            clearable: true,
            options: allocationTypeOptions,
            style: { width: '220px' }
        }
    },
    {
        field: 'allocationTimeRange',
        label: '分配时间',
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
} = useTable<ClueApi.ClueVO>({
    getListApi: async (params) => await ClueApi.getAllocationCluePage(params as ClueApi.ClueAllocationPageReqVO)
})

const selectedUser = computed(() => userOptions.value.find((item) => item.value === assignForm.ownerId))
const selectedDeptName = computed(() => {
    const dept = deptOptions.value.find((item) => item.id === selectedUser.value?.deptId)
    return dept?.name || '--'
})

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'mobile', label: '联系电话', width: '140px' },
    { field: 'name', label: '姓名', width: '120px' },
    { field: 'currentOwnerName', label: '当前归属人', width: '120px' },
    { field: 'currentDepartmentName', label: '当前归属部门', width: '140px' },
    { field: 'firstAllocationOwnerName', label: '首次分配人', width: '120px' },
    { field: 'firstAllocationDepartmentName', label: '首次分配部门', width: '140px' },
    { field: 'consultProjectName', label: '咨询项目', minWidth: '160px' },
    { field: 'assignModeName', label: '分配方式', width: '100px' },
    { field: 'allocationTypeName', label: '分配类型', minWidth: '130px' },
    {
        field: 'tagNames',
        label: '标签',
        minWidth: '150px',
        slots: { default: (data) => <span>{(data.row.tagNames as string[])?.length ? (data.row.tagNames as string[]).join('、') : '-'}</span> }
    },
    { field: 'intentLevelName', label: '意向度', width: '90px' },
    { field: 'todayCallCount', label: '当日外呼', width: '100px' },
    { field: 'todayConnectedCount', label: '当日接通', width: '100px' },
    { field: 'orderCount', label: '订单数', width: '90px' },
    { field: 'allocationTime', label: '分配时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter }
])

const loadOptions = async () => {
    const [users, depts] = await Promise.all([UserApi.getSimpleUserList(), DeptApi.getSimpleDeptList()])
    userOptions.value = (users || []).map((item) => ({
        label: item.nickname || item.username,
        value: item.id,
        deptId: item.deptId
    }))
    deptOptions.value = depts || []
    const ownerField = searchSchema.find((item) => item.field === 'currentOwnerId')
    if (ownerField?.componentProps) {
        ownerField.componentProps.options = userOptions.value
    }
}

const handleSelectionChange = (rows: ClueApi.ClueVO[]) => {
    selectionList.value = rows || []
}

const setSearchParams = (params: Record<string, any>) => {
    const { allocationTimeRange, ...rest } = params
    tableMethods.setSearchParams({
        ...rest,
        beginAllocationTime: allocationTimeRange?.[0],
        endAllocationTime: allocationTimeRange?.[1]
    })
}

const openMergeDialog = () => {
    const keepId = selectionList.value[0]?.id
    mergeForm.keepClueId = keepId ? Number(keepId) : undefined
    mergeForm.remark = ''
    mergeDialogVisible.value = true
}

const handleBatchAssign = async () => {
    if (!assignForm.ownerId) {
        message.warning('请选择归属人')
        return
    }
    const user = selectedUser.value
    if (!user?.deptId) {
        message.warning('所选归属人缺少所属部门，无法分配')
        return
    }
    await ClueApi.allocationBatchAssign({
        clueIds: selectionList.value.map((item) => Number(item.id)),
        ownerId: Number(assignForm.ownerId),
        departmentId: Number(user.deptId)
    })
    message.success('批量分配成功')
    assignDialogVisible.value = false
    assignForm.ownerId = undefined
    selectionList.value = []
    await tableMethods.clearSelection()
    await tableMethods.getList()
}

const handleBatchSilent = async () => {
    if (!silentForm.silentReason.trim()) {
        message.warning('请输入静默原因')
        return
    }
    await ClueApi.allocationBatchSilent({
        clueIds: selectionList.value.map((item) => Number(item.id)),
        silentReason: silentForm.silentReason,
        silentDays: Number(silentForm.silentDays),
        remark: silentForm.remark || undefined
    })
    message.success('批量静默成功')
    silentDialogVisible.value = false
    Object.assign(silentForm, { silentReason: '', silentDays: 7, remark: '' })
    selectionList.value = []
    await tableMethods.clearSelection()
    await tableMethods.getList()
}

const handleMerge = async () => {
    if (!mergeForm.keepClueId) {
        message.warning('请选择保留线索')
        return
    }
    const mergedClue = selectionList.value.find((item) => Number(item.id) !== mergeForm.keepClueId)
    if (!mergedClue?.id) {
        message.warning('请选择两条线索后再进行合并')
        return
    }
    await ClueApi.allocationMerge({
        keepClueId: Number(mergeForm.keepClueId),
        mergedClueId: Number(mergedClue.id),
        remark: mergeForm.remark || undefined
    })
    message.success('线索合并成功')
    mergeDialogVisible.value = false
    selectionList.value = []
    await tableMethods.clearSelection()
    await tableMethods.getList()
}

onMounted(async () => {
    await loadOptions()
    tableMethods.getList()
})
</script>
