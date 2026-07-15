import { fenToYuan } from '@/utils'

export const ORDER_STATUS_OPTIONS = [
    { label: '待支付', value: 0 },
    { label: '部分支付', value: 10 },
    { label: '已支付', value: 20 },
    { label: '已关闭', value: 30 },
    { label: '已退款', value: 40 }
]

export const CONTRACT_STATUS_OPTIONS = [
    { label: '待签署', value: 0 },
    { label: '已归档', value: 10 },
    { label: '已解约', value: 20 }
]

export const INSTALLMENT_STATUS_OPTIONS = [
    { label: '分期', value: 1 },
    { label: '全款', value: 2 }
]

export const PAY_STATUS_OPTIONS = [
    { label: '待支付', value: 0 },
    { label: '已支付', value: 10 },
    { label: '超时未支付', value: 20 },
    { label: '取消支付', value: 30 }
]

export const PAY_CONFIRM_STATUS_OPTIONS = [
    { label: '未确认', value: 0 },
    { label: '待确认', value: 10 },
    { label: '已通过', value: 20 },
    { label: '已驳回', value: 30 }
]

export const REFUND_STATUS_OPTIONS = [
    { label: '审核中', value: 0 },
    { label: '待退款', value: 10 },
    { label: '已退款', value: 20 },
    { label: '已拒绝', value: 30 }
]

export const REFUND_TYPE_OPTIONS = [
    { label: '退学', value: 1 },
    { label: '退费', value: 2 }
]

export const getOptionLabel = (
    options: { label: string; value: string | number }[],
    value?: string | number
) => options.find((item) => item.value === value)?.label || '-'

export const formatAmount = (value?: number | null) => {
    if (value === undefined || value === null) {
        return '-'
    }
    return fenToYuan(value)
}

export const getRemainingAmount = (payableAmount?: number, paidAmount?: number) => {
    const result = Number(payableAmount || 0) - Number(paidAmount || 0)
    return Number(result > 0 ? result : 0)
}

export const getRefundableAmount = (paidAmount?: number, refundAmount?: number) => {
    const result = Number(paidAmount || 0) - Number(refundAmount || 0)
    return Number(result > 0 ? result : 0)
}

export const hasPaidAmount = (paidAmount?: number) => Number(paidAmount || 0) > 0

export const canSignOrderContract = (order?: { orderStatus?: number; paidAmount?: number }) => {
    if (!order) {
        return false
    }
    return ![30, 40].includes(Number(order.orderStatus))
}
