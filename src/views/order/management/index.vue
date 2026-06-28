<template>
    <ContentWrap>
        <Search
            ref="searchRef"
            :schema="searchSchema"
            :model="searchForm"
            @search="setSearchParams"
            @reset="handleReset"
        >
            <template #ownerUserName>
                <el-input
                    v-model="searchForm.ownerUserName"
                    readonly
                    placeholder="请选择订单归属人"
                    style="width: 220px"
                    @click="openUserSelect('owner')"
                >
                    <template #suffix>
                        <el-icon
                            v-if="searchForm.ownerUserName"
                            class="cursor-pointer"
                            @click.stop="clearSelectedUser('owner')"
                        >
                            <CircleClose />
                        </el-icon>
                    </template>
                </el-input>
            </template>
            <template #cardOwnerUserName>
                <el-input
                    v-model="searchForm.cardOwnerUserName"
                    readonly
                    placeholder="请选择名片归属人"
                    style="width: 220px"
                    @click="openUserSelect('cardOwner')"
                >
                    <template #suffix>
                        <el-icon
                            v-if="searchForm.cardOwnerUserName"
                            class="cursor-pointer"
                            @click.stop="clearSelectedUser('cardOwner')"
                        >
                            <CircleClose />
                        </el-icon>
                    </template>
                </el-input>
            </template>
            <template #creator>
                <el-input
                    v-model="creatorDisplayName"
                    readonly
                    placeholder="请选择创建人"
                    style="width: 220px"
                    @click="openUserSelect('creator')"
                >
                    <template #suffix>
                        <el-icon
                            v-if="creatorDisplayName"
                            class="cursor-pointer"
                            @click.stop="clearSelectedUser('creator')"
                        >
                            <CircleClose />
                        </el-icon>
                    </template>
                </el-input>
            </template>
        </Search>
        <div class="action-btn-wrap flex items-center gap-2">
            <BaseButton
                v-hasPermi="['crm:order:batch-update-owner']"
                type="primary"
                @click="openBatchUpdateOwnerDialog"
                >修改订单归属人</BaseButton
            >
            <BaseButton v-hasPermi="['crm:order:export']" plain @click="openExportDialog"
                >导出</BaseButton
            >
            <BaseButton @click="handleBatchRepurchase">激活订单</BaseButton>
            <el-tooltip
                content="订单激活后，客户自动进入成单人复购列表，支持持续跟进与再次下单"
                placement="top"
            >
                <Icon class="text-orange-400" icon="ep:question-filled" />
            </el-tooltip>
        </div>
        <Table
            selection
            v-model:currentPage="tableObject.currentPage"
            v-model:pageSize="tableObject.pageSize"
            :columns="tableColumns"
            :data="tableObject.tableList"
            :loading="tableObject.loading"
            :pagination="{ total: tableObject.total }"
            @register="tableRegister"
        />
    </ContentWrap>

    <OrderDetailDrawer ref="detailRef" />
    <OrderContractSignDialog ref="contractSignRef" @success="tableMethods.getList" />
    <RefundDialog ref="refundRef" @success="tableMethods.getList" />
    <OrderPayDialog ref="payDialogRef" @success="tableMethods.getList" />
    <BatchUpdateOwnerDialog ref="batchUpdateOwnerDialogRef" @confirm="submitBatchUpdateOwner" />
    <ExportTaskDialog ref="exportDialogRef" @success="handleExportSuccess" />
    <UserSelectForm ref="userSelectFormRef" @confirm="handleUserSelectConfirm" />
    <AftersalesForm ref="aftersalesFormRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue'
import { CircleClose } from '@element-plus/icons-vue'
import { ElLink, ElMessageBox } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import type { SearchExpose } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { dateFormatter } from '@/utils/formatTime'
import * as OrderApi from '@/api/crm/order'
import {
    canSignOrderContract,
    CONTRACT_STATUS_OPTIONS,
    ORDER_STATUS_OPTIONS,
    formatAmount,
    getOptionLabel,
    getRefundableAmount,
    getRemainingAmount
} from '../utils'
import OrderDetailDrawer from '../detail/OrderDetailDrawer.vue'
import OrderContractSignDialog from '../detail/OrderContractSignDialog.vue'
import OrderPayDialog from '../components/OrderPayDialog.vue'
import RefundDialog from '../refund/RefundDialog.vue'
import { renderCopyMobileCell } from '@/views/crm/clue/mobileCopy'
import BatchUpdateOwnerDialog from './BatchUpdateOwnerDialog.vue'
import ExportTaskDialog from '@/views/crm/clue/components/ExportTaskDialog.vue'
import UserSelectForm from '@/components/UserSelectForm/index.vue'
import type { UserVO } from '@/api/system/user'
import { hasPermission } from '@/directives/permission/hasPermi'
import AftersalesForm from '@/views/aftersales/components/AftersalesForm.vue'

defineOptions({ name: 'OrderManagement' })

const message = useMessage()
const route = useRoute()
const detailRef = ref<InstanceType<typeof OrderDetailDrawer>>()
const searchRef = ref<SearchExpose>()
const contractSignRef = ref<InstanceType<typeof OrderContractSignDialog>>()
const refundRef = ref<InstanceType<typeof RefundDialog>>()
const payDialogRef = ref<InstanceType<typeof OrderPayDialog>>()
const batchUpdateOwnerDialogRef = ref<InstanceType<typeof BatchUpdateOwnerDialog>>()
const exportDialogRef = ref<InstanceType<typeof ExportTaskDialog>>()
const userSelectFormRef = ref<InstanceType<typeof UserSelectForm>>()
const aftersalesFormRef = ref<InstanceType<typeof AftersalesForm>>()
const currentSearchParams = ref<Recordable>({})
const canCreateAftersales = hasPermission(['crm:aftersales:create'])
const defaultSearchForm = {
    mobile: '',
    customer: '',
    orderNo: '',
    orderStatus: undefined,
    enrollTimeRange: [],
    contractStatus: undefined,
    productCategory: '',
    productKeyword: '',
    paidAmountRange: [],
    ownerUserName: '',
    cardOwnerUserName: '',
    creator: '',
    createTimeRange: []
}
const searchForm = reactive<Recordable>({ ...defaultSearchForm })
const creatorDisplayName = ref('')
const activeUserField = ref<'owner' | 'cardOwner' | 'creator'>('owner')

const searchSchema = computed<FormSchema[]>(() => [
    {
        field: 'mobile',
        label: '联系电话',
        component: 'Input',
        componentProps: { placeholder: '请输入手机号', clearable: true, style: { width: '220px' } }
    },
    {
        field: 'customer',
        label: '客户',
        component: 'Input',
        componentProps: {
            placeholder: '请输入客户编号',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'orderNo',
        label: '订单编号',
        component: 'Input',
        componentProps: {
            placeholder: '请输入订单编号',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'orderStatus',
        label: '订单状态',
        component: 'Select',
        componentProps: {
            options: ORDER_STATUS_OPTIONS,
            placeholder: '请选择',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'enrollTimeRange',
        label: '报名时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            style: { width: '220px' }
        }
    },
    {
        field: 'contractStatus',
        label: '合同签署',
        component: 'Select',
        componentProps: {
            options: CONTRACT_STATUS_OPTIONS,
            placeholder: '请选择',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'productCategory',
        label: '商品分类',
        component: 'Input',
        componentProps: {
            placeholder: '请输入商品分类',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'productKeyword',
        label: '商品',
        component: 'Input',
        componentProps: { placeholder: '请输入商品', clearable: true, style: { width: '220px' } }
    },
    {
        field: 'paidAmountRange',
        label: '已付金额',
        component: 'AmountRangeInput',
        componentProps: {
            style: { width: '220px' },
            startPlaceholder: '最小金额',
            endPlaceholder: '最大金额'
        }
    },
    {
        field: 'ownerUserName',
        label: '订单归属人',
        component: 'Input'
    },
    {
        field: 'cardOwnerUserName',
        label: '名片归属',
        component: 'Input'
    },
    {
        field: 'creator',
        label: '创建人',
        component: 'Input'
    },
    {
        field: 'createTimeRange',
        label: '创建时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            style: { width: '220px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<OrderApi.OrderPageRespVO>({
    getListApi: async (params) => await OrderApi.getOrderPage(params)
})

const orderStatusLabel = (value?: number) => getOptionLabel(ORDER_STATUS_OPTIONS, value)

const syncSearchField = async (
    field: 'ownerUserName' | 'cardOwnerUserName' | 'creator',
    value: string
) => {
    searchForm[field] = value
    await searchRef.value?.setValues({ [field]: value })
}

const openUserSelect = (field: 'owner' | 'cardOwner' | 'creator') => {
    activeUserField.value = field
    const fieldMap = {
        owner: { title: '选择订单归属人' },
        cardOwner: { title: '选择名片归属人' },
        creator: { title: '选择创建人' }
    }
    const current = fieldMap[field]
    userSelectFormRef.value?.open(0, [], { title: current.title, multiple: false })
}

const handleUserSelectConfirm = (_id: any, userList: UserVO[]) => {
    const user = userList?.[0]
    const userName = user?.nickname || user?.username || ''
    if (activeUserField.value === 'owner') {
        syncSearchField('ownerUserName', userName)
        return
    }
    if (activeUserField.value === 'cardOwner') {
        syncSearchField('cardOwnerUserName', userName)
        return
    }
    creatorDisplayName.value = userName
    syncSearchField('creator', user?.id ? String(user.id) : '')
}

const clearSelectedUser = (field: 'owner' | 'cardOwner' | 'creator') => {
    if (field === 'owner') {
        syncSearchField('ownerUserName', '')
        return
    }
    if (field === 'cardOwner') {
        syncSearchField('cardOwnerUserName', '')
        return
    }
    creatorDisplayName.value = ''
    syncSearchField('creator', '')
}

const handleReset = async (params: Recordable) => {
    Object.assign(searchForm, defaultSearchForm)
    creatorDisplayName.value = ''
    await searchRef.value?.setValues({ ...defaultSearchForm })
    setSearchParams(params)
}

const setSearchParams = (params: Recordable) => {
    currentSearchParams.value = { ...params }
    const {
        enrollTimeRange = [],
        expireTimeRange = [],
        createTimeRange = [],
        paidAmountRange = [],
        ...rest
    } = params
    tableMethods.setSearchParams({
        ...rest,
        minPaidAmount: paidAmountRange[0] ? Number(paidAmountRange[0]) : undefined,
        maxPaidAmount: paidAmountRange[1] ? Number(paidAmountRange[1]) : undefined,
        beginEnrollTime: enrollTimeRange[0],
        endEnrollTime: enrollTimeRange[1],
        beginExpireTime: expireTimeRange[0],
        endExpireTime: expireTimeRange[1],
        beginCreateTime: createTimeRange[0],
        endCreateTime: createTimeRange[1]
    })
}

const getQueryString = (value: unknown) => {
    if (Array.isArray(value)) {
        return value[0]
    }
    return typeof value === 'string' ? value : undefined
}

const initSearchFormFromRoute = () => {
    const beginCreateTime = getQueryString(route.query.beginCreateTime)
    const endCreateTime = getQueryString(route.query.endCreateTime)
    if (!beginCreateTime || !endCreateTime) {
        return
    }
    searchForm.createTimeRange = [beginCreateTime, endCreateTime]
    searchForm.enrollTimeRange = [beginCreateTime, endCreateTime]
}

const openDetail = (id: number, tab?: string) => {
    detailRef.value?.open(id, tab)
}

const handlePay = async (row: OrderApi.OrderPageRespVO) => {
    const remain = getRemainingAmount(row.payableAmount, row.paidAmount)
    if (!remain) {
        message.warning('当前订单没有可支付金额')
        return
    }
    payDialogRef.value?.open(row.id, formatAmount(remain))
}

const handleRefund = async (row: OrderApi.OrderPageRespVO) => {
    const refundable = getRefundableAmount(row.paidAmount, row.refundAmount)
    if (!refundable) {
        message.warning('当前订单没有可退款金额')
        return
    }
    refundRef.value?.open(row)
}

const handleCreateAftersales = async (row: OrderApi.OrderPageRespVO) => {
    const detail = await OrderApi.getOrder(row.id)
    if (!detail?.clueId) {
        message.warning('该订单未关联客户，无法用于售后工单')
        return
    }
    aftersalesFormRef.value?.open({
        clueId: Number(detail.clueId),
        orderId: detail.id,
        orderNo: detail.orderNo,
        customerId: detail.customerId,
        customerName: detail.customerName,
        orderFilterClueId: Number(detail.clueId)
    })
}

const handleVoid = async (row: OrderApi.OrderPageRespVO) => {
    await ElMessageBox.confirm(`确认作废订单“${row.orderNo}”吗？`, '提示', { type: 'warning' })
    await OrderApi.voidOrder(row.id)
    message.success('作废成功')
    await tableMethods.getList()
}

const handleBatchRepurchase = async () => {
    const selections = await tableMethods.getSelections()
    if (!selections.length) {
        message.warning('请先选择订单')
        return
    }
    for (const row of selections) {
        await OrderApi.repurchaseOrder(row.id)
    }
    message.success('复购订单已生成')
    await tableMethods.getList()
}

const openBatchUpdateOwnerDialog = async () => {
    const selections = await tableMethods.getSelections()
    if (!selections.length) {
        message.warning('请先选择订单')
        return
    }
    batchUpdateOwnerDialogRef.value?.open()
}

const submitBatchUpdateOwner = async (ownerUserId: number) => {
    const selections = await tableMethods.getSelections()
    if (!selections.length) {
        message.warning('请先选择订单')
        return
    }
    await OrderApi.batchUpdateOwner({
        orderIds: selections.map((item) => item.id),
        ownerUserId
    })
    message.success('订单归属人修改成功')
    await tableMethods.getList()
}

const openExportDialog = () => {
    exportDialogRef.value?.open({
        title: '导出订单管理',
        bizType: 'crm_order_management_page_export',
        submit: async (payload) => {
            const {
                enrollTimeRange = [],
                expireTimeRange = [],
                createTimeRange = [],
                paidAmountRange = [],
                ...rest
            } = currentSearchParams.value || {}
            await OrderApi.createOrderExportTask({
                ...rest,
                minPaidAmount: paidAmountRange[0] ? Number(paidAmountRange[0]) : undefined,
                maxPaidAmount: paidAmountRange[1] ? Number(paidAmountRange[1]) : undefined,
                beginEnrollTime: enrollTimeRange[0],
                endEnrollTime: enrollTimeRange[1],
                beginExpireTime: expireTimeRange[0],
                endExpireTime: expireTimeRange[1],
                beginCreateTime: createTimeRange[0],
                endCreateTime: createTimeRange[1],
                ...payload
            })
        }
    })
}

const handleExportSuccess = async () => {
    message.success('导出任务已创建，请到下载中心查看')
}

const handleContractSign = (row: OrderApi.OrderPageRespVO) => {
    if (!canSignOrderContract(row)) {
        message.warning('订单支付后才可以签署合同')
        return
    }
    contractSignRef.value?.open(row)
}

const isPendingPayOrder = (row: OrderApi.OrderPageRespVO) => [0, 10].includes(row.orderStatus)
const isClosedOrder = (row: OrderApi.OrderPageRespVO) => row.orderStatus === 30
const isRefundedOrder = (row: OrderApi.OrderPageRespVO) => row.orderStatus === 40
const canSignContract = (row: OrderApi.OrderPageRespVO) => canSignOrderContract(row)
const canPayOrder = (row: OrderApi.OrderPageRespVO) =>
    !isClosedOrder(row) &&
    !isRefundedOrder(row) &&
    getRemainingAmount(row.payableAmount, row.paidAmount) > 0

const getMoreActions = (row: OrderApi.OrderPageRespVO) =>
    [
        {
            command: 'aftersales',
            label: '新增工单',
            show: canCreateAftersales
        },
        {
            command: 'contractSign',
            label: '签署合同',
            show: canSignContract(row)
        },
        {
            command: 'pay',
            label: '支付',
            show: canPayOrder(row)
        },
        {
            command: 'refund',
            label: '退款',
            show: getRefundableAmount(row.paidAmount, row.refundAmount) > 0,
            type: 'danger' as const
        },
        {
            command: 'void',
            label: '作废',
            show: row.orderStatus !== 30,
            type: 'danger' as const
        }
    ].filter((item) => item.show)

const handleMoreCommand = async (command: string, row: OrderApi.OrderPageRespVO) => {
    switch (command) {
        case 'contractSign':
            handleContractSign(row)
            break
        case 'pay':
            await handlePay(row)
            break
        case 'aftersales':
            await handleCreateAftersales(row)
            break
        case 'refund':
            await handleRefund(row)
            break
        case 'void':
            await handleVoid(row)
            break
        default:
            break
    }
}

const getOrderClueDetail = async (id: number) => {
    const detail = await OrderApi.getOrder(id)
    return { clueId: detail.clueId }
}

const tableColumns = computed<TableColumn[]>(() => [
    {
        field: 'orderNo',
        label: '订单编号',
        minWidth: '170px',
        fixed: 'left',
        slots: {
            default: (data) => (
                <ElLink type="primary" underline={false} onClick={() => openDetail(data.row.id)}>
                    {data.row.orderNo}
                </ElLink>
            )
        }
    },
    { field: 'enrollTime', label: '报名时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'customerName', label: '姓名', minWidth: '100px' },
    { field: 'customerId', label: '客户编号', minWidth: '110px' },
    {
        field: 'customerMobile',
        label: '手机号',
        minWidth: '170px',
        slots: {
            default: (data) =>
                renderCopyMobileCell({
                    row: data.row,
                    mobile: data.row.customerMobile,
                    getDetail: getOrderClueDetail,
                    success: message.success,
                    warning: message.warning
                })
        }
    },
    {
        field: 'orderStatus',
        label: '订单状态',
        minWidth: '100px',
        formatter: (_r, _c, v) => orderStatusLabel(v)
    },
    {
        field: 'mainProductCode',
        label: '商品编号',
        minWidth: '140px',
        showOverflowTooltip: true,
        formatter: (_row, _column, value) => value || '-'
    },
    {
        field: 'mainProductName',
        label: '商品名称',
        minWidth: '180px',
        showOverflowTooltip: true,
        formatter: (_row, _column, value) => value || '-'
    },
    {
        field: 'mainProductCategoryPath',
        label: '商品分类',
        minWidth: '180px',
        showOverflowTooltip: true,
        formatter: (_row, _column, value) => value || '-'
    },
    {
        field: 'payableAmount',
        label: '应付金额',
        minWidth: '100px',
        formatter: (_r, _c, v) => formatAmount(v)
    },
    {
        field: 'paidAmount',
        label: '已付金额',
        minWidth: '100px',
        formatter: (_r, _c, v) => formatAmount(v)
    },
    {
        field: 'refundAmount',
        label: '已退费金额',
        minWidth: '110px',
        formatter: (_r, _c, v) => formatAmount(v)
    },
    { field: 'campusName', label: '报名分校', minWidth: '120px' },
    { field: 'ownerUserName', label: '订单归属人', minWidth: '110px' },
    { field: 'cardOwnerUserName', label: '名片归属', minWidth: '110px' },
    { field: 'remark', label: '备注', minWidth: '140px', showOverflowTooltip: true },
    {
        field: 'creatorName',
        label: '订单创建人',
        minWidth: '110px'
    },
    { field: 'createTime', label: '订单创建时间', minWidth: '170px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '140px',
        fixed: 'right',
        slots: {
            default: (data) => {
                const row = data.row as OrderApi.OrderPageRespVO
                const moreActions = getMoreActions(row)
                return (
                    <div class="flex items-center justify-center">
                        <BaseButton link type="primary" onClick={() => openDetail(row.id)}>
                            详情
                        </BaseButton>
                        {moreActions.length ? (
                            <ElDropdown
                                trigger="click"
                                onCommand={(command: string) => handleMoreCommand(command, row)}
                            >
                                {{
                                    default: () => (
                                        <BaseButton link type="primary" class="order-more-btn">
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

onMounted(() => {
    initSearchFormFromRoute()
    if (Object.keys(searchForm).length) {
        setSearchParams(searchForm)
        return
    }
    tableMethods.getList()
})
</script>

<style lang="scss" scoped>
.order-more-btn:focus,
.order-more-btn:focus-visible {
    outline: none;
    box-shadow: none;
}
</style>
