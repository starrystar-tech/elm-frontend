<template>
    <ContentWrap>
        <Search
            :schema="searchSchema"
            :model="searchForm"
            @reset="resetSearchParams"
            @search="setSearchParams"
        >
            <template #areaId>
                <AreaSelect
                    v-model="searchForm.areaId"
                    :include-all-node="false"
                    placeholder="请选择地域"
                    style="width: 220px"
                />
            </template>
        </Search>
        <Table
            v-model:currentPage="tableObject.currentPage"
            v-model:pageSize="tableObject.pageSize"
            :columns="tableColumns"
            :data="tableObject.tableList"
            :loading="tableObject.loading"
            :pagination="{ total: tableObject.total }"
            row-key="id"
            @register="tableRegister"
        />
    </ContentWrap>

    <CustomerDetailDrawer ref="detailRef" @refresh="handleDetailRefresh" />
    <AftersalesForm ref="aftersalesFormRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { ElLink } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as ClueApi from '@/api/crm/clue'
import AreaSelect from '@/components/AreaSelect.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { useUserStore } from '@/store/modules/user'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import CustomerDetailDrawer from './detail/CustomerDetailDrawer.vue'
import MobileCopyInline from '@/views/crm/clue/MobileCopyInline.vue'
import { buildAreaLabel } from '@/views/crm/clue/listShared'
import AftersalesForm from '@/views/aftersales/components/AftersalesForm.vue'

interface StudentSearchParams {
    mobile?: string
    customer?: string
    areaId?: number
}

defineOptions({ name: 'CrmMyOrderCustomer' })

const detailRef = ref<InstanceType<typeof CustomerDetailDrawer>>()
const aftersalesFormRef = ref<InstanceType<typeof AftersalesForm>>()
const searchForm = reactive<StudentSearchParams>({})
const userStore = useUserStore()
const currentUserId = computed(() => Number(userStore.getUser.id || 0))
const canCreateAftersales = hasPermission(['crm:aftersales:create'])
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
        field: 'areaId',
        label: '地域',
        component: 'Input',
        componentProps: {
            clearable: true,
            style: { width: '220px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ClueApi.ClueVO>({
    getListApi: async (params) => await ClueApi.getStudentPage(params)
})

const buildListParams = (params: StudentSearchParams = {}) => ({
    mobile: params.mobile,
    customer: params.customer,
    areaId: params.areaId,
    headteacherUserId: currentUserId.value || undefined,
    minOrderCount: 1
})

const syncSearchForm = (params: StudentSearchParams = {}) => {
    Object.keys(searchForm).forEach((key) => {
        delete searchForm[key as keyof StudentSearchParams]
    })
    Object.assign(searchForm, params)
}

const openDetail = (id: number) => {
    detailRef.value?.open(id)
}

const handleDetailRefresh = async () => {
    await tableMethods.getList()
}

const handleCreateAftersales = (row: ClueApi.ClueVO) => {
    aftersalesFormRef.value?.open({
        clueId: Number(row.id),
        customerId: row.customerId,
        customerName: row.name,
        orderFilterClueId: Number(row.id)
    })
}

const tableColumns = computed<TableColumn[]>(() => [
    {
        field: 'customerId',
        label: '学员ID',
        width: '120px',
        slots: {
            default: (data) => (
                <ElLink underline={false} type="primary" onClick={() => openDetail(data.row.id)}>
                    {data.row.customerId || '--'}
                </ElLink>
            )
        }
    },
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
        label: '联系电话',
        minWidth: '170px',
        slots: {
            default: (data) => (
                <MobileCopyInline clueId={Number(data.row.id)} mobile={data.row.mobile} />
            )
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
        slots: { default: () => <span>已报名</span> }
    },
    { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '180px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <div class="flex items-center justify-center">
                    <BaseButton link type="primary" onClick={() => openDetail(data.row.id)}>
                        详情
                    </BaseButton>
                    {canCreateAftersales ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => handleCreateAftersales(data.row as ClueApi.ClueVO)}
                        >
                            新增工单
                        </BaseButton>
                    ) : null}
                </div>
            )
        }
    }
])

const setSearchParams = (params: StudentSearchParams) => {
    const mergedParams = {
        ...params,
        areaId: searchForm.areaId
    }
    syncSearchForm(mergedParams)
    tableMethods.setSearchParams(buildListParams(mergedParams))
}

const resetSearchParams = () => {
    syncSearchForm({})
    tableMethods.setSearchParams(buildListParams({}))
}

onMounted(() => {
    tableMethods.setSearchParams(buildListParams())
})
</script>
