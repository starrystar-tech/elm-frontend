<template>
    <ContentWrap>
        <Search
            :schema="searchSchema"
            :model="searchForm"
            @reset="resetSearchParams"
            @search="setSearchParams"
        >
            <template #enrollStatus>
                <el-select
                    v-model="searchForm.enrollStatus"
                    clearable
                    placeholder="请选择报名状态"
                    style="width: 180px"
                >
                    <el-option label="未报名" value="unregistered" />
                    <el-option label="已报名" value="registered" />
                </el-select>
            </template>
            <template #areaId>
                <AreaSelect
                    v-model="searchForm.areaId"
                    :include-all-node="false"
                    placeholder="请选择地域"
                    style="width: 220px"
                />
            </template>
        </Search>
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
    <CustomerDetailDrawer ref="detailRef" @refresh="handleDetailRefresh" />
</template>

<script lang="tsx" setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { ElLink } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as ClueApi from '@/api/crm/clue'
import * as HeadteacherApi from '@/api/crm/allocation/headteacher'
import AreaSelect from '@/components/AreaSelect.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import BatchHeadteacherForm from './BatchHeadteacherForm.vue'
import CustomerDetailDrawer from './detail/CustomerDetailDrawer.vue'
import { renderCopyMobileCell } from '@/views/crm/clue/mobileCopy'

interface StudentSearchParams {
    mobile?: string
    customer?: string
    areaId?: number
    headteacherUserId?: number
    enrollStatus?: 'registered' | 'unregistered'
}

defineOptions({ name: 'CrmCustomer' })

const message = useMessage()
const batchHeadteacherFormRef = ref<InstanceType<typeof BatchHeadteacherForm>>()
const detailRef = ref<InstanceType<typeof CustomerDetailDrawer>>()
const searchForm = reactive<StudentSearchParams>({})
const selectionList = ref<ClueApi.ClueVO[]>([])
const headteacherOptions = ref<{ label: string; value: number }[]>([])
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
        component: 'Input',
        componentProps: {
            clearable: true,
            style: { width: '180px' }
        }
    },
    {
        field: 'areaId',
        label: '地域',
        component: 'Input',
        componentProps: {
            clearable: true,
            style: { width: '220px' }
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

const tableRef = ref<any>()
const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ClueApi.ClueVO>({
    getListApi: async (params) => await ClueApi.getCluePage(params)
})

const buildAreaLabel = (row: ClueApi.ClueVO) => {
    const names = [row.province, row.city, row.district].filter(Boolean)
    if (names.length > 0) {
        return names.join(' / ')
    }
    return row.areaName || '--'
}

const buildEnrollStatus = (row: ClueApi.ClueVO) =>
    Number(row.orderCount || 0) > 0 ? '已报名' : '未报名'

const buildListParams = (params: StudentSearchParams = {}) => {
    const nextParams: Record<string, any> = {
        mobile: params.mobile,
        customer: params.customer,
        areaId: params.areaId,
        headteacherUserId: params.headteacherUserId,
        minOrderCount: (params as Record<string, any>).minOrderCount,
        maxOrderCount: (params as Record<string, any>).maxOrderCount
    }
    if (params.enrollStatus === 'registered') {
        nextParams.minOrderCount = 1
        delete nextParams.maxOrderCount
    }
    if (params.enrollStatus === 'unregistered') {
        nextParams.maxOrderCount = 0
        delete nextParams.minOrderCount
    }
    return nextParams
}

const syncSearchForm = (params: StudentSearchParams = {}) => {
    Object.keys(searchForm).forEach((key) => {
        delete searchForm[key as keyof StudentSearchParams]
    })
    Object.assign(searchForm, params)
}

const openDetail = (id: number) => {
    detailRef.value?.open(id)
}

const registerTable = (table: any, elTable: any) => {
    tableRegister(table, elTable)
    tableRef.value = table
}

const handleDetailRefresh = async () => {
    await tableMethods.getList()
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
    {
        field: 'mobile',
        label: '手机号',
        minWidth: '170px',
        slots: {
            default: (data) =>
                renderCopyMobileCell({
                    row: data.row,
                    mobile: data.row.mobile,
                    success: message.success,
                    warning: message.warning
                })
        }
    },
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
        minWidth: '200px',
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

const loadFilterOptions = async () => {
    const [headteachers] = await Promise.all([HeadteacherApi.getHeadteacherSimpleList()])
    headteacherOptions.value = (headteachers || []).map((item) => ({
        label: item.nickname || item.username,
        value: item.id
    }))
    const headteacherField = searchSchema.find((item) => item.field === 'headteacherUserId')
    if (headteacherField?.componentProps) {
        headteacherField.componentProps.options = headteacherOptions.value
    }
}

const setSearchParams = (params: StudentSearchParams) => {
    const mergedParams = {
        ...params,
        enrollStatus: searchForm.enrollStatus,
        areaId: searchForm.areaId
    }
    syncSearchForm(mergedParams)
    tableMethods.setSearchParams(buildListParams(mergedParams))
}

const resetSearchParams = () => {
    syncSearchForm({})
    tableMethods.setSearchParams(buildListParams({}))
}

onMounted(async () => {
    await loadFilterOptions()
    await tableMethods.getList()
})
</script>
