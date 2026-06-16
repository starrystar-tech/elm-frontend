<template>
    <ContentWrap>
        <Search
            :schema="searchSchema"
            :model="searchForm"
            @search="setSearchParams"
            @reset="setSearchParams"
        />
        <div class="action-btn-wrap">
            <BaseButton type="primary" @click="openCreate">新增工单</BaseButton>
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
        <AftersalesProcessDialog ref="processRef" @success="tableMethods.getList()" />
        <AftersalesDetailDialog ref="detailRef" />
    </ContentWrap>
</template>

<script setup lang="tsx">
import { computed, onMounted, reactive } from 'vue'
import { ElLink } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { dateFormatter } from '@/utils/formatTime'
import * as AftersalesApi from '@/api/crm/aftersales'
import * as HeadteacherApi from '@/api/crm/allocation/headteacher'
import * as ComplaintTagApi from '@/api/system/complaintTag'
import {
    buildBaseSearchSchema,
    buildPageParams,
    getAftersalesPriorityLabel,
    getAftersalesStatusLabel,
    getAftersalesTypeLabel
} from '../config'
import AftersalesForm from '../components/AftersalesForm.vue'
import AftersalesProcessDialog from '../components/AftersalesProcessDialog.vue'
import AftersalesDetailDialog from '../components/AftersalesDetailDialog.vue'
import { renderCopyMobileCell } from '@/views/crm/clue/mobileCopy'

defineOptions({ name: 'AftersalesMy' })

const message = useMessage()
const route = useRoute()
const handlerOptions = ref<{ label: string; value: number }[]>([])
const complaintTagOptions = ref<{ label: string; value: number }[]>([])
const formRef = ref()
const processRef = ref()
const detailRef = ref()
const searchForm = reactive<Recordable>({})

const searchSchema = computed<FormSchema[]>(() => {
    const schema = buildBaseSearchSchema(handlerOptions.value, complaintTagOptions.value)
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

const getQueryString = (value: unknown) => {
    if (Array.isArray(value)) {
        return typeof value[0] === 'string' ? value[0] : ''
    }
    return typeof value === 'string' ? value : ''
}

const initSearchFormFromRoute = () => {
    const status = getQueryString(route.query.status)
    if (!status) {
        return
    }
    searchForm.status = Number(status)
}

const openCreate = () => formRef.value.open()
const openProcess = (row: AftersalesApi.AftersalesRespVO) => processRef.value.open(row)
const openDetail = (id: number) => detailRef.value.open(id)

const tableColumns = computed<TableColumn[]>(() => [
    {
        field: 'ticketNo',
        label: '工单号',
        minWidth: '170px',
        fixed: 'left',
        slots: {
            default: (data) => (
                <ElLink type="primary" underline={false} onClick={() => openDetail(data.row.id)}>
                    {data.row.ticketNo}
                </ElLink>
            )
        }
    },
    { field: 'customerId', label: '客户ID', minWidth: '120px' },
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
    { field: 'processResult', label: '处理结果', minWidth: '160px', showOverflowTooltip: true },
    { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'handlerUserName', label: '处理人', minWidth: '100px' },
    { field: 'receiveTime', label: '领取时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'processTime', label: '处理时间', minWidth: '170px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '160px',
        fixed: 'right',
        slots: {
            default: (data) => {
                const row = data.row as AftersalesApi.AftersalesRespVO
                return (
                    <>
                        <BaseButton link type="primary" onClick={() => openDetail(row.id)}>
                            查看
                        </BaseButton>
                        {row.status !== 20 && row.status !== 30 ? (
                            <BaseButton link type="warning" onClick={() => openProcess(row)}>
                                处理
                            </BaseButton>
                        ) : null}
                    </>
                )
            }
        }
    }
])

onMounted(async () => {
    initSearchFormFromRoute()
    const [list, complaintTags] = await Promise.all([
        HeadteacherApi.getHeadteacherSimpleList(),
        ComplaintTagApi.getComplaintTagSimpleList()
    ])
    handlerOptions.value = (list || []).map((item) => ({
        label: item.nickname || item.username,
        value: item.id
    }))
    complaintTagOptions.value = (complaintTags || []).map((item) => ({
        label: item.name,
        value: item.id
    }))
    if (Object.keys(searchForm).length) {
        setSearchParams({ ...searchForm })
        return
    }
    await tableMethods.getList()
})
</script>
