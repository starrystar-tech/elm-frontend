<template>
    <ContentWrap>
        <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
        <div class="action-btn-wrap flex items-center gap-2">
            <BaseButton
                v-hasPermi="['crm:order:payment-confirm-export']"
                plain
                @click="openExportDialog"
            >
                导出
            </BaseButton>
        </div>
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
    <PaymentRecordDetailDialog ref="detailDialogRef" />
    <PaymentContractInfoDialog ref="contractDialogRef" />
    <ExportTaskDialog ref="exportDialogRef" @success="handleExportSuccess" />
</template>

<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue'
import { ElImage, ElMessageBox } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import * as OrderApi from '@/api/crm/order'
import {
    ORDER_STATUS_OPTIONS,
    PAY_CONFIRM_STATUS_OPTIONS,
    formatAmount,
    getOptionLabel
} from '../utils'
import { renderCopyMobileCell } from '@/views/crm/clue/mobileCopy'
import { buildDeptOwnerDisplayName } from '@/views/crm/clue/listShared'
import {
    getAftersalesResultLabel,
    getAftersalesStatusLabel
} from '@/views/aftersales/config'
import * as StudentCenterApi from '@/api/crm/studentCenter'
import ExportTaskDialog from '@/views/crm/clue/components/ExportTaskDialog.vue'
import PaymentRecordDetailDialog from './PaymentRecordDetailDialog.vue'
import PaymentContractInfoDialog from './PaymentContractInfoDialog.vue'

defineOptions({ name: 'OrderPaymentConfirm' })

const message = useMessage()
const detailDialogRef = ref<InstanceType<typeof PaymentRecordDetailDialog>>()
const contractDialogRef = ref<InstanceType<typeof PaymentContractInfoDialog>>()
const exportDialogRef = ref<InstanceType<typeof ExportTaskDialog>>()
const currentSearchParams = ref<Recordable>({})
const payConfirmSearchOptions = PAY_CONFIRM_STATUS_OPTIONS.filter((item) => item.value !== 0)
const ownerDeptLabel = (row: OrderApi.OrderPayRecordRespVO) =>
    buildDeptOwnerDisplayName(row.ownerDeptName, row.ownerUserName)

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
        field: 'confirmStatus',
        label: '确认状态',
        component: 'Select',
        componentProps: {
            options: payConfirmSearchOptions,
            clearable: true,
            style: { width: '220px' }
        }
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
        componentProps: {
            options: getStrDictOptions(DICT_TYPE.PAY_CHANNEL_CODE),
            clearable: true,
            style: { width: '220px' }
        }
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
            style: { width: '260px' },
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
        const { payTimeRange = [], payAmountRange = [], confirmStatus, ...rest } = params
        const pageResult = await OrderApi.getPayConfirmPage({
            ...rest,
            confirmStatus:
                confirmStatus === '' || confirmStatus === null || confirmStatus === undefined
                    ? undefined
                    : Number(confirmStatus),
            beginPayTime: payTimeRange[0],
            endPayTime: payTimeRange[1],
            minPayAmount: payAmountRange[0] ? Math.round(Number(payAmountRange[0]) * 100) : undefined,
            maxPayAmount: payAmountRange[1] ? Math.round(Number(payAmountRange[1]) * 100) : undefined
        })
        return pageResult
    }
})

const setSearchParams = (params: Recordable) => {
    currentSearchParams.value = params || {}
    tableMethods.setSearchParams(params)
}

const buildExportParams = (params: Recordable = {}) => {
    const { payTimeRange = [], payAmountRange = [], confirmStatus, ...rest } = params
    return {
        ...rest,
        confirmStatus:
            confirmStatus === '' || confirmStatus === null || confirmStatus === undefined
                ? undefined
                : Number(confirmStatus),
        beginPayTime: payTimeRange[0],
        endPayTime: payTimeRange[1],
        minPayAmount: payAmountRange[0] ? Math.round(Number(payAmountRange[0]) * 100) : undefined,
        maxPayAmount: payAmountRange[1] ? Math.round(Number(payAmountRange[1]) * 100) : undefined
    }
}

const openExportDialog = () => {
    exportDialogRef.value?.open({
        title: '导出支付确认',
        bizType: 'crm_order_payment_confirm_export',
        submit: async (payload) => {
            await OrderApi.createPayConfirmExportTask({
                ...buildExportParams(currentSearchParams.value),
                ...payload
            })
        }
    })
}

const handleExportSuccess = async () => {
    message.success('导出任务已创建，请到下载中心查看')
}

const getOrderClueDetail = async (id: number) => {
    const detail = await OrderApi.getOrder(id)
    return { clueId: detail.clueId }
}

const audit = async (row: OrderApi.OrderPayRecordRespVO, confirmStatus: number) => {
    const result = await ElMessageBox.prompt(
        confirmStatus === 20 ? '请输入通过结果' : '请输入驳回原因',
        '支付确认',
        {
            inputValue: confirmStatus === 20 ? '支付记录无误' : '支付凭证有误'
        }
    )
    await OrderApi.confirmPayRecord({
        id: row.id,
        confirmStatus,
        confirmResult: result.value,
        confirmRemark: result.value
    })
    message.success(confirmStatus === 20 ? '审核通过' : '已驳回')
    await tableMethods.getList()
}

const openPayRecordDetail = (row: OrderApi.OrderPayRecordRespVO) => {
    if (!row?.orderId) return
    detailDialogRef.value?.open(Number(row.orderId))
}

const canShowContractInfo = (row: OrderApi.OrderPayRecordRespVO) =>
    Boolean(row?.orderId && row.hasContractInfo)

const openContractInfo = (row: OrderApi.OrderPayRecordRespVO) => {
    if (!row?.orderId) return
    contractDialogRef.value?.open(Number(row.orderId))
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
    // { field: 'confirmResult', label: '确认结果', minWidth: '160px' },
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
        field: 'confirmStatus',
        label: '确认状态',
        minWidth: '100px',
        formatter: (_r, _c, v) => getOptionLabel(PAY_CONFIRM_STATUS_OPTIONS, v)
    },
    {
        field: 'confirmResult',
        label: '确认结果',
        minWidth: '180px',
        showOverflowTooltip: true,
        slots: {
            default: (data) => <span>{data.row.confirmResult || '-'}</span>
        }
    },
    {
        field: 'payAmount',
        label: '支付金额',
        minWidth: '100px',
        formatter: (_r, _c, v) => formatAmount(v)
    },
    {
        field: 'orderStatus',
        label: '订单状态',
        minWidth: '100px',
        formatter: (_r, _c, v) => getOptionLabel(ORDER_STATUS_OPTIONS, v)
    },
    {
        field: 'ownerUserName',
        label: '订单归属人(组别)',
        minWidth: '160px',
        showOverflowTooltip: true,
        slots: {
            default: (data) => <span>{ownerDeptLabel(data.row)}</span>
        }
    },
    {
        field: 'aftersalesStatus',
        label: '售后状态',
        minWidth: '100px',
        formatter: (_r, _c, v) => getAftersalesStatusLabel(v)
    },
    {
        field: 'aftersalesResult',
        label: '售后结果',
        minWidth: '120px',
        formatter: (_r, _c, v) => getAftersalesResultLabel(v)
    },
    {
        field: 'courseStatus',
        label: '开课状态',
        minWidth: '100px',
        formatter: (_r, _c, v) => StudentCenterApi.getStudentCourseStatusLabel(v)
    },
    {
        field: 'payMethod',
        label: '支付方式',
        minWidth: '100px',
        slots: {
            default: (data) => (
                <DictTag type={DICT_TYPE.PAY_CHANNEL_CODE} value={data.row.payMethod} />
            )
        }
    },
    {
        field: 'payProofUrl',
        label: '支付凭证',
        minWidth: '100px',
        slots: {
            default: (data) => renderPayProofCell(data.row.payProofUrl)
        }
    },
    { field: 'remark', label: '支付备注', minWidth: '180px', showOverflowTooltip: true },
    { field: 'payNo', label: '支付流水号', minWidth: '220px' },
    { field: 'payTime', label: '支付时间', minWidth: '180px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '300px',
        fixed: 'right',
        slots: {
            default: (data) => {
                const row = data.row as OrderApi.OrderPayRecordRespVO
                return row.confirmStatus === 10 ? (
                    <>
                        <BaseButton link type="primary" onClick={() => openPayRecordDetail(row)}>
                            详情
                        </BaseButton>
                        {canShowContractInfo(row) ? (
                            <BaseButton link type="primary" onClick={() => openContractInfo(row)}>
                                合同信息
                            </BaseButton>
                        ) : null}
                        <BaseButton link type="primary" onClick={() => audit(row, 20)}>
                            通过
                        </BaseButton>
                        <BaseButton link type="danger" onClick={() => audit(row, 30)}>
                            驳回
                        </BaseButton>
                    </>
                ) : (
                    <>
                        <BaseButton link type="primary" onClick={() => openPayRecordDetail(row)}>
                            详情
                        </BaseButton>
                        {canShowContractInfo(row) ? (
                            <BaseButton link type="primary" onClick={() => openContractInfo(row)}>
                                合同信息
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
