<template>
    <ContentWrap>
        <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
        <div class="action-btn-wrap">
            <BaseButton v-hasPermi="['crm:aftersales:claim']" type="primary" @click="batchClaim">
                批量领取
            </BaseButton>
        </div>
        <Table
            selection
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
import * as AftersalesApi from '@/api/crm/aftersales'
import * as ComplaintTagApi from '@/api/system/complaintTag'
import * as CampusApi from '@/api/system/campus'
import { buildBaseSearchSchema, buildPageParams } from '../config'
import { buildAftersalesColumns } from '../listColumns'

defineOptions({ name: 'AftersalesPool' })

const message = useMessage()
const complaintTagOptions = ref<{ label: string; value: number }[]>([])
const campusOptions = ref<{ label: string; value: number }[]>([])
const hiddenPoolSearchFields = [
    'handlerUserId',
    'enrollTimeRange',
    'installmentStatus',
    'confirmStatus',
    'aftersalesResult',
    'receiveTimeRange',
    'processTimeRange'
]
const visiblePoolTableFields = [
    'ticketNo',
    'customerId',
    'orderNo',
    'customerName',
    'customerMobile',
    'campusName',
    'source',
    'priority',
    'action'
]

const searchSchema = computed<FormSchema[]>(() =>
    buildBaseSearchSchema([], complaintTagOptions.value, campusOptions.value).filter(
        (item) => !hiddenPoolSearchFields.includes(item.field)
    )
)

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<AftersalesApi.AftersalesRespVO>({
    getListApi: async (params) => await AftersalesApi.getPoolAftersalesPage(params)
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(buildPageParams(params))
}

const claim = async (row: AftersalesApi.AftersalesRespVO) => {
    await AftersalesApi.claimAftersales(row.id)
    message.success('领取成功')
    await tableMethods.getList()
}

const batchClaim = async () => {
    const selections = await tableMethods.getSelections()
    if (!selections.length) {
        message.warning('请先选择工单')
        return
    }
    await AftersalesApi.batchClaimAftersales(selections.map((item) => item.id))
    message.success('批量领取成功')
    await tableMethods.getList()
}

const tableColumns = computed<TableColumn[]>(() =>
    buildAftersalesColumns({
        message,
        claim,
        actionWidth: '80px'
    }).filter((item) => visiblePoolTableFields.includes(item.field))
)

onMounted(async () => {
    const [complaintTags, campuses] = await Promise.all([
        ComplaintTagApi.getComplaintTagSimpleList(),
        CampusApi.getSimpleCampusList()
    ])
    complaintTagOptions.value = (complaintTags || []).map((item) => ({
        label: item.name,
        value: item.id
    }))
    campusOptions.value = (campuses || []).map((item) => ({
        label: item.name,
        value: Number(item.id)
    }))
    await tableMethods.getList()
})
</script>
