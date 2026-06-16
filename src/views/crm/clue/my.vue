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
                :model="searchForm"
                expand-field="createTimeRange"
                @reset="handleResetSearch"
                @search="handleSearch"
            >
                <template #areaId>
                    <AreaSelect
                        v-model="searchForm.areaId"
                        :include-all-node="false"
                        placeholder="请选择地区"
                        style="width: 220px"
                    />
                </template>
                <template #consultProjectId>
                    <ProductTypeSelect
                        v-model="searchForm.consultProjectId"
                        placeholder="请选择咨询项目"
                    />
                </template>
            </Search>
            <div class="action-btn-wrap">
                <BaseButton
                    v-if="canSmsSend"
                    plain
                    :disabled="selectionList.length === 0"
                    @click="openSmsDialog"
                >
                    批量发短信
                </BaseButton>
                <BaseButton
                    type="primary"
                    :disabled="selectionList.length === 0"
                    @click="releaseDialogVisible = true"
                >
                    批量释放
                </BaseButton>
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
    <ClueSmsDialog ref="smsDialogRef" @success="handleSmsSuccess" />
    <ClueEnrollDialog ref="enrollRef" @success="handleDetailRefresh" />

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
import { computed, nextTick, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import AreaSelect from '@/components/AreaSelect.vue'
import ProductTypeSelect from '@/components/ProductTypeSelect.vue'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import * as ClueApi from '@/api/crm/clue'
import { hasPermission } from '@/directives/permission/hasPermi'
import { renderCopyMobileCell } from './mobileCopy'
import ClueSmsDialog from './ClueSmsDialog.vue'
import ClueDetailDrawer from './detail/ClueDetailDrawer.vue'
import ClueEnrollDialog from './detail/ClueEnrollDialog.vue'
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
    callCountRange?: Array<string | number | undefined>
    feedbackStatus?: number
    minOrderCount?: number
    maxOrderCount?: number
    lastFeedbackTimeRange?: string[]
    createTimeRange?: string[]
}

const message = useMessage()
const route = useRoute()
const canSmsSend = hasPermission(['crm:clue:sms:send'])
const detailRef = ref<InstanceType<typeof ClueDetailDrawer>>()
const smsDialogRef = ref<InstanceType<typeof ClueSmsDialog>>()
const enrollRef = ref<InstanceType<typeof ClueEnrollDialog>>()
const activeTab = ref('FIRST')
const searchForm = reactive<MyClueSearchParams>({})
const selectionList = ref<ClueApi.MyCluePageRespVO[]>([])
const areaOptions = ref<AreaOption[]>([])
const userOptions = ref<UserOption[]>([])
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
        component: 'Input',
        componentProps: {
            clearable: true,
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
        field: 'callCountRange',
        label: '外呼次数',
        component: 'AmountRangeInput',
        componentProps: {
            startPlaceholder: '外呼次数起',
            endPlaceholder: '外呼次数止',
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
    {
        field: 'mobile',
        label: '联系电话',
        width: '170px',
        slots: {
            default: (data) =>
                renderCopyMobileCell({
                    row: data.row,
                    mobile: data.row.mobile,
                    clueId: data.row.id,
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
    { field: 'claimSourceName', label: '领取来源', width: '110px' },
    { field: 'intentLevelName', label: '意向度', width: '100px' },
    { field: 'feedbackStatusName', label: '反馈状态', width: '100px' },
    { field: 'allocationTypeName', label: '分配类型', minWidth: '120px' },
    {
        field: 'tagNames',
        label: '标签',
        minWidth: '150px',
        slots: {
            default: (data) => (
                <span>
                    {(data.row.tagNames as string[])?.length
                        ? (data.row.tagNames as string[]).join('、')
                        : '-'}
                </span>
            )
        }
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
    // {
    //     field: 'expireTime',
    //     label: '保护期截止',
    //     minWidth: '170px',
    //     formatter: dateFormatter
    // },
    {
        field: 'action',
        label: '操作',
        width: '140px',
        fixed: 'right',
        slots: {
            default: (data) => {
                const rowId = Number(data.row.id)
                const moreActions = getMoreActions(rowId)
                return (
                    <div class="flex items-center justify-center">
                        <BaseButton link type="primary" onClick={() => openDetail(rowId)}>
                            详情
                        </BaseButton>
                        {moreActions.length ? (
                            <ElDropdown
                                trigger="click"
                                onCommand={(command: string) => handleMoreCommand(command, rowId)}
                            >
                                {{
                                    default: () => (
                                        <BaseButton link type="primary" class="clue-more-btn">
                                            更多
                                        </BaseButton>
                                    ),
                                    dropdown: () => (
                                        <ElDropdownMenu>
                                            {moreActions.map((item) => (
                                                <ElDropdownItem
                                                    command={item.command}
                                                    style={
                                                        item.type === 'danger'
                                                            ? 'color: var(--el-color-danger)'
                                                            : undefined
                                                    }
                                                >
                                                    {item.label}
                                                </ElDropdownItem>
                                            ))}
                                        </ElDropdownMenu>
                                    )
                                }}
                            </ElDropdown>
                        ) : null}
                    </div>
                )
            }
        }
    }
])

const buildSearchParams = (params: MyClueSearchParams) => {
    const { lastFeedbackTimeRange, createTimeRange, callCountRange, ...rest } = params
    return {
        ...rest,
        tabType: activeTab.value,
        minCallCount: callCountRange?.[0] ? Number(callCountRange[0]) : undefined,
        maxCallCount: callCountRange?.[1] ? Number(callCountRange[1]) : undefined,
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

const mergeSearchParams = (params: MyClueSearchParams = {}): MyClueSearchParams => ({
    ...params,
    areaId: searchForm.areaId,
    consultProjectId: searchForm.consultProjectId
})

const handleSearch = (params: MyClueSearchParams) => {
    tableMethods.setSearchParams(buildSearchParams(mergeSearchParams(params)))
}

const handleResetSearch = (params: MyClueSearchParams) => {
    searchForm.areaId = undefined
    searchForm.consultProjectId = undefined
    tableMethods.setSearchParams(buildSearchParams(mergeSearchParams(params)))
}

const getQueryString = (value: unknown) => {
    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : ''
    }
    return typeof value === 'string' ? value : ''
}

const initSearchFormFromRoute = () => {
    const tabType = getQueryString(route.query.tabType)
    const beginCreateTime = getQueryString(route.query.beginCreateTime)
    const endCreateTime = getQueryString(route.query.endCreateTime)
    if (tabType) {
        activeTab.value = tabType
    }
    if (beginCreateTime && endCreateTime) {
        searchForm.createTimeRange = [beginCreateTime, endCreateTime]
    }
}

const handleTabChange = async () => {
    selectionList.value = []
    searchForm.areaId = undefined
    searchForm.consultProjectId = undefined
    tableMethods.setSearchParams(buildSearchParams({}))
}

const openDetail = (id: number) => {
    detailRef.value?.open(id)
}

const openSmsDialog = () => {
    smsDialogRef.value?.open(selectionList.value.map((item) => Number(item.id)))
}

const openEnroll = async (id: number) => {
    const detail = await ClueApi.getClue(id)
    enrollRef.value?.open(detail)
}

const getMoreActions = (rowId: number) =>
    [
        canSmsSend
            ? {
                  command: 'sms',
                  label: '发短信'
              }
            : null,
        {
            command: 'enroll',
            label: '报名'
        },
        {
            command: 'release',
            label: '释放',
            type: 'danger' as const
        }
    ].filter((item): item is { command: string; label: string; type?: 'danger' } => Boolean(item && rowId))

const handleMoreCommand = async (command: string, rowId: number) => {
    switch (command) {
        case 'sms':
            smsDialogRef.value?.open([rowId])
            break
        case 'enroll':
            await openEnroll(rowId)
            break
        case 'release':
            await handleRelease([rowId])
            break
        default:
            break
    }
}

const handleDetailRefresh = async () => {
    await Promise.all([tableMethods.getList(), loadCounts()])
}

const handleSmsSuccess = async () => {
    await handleDetailRefresh()
}

const resetTableSelection = async () => {
    selectionList.value = []
    await tableMethods.clearSelection()
    await nextTick()
    await tableMethods.clearSelection()
}

const handleRelease = async (ids?: number[]) => {
    const clueIds = ids || selectionList.value.map((item) => Number(item.id))
    if (!clueIds.length) {
        message.warning('请选择要释放的客户')
        return
    }
    await message.confirm(
        clueIds.length > 1 ? `确认释放选中的 ${clueIds.length} 位客户吗？` : '确认释放该客户吗？'
    )
    await ClueApi.releaseMyClue({
        clueIds,
        reason: releaseForm.reason || undefined
    })
    message.success('释放成功')
    releaseDialogVisible.value = false
    releaseForm.reason = ''
    if (!ids) {
        await resetTableSelection()
    }
    await Promise.all([tableMethods.getList(), loadCounts()])
    if (!ids) {
        await resetTableSelection()
    }
}

onMounted(async () => {
    initSearchFormFromRoute()
    await Promise.all([
        loadClueListOptions({
            schema: searchSchema,
            areaOptions,
            userOptions,
            clueSourceOptions,
            tagOptions
        }),
        loadCounts()
    ])
    tableMethods.setSearchParams(buildSearchParams(mergeSearchParams(searchForm)))
})
</script>

<style lang="scss" scoped>
.clue-more-btn:focus,
.clue-more-btn:focus-visible {
    outline: none;
    box-shadow: none;
}
</style>
