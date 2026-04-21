<template>
    <ContentWrap>
        <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
        <el-tabs v-model="activeName" @tab-click="handleTabClick" class="list-tabs-compact">
            <el-tab-pane label="我负责的" name="1" />
            <el-tab-pane label="我参与的" name="2" />
            <el-tab-pane label="下属负责的" name="3" />
        </el-tabs>
        <div class="mb-10px">
            <BaseButton v-if="canCreate" type="primary" @click="openForm('create')"
                >新增</BaseButton
            >
            <BaseButton v-if="canImport" type="warning" @click="handleImport">导入</BaseButton>
            <BaseButton
                v-if="canExport"
                type="success"
                :loading="exportLoading"
                @click="handleExport"
            >
                导出
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
    </ContentWrap>

    <CustomerForm ref="formRef" @success="tableMethods.getList" />
    <CustomerImportForm ref="importFormRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElLink, type TabsPaneContext } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as CustomerApi from '@/api/crm/customer'
import CustomerForm from './CustomerForm.vue'
import CustomerImportForm from './CustomerImportForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'CrmCustomer' })

const canCreate = hasPermission(['crm:customer:create'])
const canUpdate = hasPermission(['crm:customer:update'])
const canDelete = hasPermission(['crm:customer:delete'])
const canImport = hasPermission(['crm:customer:import'])
const canExport = hasPermission(['crm:customer:export'])

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'name',
        label: '客户名称',
        component: 'Input',
        componentProps: {
            placeholder: '请输入客户名称',
            clearable: true,
            style: { width: '240px' }
        }
    },
    {
        field: 'mobile',
        label: '手机',
        component: 'Input',
        componentProps: { placeholder: '请输入手机', clearable: true, style: { width: '240px' } }
    },
    {
        field: 'industryId',
        label: '所属行业',
        component: 'Select',
        componentProps: {
            placeholder: '请选择所属行业',
            clearable: true,
            options: getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_INDUSTRY),
            style: { width: '240px' }
        }
    },
    {
        field: 'level',
        label: '客户级别',
        component: 'Select',
        componentProps: {
            placeholder: '请选择客户级别',
            clearable: true,
            options: getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_LEVEL),
            style: { width: '240px' }
        }
    },
    {
        field: 'source',
        label: '客户来源',
        component: 'Select',
        componentProps: {
            placeholder: '请选择客户来源',
            clearable: true,
            options: getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_SOURCE),
            style: { width: '240px' }
        }
    }
])

const activeName = ref('1')
const formRef = ref<InstanceType<typeof CustomerForm>>()
const importFormRef = ref<InstanceType<typeof CustomerImportForm>>()
const { currentRoute, push } = useRouter()

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<CustomerApi.CustomerVO>({
    getListApi: async (params) =>
        await CustomerApi.getCustomerPage({
            ...params,
            sceneType: activeName.value
        }),
    delListApi: async (id) => await CustomerApi.deleteCustomer(id as number),
    exportListApi: async (params) =>
        await CustomerApi.exportCustomer({
            ...params,
            sceneType: activeName.value
        })
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams({
        ...params,
        sceneType: activeName.value
    })
}

const handleTabClick = (tab: TabsPaneContext) => {
    activeName.value = String(tab.paneName)
    tableMethods.setSearchParams({
        ...(tableObject.params || {}),
        sceneType: activeName.value
    })
}

const openDetail = (id: number) => {
    push({ name: 'CrmCustomerDetail', params: { id } })
}

const openForm = (type: string, id?: number) => {
    formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
    await tableMethods.delList(id, false)
}

const handleImport = () => {
    importFormRef.value?.open()
}

const handleExport = async () => {
    await tableMethods.exportList('客户.xls')
}

const tableColumns = reactive<TableColumn[]>([
    {
        field: 'name',
        label: '客户名称',
        width: '160px',
        fixed: 'left',
        slots: {
            default: (data) => (
                <ElLink underline={false} type="primary" onClick={() => openDetail(data.row.id)}>
                    {data.row.name}
                </ElLink>
            )
        }
    },
    {
        field: 'source',
        label: '客户来源',
        width: '100px',
        slots: {
            default: (data) => (
                <DictTag type={DICT_TYPE.CRM_CUSTOMER_SOURCE} value={data.row.source} />
            )
        }
    },
    { field: 'mobile', label: '手机', width: '120px' },
    { field: 'telephone', label: '电话', width: '130px' },
    { field: 'email', label: '邮箱', width: '180px' },
    {
        field: 'level',
        label: '客户级别',
        width: '135px',
        slots: {
            default: (data) => (
                <DictTag type={DICT_TYPE.CRM_CUSTOMER_LEVEL} value={data.row.level} />
            )
        }
    },
    {
        field: 'industryId',
        label: '客户行业',
        width: '100px',
        slots: {
            default: (data) => (
                <DictTag type={DICT_TYPE.CRM_CUSTOMER_INDUSTRY} value={data.row.industryId} />
            )
        }
    },
    { field: 'contactNextTime', label: '下次联系时间', width: '180px', formatter: dateFormatter },
    { field: 'remark', label: '备注', width: '200px' },
    {
        field: 'lockStatus',
        label: '锁定状态',
        slots: {
            default: (data) => (
                <DictTag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.lockStatus} />
            )
        }
    },
    {
        field: 'dealStatus',
        label: '成交状态',
        slots: {
            default: (data) => (
                <DictTag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.dealStatus} />
            )
        }
    },
    { field: 'contactLastTime', label: '最后跟进时间', width: '180px', formatter: dateFormatter },
    { field: 'contactLastContent', label: '最后跟进记录', width: '200px' },
    { field: 'detailAddress', label: '地址', width: '180px' },
    {
        field: 'poolDay',
        label: '距离进入公海天数',
        width: '140px',
        slots: { default: (data) => <>{data.row.poolDay} 天</> }
    },
    { field: 'ownerUserName', label: '负责人', width: '100px' },
    { field: 'ownerUserDeptName', label: '所属部门', width: '100px' },
    { field: 'updateTime', label: '更新时间', width: '180px', formatter: dateFormatter },
    { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
    { field: 'creatorName', label: '创建人', width: '100px' },
    {
        field: 'action',
        label: '操作',
        minWidth: '150px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <>
                    {canUpdate ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => openForm('update', data.row.id)}
                        >
                            编辑
                        </BaseButton>
                    ) : null}
                    {canDelete ? (
                        <BaseButton link type="danger" onClick={() => handleDelete(data.row.id)}>
                            删除
                        </BaseButton>
                    ) : null}
                </>
            )
        }
    }
])

watch(
    () => currentRoute.value,
    () => {
        tableMethods.getList()
    }
)

onMounted(() => {
    tableMethods.setSearchParams({ sceneType: activeName.value })
})
</script>
