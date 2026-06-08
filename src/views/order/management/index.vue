<template>
    <ContentWrap>
        <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
        <div class="action-btn-wrap">
            <BaseButton type="primary" @click="handleBatchRepurchase">订单复购</BaseButton>
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

defineOptions({ name: 'OrderManagement' })

const message = useMessage()
const detailRef = ref<InstanceType<typeof OrderDetailDrawer>>()
const contractSignRef = ref<InstanceType<typeof OrderContractSignDialog>>()
const refundRef = ref<InstanceType<typeof RefundDialog>>()

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
            style: { width: '260px' }
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
        field: 'minPaidAmount',
        label: '已付金额起',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '160px' } }
    },
    {
        field: 'maxPaidAmount',
        label: '已付金额止',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '160px' } }
    },
    {
        field: 'ownerUserName',
        label: '订单归属',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    },
    {
        field: 'cardOwnerUserName',
        label: '名片归属',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    },
    {
        field: 'expireTimeRange',
        label: '到期时间',
        component: 'DatePicker',
        componentProps: { type: 'daterange', valueFormat: 'YYYY-MM-DD', style: { width: '240px' } }
    },
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
            style: { width: '260px' }
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
    const { enrollTimeRange = [], expireTimeRange = [], createTimeRange = [], ...rest } = params
    tableMethods.setSearchParams({
        ...rest,
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

const handleContractSign = (row: OrderApi.OrderPageRespVO) => {
    contractSignRef.value?.open(row)
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
    { field: 'customerId', label: '客户ID', minWidth: '100px' },
    { field: 'customerMobile', label: '手机号', minWidth: '130px' },
    {
        field: 'orderStatus',
        label: '订单状态',
        minWidth: '100px',
        formatter: (_r, _c, v) => orderStatusLabel(v)
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
        width: '320px',
        fixed: 'right',
        slots: {
            default: (data) => {
                const row = data.row as OrderApi.OrderPageRespVO
                return (
                    <>
                        <BaseButton link type="primary" onClick={() => openDetail(row.id)}>
                            详情
                        </BaseButton>
                        <BaseButton link type="success" onClick={() => handleContractSign(row)}>
                            签署合同
                        </BaseButton>
                        {getRemainingAmount(row.payableAmount, row.paidAmount) > 0 ? (
                            <BaseButton link type="primary" onClick={() => handlePay(row)}>
                                支付
                            </BaseButton>
                        ) : null}
                        {getRefundableAmount(row.paidAmount, row.refundAmount) > 0 ? (
                            <BaseButton link type="warning" onClick={() => handleRefund(row)}>
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
