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
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import * as AftersalesApi from '@/api/crm/aftersales'
import * as UserApi from '@/api/system/user'
import * as DeptApi from '@/api/system/dept'
import { getAftersalesPriorityOptions, getAftersalesTypeOptions } from '../config'

defineOptions({ name: 'AftersalesStats' })

const userOptions = ref<{ label: string; value: number }[]>([])
const deptOptions = ref<{ label: string; value: number }[]>([])

const searchSchema = computed<FormSchema[]>(() => [
    {
        field: 'deptId',
        label: '部门',
        component: 'Select',
        componentProps: { options: deptOptions.value, clearable: true, style: { width: '220px' } }
    },
    {
        field: 'handlerUserId',
        label: '用户',
        component: 'Select',
        componentProps: { options: userOptions.value, clearable: true, style: { width: '220px' } }
    },
    {
        field: 'receiveTimeRange',
        label: '领取时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
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
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<AftersalesApi.AftersalesStatsRespVO>({
    getListApi: async (params) => await AftersalesApi.getAftersalesStatsPage(params)
})

const setSearchParams = (params: Recordable) => {
    const { receiveTimeRange = [], processTimeRange = [], deptId, ...rest } = params
    tableMethods.setSearchParams({
        ...rest,
        beginReceiveTime: receiveTimeRange[0],
        endReceiveTime: receiveTimeRange[1],
        beginProcessTime: processTimeRange[0],
        endProcessTime: processTimeRange[1],
        deptId
    })
}

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'userName', label: '用户', minWidth: '120px' },
    { field: 'deptName', label: '所在部门', minWidth: '140px' },
    { field: 'totalCount', label: '工单总数', minWidth: '100px' },
    { field: 'finishedCount', label: '已完成', minWidth: '100px' },
    { field: 'pendingCount', label: '待处理', minWidth: '100px' },
    { field: 'processingCount', label: '处理中', minWidth: '100px' }
])

onMounted(async () => {
    const [users, depts] = await Promise.all([
        UserApi.getSimpleUserList(),
        DeptApi.getSimpleDeptList()
    ])
    userOptions.value = (users || []).map((item) => ({
        label: item.nickname || item.username,
        value: item.id
    }))
    deptOptions.value = (depts || []).map((item) => ({ label: item.name, value: item.id }))
    await tableMethods.getList()
})
</script>
