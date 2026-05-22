<template>
    <ContentWrap>
        <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
        <div class="mb-12px flex items-center justify-between action-btn-wrap">
            <BaseButton type="primary" disabled>设置班主任（待接入）</BaseButton>
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
    </ContentWrap>
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { ElLink } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as ClueApi from '@/api/crm/clue'
import * as UserApi from '@/api/system/user'
import * as AreaApi from '@/api/system/area'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

interface AreaOption {
    label: string
    value: number
}

interface StudentSearchParams {
    mobile?: string
    customer?: string
    areaId?: number
    currentOwnerId?: number
    enrollStatus?: 'registered' | 'unregistered'
}

defineOptions({ name: 'CrmCustomer' })

const ownerOptions = ref<{ label: string; value: number }[]>([])
const areaOptions = ref<AreaOption[]>([])
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
        label: '学员',
        component: 'Input',
        componentProps: {
            placeholder: '请输入学员ID/姓名',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'enrollStatus',
        label: '报名状态',
        component: 'Select',
        componentProps: {
            clearable: true,
            style: { width: '180px' },
            options: [
                { label: '未报名', value: 'unregistered' },
                { label: '已报名', value: 'registered' }
            ]
        }
    },
    {
        field: 'areaId',
        label: '地域',
        component: 'Select',
        componentProps: {
            clearable: true,
            filterable: true,
            style: { width: '220px' },
            options: areaOptions.value
        }
    },
    {
        field: 'currentOwnerId',
        label: '班主任',
        component: 'Select',
        componentProps: {
            clearable: true,
            filterable: true,
            style: { width: '200px' },
            options: ownerOptions.value
        }
    }
])

const { push } = useRouter()
const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ClueApi.ClueVO>({
    getListApi: async (params) =>
        await ClueApi.getCluePage(buildListParams(params as StudentSearchParams))
})

const buildAreaLabel = (row: ClueApi.ClueVO) => {
    const names = [row.province, row.city, row.district].filter(Boolean)
    if (names.length > 0) {
        return names.join(' / ')
    }
    return row.areaName || '--'
}

const buildEnrollStatus = (row: ClueApi.ClueVO) => (row.customerId ? '已报名' : '未报名')

const buildListParams = (params: StudentSearchParams = {}) => {
    const nextParams: Record<string, any> = {
        mobile: params.mobile,
        customer: params.customer,
        areaId: params.areaId,
        currentOwnerId: params.currentOwnerId
    }
    if (params.enrollStatus === 'registered') {
        nextParams.minOrderCount = 1
    }
    if (params.enrollStatus === 'unregistered') {
        nextParams.maxOrderCount = 0
    }
    return nextParams
}

const openDetail = (id: number) => {
    push({ name: 'CrmCustomerDetail', params: { id } })
}

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'customerId', label: '学员ID', width: '120px' },
    {
        field: 'name',
        label: '学员姓名',
        minWidth: '140px',
        fixed: 'left',
        slots: {
            default: (data) => (
                <ElLink underline={false} type="primary" onClick={() => openDetail(data.row.id)}>
                    {data.row.name || '--'}
                </ElLink>
            )
        }
    },
    { field: 'mobile', label: '手机号', width: '140px' },
    {
        field: 'genderName',
        label: '性别',
        width: '90px',
        slots: { default: (data) => <span>{data.row.genderName || '--'}</span> }
    },
    {
        field: 'wechat',
        label: '微信',
        minWidth: '150px',
        slots: { default: (data) => <span>{data.row.wechat || '--'}</span> }
    },
    {
        field: 'areaName',
        label: '地域',
        minWidth: '180px',
        slots: { default: (data) => <span>{buildAreaLabel(data.row)}</span> }
    },
    {
        field: 'currentOwnerName',
        label: '班主任',
        width: '120px',
        slots: {
            default: (data) => (
                <span>{data.row.currentOwnerName || data.row.ownerUserName || '--'}</span>
            )
        }
    },
    {
        field: 'enrollStatus',
        label: '报名状态',
        width: '100px',
        slots: { default: (data) => <span>{buildEnrollStatus(data.row)}</span> }
    },
    { field: 'contactLastTime', label: '最近跟进', minWidth: '170px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '120px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <BaseButton link type="primary" onClick={() => openDetail(data.row.id)}>
                    详情
                </BaseButton>
            )
        }
    }
])

const flattenAreas = (nodes: any[] = [], parents: string[] = []): AreaOption[] => {
    return nodes.flatMap((node) => {
        const nextParents = [...parents, node.name]
        const current = node.id
            ? [
                  {
                      label: nextParents.join(' / '),
                      value: Number(node.id)
                  }
              ]
            : []
        return current.concat(flattenAreas(node.children || [], nextParents))
    })
}

const loadFilterOptions = async () => {
    const [users, areas] = await Promise.all([UserApi.getSimpleUserList(), AreaApi.getAreaTree()])
    ownerOptions.value = (users || []).map((item) => ({
        label: item.nickname || item.username,
        value: item.id
    }))
    areaOptions.value = flattenAreas(areas || [])
    const areaField = searchSchema.find((item) => item.field === 'areaId')
    if (areaField?.componentProps) {
        areaField.componentProps.options = areaOptions.value
    }
    const ownerField = searchSchema.find((item) => item.field === 'currentOwnerId')
    if (ownerField?.componentProps) {
        ownerField.componentProps.options = ownerOptions.value
    }
}

const setSearchParams = (params: StudentSearchParams) => {
    tableMethods.setSearchParams(buildListParams(params))
}

onMounted(async () => {
    await loadFilterOptions()
    tableMethods.getList()
})
</script>
