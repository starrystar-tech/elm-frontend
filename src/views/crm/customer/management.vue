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
            row-key="orderId"
            selection
            @register="registerTable"
            @selection-change="handleSelectionChange"
        />
    </ContentWrap>

    <BatchHeadteacherForm ref="batchHeadteacherFormRef" @success="handleBatchHeadteacherSuccess" />
    <CustomerDetailDrawer ref="detailRef" @refresh="handleDetailRefresh" />
    <AftersalesForm ref="aftersalesFormRef" @success="tableMethods.getList" />
    <StudentEditForm ref="studentEditFormRef" @success="handleStudentEditSuccess" />
</template>

<script lang="tsx" setup>
import { computed, nextTick, reactive, ref } from 'vue'
import { ElLink } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as StudentCenterApi from '@/api/crm/studentCenter'
import * as HeadteacherApi from '@/api/crm/allocation/headteacher'
import AreaSelect from '@/components/AreaSelect.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import BatchHeadteacherForm from './BatchHeadteacherForm.vue'
import CustomerDetailDrawer from './detail/CustomerDetailDrawer.vue'
import MobileCopyInline from '@/views/crm/clue/MobileCopyInline.vue'
import { buildAreaLabel } from '@/views/crm/clue/listShared'
import AftersalesForm from '@/views/aftersales/components/AftersalesForm.vue'
import StudentEditForm from './StudentEditForm.vue'

interface StudentSearchParams {
    mobile?: string
    customer?: string
    areaId?: number
    headteacherUserId?: number
    serviceStatus?: number
    courseStatus?: number
    studentRemark?: string
}

defineOptions({ name: 'CrmCustomerManagement' })

const batchHeadteacherFormRef = ref<InstanceType<typeof BatchHeadteacherForm>>()
const detailRef = ref<InstanceType<typeof CustomerDetailDrawer>>()
const aftersalesFormRef = ref<InstanceType<typeof AftersalesForm>>()
const studentEditFormRef = ref<InstanceType<typeof StudentEditForm>>()
const searchForm = reactive<StudentSearchParams>({})
const selectionList = ref<StudentCenterApi.StudentCenterPageRespVO[]>([])
const headteacherOptions = ref<{ label: string; value: number }[]>([])
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
    },
    {
        field: 'serviceStatus',
        label: '服务状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择服务状态',
            clearable: true,
            style: { width: '220px' },
            options: StudentCenterApi.STUDENT_SERVICE_STATUS_OPTIONS
        }
    },
    {
        field: 'courseStatus',
        label: '开课状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择开课状态',
            clearable: true,
            style: { width: '220px' },
            options: StudentCenterApi.STUDENT_COURSE_STATUS_OPTIONS
        }
    },
    {
        field: 'studentRemark',
        label: '学员备注',
        component: 'Input',
        componentProps: {
            placeholder: '请输入学员备注',
            clearable: true,
            style: { width: '220px' }
        }
    }
])

const tableRef = ref<any>()
const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<StudentCenterApi.StudentCenterPageRespVO>({
    getListApi: async (params) => (await StudentCenterApi.getStudentPage(params)) as any
})

const buildListParams = (params: StudentSearchParams = {}) => ({
    mobile: params.mobile,
    customer: params.customer,
    areaId: params.areaId,
    headteacherUserId: params.headteacherUserId,
    serviceStatus: params.serviceStatus,
    courseStatus: params.courseStatus,
    studentRemark: params.studentRemark
})

const syncSearchForm = (params: StudentSearchParams = {}) => {
    Object.keys(searchForm).forEach((key) => {
        delete searchForm[key as keyof StudentSearchParams]
    })
    Object.assign(searchForm, params)
}

const openDetail = (clueId?: number) => {
    if (!clueId) return
    detailRef.value?.open(Number(clueId))
}

const registerTable = (table: any, elTable: any) => {
    tableRegister(table, elTable)
    tableRef.value = table
}

const handleDetailRefresh = async () => {
    await tableMethods.getList()
}

const handleCreateAftersales = (row: StudentCenterApi.StudentCenterPageRespVO) => {
    aftersalesFormRef.value?.open({
        clueId: Number(row.clueId),
        customerId: row.customerId,
        customerName: row.customerName,
        orderFilterClueId: Number(row.clueId)
    })
}

const handleSelectionChange = (rows: StudentCenterApi.StudentCenterPageRespVO[]) => {
    selectionList.value = rows || []
}

const openBatchHeadteacherForm = () => {
    batchHeadteacherFormRef.value?.open(selectionList.value.map((item) => Number(item.clueId)))
}

const handleBatchHeadteacherSuccess = async () => {
    selectionList.value = []
    tableRef.value?.clearSelection?.()
    await tableMethods.getList()
    await nextTick()
    tableRef.value?.clearSelection?.()
}

const openStudentEditForm = (row: StudentCenterApi.StudentCenterPageRespVO) => {
    studentEditFormRef.value?.open(row)
}

const handleStudentEditSuccess = async () => {
    await tableMethods.getList()
}

const getGenderLabel = (value?: number) => {
    if (Number(value) === 1) return '男'
    if (Number(value) === 2) return '女'
    return '--'
}

const tableColumns = computed<TableColumn[]>(() => [
    {
        field: 'customerId',
        label: '学员ID',
        width: '120px',
        fixed: 'left',
        slots: {
            default: (data) => (
                <ElLink underline={false} type="primary" onClick={() => openDetail(data.row.clueId)}>
                    {data.row.customerId || '--'}
                </ElLink>
            )
        }
    },
    {
        field: 'customerName',
        label: '学员姓名',
        minWidth: '140px',
        fixed: 'left'
    },
    {
        field: 'customerMobile',
        label: '联系电话',
        minWidth: '170px',
        slots: {
            default: (data) => (
                <MobileCopyInline clueId={Number(data.row.clueId)} mobile={data.row.customerMobile} />
            )
        }
    },
    {
        field: 'genderName',
        label: '性别',
        width: '90px',
        slots: { default: (data) => <span>{getGenderLabel(data.row.gender)}</span> }
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
            default: (data) => <span>{data.row.headteacherUserName || '--'}</span>
        }
    },
    {
        field: 'serviceStatus',
        label: '服务状态',
        width: '100px',
        slots: {
            default: (data) => (
                <span>{StudentCenterApi.getStudentServiceStatusLabel(data.row.serviceStatus)}</span>
            )
        }
    },
    {
        field: 'courseStatus',
        label: '开课状态',
        width: '100px',
        slots: {
            default: (data) => (
                <span>{StudentCenterApi.getStudentCourseStatusLabel(data.row.courseStatus)}</span>
            )
        }
    },
    {
        field: 'studentRemark',
        label: '学员备注',
        minWidth: '180px',
        showOverflowTooltip: true
    },
    { field: 'enrollTime', label: '报名时间', minWidth: '170px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '220px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <div class="flex items-center justify-center">
                    <BaseButton link type="primary" onClick={() => openDetail(data.row.clueId)}>
                        详情
                    </BaseButton>
                    <BaseButton link type="primary" onClick={() => openStudentEditForm(data.row)}>
                        编辑
                    </BaseButton>
                    {canCreateAftersales ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() =>
                                handleCreateAftersales(
                                    data.row as StudentCenterApi.StudentCenterPageRespVO
                                )
                            }
                        >
                            新增工单
                        </BaseButton>
                    ) : null}
                </div>
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
    tableMethods.setSearchParams(buildListParams())
})
</script>
