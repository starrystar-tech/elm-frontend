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
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { dateFormatter } from '@/utils/formatTime'
import * as AftersalesApi from '@/api/crm/aftersales'
import * as ComplaintTagApi from '@/api/system/complaintTag'
import {
    buildBaseSearchSchema,
    buildPageParams,
    getAftersalesPriorityLabel,
    getAftersalesStatusLabel,
    getAftersalesTypeLabel
} from '../config'
import { renderCopyMobileCell } from '@/views/crm/clue/mobileCopy'

defineOptions({ name: 'AftersalesToday' })

const message = useMessage()
const complaintTagOptions = ref<{ label: string; value: number }[]>([])
const searchSchema = computed<FormSchema[]>(() =>
    buildBaseSearchSchema([], complaintTagOptions.value).filter(
        (item) => !['handlerUserId', 'receiveTimeRange', 'processTimeRange'].includes(item.field)
    )
)

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<AftersalesApi.AftersalesRespVO>({
    getListApi: async (params) => await AftersalesApi.getTodayAftersalesPage(params)
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(buildPageParams(params))
}

const claim = async (row: AftersalesApi.AftersalesRespVO) => {
    await AftersalesApi.claimAftersales(row.id)
    message.success('领取成功')
    await tableMethods.getList()
}

const tableColumns = computed<TableColumn[]>(() => [
    {
        field: 'ticketNo',
        label: '工单号',
        minWidth: '195px',
        fixed: 'left'
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
                    success: message.success,
                    warning: message.warning
                })
        }
    },
    {
        field: 'ticketType',
        label: '工单类型',
        minWidth: '100px',
        formatter: (_r, _c, v) => getAftersalesTypeLabel(v)
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
    { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '80px',
        fixed: 'right',
        slots: {
            default: (data) => {
                const row = data.row as AftersalesApi.AftersalesRespVO
                return (
                    <BaseButton
                        v-hasPermi={['crm:aftersales:claim']}
                        link
                        type="primary"
                        onClick={() => claim(row)}
                    >
                        领取
                    </BaseButton>
                )
            }
        }
    }
])

onMounted(async () => {
    const complaintTags = await ComplaintTagApi.getComplaintTagSimpleList()
    complaintTagOptions.value = (complaintTags || []).map((item) => ({
        label: item.name,
        value: item.id
    }))
    await tableMethods.getList()
})
</script>
