<template>
    <ContentWrap>
        <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
        <el-tabs v-model="activeName" @tab-click="handleTabClick" class="list-tabs-compact">
            <el-tab-pane label="我负责的" name="1" />
            <el-tab-pane label="下属负责的" name="3" />
        </el-tabs>
        <div class="mb-10px">
            <BaseButton v-if="canCreate" type="primary" @click="openForm('create')"
                >新增</BaseButton
            >
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
            :show-overflow-tooltip="true"
            :stripe="true"
            @register="tableRegister"
        />
    </ContentWrap>

    <ReceivablePlanForm ref="formRef" @success="tableMethods.getList" />
    <ReceivableForm ref="receivableFormRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, ref } from 'vue'
import { ElLink, ElText, type TabsPaneContext } from 'element-plus'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import * as ReceivablePlanApi from '@/api/crm/receivable/plan'
import ReceivablePlanForm from './ReceivablePlanForm.vue'
import * as CustomerApi from '@/api/crm/customer'
import { erpPriceInputFormatter, erpPriceTableColumnFormatter } from '@/utils'
import ReceivableForm from '@/views/crm/receivable/ReceivableForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ReceivablePlan' })

const canCreate = hasPermission(['crm:receivable-plan:create'])
const canUpdate = hasPermission(['crm:receivable-plan:update'])
const canDelete = hasPermission(['crm:receivable-plan:delete'])
const canCreateReceivable = hasPermission(['crm:receivable:create'])
const canExport = hasPermission(['crm:receivable-plan:export'])

const activeName = ref('1')
const customerList = ref<CustomerApi.CustomerVO[]>([])
const formRef = ref<InstanceType<typeof ReceivablePlanForm>>()
const receivableFormRef = ref<InstanceType<typeof ReceivableForm>>()
const { push } = useRouter()

const searchSchema = computed<FormSchema[]>(() => [
    {
        field: 'customerId',
        label: '客户名称',
        component: 'Select',
        componentProps: {
            placeholder: '请选择客户',
            clearable: true,
            options: customerList.value.map((item) => ({ label: item.name, value: item.id })),
            style: { width: '240px' }
        }
    },
    {
        field: 'contractNo',
        label: '合同编号',
        component: 'Input',
        componentProps: {
            placeholder: '请输入合同编号',
            clearable: true,
            style: { width: '240px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ReceivablePlanApi.ReceivablePlanVO>({
    getListApi: async (params) =>
        await ReceivablePlanApi.getReceivablePlanPage({
            ...params,
            sceneType: activeName.value
        }),
    delListApi: async (id) => await ReceivablePlanApi.deleteReceivablePlan(id as number),
    exportListApi: async (params) =>
        await ReceivablePlanApi.exportReceivablePlan({
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

const openForm = (type: string, id?: number) => {
    formRef.value?.open(type, id)
}

const openReceivableForm = (row: ReceivablePlanApi.ReceivablePlanVO) => {
    receivableFormRef.value?.open('create', undefined, row)
}

const handleDelete = async (id: number) => {
    await tableMethods.delList(id, false)
}

const handleExport = async () => {
    await tableMethods.exportList('回款计划.xls')
}

const openDetail = (id: number) => {
    push({ name: 'CrmReceivablePlanDetail', params: { id } })
}

const openCustomerDetail = (id: number) => {
    push({ name: 'CrmCustomerDetail', params: { id } })
}

const tableColumns: TableColumn[] = [
    {
        field: 'customerName',
        label: '客户名称',
        width: '150px',
        fixed: 'left',
        slots: {
            default: (data) => (
                <ElLink
                    underline={false}
                    type="primary"
                    onClick={() => openCustomerDetail(data.row.customerId)}
                >
                    {data.row.customerName}
                </ElLink>
            )
        }
    },
    { field: 'contractNo', label: '合同编号', width: '200px' },
    {
        field: 'period',
        label: '期数',
        slots: {
            default: (data) => (
                <ElLink underline={false} type="primary" onClick={() => openDetail(data.row.id)}>
                    {data.row.period}
                </ElLink>
            )
        }
    },
    {
        field: 'price',
        label: '计划回款金额（元）',
        width: '160px',
        formatter: erpPriceTableColumnFormatter
    },
    { field: 'returnTime', label: '计划回款日期', width: '180px', formatter: dateFormatter2 },
    { field: 'remindDays', label: '提前几天提醒', width: '150px' },
    { field: 'remindTime', label: '提醒日期', width: '180px', formatter: dateFormatter2 },
    {
        field: 'returnType',
        label: '回款方式',
        width: '130px',
        slots: {
            default: (data) => (
                <DictTag type={DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE} value={data.row.returnType} />
            )
        }
    },
    { field: 'remark', label: '备注' },
    { field: 'ownerUserName', label: '负责人', width: '120px' },
    {
        field: 'receivablePrice',
        label: '实际回款金额（元）',
        width: '160px',
        slots: {
            default: (data) => (
                <ElText>
                    {erpPriceInputFormatter(data.row.receivable ? data.row.receivable.price : 0)}
                </ElText>
            )
        }
    },
    {
        field: 'receivableReturnTime',
        label: '实际回款日期',
        width: '180px',
        slots: {
            default: (data) => (
                <>
                    {data.row.receivable
                        ? dateFormatter2(
                              data.row,
                              undefined,
                              data.row.receivable.returnTime,
                              undefined
                          )
                        : ''}
                </>
            )
        }
    },
    {
        field: 'remainingPrice',
        label: '未回款金额（元）',
        width: '160px',
        slots: {
            default: (data) => (
                <ElText>
                    {erpPriceInputFormatter(
                        data.row.receivable
                            ? data.row.price - data.row.receivable.price
                            : data.row.price
                    )}
                </ElText>
            )
        }
    },
    { field: 'updateTime', label: '更新时间', width: '180px', formatter: dateFormatter },
    { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
    { field: 'creatorName', label: '创建人', width: '100px' },
    {
        field: 'action',
        label: '操作',
        width: '180px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <>
                    {canCreateReceivable ? (
                        <BaseButton
                            link
                            type="success"
                            disabled={!!data.row.receivableId}
                            onClick={() => openReceivableForm(data.row)}
                        >
                            创建回款
                        </BaseButton>
                    ) : null}
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
]

onMounted(async () => {
    tableMethods.setSearchParams({ sceneType: activeName.value })
    customerList.value = await CustomerApi.getCustomerSimpleList()
})
</script>
