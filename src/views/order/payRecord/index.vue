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
    <PayProofDialog ref="payProofDialogRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, onMounted } from 'vue'
import { ElImage } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { dateFormatter } from '@/utils/formatTime'
import * as OrderApi from '@/api/crm/order'
import { PAY_METHOD_OPTIONS, PAY_STATUS_OPTIONS, formatAmount, getOptionLabel } from '../utils'
import { renderCopyMobileCell } from '@/views/crm/clue/mobileCopy'
import { BaseButton } from '@/components/Button'
import PayProofDialog from './PayProofDialog.vue'

defineOptions({ name: 'OrderPayRecord' })

const message = useMessage()
const payProofDialogRef = ref<InstanceType<typeof PayProofDialog>>()

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
        field: 'payStatus',
        label: '支付状态',
        component: 'Select',
        componentProps: { options: PAY_STATUS_OPTIONS, clearable: true, style: { width: '220px' } }
    },
    {
        field: 'payNo',
        label: '支付流水号',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    },
    {
        field: 'payMethod',
        label: '支付方式',
        component: 'Select',
        componentProps: { options: PAY_METHOD_OPTIONS, clearable: true, style: { width: '220px' } }
    },
    {
        field: 'payTimeRange',
        label: '支付时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            style: { width: '220px' }
        }
    },
    {
        field: 'payAmountRange',
        label: '支付金额',
        component: 'AmountRangeInput',
        componentProps: {
            style: { width: '220px' },
            startPlaceholder: '最小金额',
            endPlaceholder: '最大金额'
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<OrderApi.OrderPayRecordRespVO>({
    getListApi: async (params) => {
        const { payTimeRange = [], payAmountRange = [], ...rest } = params
        return await OrderApi.getPayRecordPage({
            ...rest,
            beginPayTime: payTimeRange[0],
            endPayTime: payTimeRange[1],
            minPayAmount: payAmountRange[0] ? Number(payAmountRange[0]) : undefined,
            maxPayAmount: payAmountRange[1] ? Number(payAmountRange[1]) : undefined
        })
    }
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(params)
}

const getOrderClueDetail = async (id: number) => {
    const detail = await OrderApi.getOrder(id)
    return { clueId: detail.clueId }
}

const renderPayProofCell = (url?: string) => {
    if (!url) return <span>-</span>
    return (
        <ElImage
            src={url}
            previewSrcList={[url]}
            previewTeleported
            fit="cover"
            style={{ width: '48px', height: '48px', borderRadius: '6px' }}
        />
    )
}

const tableColumns = computed<TableColumn[]>(() => [
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
        field: 'payAmount',
        label: '支付金额',
        minWidth: '100px',
        formatter: (_r, _c, v) => formatAmount(v)
    },
    { field: 'payMethod', label: '支付方式', minWidth: '100px' },
    {
        field: 'payProofUrl',
        label: '支付凭证',
        minWidth: '100px',
        slots: {
            default: (data) => renderPayProofCell(data.row.payProofUrl)
        }
    },
    {
        field: 'payStatus',
        label: '支付状态',
        minWidth: '100px',
        formatter: (_r, _c, v) => getOptionLabel(PAY_STATUS_OPTIONS, v)
    },
    { field: 'payNo', label: '支付流水号', minWidth: '220px' },
    { field: 'payTime', label: '支付时间', minWidth: '180px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '120px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <BaseButton
                    link
                    type="primary"
                    onClick={() =>
                        payProofDialogRef.value?.open(data.row as OrderApi.OrderPayRecordRespVO)
                    }
                >
                    支付凭证
                </BaseButton>
            )
        }
    }
])

onMounted(() => {
    tableMethods.getList()
})
</script>
