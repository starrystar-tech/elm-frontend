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

        <Search
            :schema="searchSchema"
            expand-field="createTimeRange"
            @reset="setSearchParams"
            @search="setSearchParams"
        />

        <div class="mb-12px flex items-center justify-between gap-12px flex-wrap action-btn-wrap">
            <div class="flex gap-8px flex-wrap">
                <BaseButton
                    type="primary"
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
    </ContentWrap>

    <ClueDetailDrawer ref="detailRef" />

    <Dialog v-model="releaseDialogVisible" title="释放我的客户" width="520px">
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
import ClueDetailDrawer from './detail/ClueDetailDrawer.vue'
import {
    buildAreaLabel,
    CUSTOMER_TABS,
    FEEDBACK_STATUS_OPTIONS,
    INTENT_LEVEL_OPTIONS,
    loadClueListOptions,
    type AreaOption,
    type LabelValueOption,
    type UserOption
} from './listShared'

defineOptions({ name: 'CrmMyClue' })

interface MyClueSearchParams {
    customer?: string
    mobile?: string
    wechat?: string
    qq?: string
    areaId?: number
    tagId?: number
    consultProjectId?: number
    clueSourceId?: number
    intentLevel?: number
    minCallCount?: number
    maxCallCount?: number
    feedbackStatus?: number
    minOrderCount?: number
    maxOrderCount?: number
    lastFeedbackTimeRange?: string[]
    createTimeRange?: string[]
}

const message = useMessage()
const detailRef = ref<InstanceType<typeof ClueDetailDrawer>>()
const activeTab = ref('FIRST')
const selectionList = ref<ClueApi.MyCluePageRespVO[]>([])
const areaOptions = ref<AreaOption[]>([])
const userOptions = ref<UserOption[]>([])
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
const releaseDialogVisible = ref(false)
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
        field: 'minCallCount',
        label: '外呼次数起',
        component: 'InputNumber',
        componentProps: {
            min: 0,
            controlsPosition: 'right',
            style: { width: '220px' }
        }
    },
    {
        field: 'maxCallCount',
        label: '外呼次数止',
        component: 'InputNumber',
        componentProps: {
            min: 0,
            controlsPosition: 'right',
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
        field: 'createTimeRange',
        label: '创建时间',
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
} = useTable<ClueApi.MyCluePageRespVO>({
    getListApi: async (params) => await ClueApi.getMyCluePage(params as ClueApi.MyCluePageReqVO)
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
    { field: 'consultProjectName', label: '咨询项目', minWidth: '160px' },
    { field: 'claimSourceName', label: '领取来源', width: '110px' },
    { field: 'feedbackStatusName', label: '反馈状态', width: '100px' },
    { field: 'allocationTypeName', label: '分配类型', minWidth: '120px' },
    {
        field: 'lastFeedbackTime',
        label: '最近反馈时间',
        minWidth: '170px',
        formatter: dateFormatter
    },
    { field: 'todayCallCount', label: '当日外呼', width: '100px' },
    { field: 'todayConnectedCount', label: '当日接通', width: '100px' },
    { field: 'orderCount', label: '报名次数', width: '100px' },
    {
        field: 'nextFollowUpTime',
        label: '下次回访时间',
        minWidth: '170px',
        formatter: dateFormatter
    },
    {
        field: 'expireTime',
        label: '保护期截止',
        minWidth: '170px',
        formatter: dateFormatter
    },
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

const buildSearchParams = (params: MyClueSearchParams) => {
    const { lastFeedbackTimeRange, createTimeRange, ...rest } = params
    return {
        ...rest,
        tabType: activeTab.value,
        beginLastFeedbackTime: lastFeedbackTimeRange?.[0],
        endLastFeedbackTime: lastFeedbackTimeRange?.[1],
        beginCreateTime: createTimeRange?.[0],
        endCreateTime: createTimeRange?.[1]
    }
}

const loadCounts = async () => {
    const data = await ClueApi.getMyClueCounts()
    Object.assign(counts, {
        firstCount: Number(data?.firstCount || 0),
        seaCount: Number(data?.seaCount || 0),
        repurchaseCount: Number(data?.repurchaseCount || 0),
        waitReturnCount: Number(data?.waitReturnCount || 0),
        returnedCount: Number(data?.returnedCount || 0)
    })
}

const handleSelectionChange = (rows: ClueApi.MyCluePageRespVO[]) => {
    selectionList.value = rows || []
}

const setSearchParams = (params: MyClueSearchParams) => {
    tableMethods.setSearchParams(buildSearchParams(params))
}

const handleTabChange = async () => {
    selectionList.value = []
    tableMethods.setSearchParams(buildSearchParams({}))
}

const openDetail = (id: number) => {
    detailRef.value?.open(id)
}

const handleRelease = async (ids?: number[]) => {
    const clueIds = ids || selectionList.value.map((item) => Number(item.id))
    if (!clueIds.length) {
        message.warning('请选择要释放的客户')
        return
    }
    await ClueApi.releaseMyClue({
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
            projectOptions,
            clueSourceOptions,
            tagOptions
        }),
        loadCounts()
    ])
    tableMethods.setSearchParams(buildSearchParams({}))
})
</script>
