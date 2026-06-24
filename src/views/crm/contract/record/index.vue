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
import { reactive } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { liToYuan } from '@/utils/formatter'
import { hasPermission } from '@/directives/permission/hasPermi'
import * as ContractApi from '@/api/system/contract'
import { renderCopyMobileCell } from '@/views/crm/clue/mobileCopy'

defineOptions({ name: 'ContractRecord' })

const message = useMessage()
const canDownload = hasPermission(['system:contract:download'])

const contractTypeOptions = [
    { label: '普通合同', value: 1 },
    { label: '解约合同', value: 2 }
]

const contractStatusOptions = [
    { label: '待签署', value: 1 },
    { label: '已拒签', value: 2 },
    { label: '已撤销', value: 3 },
    { label: '已签署', value: 4 }
]

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'mobile',
        label: '联系电话',
        component: 'Input',
        componentProps: {
            placeholder: '请输入联系电话',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'customer',
        label: '客户',
        component: 'Input',
        componentProps: {
            placeholder: '请输入客户编号/名称',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'status',
        label: '合同状态',
        component: 'Select',
        componentProps: {
            options: contractStatusOptions,
            placeholder: '请选择合同状态',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'contractType',
        label: '合同类型',
        component: 'Select',
        componentProps: {
            options: contractTypeOptions,
            placeholder: '请选择合同类型',
            clearable: true,
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
            startPlaceholder: '开始时间',
            endPlaceholder: '结束时间',
            style: { width: '220px' }
        }
    },
    {
        field: 'contractNo',
        label: '合同编号',
        component: 'Input',
        componentProps: {
            placeholder: '请输入合同编号',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'orderNo',
        label: '订单编号',
        component: 'Input',
        componentProps: {
            placeholder: '请输入订单编号',
            clearable: true,
            style: { width: '220px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ContractApi.ContractPageRespVO>({
    getListApi: async (params) => {
        const createTimeRange = params.createTimeRange || []
        return await ContractApi.getContractPage({
            ...params,
            beginCreateTime: createTimeRange[0],
            endCreateTime: createTimeRange[1]
        })
    }
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(params)
}

const getContractTypeLabel = (value?: number) =>
    contractTypeOptions.find((item) => item.value === value)?.label || '-'

const getContractStatusMeta = (value?: number) => {
    switch (value) {
        case 1:
            return { label: '待签署', type: 'warning' as const }
        case 2:
            return { label: '已拒签', type: 'danger' as const }
        case 3:
            return { label: '已撤销', type: 'info' as const }
        case 4:
            return { label: '已签署', type: 'success' as const }
        default:
            return { label: '-', type: 'info' as const }
    }
}

const formatPayFee = (value?: number) => `￥${liToYuan(value)}`

const handlePreview = async (id: number) => {
    const url = await ContractApi.getContractPreviewUrl(id)
    window.open(url, '_blank')
}

const handleDownload = async (id: number) => {
    const url = await ContractApi.getContractDownloadUrl(id)
    window.open(url, '_blank')
}

const tableColumns = reactive<TableColumn[]>([
    { field: 'contractNo', label: '合同编号', minWidth: '180px', fixed: 'left' },
    { field: 'orderNo', label: '关联订单', minWidth: '160px' },
    {
        field: 'customerName',
        label: '客户',

        minWidth: '140px',
        slots: {
            default: (data) => data.row.customerName || data.row.customerId || '-'
        }
    },
    {
        field: 'customerMobile',
        label: '手机号',
        minWidth: '170px',
        slots: {
            default: (data) =>
                renderCopyMobileCell({
                    row: { id: data.row.id },
                    mobile: data.row.customerMobile,
                    directCopyWhenMissingClueId: true,
                    success: message.success,
                    warning: message.warning
                })
        }
    },
    { field: 'docTitle', label: '合同名称', minWidth: '220px', showOverflowTooltip: true },
    {
        field: 'contractType',
        label: '合同类型',
        width: '120px',
        slots: {
            default: (data) => getContractTypeLabel(data.row.contractType)
        }
    },
    {
        field: 'status',
        label: '合同状态',
        width: '120px',
        slots: {
            default: (data) => {
                const meta = getContractStatusMeta(data.row.status)
                return <el-tag type={meta.type}>{meta.label}</el-tag>
            }
        }
    },
    { field: 'productName', label: '商品名称', minWidth: '200px', showOverflowTooltip: true },
    {
        field: 'payFee',
        label: '支付金额',
        width: '120px',
        slots: {
            default: (data) => formatPayFee(data.row.payFee)
        }
    },
    { field: 'creatorName', label: '操作人', width: '120px' },
    { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '150px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <>
                    <BaseButton link type="primary" onClick={() => handlePreview(data.row.id)}>
                        预览
                    </BaseButton>
                    {canDownload ? (
                        <BaseButton link type="primary" onClick={() => handleDownload(data.row.id)}>
                            下载
                        </BaseButton>
                    ) : null}
                </>
            )
        }
    }
])

onMounted(() => {
    tableMethods.getList()
})
</script>
