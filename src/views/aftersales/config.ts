import type { FormSchema } from '@/types/form'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'

export const getAftersalesTypeOptions = () => getIntDictOptions(DICT_TYPE.CRM_AFTERSALES_TYPE)

export const getAftersalesPriorityOptions = () =>
    getIntDictOptions(DICT_TYPE.CRM_AFTERSALES_PRIORITY)

export const getAftersalesStatusOptions = () => getIntDictOptions(DICT_TYPE.CRM_AFTERSALES_STATUS)

export const getOptionLabel = (options: { label: string; value: number }[], value?: number) => {
    return options.find((item) => item.value === value)?.label || '--'
}

export const dateRangeDefaultTime = [
    new Date(2000, 0, 1, 0, 0, 0),
    new Date(2000, 0, 1, 23, 59, 59)
]

export const getAftersalesTypeLabel = (value?: number) =>
    value === undefined ? '--' : getDictLabel(DICT_TYPE.CRM_AFTERSALES_TYPE, value) || '--'

export const getAftersalesPriorityLabel = (value?: number) =>
    value === undefined ? '--' : getDictLabel(DICT_TYPE.CRM_AFTERSALES_PRIORITY, value) || '--'

export const getAftersalesStatusLabel = (value?: number) =>
    value === undefined ? '--' : getDictLabel(DICT_TYPE.CRM_AFTERSALES_STATUS, value) || '--'

export const buildBaseSearchSchema = (
    handlerOptions: { label: string; value: number }[] = [],
    complaintTagOptions: { label: string; value: number }[] = []
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
        field: 'complaintTagId',
        label: '投诉标签',
        component: 'Select',
        componentProps: {
            options: complaintTagOptions,
            clearable: true,
            filterable: true,
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
        field: 'ticketType',
        label: '工单类型',
        component: 'Select',
        componentProps: {
            options: getAftersalesTypeOptions(),
            clearable: true,
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
            options: getAftersalesStatusOptions(),
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

export const buildPageParams = (params: Recordable) => {
    const { createTimeRange = [], receiveTimeRange = [], processTimeRange = [], ...rest } = params
    return {
        ...rest,
        beginCreateTime: createTimeRange[0],
        endCreateTime: createTimeRange[1],
        beginReceiveTime: receiveTimeRange[0],
        endReceiveTime: receiveTimeRange[1],
        beginProcessTime: processTimeRange[0],
        endProcessTime: processTimeRange[1]
    }
}
