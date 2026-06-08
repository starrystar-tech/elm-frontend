<template>
    <ContentWrap>
        <el-tabs v-model="activeTab" class="list-tabs-compact" @tab-change="handleTabChange">
            <el-tab-pane
                v-for="tab in PUBLIC_SEA_TABS"
                :key="tab.value"
                :name="String(tab.value)"
                :label="`${tab.label} (${publicSeaCounts[tab.countField] || 0})`"
            />
        </el-tabs>
        <div class="tab-content-wrap">
            <Search
                :schema="searchSchema"
                expand-field="enterPublicSeaTimeRange"
                @reset="setSearchParams"
                @search="setSearchParams"
            >
                <template #consultProjectId="formModel">
                    <ProductCategorySelect
                        v-model="formModel.consultProjectId"
                        placeholder="请选择咨询项目"
                    />
                </template>
            </Search>

            <div class="flex items-center justify-between gap-12px flex-wrap action-btn-wrap">
                <div class="flex gap-8px flex-wrap">
                    <BaseButton
                        type="primary"
                        :disabled="selectionList.length === 0"
                        @click="handleBatchClaim()"
                    >
                        批量领取
                    </BaseButton>
                    <BaseButton
                        plain
                        :disabled="selectionList.length === 0"
                        @click="assignDialogVisible = true"
                    >
                        批量分配
                    </BaseButton>
                </div>
                <div class="text-13px pr-12px text-[var(--el-text-color-secondary)]">
                    {{ claimSummaryText }}
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

    <ClueDetailDrawer ref="detailRef" @refresh="handleDetailRefresh" />

    <Dialog v-model="assignDialogVisible" title="批量分配公海客户" width="420px">
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
</template>

<script setup lang="tsx">
import { computed, nextTick, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import ProductCategorySelect from '@/components/ProductCategorySelect.vue'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import * as ClueApi from '@/api/crm/clue'
import type { DeptVO } from '@/api/system/dept'
import { renderCopyMobileCell } from './mobileCopy'
import ClueDetailDrawer from './detail/ClueDetailDrawer.vue'
import {
    buildAreaLabel,
    FEEDBACK_STATUS_OPTIONS,
    INTENT_LEVEL_OPTIONS,
    loadClueListOptions,
    PUBLIC_SEA_TABS,
    type AreaOption,
    type LabelValueOption,
    type UserOption
} from './listShared'

defineOptions({ name: 'CrmCluePublicSea' })

interface PublicSeaSearchParams {
    customer?: string
    mobile?: string
    wechat?: string
    qq?: string
    areaId?: number
    tagId?: number
    consultProjectId?: number
    clueSourceId?: number
    intentLevel?: number
    feedbackStatus?: number
    minOrderCount?: number
    maxOrderCount?: number
    minEnterPublicSeaCount?: number
    maxEnterPublicSeaCount?: number
    enterPublicSeaTimeRange?: string[]
}

const message = useMessage()
const detailRef = ref<InstanceType<typeof ClueDetailDrawer>>()
const activeTab = ref('1')
const selectionList = ref<ClueApi.PublicSeaPageRespVO[]>([])
const areaOptions = ref<AreaOption[]>([])
const userOptions = ref<UserOption[]>([])
const deptOptions = ref<DeptVO[]>([])
const clueSourceOptions = ref<LabelValueOption[]>([])
const tagOptions = ref<LabelValueOption[]>([])
const publicSeaCounts = reactive({
    firstConsultCount: 0,
    repurchaseCount: 0
})
const claimSummary = reactive<ClueApi.PublicSeaClaimSummaryRespVO>({
    unlimited: false,
    dailyLimit: 0,
    claimedCount: 0,
    remainingCount: 0
})
const assignDialogVisible = ref(false)
const assignForm = reactive({
    ownerId: undefined as number | undefined
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
        field: 'wechat',
        label: '微信号',
        component: 'Input',
        componentProps: {
            placeholder: '请输入微信号',
            clearable: true,
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
        field: 'minEnterPublicSeaCount',
        label: '回流次数起',
        component: 'InputNumber',
        value: null,
        componentProps: {
            min: 0,
            controlsPosition: 'right',
            style: { width: '220px' }
        }
    },
    {
        field: 'maxEnterPublicSeaCount',
        label: '回流次数止',
        component: 'InputNumber',
        value: null,
        componentProps: {
            min: 0,
            controlsPosition: 'right',
            style: { width: '220px' }
        }
    },
    {
        field: 'enterPublicSeaTimeRange',
        label: '进入公海时间',
        component: 'DatePicker',
        componentProps: {
            type: 'datetimerange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            startPlaceholder: '开始时间',
            endPlaceholder: '结束时间',
            style: { width: '240px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ClueApi.PublicSeaPageRespVO>({
    getListApi: async (params) =>
        await ClueApi.getPublicSeaPage(params as ClueApi.PublicSeaPageReqVO)
})

const selectedUser = computed(() =>
    userOptions.value.find((item) => item.value === assignForm.ownerId)
)
const selectedDeptName = computed(() => {
    const dept = deptOptions.value.find((item) => item.id === selectedUser.value?.deptId)
    return dept?.name || '--'
})
const claimSummaryText = computed(() => {
    if (claimSummary.unlimited) {
        return `今日已领取 ${claimSummary.claimedCount || 0} 条，当前规则不限额`
    }
    return `今日已领取 ${claimSummary.claimedCount || 0} / ${claimSummary.dailyLimit || 0}，剩余 ${
        claimSummary.remainingCount || 0
    } 条`
})

const tableColumns = computed<TableColumn[]>(() => [
    {
        field: 'mobile',
        label: '联系电话',
        width: '170px',
        slots: {
            default: (data) =>
                renderCopyMobileCell({
                    row: data.row,
                    mobile: data.row.mobile,
                    success: message.success,
                    warning: message.warning
                })
        }
    },
    { field: 'name', label: '姓名', width: '120px' },
    {
        field: 'areaName',
        label: '地区',
        minWidth: '170px',
        slots: { default: (data) => <span>{buildAreaLabel(data.row)}</span> }
    },
    { field: 'consultProjectName', label: '咨询项目', minWidth: '160px' },
    { field: 'clueSourceName', label: '线索来源', minWidth: '140px' },
    { field: 'intentLevelName', label: '意向度', width: '100px' },
    { field: 'feedbackStatusName', label: '反馈状态', width: '100px' },
    {
        field: 'tagNames',
        label: '标签',
        minWidth: '150px',
        slots: { default: (data) => <span>{(data.row.tagNames as string[])?.length ? (data.row.tagNames as string[]).join('、') : '-'}</span> }
    },
    {
        field: 'complaintTagNames',
        label: '投诉标签',
        minWidth: '150px',
        slots: {
            default: (data) => (
                <span>
                    {(data.row.complaintTagNames as string[])?.length
                        ? (data.row.complaintTagNames as string[]).join('、')
                        : '-'}
                </span>
            )
        }
    },
    {
        field: 'enterPublicSeaTime',
        label: '进入公海时间',
        minWidth: '170px',
        formatter: dateFormatter
    },
    { field: 'enterPublicSeaReason', label: '进入公海原因', minWidth: '160px' },
    { field: 'enterPublicSeaCount', label: '回流次数', width: '100px' },
    { field: 'lastClaimOwnerName', label: '最后领取人', width: '120px' },
    { field: 'claimCount', label: '领取次数', width: '100px' },
    { field: 'orderCount', label: '报名次数', width: '100px' },
    {
        field: 'action',
        label: '操作',
        width: '150px',
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
                        onClick={() => handleBatchClaim([Number(data.row.id)])}
                    >
                        领取
                    </BaseButton>
                </>
            )
        }
    }
])

const getSeaType = () => Number(activeTab.value)

const buildSearchParams = (params: PublicSeaSearchParams) => {
    const { enterPublicSeaTimeRange, ...rest } = params
    return {
        ...rest,
        seaType: getSeaType(),
        beginEnterPublicSeaTime: enterPublicSeaTimeRange?.[0],
        endEnterPublicSeaTime: enterPublicSeaTimeRange?.[1]
    }
}

const loadPageOptions = async () => {
    await loadClueListOptions({
        schema: searchSchema,
        areaOptions,
        userOptions,
        deptOptions,
        clueSourceOptions,
        tagOptions
    })
}

const loadCounts = async () => {
    const data = await ClueApi.getPublicSeaCounts()
    publicSeaCounts.firstConsultCount = Number(data?.firstConsultCount || 0)
    publicSeaCounts.repurchaseCount = Number(data?.repurchaseCount || 0)
}

const loadClaimSummary = async () => {
    const data = await ClueApi.getPublicSeaClaimSummary(getSeaType())
    Object.assign(claimSummary, data || {})
}

const handleSelectionChange = (rows: ClueApi.PublicSeaPageRespVO[]) => {
    selectionList.value = rows || []
}

const setSearchParams = (params: PublicSeaSearchParams) => {
    tableMethods.setSearchParams(buildSearchParams(params))
}

const handleTabChange = async () => {
    selectionList.value = []
    await loadClaimSummary()
    tableMethods.setSearchParams(buildSearchParams({}))
}

const openDetail = (id: number) => {
    detailRef.value?.open(id)
}

const handleDetailRefresh = async () => {
    await Promise.all([tableMethods.getList(), loadCounts(), loadClaimSummary()])
}

const resetTableSelection = async () => {
    selectionList.value = []
    await tableMethods.clearSelection()
    await nextTick()
    await tableMethods.clearSelection()
}

const handleBatchClaim = async (ids?: number[]) => {
    const clueIds = ids || selectionList.value.map((item) => Number(item.id))
    if (!clueIds.length) {
        message.warning('请选择要领取的客户')
        return
    }
    await ClueApi.claimPublicSea({
        seaType: getSeaType(),
        clueIds
    })
    message.success('领取成功')
    if (!ids) {
        await resetTableSelection()
    }
    await Promise.all([tableMethods.getList(), loadCounts(), loadClaimSummary()])
    if (!ids) {
        await resetTableSelection()
    }
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
    await ClueApi.assignPublicSea({
        seaType: getSeaType(),
        clueIds: selectionList.value.map((item) => Number(item.id)),
        ownerId: Number(assignForm.ownerId),
        departmentId: Number(user.deptId)
    })
    message.success('批量分配成功')
    assignDialogVisible.value = false
    assignForm.ownerId = undefined
    await resetTableSelection()
    await Promise.all([tableMethods.getList(), loadCounts(), loadClaimSummary()])
    await resetTableSelection()
}

onMounted(async () => {
    await Promise.all([loadPageOptions(), loadCounts(), loadClaimSummary()])
    tableMethods.setSearchParams(buildSearchParams({}))
})
</script>
