<template>
    <ContentWrap>
        <Search
            ref="searchRef"
            :schema="searchSchema"
            :model="searchForm"
            @reset="setSearchParams"
            @search="setSearchParams"
        />
        <div class="mb-12px flex items-center justify-between action-btn-wrap">
            <BaseButton
                type="primary"
                :disabled="selectionList.length === 0"
                @click="openBatchHeadteacherForm"
            >
                设置班主任
            </BaseButton>
        </div>
        <Table
            v-model:currentPage="tableObject.currentPage"
            v-model:pageSize="tableObject.pageSize"
            :columns="tableColumns"
            :data="tableObject.tableList"
            :loading="tableObject.loading"
            :pagination="{ total: tableObject.total }"
            row-key="id"
            selection
            @register="registerTable"
            @selection-change="handleSelectionChange"
        />
    </ContentWrap>

    <BatchHeadteacherForm ref="batchHeadteacherFormRef" @success="handleBatchHeadteacherSuccess" />
</template>

<script lang="tsx" setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { ElLink } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as ClueApi from '@/api/crm/clue'
import * as HeadteacherApi from '@/api/crm/allocation/headteacher'
import * as AreaApi from '@/api/system/area'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { useCache } from '@/hooks/web/useCache'
import type { FormSchema } from '@/types/form'
import type { SearchExpose } from '@/components/Search'
import BatchHeadteacherForm from './BatchHeadteacherForm.vue'

interface AreaOption {
    label: string
    value: number
}

interface StudentSearchParams {
    mobile?: string
    customer?: string
    areaId?: number
    headteacherUserId?: number
    enrollStatus?: 'registered' | 'unregistered'
}

interface CustomerListCacheState {
    searchParams: StudentSearchParams
    currentPage: number
    pageSize: number
}

defineOptions({ name: 'CrmCustomer' })

const CUSTOMER_LIST_CACHE_KEY = 'crmCustomerListState'
const { wsCache } = useCache('sessionStorage')
const searchRef = ref<SearchExpose>()
const batchHeadteacherFormRef = ref<InstanceType<typeof BatchHeadteacherForm>>()
const searchForm = reactive<StudentSearchParams>({})
const selectionList = ref<ClueApi.ClueVO[]>([])
const headteacherOptions = ref<{ label: string; value: number }[]>([])
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
        field: 'headteacherUserId',
        label: '班主任',
        component: 'Select',
        componentProps: {
            clearable: true,
            filterable: true,
            style: { width: '220px' },
            options: headteacherOptions.value
        }
    }
])

const { push } = useRouter()
const tableRef = ref<any>()
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
        headteacherUserId: params.headteacherUserId
    }
    if (params.enrollStatus === 'registered') {
        nextParams.minOrderCount = 1
    }
    if (params.enrollStatus === 'unregistered') {
        nextParams.maxOrderCount = 0
    }
    return nextParams
}

const syncSearchForm = (params: StudentSearchParams = {}) => {
    Object.keys(searchForm).forEach((key) => {
        delete searchForm[key as keyof StudentSearchParams]
    })
    Object.assign(searchForm, params)
}

const cacheListState = async () => {
    const currentSearchParams = await searchRef.value?.getFormData<StudentSearchParams>()
    wsCache.set(CUSTOMER_LIST_CACHE_KEY, {
        searchParams: currentSearchParams || { ...searchForm },
        currentPage: tableObject.currentPage,
        pageSize: tableObject.pageSize
    } as CustomerListCacheState)
}

const openDetail = async (id: number) => {
    await cacheListState()
    push({ name: 'CrmCustomerDetail', params: { id } })
}

const registerTable = (table: any, elTable: any) => {
    tableRegister(table, elTable)
    tableRef.value = table
}

const restoreListState = async () => {
    const cachedState = wsCache.get(CUSTOMER_LIST_CACHE_KEY) as CustomerListCacheState | undefined
    if (!cachedState) {
        tableMethods.getList()
        return
    }
    wsCache.delete(CUSTOMER_LIST_CACHE_KEY)
    syncSearchForm(cachedState.searchParams || {})
    await searchRef.value?.setValues(cachedState.searchParams || {})
    const pageSizeChanged = !!cachedState.pageSize && cachedState.pageSize !== tableObject.pageSize
    const currentPageChanged =
        !!cachedState.currentPage && cachedState.currentPage !== tableObject.currentPage
    tableObject.pageSize = cachedState.pageSize || tableObject.pageSize
    tableObject.currentPage = cachedState.currentPage || tableObject.currentPage
    tableObject.params = buildListParams(cachedState.searchParams || {})
    if (!pageSizeChanged && !currentPageChanged) {
        await tableMethods.getList()
    }
}

const handleSelectionChange = (rows: ClueApi.ClueVO[]) => {
    selectionList.value = rows || []
}

const openBatchHeadteacherForm = () => {
    batchHeadteacherFormRef.value?.open(selectionList.value.map((item) => Number(item.id)))
}

const handleBatchHeadteacherSuccess = async () => {
    selectionList.value = []
    tableRef.value?.clearSelection?.()
    await tableMethods.getList()
    await nextTick()
    tableRef.value?.clearSelection?.()
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
        field: 'headteacherName',
        label: '班主任',
        width: '120px',
        slots: {
            default: (data) => <span>{data.row.headteacherName || '--'}</span>
        }
    },
    {
        field: 'enrollStatus',
        label: '报名状态',
        width: '100px',
        slots: { default: (data) => <span>{buildEnrollStatus(data.row)}</span> }
    },
    { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter },
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
    const [headteachers, areas] = await Promise.all([
        HeadteacherApi.getHeadteacherSimpleList(),
        AreaApi.getAreaTree()
    ])
    headteacherOptions.value = (headteachers || []).map((item) => ({
        label: item.nickname || item.username,
        value: item.id
    }))
    areaOptions.value = flattenAreas(areas || [])
    const areaField = searchSchema.find((item) => item.field === 'areaId')
    if (areaField?.componentProps) {
        areaField.componentProps.options = areaOptions.value
    }
    const headteacherField = searchSchema.find((item) => item.field === 'headteacherUserId')
    if (headteacherField?.componentProps) {
        headteacherField.componentProps.options = headteacherOptions.value
    }
}

const setSearchParams = (params: StudentSearchParams) => {
    syncSearchForm(params)
    tableMethods.setSearchParams(buildListParams(params))
}

onMounted(async () => {
    await loadFilterOptions()
    await restoreListState()
})
</script>
