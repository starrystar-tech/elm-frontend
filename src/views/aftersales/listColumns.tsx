import { ElLink } from 'element-plus'
import { BaseButton } from '@/components/Button'
import type { TableColumn } from '@/components/Table'
import { dateFormatter } from '@/utils/formatTime'
import type * as AftersalesApi from '@/api/crm/aftersales'
import { hasPermission } from '@/directives/permission/hasPermi'
import { renderCopyMobileCell } from '@/views/crm/clue/mobileCopy'
import {
    formatAftersalesAmount,
    formatComplaintTags,
    getAftersalesInstallmentStatusLabel,
    getAftersalesPriorityLabel,
    getAftersalesResultLabel,
    getAftersalesSourceLabel,
    getAftersalesStatusLabel
} from './config'

interface BuildAftersalesColumnsOptions {
    message: {
        success: (message: string) => void
        warning: (message: string) => void
    }
    openDetail?: (id: number) => void
    openProcess?: (row: AftersalesApi.AftersalesRespVO) => void
    claim?: (row: AftersalesApi.AftersalesRespVO) => void
    repurchase?: (row: AftersalesApi.AftersalesRespVO) => void
    showProcess?: (row: AftersalesApi.AftersalesRespVO) => boolean
    showClaim?: (row: AftersalesApi.AftersalesRespVO) => boolean
    showRepurchase?: (row: AftersalesApi.AftersalesRespVO) => boolean
    actionWidth?: string
}

const defaultShowProcess = () => true
const defaultShowClaim = () => true
const defaultShowRepurchase = (row: AftersalesApi.AftersalesRespVO) => !!row.orderId

export const buildAftersalesColumns = (options: BuildAftersalesColumnsOptions): TableColumn[] => {
    const hasAction = options.openDetail || options.openProcess || options.claim || options.repurchase
    const canClaim = hasPermission(['crm:aftersales:claim'])

    const columns: TableColumn[] = [
        {
            field: 'ticketNo',
            label: '工单号',
            minWidth: '200px',
            fixed: 'left',
            slots: {
                default: (data) =>
                    options.openDetail ? (
                        <ElLink
                            type="primary"
                            underline={false}
                            onClick={() => options.openDetail?.(data.row.id)}
                        >
                            {data.row.ticketNo || '--'}
                        </ElLink>
                    ) : (
                        <span>{data.row.ticketNo || '--'}</span>
                    )
            }
        },
        { field: 'customerId', label: '客户编号', minWidth: '120px' },
        { field: 'orderNo', label: '订单编号', minWidth: '160px' },
        { field: 'customerName', label: '客户', minWidth: '100px' },
        {
            field: 'customerMobile',
            label: '手机号',
            minWidth: '170px',
            slots: {
                default: (data) =>
                    renderCopyMobileCell({
                        row: data.row,
                        mobile: data.row.customerMobile,
                        success: options.message.success,
                        warning: options.message.warning
                    })
            }
        },
        { field: 'handlerUserName', label: '处理人', minWidth: '100px' },
        {
            field: 'source',
            label: '来源',
            minWidth: '110px',
            slots: {
                default: (data) => (
                    <span>{data.row.sourceDesc || getAftersalesSourceLabel(data.row.source)}</span>
                )
            }
        },
        {
            field: 'priority',
            label: '优先级',
            minWidth: '90px',
            formatter: (_r, _c, v) => getAftersalesPriorityLabel(v)
        },
        {
            field: 'status',
            label: '状态',
            minWidth: '100px',
            formatter: (_r, _c, v) => getAftersalesStatusLabel(v)
        },
        {
            field: 'aftersalesResult',
            label: '处理结果',
            minWidth: '120px',
            slots: {
                default: (data) => (
                    <span>{data.row.aftersalesResultDesc || getAftersalesResultLabel(data.row.aftersalesResult)}</span>
                )
            }
        },
        { field: 'campusName', label: '报名分校', minWidth: '130px', showOverflowTooltip: true },
        { field: 'enrollTime', label: '报名时间', minWidth: '170px', formatter: dateFormatter },
        {
            field: 'installmentStatus',
            label: '分期状态',
            minWidth: '100px',
            formatter: (_r, _c, v) => getAftersalesInstallmentStatusLabel(v)
        },
        { field: 'finalPaymentChannel', label: '尾款渠道', minWidth: '130px', showOverflowTooltip: true },
        {
            field: 'complaintTags',
            label: '投诉标签',
            minWidth: '160px',
            showOverflowTooltip: true,
            slots: { default: (data) => <span>{formatComplaintTags(data.row.complaintTags)}</span> }
        },
        {
            field: 'refundAmount',
            label: '退款金额',
            minWidth: '110px',
            slots: { default: (data) => <span>￥{formatAftersalesAmount(data.row.refundAmount)}</span> }
        },
        {
            field: 'retainAmount',
            label: '挽单金额',
            minWidth: '110px',
            slots: { default: (data) => <span>￥{formatAftersalesAmount(data.row.retainAmount)}</span> }
        },
        { field: 'processResult', label: '处理备注', minWidth: '160px', showOverflowTooltip: true },
        { field: 'creatorName', label: '提交人', minWidth: '110px' },
        { field: 'creatorDeptName', label: '提交部门', minWidth: '130px', showOverflowTooltip: true },
        { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter },
        { field: 'receiveTime', label: '领取时间', minWidth: '170px', formatter: dateFormatter },
        { field: 'processTime', label: '处理时间', minWidth: '170px', formatter: dateFormatter }
    ]

    if (!hasAction) return columns

    columns.push({
        field: 'action',
        label: '操作',
        width: options.actionWidth || '180px',
        fixed: 'right',
        slots: {
            default: (data) => {
                const row = data.row as AftersalesApi.AftersalesRespVO
                return (
                    <>
                        {options.openDetail ? (
                            <BaseButton link type="primary" onClick={() => options.openDetail?.(row.id)}>
                                查看
                            </BaseButton>
                        ) : null}
                        {canClaim && options.claim && (options.showClaim || defaultShowClaim)(row) ? (
                            <BaseButton
                                link
                                type="primary"
                                onClick={() => options.claim?.(row)}
                            >
                                领取
                            </BaseButton>
                        ) : null}
                        {options.openProcess && (options.showProcess || defaultShowProcess)(row) ? (
                            <BaseButton link type="primary" onClick={() => options.openProcess?.(row)}>
                                处理
                            </BaseButton>
                        ) : null}
                        {options.repurchase && (options.showRepurchase || defaultShowRepurchase)(row) ? (
                            <BaseButton link type="primary" onClick={() => options.repurchase?.(row)}>
                                激活
                            </BaseButton>
                        ) : null}
                    </>
                )
            }
        }
    })

    return columns
}
