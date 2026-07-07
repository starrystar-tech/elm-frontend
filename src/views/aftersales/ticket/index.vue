<template>
    <ContentWrap>
        <Search
            :schema="searchSchema"
            :model="searchForm"
            @search="setSearchParams"
            @reset="handleResetSearch"
        />
        <div class="action-btn-wrap flex items-center gap-2">
            <!-- <BaseButton v-hasPermi="['crm:aftersales:create']" type="primary" @click="openCreate">
                新增工单
            </BaseButton>
            <BaseButton v-hasPermi="['crm:aftersales:import']" plain @click="openImport">
                批量导入
            </BaseButton> -->
            <BaseButton v-hasPermi="['crm:aftersales:assign']" @click="openAssign">
                分配处理人
            </BaseButton>
            <BaseButton v-hasPermi="['crm:aftersales:export']" plain @click="openExportDialog">
                导出
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
        <AftersalesForm ref="formRef" @success="tableMethods.getList()" />
        <AftersalesAssignDialog ref="assignRef" @success="tableMethods.getList()" />
        <AftersalesDetailDialog ref="detailRef" />
        <AftersalesImportDialog ref="importRef" @success="tableMethods.getList()" />
        <ExportTaskDialog ref="exportDialogRef" @success="handleExportSuccess" />
    </ContentWrap>
</template>

<script setup lang="tsx">
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { useEmitt } from '@/hooks/web/useEmitt'
import type { FormSchema } from '@/types/form'
import * as AftersalesApi from '@/api/crm/aftersales'
import * as HeadteacherApi from '@/api/crm/allocation/headteacher'
import * as ComplaintTagApi from '@/api/system/complaintTag'
import * as CampusApi from '@/api/system/campus'
import { buildBaseSearchSchema, buildPageParams } from '../config'
import AftersalesForm from '../components/AftersalesForm.vue'
import AftersalesAssignDialog from '../components/AftersalesAssignDialog.vue'
import AftersalesDetailDialog from '../components/AftersalesDetailDialog.vue'
import AftersalesImportDialog from './AftersalesImportDialog.vue'
import ExportTaskDialog from '@/views/crm/clue/components/ExportTaskDialog.vue'
import { buildAftersalesColumns } from '../listColumns'

defineOptions({ name: 'AftersalesTicket' })

const message = useMessage()
const route = useRoute()
const formRef = ref()
const assignRef = ref()
const detailRef = ref()
const importRef = ref<InstanceType<typeof AftersalesImportDialog>>()
const exportDialogRef = ref<InstanceType<typeof ExportTaskDialog>>()
const { emitter } = useEmitt()
const handlerOptions = ref<{ label: string; value: number }[]>([])
const complaintTagOptions = ref<{ label: string; value: number }[]>([])
const campusOptions = ref<{ label: string; value: number }[]>([])
const searchForm = reactive<Recordable>({})
const currentSearchParams = ref<Recordable>({})
let exportReminderTimer: number | undefined

const searchSchema = computed<FormSchema[]>(() =>
    buildBaseSearchSchema(handlerOptions.value, complaintTagOptions.value, campusOptions.value)
)

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<AftersalesApi.AftersalesRespVO>({
    getListApi: async (params) => await AftersalesApi.getAftersalesPage(params)
})

const setSearchParams = (params: Recordable) => {
    const pageParams = buildPageParams(params)
    currentSearchParams.value = pageParams
    tableMethods.setSearchParams(pageParams)
}

const clearSearchForm = () => {
    Object.keys(searchForm).forEach((key) => {
        delete searchForm[key]
    })
}

const handleResetSearch = () => {
    clearSearchForm()
    setSearchParams({})
}

const getQueryString = (value: unknown) => {
    if (Array.isArray(value)) {
        return value[0]
    }
    return typeof value === 'string' ? value : undefined
}

const getQueryNumber = (value: unknown) => {
    const queryValue = getQueryString(value)
    if (queryValue === undefined || queryValue === '') {
        return undefined
    }
    const numberValue = Number(queryValue)
    return Number.isNaN(numberValue) ? undefined : numberValue
}

const initSearchFormFromRoute = () => {
    const status = getQueryNumber(route.query.status)
    const priority = getQueryNumber(route.query.priority)
    if (status !== undefined) {
        searchForm.status = status
    }
    if (priority !== undefined) {
        searchForm.priority = priority
    }
}

const openAssign = async () => {
    const selections = await tableMethods.getSelections()
    if (!selections.length) {
        message.warning('请先选择工单')
        return
    }
    assignRef.value.open(selections.map((item) => item.id))
}

const openExportDialog = () => {
    exportDialogRef.value?.open({
        title: '导出售后工单',
        bizType: 'crm_aftersales_ticket_export',
        submit: async (payload) => {
            await AftersalesApi.createAftersalesExportTask({
                ...currentSearchParams.value,
                ...payload
            })
        }
    })
}

const handleExportSuccess = () => {
    message.success('导出任务已创建，请到下载中心查看')
    if (exportReminderTimer) {
        window.clearTimeout(exportReminderTimer)
    }
    exportReminderTimer = window.setTimeout(() => {
        emitter.emit('refresh-export-task-reminder')
        exportReminderTimer = undefined
    }, 4000)
}

onBeforeUnmount(() => {
    if (exportReminderTimer) {
        window.clearTimeout(exportReminderTimer)
    }
})

const openDetail = (id: number) => detailRef.value.open(id)

const tableColumns = computed<TableColumn[]>(() =>
    buildAftersalesColumns({
        message,
        openDetail,
        actionWidth: '90px'
    })
)

onMounted(async () => {
    initSearchFormFromRoute()
    const [users, complaintTags, campuses] = await Promise.all([
        HeadteacherApi.getHeadteacherSimpleList(),
        ComplaintTagApi.getComplaintTagSimpleList(),
        CampusApi.getSimpleCampusList()
    ])
    handlerOptions.value = (users || []).map((item) => ({
        label: item.nickname || item.username,
        value: item.id
    }))
    complaintTagOptions.value = (complaintTags || []).map((item) => ({
        label: item.name,
        value: item.id
    }))
    campusOptions.value = (campuses || []).map((item) => ({
        label: item.name,
        value: Number(item.id)
    }))
    if (Object.keys(searchForm).length) {
        setSearchParams(searchForm)
        return
    }
    await tableMethods.getList()
})
</script>
