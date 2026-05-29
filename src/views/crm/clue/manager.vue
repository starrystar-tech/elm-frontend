<template>
    <ContentWrap>
        <el-tabs v-model="activeTab" class="list-tabs-compact" @tab-change="handleTabChange">
            <el-tab-pane
                v-for="tab in CUSTOMER_TABS"
                :key="tab.value"
                :name="tab.value"
                :label="`${tab.label} (${counts[tab.countField] || 0})`"
            />
        </el-tabs>
        <div class="tab-content-wrap">
            <Search
                :schema="searchSchema"
                expand-field="allocationTimeRange"
                @reset="setSearchParams"
                @search="setSearchParams"
            />

            <div class="action-btn-wrap">
                <div class="flex gap-8px flex-wrap">
                    <BaseButton
                        type="primary"
                        :disabled="selectionList.length === 0"
                        @click="assignDialogVisible = true"
                    >
                        批量分配
                    </BaseButton>
                    <BaseButton
                        plain
                        :disabled="selectionList.length === 0"
                        @click="releaseDialogVisible = true"
                    >
                        批量释放
                    </BaseButton>
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
        </div>
    </ContentWrap>

    <ClueDetailDrawer ref="detailRef" />

    <Dialog v-model="assignDialogVisible" title="批量分配客户" width="420px">
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
            <el-button type="primary" @click="handleAssign">确定</el-button>
        </template>
    </Dialog>

    <Dialog v-model="releaseDialogVisible" title="批量释放客户" width="520px">
        <el-form label-width="90px">
            <el-form-item label="释放原因">
                <el-input
                    v-model="releaseForm.reason"
                    type="textarea"
                    :rows="3"
                    maxlength="128"
                    show-word-limit
                    placeholder="请输入释放原因"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="releaseDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleRelease()">确定</el-button>
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
import type { DeptVO } from '@/api/system/dept'
import ClueDetailDrawer from './detail/ClueDetailDrawer.vue'
import {
    ALLOCATION_TYPE_OPTIONS,
    buildAreaLabel,
    CUSTOMER_TABS,
    FEEDBACK_STATUS_OPTIONS,
    INTENT_LEVEL_OPTIONS,
    loadClueListOptions,
    type AreaOption,
    type LabelValueOption,
    type UserOption
} from './listShared'

defineOptions({ name: 'CrmClueManager' })

interface ManagerSearchParams {
    customer?: string
    mobile?: string
    ownerId?: number
    areaId?: number
    consultProjectId?: number
    clueSourceId?: number
    tagId?: number
    intentLevel?: number
    feedbackStatus?: number
    allocationType?: number
    minOrderCount?: number
    maxOrderCount?: number
    lastFeedbackTimeRange?: string[]
    allocationTimeRange?: string[]
}

const message = useMessage()
const detailRef = ref<InstanceType<typeof ClueDetailDrawer>>()
const activeTab = ref('FIRST')
const selectionList = ref<ClueApi.ClueManagementPageRespVO[]>([])
const areaOptions = ref<AreaOption[]>([])
const userOptions = ref<UserOption[]>([])
const deptOptions = ref<DeptVO[]>([])
const projectOptions = ref<LabelValueOption[]>([])
const clueSourceOptions = ref<LabelValueOption[]>([])
const tagOptions = ref<LabelValueOption[]>([])
const counts = reactive({
    firstCount: 0,
    seaCount: 0,
    repurchaseCount: 0,
    waitReturnCount: 0,
    returnedCount: 0
})
const assignDialogVisible = ref(false)
const releaseDialogVisible = ref(false)
const assignForm = reactive({
    ownerId: undefined as number | undefined
})
const releaseForm = reactive({
    reason: ''
})

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
        field: 'ownerId',
        label: '归属人',
        component: 'Select',
        componentProps: {
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px' }
        }
    },
    {
        field: 'areaId',
        label: '地区',
        component: 'Select',
        componentProps: {
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px' }
        }
    },
    {
        field: 'consultProjectId',
        label: '咨询项目',
        component: 'Select',
        componentProps: {
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px' }
        }
    },
    {
        field: 'clueSourceId',
        label: '线索来源',
        component: 'Select',
        componentProps: {
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px' }
        }
    },
    {
        field: 'tagId',
        label: '标签',
        component: 'Select',
        componentProps: {
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px' }
        }
    },
    {
        field: 'intentLevel',
        label: '意向度',
        component: 'Select',
        componentProps: {
            clearable: true,
            options: INTENT_LEVEL_OPTIONS,
            style: { width: '220px' }
        }
    },
    {
        field: 'feedbackStatus',
        label: '反馈状态',
        component: 'Select',
        componentProps: {
            clearable: true,
            options: FEEDBACK_STATUS_OPTIONS,
            style: { width: '220px' }
        }
    },
    {
        field: 'allocationType',
        label: '分配类型',
        component: 'Select',
        componentProps: {
            clearable: true,
            options: ALLOCATION_TYPE_OPTIONS,
            style: { width: '220px' }
        }
    },
    {
        field: 'lastFeedbackTimeRange',
        label: '最近反馈时间',
        component: 'DatePicker',
        componentProps: {
            type: 'datetimerange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            startPlaceholder: '开始时间',
            endPlaceholder: '结束时间',
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
} = useTable<ClueApi.ClueManagementPageRespVO>({
    getListApi: async (params) =>
        await ClueApi.getClueManagementPage(params as ClueApi.ClueManagementPageReqVO)
})

const selectedUser = computed(() =>
    userOptions.value.find((item) => item.value === assignForm.ownerId)
)
const selectedDeptName = computed(() => {
    const dept = deptOptions.value.find((item) => item.id === selectedUser.value?.deptId)
    return dept?.name || '--'
})

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'customerId', label: '客户编号', minWidth: '120px' },
    { field: 'mobile', label: '联系电话', width: '140px' },
    { field: 'name', label: '姓名', width: '120px' },
    {
        field: 'areaName',
        label: '地区',
        minWidth: '170px',
        slots: { default: (data) => <span>{buildAreaLabel(data.row)}</span> }
    },
    { field: 'currentOwnerName', label: '归属人', width: '120px' },
    { field: 'currentDepartmentName', label: '所属部门', minWidth: '140px' },
    { field: 'consultProjectName', label: '咨询项目', minWidth: '160px' },
    { field: 'claimSourceName', label: '领取来源', width: '110px' },
    { field: 'allocationTypeName', label: '分配类型', minWidth: '120px' },
    {
        field: 'allocationTime',
        label: '分配时间',
        minWidth: '170px',
        formatter: dateFormatter
    },
    { field: 'feedbackStatusName', label: '反馈状态', width: '100px' },
    {
        field: 'lastFeedbackTime',
        label: '最近反馈时间',
        minWidth: '170px',
        formatter: dateFormatter
    },
    { field: 'orderCount', label: '报名次数', width: '100px' },
    {
        field: 'action',
        label: '操作',
        width: '160px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <>
                    <BaseButton link type="primary" onClick={() => openDetail(Number(data.row.id))}>
                        详情
                    </BaseButton>
                    <BaseButton
                        link
                        type="primary"
                        onClick={() => handleAssign([Number(data.row.id)])}
                    >
                        分配
                    </BaseButton>
                    <BaseButton
                        link
                        type="danger"
                        onClick={() => handleRelease([Number(data.row.id)])}
                    >
                        释放
                    </BaseButton>
                </>
            )
        }
    }
])

const buildSearchParams = (params: ManagerSearchParams) => {
    const { lastFeedbackTimeRange, allocationTimeRange, ...rest } = params
    return {
        ...rest,
        tabType: activeTab.value,
        beginLastFeedbackTime: lastFeedbackTimeRange?.[0],
        endLastFeedbackTime: lastFeedbackTimeRange?.[1],
        beginAllocationTime: allocationTimeRange?.[0],
        endAllocationTime: allocationTimeRange?.[1]
    }
}

const loadCounts = async () => {
    const data = await ClueApi.getClueManagementCounts()
    Object.assign(counts, {
        firstCount: Number(data?.firstCount || 0),
        seaCount: Number(data?.seaCount || 0),
        repurchaseCount: Number(data?.repurchaseCount || 0),
        waitReturnCount: Number(data?.waitReturnCount || 0),
        returnedCount: Number(data?.returnedCount || 0)
    })
}

const handleSelectionChange = (rows: ClueApi.ClueManagementPageRespVO[]) => {
    selectionList.value = rows || []
}

const setSearchParams = (params: ManagerSearchParams) => {
    tableMethods.setSearchParams(buildSearchParams(params))
}

const handleTabChange = async () => {
    selectionList.value = []
    tableMethods.setSearchParams(buildSearchParams({}))
}

const openDetail = (id: number) => {
    detailRef.value?.open(id)
}

const handleAssign = async (ids?: number[]) => {
    const clueIds = ids || selectionList.value.map((item) => Number(item.id))
    if (!clueIds.length) {
        message.warning('请选择要分配的客户')
        return
    }
    if (!assignForm.ownerId) {
        message.warning('请选择归属人')
        return
    }
    const user = selectedUser.value
    if (!user?.deptId) {
        message.warning('所选归属人缺少所属部门，无法分配')
        return
    }
    await ClueApi.assignClueManagement({
        clueIds,
        ownerId: Number(assignForm.ownerId),
        departmentId: Number(user.deptId)
    })
    message.success('分配成功')
    assignDialogVisible.value = false
    assignForm.ownerId = undefined
    await Promise.all([tableMethods.getList(), loadCounts()])
}

const handleRelease = async (ids?: number[]) => {
    const clueIds = ids || selectionList.value.map((item) => Number(item.id))
    if (!clueIds.length) {
        message.warning('请选择要释放的客户')
        return
    }
    await ClueApi.releaseClueManagement({
        clueIds,
        reason: releaseForm.reason || undefined
    })
    message.success('释放成功')
    releaseDialogVisible.value = false
    releaseForm.reason = ''
    await Promise.all([tableMethods.getList(), loadCounts()])
}

onMounted(async () => {
    await Promise.all([
        loadClueListOptions({
            schema: searchSchema,
            areaOptions,
            userOptions,
            deptOptions,
            projectOptions,
            clueSourceOptions,
            tagOptions
        }),
        loadCounts()
    ])
    tableMethods.setSearchParams(buildSearchParams({}))
})
</script>
