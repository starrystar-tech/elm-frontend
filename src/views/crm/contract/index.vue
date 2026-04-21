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

    <ContractForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, ref, watch } from 'vue'
import { ElLink, type TabsPaneContext } from 'element-plus'
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import * as ContractApi from '@/api/crm/contract'
import ContractForm from './ContractForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import { erpPriceInputFormatter, erpPriceTableColumnFormatter } from '@/utils'
import * as CustomerApi from '@/api/crm/customer'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'CrmContract' })

const canCreate = hasPermission(['crm:contract:create'])
const canUpdate = hasPermission(['crm:contract:update'])
const canDelete = hasPermission(['crm:contract:delete'])
const canQuery = hasPermission(['crm:contract:query'])
const canExport = hasPermission(['crm:contract:export'])

const activeName = ref('1')
const customerList = ref<CustomerApi.CustomerVO[]>([])
const formRef = ref<InstanceType<typeof ContractForm>>()
const { currentRoute, push } = useRouter()

const searchSchema = computed<FormSchema[]>(() => [
    {
        field: 'no',
        label: '合同编号',
        component: 'Input',
        componentProps: {
            placeholder: '请输入合同编号',
            clearable: true,
            style: { width: '240px' }
        }
    },
    {
        field: 'name',
        label: '合同名称',
        component: 'Input',
        componentProps: {
            placeholder: '请输入合同名称',
            clearable: true,
            style: { width: '240px' }
        }
    },
    {
        field: 'customerId',
        label: '客户',
        component: 'Select',
        componentProps: {
            placeholder: '请选择客户',
            clearable: true,
            options: customerList.value.map((item) => ({ label: item.name, value: item.id })),
            style: { width: '240px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ContractApi.ContractVO>({
    getListApi: async (params) =>
        await ContractApi.getContractPage({
            ...params,
            sceneType: activeName.value
        }),
    delListApi: async (id) => await ContractApi.deleteContract(id as number),
    exportListApi: async (params) =>
        await ContractApi.exportContract({
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

const handleDelete = async (id: number) => {
    await tableMethods.delList(id, false)
}

const handleExport = async () => {
    await tableMethods.exportList('合同.xls')
}

const handleSubmit = async (row: ContractApi.ContractVO) => {
    const message = useMessage()
    await message.confirm(`您确定提交【${row.name}】审核吗？`)
    await ContractApi.submitContract(row.id)
    message.success('提交审核成功！')
    await tableMethods.getList()
}

const handleProcessDetail = (row: ContractApi.ContractVO) => {
    push({ name: 'BpmProcessInstanceDetail', query: { id: row.processInstanceId } })
}

const openDetail = (id: number) => {
    push({ name: 'CrmContractDetail', params: { id } })
}

const openCustomerDetail = (id: number) => {
    push({ name: 'CrmCustomerDetail', params: { id } })
}

const openContactDetail = (id: number) => {
    push({ name: 'CrmContactDetail', params: { id } })
}

const openBusinessDetail = (id: number) => {
    push({ name: 'CrmBusinessDetail', params: { id } })
}

const tableColumns: TableColumn[] = [
    { field: 'no', label: '合同编号', width: '180px', fixed: 'left' },
    {
        field: 'name',
        label: '合同名称',
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
        field: 'customerName',
        label: '客户名称',
        width: '120px',
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
    {
        field: 'businessName',
        label: '商机名称',
        width: '130px',
        slots: {
            default: (data) =>
                data.row.businessId ? (
                    <ElLink
                        underline={false}
                        type="primary"
                        onClick={() => openBusinessDetail(data.row.businessId)}
                    >
                        {data.row.businessName}
                    </ElLink>
                ) : (
                    data.row.businessName || ''
                )
        }
    },
    {
        field: 'totalPrice',
        label: '合同金额（元）',
        width: '140px',
        formatter: erpPriceTableColumnFormatter
    },
    { field: 'orderDate', label: '下单时间', width: '120px', formatter: dateFormatter2 },
    { field: 'startTime', label: '合同开始时间', width: '120px', formatter: dateFormatter2 },
    { field: 'endTime', label: '合同结束时间', width: '120px', formatter: dateFormatter2 },
    {
        field: 'contactName',
        label: '客户签约人',
        width: '130px',
        slots: {
            default: (data) =>
                data.row.signContactId ? (
                    <ElLink
                        underline={false}
                        type="primary"
                        onClick={() => openContactDetail(data.row.signContactId)}
                    >
                        {data.row.signContactName}
                    </ElLink>
                ) : (
                    data.row.signContactName || ''
                )
        }
    },
    { field: 'signUserName', label: '公司签约人', width: '130px' },
    { field: 'remark', label: '备注', width: '200px' },
    {
        field: 'totalReceivablePrice',
        label: '已回款金额（元）',
        width: '140px',
        formatter: erpPriceTableColumnFormatter
    },
    {
        field: 'unreceivedPrice',
        label: '未回款金额（元）',
        width: '140px',
        slots: {
            default: (data) => (
                <>{erpPriceInputFormatter(data.row.totalPrice - data.row.totalReceivablePrice)}</>
            )
        }
    },
    { field: 'contactLastTime', label: '最后跟进时间', width: '180px', formatter: dateFormatter },
    { field: 'ownerUserName', label: '负责人', width: '120px' },
    { field: 'ownerUserDeptName', label: '所属部门', width: '100px' },
    { field: 'updateTime', label: '更新时间', width: '180px', formatter: dateFormatter },
    { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
    { field: 'creatorName', label: '创建人', width: '120px' },
    {
        field: 'auditStatus',
        label: '合同状态',
        width: '120px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <DictTag type={DICT_TYPE.CRM_AUDIT_STATUS} value={data.row.auditStatus} />
            )
        }
    },
    {
        field: 'action',
        label: '操作',
        width: '250px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <>
                    {canUpdate && data.row.auditStatus === 0 ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => openForm('update', data.row.id)}
                        >
                            编辑
                        </BaseButton>
                    ) : null}
                    {canUpdate && data.row.auditStatus === 0 ? (
                        <BaseButton link type="primary" onClick={() => handleSubmit(data.row)}>
                            提交审核
                        </BaseButton>
                    ) : null}
                    {canUpdate && data.row.auditStatus !== 0 ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => handleProcessDetail(data.row)}
                        >
                            查看审批
                        </BaseButton>
                    ) : null}
                    {canQuery ? (
                        <BaseButton link type="primary" onClick={() => openDetail(data.row.id)}>
                            详情
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

watch(
    () => currentRoute.value,
    () => {
        tableMethods.getList()
    }
)

onMounted(async () => {
    tableMethods.setSearchParams({ sceneType: activeName.value })
    customerList.value = await CustomerApi.getCustomerSimpleList()
})
</script>
