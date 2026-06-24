<template>
    <ContentWrap>
        <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
        <Table
            v-model:currentPage="tableObject.currentPage"
            v-model:pageSize="tableObject.pageSize"
            :columns="tableColumns"
            :data="tableObject.tableList"
            :loading="tableObject.loading"
            :pagination="{ total: tableObject.total }"
            @register="tableRegister"
        />
    </ContentWrap>

    <RefundAuditDialog ref="auditRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { dateFormatter } from '@/utils/formatTime'
import * as OrderApi from '@/api/crm/order'
import { REFUND_STATUS_OPTIONS, REFUND_TYPE_OPTIONS, formatAmount, getOptionLabel } from '../utils'
import RefundAuditDialog from './RefundAuditDialog.vue'
import { renderCopyMobileCell } from '@/views/crm/clue/mobileCopy'

defineOptions({ name: 'OrderRefund' })

const message = useMessage()
const auditRef = ref<InstanceType<typeof RefundAuditDialog>>()

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
        field: 'refundStatus',
        label: '退款状态',
        component: 'Select',
        componentProps: {
            options: REFUND_STATUS_OPTIONS,
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'refundNo',
        label: '退款单号',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    },
    {
        field: 'refundType',
        label: '退款类型',
        component: 'Select',
        componentProps: { options: REFUND_TYPE_OPTIONS, clearable: true, style: { width: '220px' } }
    },
    {
        field: 'refundTimeRange',
        label: '退款时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            style: { width: '220px' }
        }
    },
    {
        field: 'refundAmountRange',
        label: '退款金额',
        component: 'AmountRangeInput',
        componentProps: {
            style: { width: '220px' },
            startPlaceholder: '最小金额',
            endPlaceholder: '最大金额'
        }
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
            style: { width: '220px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<OrderApi.OrderRefundRespVO>({
    getListApi: async (params) => {
        const {
            refundTimeRange = [],
            refundAmountRange = [],
            createTimeRange = [],
            ...rest
        } = params
        return await OrderApi.getRefundPage({
            ...rest,
            beginRefundTime: refundTimeRange[0],
            endRefundTime: refundTimeRange[1],
            beginCreateTime: createTimeRange[0],
            endCreateTime: createTimeRange[1],
            minRefundAmount: refundAmountRange[0] ? Number(refundAmountRange[0]) : undefined,
            maxRefundAmount: refundAmountRange[1] ? Number(refundAmountRange[1]) : undefined
        })
    }
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(params)
}

const openAudit = (row: OrderApi.OrderRefundRespVO, readonly = row.refundStatus !== 0) => {
    auditRef.value?.open(row, readonly)
}

const getOrderClueDetail = async (id: number) => {
    const detail = await OrderApi.getOrder(id)
    return { clueId: detail.clueId }
}

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'refundNo', label: '退款单号', minWidth: '160px' },
    { field: 'refundMethod', label: '退款方式', minWidth: '110px' },
    {
        field: 'refundType',
        label: '退款类型',
        minWidth: '100px',
        formatter: (_r, _c, v) => getOptionLabel(REFUND_TYPE_OPTIONS, v)
    },
    {
        field: 'refundAmount',
        label: '退款金额',
        minWidth: '100px',
        formatter: (_r, _c, v) => formatAmount(v)
    },
    {
        field: 'refundStatus',
        label: '退款状态',
        minWidth: '100px',
        formatter: (_r, _c, v) => getOptionLabel(REFUND_STATUS_OPTIONS, v)
    },
    { field: 'refundReason', label: '退款原因', minWidth: '160px' },
    { field: 'refundRemark', label: '退款备注', minWidth: '160px' },
    { field: 'orderNo', label: '订单编号', minWidth: '160px' },
    { field: 'customerName', label: '姓名', minWidth: '100px' },
    { field: 'customerId', label: '客户编号', minWidth: '100px' },
    {
        field: 'customerMobile',
        label: '手机号',
        minWidth: '170px',
        slots: {
            default: (data) =>
                renderCopyMobileCell({
                    row: { id: data.row.orderId },
                    mobile: data.row.customerMobile,
                    getDetail: getOrderClueDetail,
                    success: message.success,
                    warning: message.warning
                })
        }
    },
    {
        field: 'creatorName',
        label: '创建人',
        minWidth: '110px'
    },
    { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'auditUserName', label: '审批人', minWidth: '100px' },
    { field: 'refundTime', label: '退款时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'auditRemark', label: '审批备注', minWidth: '160px' },
    {
        field: 'action',
        label: '操作',
        width: '160px',
        fixed: 'right',
        slots: {
            default: (data) => {
                const row = data.row as OrderApi.OrderRefundRespVO
                return row.refundStatus === 0 ? (
                    <BaseButton link type="primary" onClick={() => openAudit(row, false)}>
                        审核
                    </BaseButton>
                ) : (
                    <BaseButton link type="primary" onClick={() => openAudit(row, true)}>
                        查看
                    </BaseButton>
                )
            }
        }
    }
])

onMounted(() => {
    tableMethods.getList()
})
</script>
