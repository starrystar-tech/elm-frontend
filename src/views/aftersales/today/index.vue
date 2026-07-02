<template>
    <ContentWrap>
        <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
        <div class="action-btn-wrap">
            <BaseButton v-hasPermi="['crm:aftersales:create']" type="primary" @click="openCreate">
                新增工单
            </BaseButton>
            <BaseButton v-hasPermi="['crm:aftersales:import']" plain @click="openImport">
                批量导入
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
        <AftersalesForm ref="formRef" @success="tableMethods.getList()" />
        <AftersalesDetailDialog ref="detailRef" />
        <AftersalesImportDialog ref="importRef" @success="tableMethods.getList()" />
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
import { AFTERSALES_SOURCE, buildBaseSearchSchema, buildPageParams } from '../config'
import AftersalesForm from '../components/AftersalesForm.vue'
import AftersalesDetailDialog from '../components/AftersalesDetailDialog.vue'
import AftersalesImportDialog from '../ticket/AftersalesImportDialog.vue'
import { buildAftersalesColumns } from '../listColumns'

defineOptions({ name: 'AftersalesToday' })

const message = useMessage()
const complaintTagOptions = ref<{ label: string; value: number }[]>([])
const campusOptions = ref<{ label: string; value: number }[]>([])
const formRef = ref()
const detailRef = ref()
const importRef = ref<InstanceType<typeof AftersalesImportDialog>>()
const searchSchema = computed<FormSchema[]>(() =>
    buildBaseSearchSchema([], complaintTagOptions.value, campusOptions.value).filter(
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

const openCreate = () => formRef.value.open({ source: AFTERSALES_SOURCE.MANUAL })
const openImport = () => importRef.value?.open()
const openDetail = (id: number) => detailRef.value.open(id)

const claim = async (row: AftersalesApi.AftersalesRespVO) => {
    await AftersalesApi.claimAftersales(row.id)
    message.success('领取成功')
    await tableMethods.getList()
}

const tableColumns = computed<TableColumn[]>(() =>
    buildAftersalesColumns({
        message,
        openDetail,
        claim,
        showClaim: (row) => !row.handlerUserId && !row.handlerUserName,
        actionWidth: '80px'
    })
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
