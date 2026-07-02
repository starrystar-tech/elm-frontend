import type { FormSchema } from '@/types/form'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'

export const AFTERSALES_SOURCE = {
    MANUAL: 1,
    AI_ASSISTANT: 2,
    SALES_FEEDBACK: 3,
    HEADTEACHER_FEEDBACK: 4
} as const

export const AFTERSALES_SOURCE_OPTIONS = [
    { label: '手动新增', value: AFTERSALES_SOURCE.MANUAL },
    { label: 'AI助手', value: AFTERSALES_SOURCE.AI_ASSISTANT },
    { label: '销售反馈', value: AFTERSALES_SOURCE.SALES_FEEDBACK },
    { label: '班主任反馈', value: AFTERSALES_SOURCE.HEADTEACHER_FEEDBACK }
]

export const AFTERSALES_STATUS_OPTIONS = [
    { label: '待处理', value: 0 },
    { label: '处理中', value: 10 },
    { label: '已完结', value: 20 }
]

export const AFTERSALES_RESULT_OPTIONS = [
    { label: '未达成一致', value: 1 },
    { label: '挽单成功', value: 2 },
    { label: '已退费', value: 3 }
]

export const AFTERSALES_INSTALLMENT_STATUS_OPTIONS = [
    { label: '分期', value: 1 },
    { label: '全款', value: 2 }
]

export const NO_COMPLAINT_TAG_VALUE = 0

export const buildComplaintTagSearchOptions = (
    options: { label: string; value: number }[] = []
) => [{ label: '无', value: NO_COMPLAINT_TAG_VALUE }, ...options]

export const getAftersalesPriorityOptions = () =>
    getIntDictOptions(DICT_TYPE.CRM_AFTERSALES_PRIORITY)

export const getOptionLabel = (
    options: { label: string; value: string | number | boolean }[],
    value?: string | number | boolean
) => options.find((item) => item.value === value)?.label || '--'

export const dateRangeDefaultTime = [
    new Date(2000, 0, 1, 0, 0, 0),
    new Date(2000, 0, 1, 23, 59, 59)
]

export const getAftersalesPriorityLabel = (value?: number) =>
    value === undefined ? '--' : getDictLabel(DICT_TYPE.CRM_AFTERSALES_PRIORITY, value) || '--'

export const getAftersalesStatusLabel = (value?: number) =>
    value === undefined ? '--' : getOptionLabel(AFTERSALES_STATUS_OPTIONS, Number(value))

export const getAftersalesSourceLabel = (value?: number) =>
    value === undefined ? '--' : getOptionLabel(AFTERSALES_SOURCE_OPTIONS, Number(value))

export const getAftersalesResultLabel = (value?: number) =>
    value === undefined || Number(value) === 0
        ? '--'
        : getOptionLabel(AFTERSALES_RESULT_OPTIONS, Number(value))

export const getAftersalesInstallmentStatusLabel = (value?: number) =>
    value === undefined ? '--' : getOptionLabel(AFTERSALES_INSTALLMENT_STATUS_OPTIONS, Number(value))

export const formatAftersalesAmount = (value?: number | string | null) => {
    if (value === undefined || value === null || value === '') return '--'
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return String(value)
    return numericValue.toFixed(2)
}

export const formatAftersalesCentAmount = (value?: number | string | null) => {
    if (value === undefined || value === null || value === '') return '--'
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return String(value)
    return (numericValue / 100).toFixed(2)
}

export const formatComplaintTags = (tags?: string[]) => (tags?.length ? tags.join('、') : '--')

export const buildBaseSearchSchema = (
    handlerOptions: { label: string; value: number }[] = [],
    complaintTagOptions: { label: string; value: number }[] = [],
    campusOptions: { label: string; value: number }[] = []
): FormSchema[] => [
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
        field: 'ticketNo',
        label: '工单号',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    },
    {
        field: 'customerId',
        label: '客户编号',
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
        field: 'complaintTagIds',
        label: '投诉标签',
        component: 'Select',
        componentProps: {
            options: buildComplaintTagSearchOptions(complaintTagOptions),
            multiple: true,
            clearable: true,
            filterable: true,
            collapseTags: true,
            collapseTagsTooltip: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'createTimeRange',
        label: '创建时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            defaultTime: dateRangeDefaultTime,
            style: { width: '220px' }
        }
    },
    {
        field: 'priority',
        label: '优先级',
        component: 'Select',
        componentProps: {
            options: getAftersalesPriorityOptions(),
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'status',
        label: '状态',
        component: 'Select',
        componentProps: {
            options: AFTERSALES_STATUS_OPTIONS,
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'source',
        label: '工单来源',
        component: 'Select',
        componentProps: {
            options: AFTERSALES_SOURCE_OPTIONS,
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'campusId',
        label: '报名分校',
        component: 'Select',
        componentProps: {
            options: campusOptions,
            clearable: true,
            filterable: true,
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
            defaultTime: dateRangeDefaultTime,
            style: { width: '220px' }
        }
    },
    {
        field: 'installmentStatus',
        label: '分期状态',
        component: 'Select',
        componentProps: {
            options: AFTERSALES_INSTALLMENT_STATUS_OPTIONS,
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'finalPaymentChannel',
        label: '尾款渠道',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    },
    {
        field: 'aftersalesResult',
        label: '处理结果',
        component: 'Select',
        componentProps: {
            options: AFTERSALES_RESULT_OPTIONS,
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'handlerUserId',
        label: '处理人',
        component: 'Select',
        componentProps: { options: handlerOptions, clearable: true, style: { width: '220px' } }
    },
    {
        field: 'receiveTimeRange',
        label: '领取时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            defaultTime: dateRangeDefaultTime,
            style: { width: '220px' }
        }
    },
    {
        field: 'processTimeRange',
        label: '处理时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            defaultTime: dateRangeDefaultTime,
            style: { width: '220px' }
        }
    }
]

const removeEmptyArrayValues = (params: Recordable) =>
    Object.keys(params).reduce((result, key) => {
        const value = params[key]
        if (Array.isArray(value) && value.length === 0) return result
        result[key] = value
        return result
    }, {} as Recordable)

const normalizeComplaintTagIds = (value: unknown) => {
    if (!Array.isArray(value)) return []
    return value.map((item) => Number(item)).filter((item) => Number.isFinite(item))
}

export const buildPageParams = (params: Recordable) => {
    const {
        createTimeRange = [],
        receiveTimeRange = [],
        processTimeRange = [],
        enrollTimeRange = [],
        complaintTagIds,
        noComplaintTag,
        ...rest
    } = params
    const normalizedComplaintTagIds = normalizeComplaintTagIds(complaintTagIds)
    const hasNoComplaintTag = normalizedComplaintTagIds.includes(NO_COMPLAINT_TAG_VALUE)
    const actualComplaintTagIds = hasNoComplaintTag
        ? []
        : normalizedComplaintTagIds.filter((item) => item !== NO_COMPLAINT_TAG_VALUE)

    return removeEmptyArrayValues({
        ...rest,
        complaintTagIds: actualComplaintTagIds,
        noComplaintTag: hasNoComplaintTag ? true : noComplaintTag,
        beginCreateTime: createTimeRange[0],
        endCreateTime: createTimeRange[1],
        beginReceiveTime: receiveTimeRange[0],
        endReceiveTime: receiveTimeRange[1],
        beginProcessTime: processTimeRange[0],
        endProcessTime: processTimeRange[1],
        beginEnrollTime: enrollTimeRange[0],
        endEnrollTime: enrollTimeRange[1]
    })
}
