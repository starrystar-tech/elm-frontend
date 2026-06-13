<template>
    <ContentWrap>
        <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
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
    <BatchUpdateOwnerDialog ref="batchUpdateOwnerDialogRef" @confirm="submitBatchUpdateOwner" />
    <ExportTaskDialog ref="exportDialogRef" @success="handleExportSuccess" />
</template>

<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue'
import { ElLink, ElMessageBox } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { dateFormatter } from '@/utils/formatTime'
import * as OrderApi from '@/api/crm/order'
import {
    CONTRACT_STATUS_OPTIONS,
    ORDER_STATUS_OPTIONS,
    formatAmount,
    getOptionLabel,
    getRefundableAmount,
    getRemainingAmount
} from '../utils'
import OrderDetailDrawer from '../detail/OrderDetailDrawer.vue'
import OrderContractSignDialog from '../detail/OrderContractSignDialog.vue'
import RefundDialog from '../refund/RefundDialog.vue'
import { renderCopyMobileCell } from '@/views/crm/clue/mobileCopy'
import BatchUpdateOwnerDialog from './BatchUpdateOwnerDialog.vue'
import ExportTaskDialog from '@/views/crm/clue/components/ExportTaskDialog.vue'

defineOptions({ name: 'OrderManagement' })

const message = useMessage()
const detailRef = ref<InstanceType<typeof OrderDetailDrawer>>()
const contractSignRef = ref<InstanceType<typeof OrderContractSignDialog>>()
const refundRef = ref<InstanceType<typeof RefundDialog>>()
const batchUpdateOwnerDialogRef = ref<InstanceType<typeof BatchUpdateOwnerDialog>>()
const exportDialogRef = ref<InstanceType<typeof ExportTaskDialog>>()
const currentSearchParams = ref<Recordable>({})

const searchSchema = computed<FormSchema[]>(() => [
    {
        field: 'mobile',
        label: '联系电话',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    },
    {
        field: 'customer',
        label: '客户',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    },
    {
        field: 'orderNo',
        label: '订单编号',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    },
    {
        field: 'orderStatus',
        label: '订单状态',
        component: 'Select',
        componentProps: {
            options: ORDER_STATUS_OPTIONS,
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
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'productCategory',
        label: '商品分类',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    },
    {
        field: 'productKeyword',
        label: '商品',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
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
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    },
    {
        field: 'cardOwnerUserName',
        label: '名片归属',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    },
    // {
    //     field: 'expireTimeRange',
    //     label: '到期时间',
    //     component: 'DatePicker',
    //     componentProps: { type: 'daterange', valueFormat: 'YYYY-MM-DD', style: { width: '220px' } }
    // },
    {
        field: 'creator',
        label: '创建人',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
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

const openDetail = (id: number, tab?: string) => {
    detailRef.value?.open(id, tab)
}

const handlePay = async (row: OrderApi.OrderPageRespVO) => {
    const remain = getRemainingAmount(row.payableAmount, row.paidAmount)
    if (!remain) {
        message.warning('当前订单没有可支付金额')
        return
    }
    const result = await ElMessageBox.prompt('请输入支付金额（元）', '订单支付', {
        inputValue: String(remain),
        inputPattern: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
        inputErrorMessage: '请输入正确金额'
    })
    await OrderApi.payOrder({
        orderId: row.id,
        payAmount: Number(result.value),
        payMethod: '微信支付'
    })
    message.success('支付记录已生成，待财务确认')
    await tableMethods.getList()
}

const handleRefund = async (row: OrderApi.OrderPageRespVO) => {
    const refundable = getRefundableAmount(row.paidAmount, row.refundAmount)
    if (!refundable) {
        message.warning('当前订单没有可退款金额')
        return
    }
    refundRef.value?.open(row)
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
    contractSignRef.value?.open(row)
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
    { field: 'customerId', label: '客户ID', minWidth: '110px' },
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
        width: '250px',
        fixed: 'right',
        slots: {
            default: (data) => {
                const row = data.row as OrderApi.OrderPageRespVO
                return (
                    <>
                        <BaseButton link type="primary" onClick={() => openDetail(row.id)}>
                            详情
                        </BaseButton>
                        <BaseButton link type="primary" onClick={() => handleContractSign(row)}>
                            签署合同
                        </BaseButton>
                        {getRemainingAmount(row.payableAmount, row.paidAmount) > 0 ? (
                            <BaseButton link type="primary" onClick={() => handlePay(row)}>
                                支付
                            </BaseButton>
                        ) : null}
                        {getRefundableAmount(row.paidAmount, row.refundAmount) > 0 ? (
                            <BaseButton link type="danger" onClick={() => handleRefund(row)}>
                                退款
                            </BaseButton>
                        ) : null}
                        {row.orderStatus !== 30 ? (
                            <BaseButton link type="danger" onClick={() => handleVoid(row)}>
                                作废
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
