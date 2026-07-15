<template>
    <ContentWrap>
        <Search
            :schema="searchSchema"
            :model="searchForm"
            @search="setSearchParams"
            @reset="handleResetSearch"
        />
        <div class="action-btn-wrap">
            <BaseButton v-hasPermi="['crm:aftersales:create']" type="primary" @click="openCreate">
                新增工单
            </BaseButton>
            <BaseButton v-hasPermi="['crm:aftersales:import']" plain @click="openImport">
                批量导入
            </BaseButton>
            <BaseButton
                v-if="canComplaintTagUpdate"
                plain
                :disabled="selectionList.length === 0"
                @click="openComplaintTagDialog"
            >
                投诉标签
            </BaseButton>
        </div>
        <Table
            :selection="canComplaintTagUpdate"
            v-model:currentPage="tableObject.currentPage"
            v-model:pageSize="tableObject.pageSize"
            :columns="tableColumns"
            :data="tableObject.tableList"
            :loading="tableObject.loading"
            :pagination="{ total: tableObject.total }"
            row-key="id"
            @register="tableRegister"
            @selection-change="handleSelectionChange"
        />
        <AftersalesForm ref="formRef" @success="tableMethods.getList()" />
        <AftersalesProcessDialog ref="processRef" @success="tableMethods.getList()" />
        <AftersalesDetailDialog ref="detailRef" />
        <OrderContractSignDialog ref="contractSignRef" @success="tableMethods.getList()" />
        <AftersalesImportDialog ref="importRef" @success="tableMethods.getList()" />
        <AftersalesComplaintTagDialog ref="complaintTagDialogRef" @success="handleComplaintTagSuccess" />
    </ContentWrap>
</template>

<script setup lang="tsx">
import { computed, nextTick, onMounted, reactive } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import * as AftersalesApi from '@/api/crm/aftersales'
import * as ComplaintTagApi from '@/api/system/complaintTag'
import * as CampusApi from '@/api/system/campus'
import * as OrderApi from '@/api/crm/order'
import { hasPermission } from '@/directives/permission/hasPermi'
import { AFTERSALES_SOURCE, buildBaseSearchSchema, buildPageParams } from '../config'
import AftersalesForm from '../components/AftersalesForm.vue'
import AftersalesProcessDialog from '../components/AftersalesProcessDialog.vue'
import AftersalesDetailDialog from '../components/AftersalesDetailDialog.vue'
import AftersalesImportDialog from '../ticket/AftersalesImportDialog.vue'
import AftersalesComplaintTagDialog from '../components/AftersalesComplaintTagDialog.vue'
import { buildAftersalesColumns } from '../listColumns'
import OrderContractSignDialog from '@/views/order/detail/OrderContractSignDialog.vue'
import { canSignOrderContract } from '@/views/order/utils'

defineOptions({ name: 'AftersalesMy' })

const message = useMessage()
const route = useRoute()
const canComplaintTagUpdate = hasPermission(['crm:clue:complaint-tag:update'])
const canOpenDetail = hasPermission(['crm:aftersales:query'])
const canSignContract = hasPermission(['crm:aftersales:sign-contract'])
const canProcess = hasPermission(['crm:aftersales:process'])
const canRepurchase = hasPermission(['crm:aftersales:repurchase'])
const complaintTagOptions = ref<{ label: string; value: number }[]>([])
const campusOptions = ref<{ label: string; value: number }[]>([])
const formRef = ref()
const processRef = ref()
const detailRef = ref()
const importRef = ref<InstanceType<typeof AftersalesImportDialog>>()
const contractSignRef = ref<InstanceType<typeof OrderContractSignDialog>>()
const complaintTagDialogRef = ref<InstanceType<typeof AftersalesComplaintTagDialog>>()
const selectionList = ref<AftersalesApi.AftersalesRespVO[]>([])
const searchForm = reactive<Recordable>({})

const searchSchema = computed<FormSchema[]>(() => {
    const schema = buildBaseSearchSchema([], complaintTagOptions.value, campusOptions.value)
    return schema.filter((item) => item.field !== 'handlerUserId')
})

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<AftersalesApi.AftersalesRespVO>({
    getListApi: async (params) => await AftersalesApi.getMyAftersalesPage(params)
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(buildPageParams(params))
}

const handleResetSearch = () => {
    Object.keys(searchForm).forEach((key) => delete searchForm[key])
    setSearchParams({})
}

const getQueryString = (value: unknown) => {
    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : ''
    }
    return typeof value === 'string' ? value : ''
}

const getQueryNumber = (value: unknown) => {
    const queryValue = getQueryString(value)
    if (queryValue === undefined || queryValue === '') return undefined
    const numberValue = Number(queryValue)
    return Number.isNaN(numberValue) ? undefined : numberValue
}

const initSearchFormFromRoute = () => {
    const status = getQueryNumber(route.query.status)
    const priority = getQueryNumber(route.query.priority)
    if (status !== undefined) searchForm.status = status
    if (priority !== undefined) searchForm.priority = priority
}

const openCreate = () => formRef.value.open({ source: AFTERSALES_SOURCE.MANUAL })
const openImport = () => importRef.value?.open()
const openProcess = (row: AftersalesApi.AftersalesRespVO) => processRef.value.open(row)
const openDetail = (id: number) => detailRef.value.open(id)
const openContractSign = async (row: AftersalesApi.AftersalesRespVO) => {
    if (!row.orderId) {
        message.warning('该工单未关联订单，无法签署合同')
        return
    }
    const orderDetail = await OrderApi.getOrder(Number(row.orderId))
    if (!canSignOrderContract(orderDetail)) {
        message.warning('订单支付后才可以签署合同')
        return
    }
    contractSignRef.value?.open(orderDetail)
}

const showSignContract = (row: AftersalesApi.AftersalesRespVO) =>
    !!row.orderId && Number(row.aftersalesResult) === 3

const openComplaintTagDialog = () =>
    complaintTagDialogRef.value?.open(selectionList.value.map((item) => Number(item.clueId)))
const handleRepurchase = async (row: AftersalesApi.AftersalesRespVO) => {
    if (!row.orderId) {
        message.warning('该工单未关联订单，无法激活')
        return
    }
    await message.confirm(
        `确认激活售后订单“${row.orderNo || row.ticketNo}”吗？`,
        '提示'
    )
    await AftersalesApi.repurchaseAftersales(Number(row.orderId))
    message.success('激活成功')
    await tableMethods.getList()
}

const handleSelectionChange = (rows: AftersalesApi.AftersalesRespVO[]) => {
    selectionList.value = rows || []
}

const resetTableSelection = async () => {
    selectionList.value = []
    await tableMethods.clearSelection()
    await nextTick()
    await tableMethods.clearSelection()
}

const handleComplaintTagSuccess = async () => {
    await resetTableSelection()
    await tableMethods.getList()
    await resetTableSelection()
}

const tableColumns = computed<TableColumn[]>(() =>
    buildAftersalesColumns({
        message,
        openDetail,
        signContract: openContractSign,
        showSignContract,
        openProcess,
        repurchase: handleRepurchase,
        canOpenDetail,
        canSignContract,
        canProcess,
        canRepurchase,
        actionWidth: '260px'
    })
)

onMounted(async () => {
    initSearchFormFromRoute()
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
    if (Object.keys(searchForm).length) {
        setSearchParams({ ...searchForm })
        return
    }
    await tableMethods.getList()
})
</script>
