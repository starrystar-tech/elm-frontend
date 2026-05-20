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
</template>

<script setup lang="tsx">
import { computed, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { dateFormatter } from '@/utils/formatTime'
import * as OrderApi from '@/api/crm/order'
import { REFUND_STATUS_OPTIONS, REFUND_TYPE_OPTIONS, formatAmount, getOptionLabel } from '../utils'

defineOptions({ name: 'OrderRefund' })

const message = useMessage()

const searchSchema = computed<FormSchema[]>(() => [
    { field: 'mobile', label: '联系电话', component: 'Input', componentProps: { clearable: true, style: { width: '220px' } } },
    { field: 'customer', label: '客户', component: 'Input', componentProps: { clearable: true, style: { width: '220px' } } },
    { field: 'orderNo', label: '订单编号', component: 'Input', componentProps: { clearable: true, style: { width: '220px' } } },
    { field: 'refundStatus', label: '退款状态', component: 'Select', componentProps: { options: REFUND_STATUS_OPTIONS, clearable: true, style: { width: '220px' } } },
    { field: 'refundNo', label: '退款单号', component: 'Input', componentProps: { clearable: true, style: { width: '220px' } } },
    { field: 'refundType', label: '退款类型', component: 'Select', componentProps: { options: REFUND_TYPE_OPTIONS, clearable: true, style: { width: '220px' } } },
    { field: 'refundTimeRange', label: '退款时间', component: 'DatePicker', componentProps: { type: 'daterange', valueFormat: 'YYYY-MM-DD HH:mm:ss', style: { width: '260px' } } },
    { field: 'refundAmountRange', label: '退款金额', component: 'Input', componentProps: { clearable: true, style: { width: '220px' } } },
    { field: 'creator', label: '创建人', component: 'Input', componentProps: { clearable: true, style: { width: '220px' } } },
    { field: 'createTimeRange', label: '创建时间', component: 'DatePicker', componentProps: { type: 'daterange', valueFormat: 'YYYY-MM-DD HH:mm:ss', style: { width: '260px' } } }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<OrderApi.OrderRefundRespVO>({
    getListApi: async (params) => {
        const { refundTimeRange = [], refundAmountRange, createTimeRange = [], ...rest } = params
        const [minRefundAmount, maxRefundAmount] = String(refundAmountRange || '')
            .split('-')
            .map((item: string) => item.trim())
        return await OrderApi.getRefundPage({
            ...rest,
            beginRefundTime: refundTimeRange[0],
            endRefundTime: refundTimeRange[1],
            beginCreateTime: createTimeRange[0],
            endCreateTime: createTimeRange[1],
            minRefundAmount: minRefundAmount ? Number(minRefundAmount) : undefined,
            maxRefundAmount: maxRefundAmount ? Number(maxRefundAmount) : undefined
        })
    }
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(params)
}

const audit = async (row: OrderApi.OrderRefundRespVO, refundStatus: number) => {
    const result = await ElMessageBox.prompt(refundStatus === 20 ? '请输入通过备注' : '请输入拒绝原因', '退款审核', {
        inputValue: refundStatus === 20 ? '同意退款' : '信息不全'
    })
    await OrderApi.auditRefund({
        id: row.id,
        refundStatus,
        auditRemark: result.value
    })
    message.success(refundStatus === 20 ? '审核通过' : '已拒绝')
    await tableMethods.getList()
}

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'refundNo', label: '退款单号', minWidth: '160px' },
    { field: 'refundMethod', label: '退款方式', minWidth: '110px' },
    { field: 'refundType', label: '退款类型', minWidth: '100px', formatter: (_r, _c, v) => getOptionLabel(REFUND_TYPE_OPTIONS, v) },
    { field: 'refundAmount', label: '退款金额', minWidth: '100px', formatter: (_r, _c, v) => formatAmount(v) },
    { field: 'refundStatus', label: '退款状态', minWidth: '100px', formatter: (_r, _c, v) => getOptionLabel(REFUND_STATUS_OPTIONS, v) },
    { field: 'refundReason', label: '退款原因', minWidth: '160px' },
    { field: 'refundRemark', label: '退款备注', minWidth: '160px' },
    { field: 'orderNo', label: '订单编号', minWidth: '160px' },
    { field: 'customerName', label: '姓名', minWidth: '100px' },
    { field: 'customerId', label: '客户ID', minWidth: '100px' },
    { field: 'customerMobile', label: '手机号', minWidth: '130px' },
    { field: 'creator', label: '创建人', minWidth: '110px' },
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
                    <>
                        <BaseButton link type="primary" onClick={() => audit(row, 20)}>
                            通过
                        </BaseButton>
                        <BaseButton link type="warning" onClick={() => audit(row, 30)}>
                            驳回
                        </BaseButton>
                    </>
                ) : (
                    <BaseButton link type="primary" onClick={() => message.info(JSON.stringify(row, null, 2))}>
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
