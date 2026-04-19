<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <el-tabs v-model="activeName" @tab-click="handleTabClick">
      <el-tab-pane label="我负责的" name="1" />
      <el-tab-pane label="我参与的" name="2" />
      <el-tab-pane label="下属负责的" name="3" />
    </el-tabs>
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton v-if="canExport" type="success" :loading="exportLoading" @click="handleExport">
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

  <ReceivableForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, ref } from 'vue'
import { ElLink, type TabsPaneContext } from 'element-plus'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter, dateFormatter2 } from '@/utils/formatTime'
import * as ReceivableApi from '@/api/crm/receivable'
import ReceivableForm from './ReceivableForm.vue'
import * as CustomerApi from '@/api/crm/customer'
import { erpPriceInputFormatter, erpPriceTableColumnFormatter } from '@/utils'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'Receivable' })

const canCreate = hasPermission(['crm:receivable:create'])
const canUpdate = hasPermission(['crm:receivable:update'])
const canDelete = hasPermission(['crm:receivable:delete'])
const canExport = hasPermission(['crm:receivable:export'])

const activeName = ref('1')
const customerList = ref<CustomerApi.CustomerVO[]>([])
const formRef = ref<InstanceType<typeof ReceivableForm>>()
const { push } = useRouter()

const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'no',
    label: '回款编号',
    component: 'Input',
    componentProps: { placeholder: '请输入回款编号', clearable: true, style: { width: '240px' } }
  },
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
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<ReceivableApi.ReceivableVO>({
  getListApi: async (params) =>
    await ReceivableApi.getReceivablePage({
      ...params,
      sceneType: activeName.value
    }),
  delListApi: async (id) => await ReceivableApi.deleteReceivable(id as number),
  exportListApi: async (params) =>
    await ReceivableApi.exportReceivable({
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

const handleSubmit = async (row: ReceivableApi.ReceivableVO) => {
  const message = useMessage()
  await message.confirm(`您确定提交编号为【${row.no}】的回款审核吗？`)
  await ReceivableApi.submitReceivable(row.id)
  message.success('提交审核成功！')
  await tableMethods.getList()
}

const handleProcessDetail = (row: ReceivableApi.ReceivableVO) => {
  push({ name: 'BpmProcessInstanceDetail', query: { id: row.processInstanceId } })
}

const openDetail = (id: number) => {
  push({ name: 'CrmReceivableDetail', params: { id } })
}

const openCustomerDetail = (id: number) => {
  push({ name: 'CrmCustomerDetail', params: { id } })
}

const openContractDetail = (id: number) => {
  push({ name: 'CrmContractDetail', params: { id } })
}

const handleExport = async () => {
  await tableMethods.exportList('回款.xls')
}

const tableColumns: TableColumn[] = [
  {
    field: 'no',
    label: '回款编号',
    width: '180px',
    fixed: 'left',
    slots: {
      default: (data) => (
        <ElLink underline={false} type="primary" onClick={() => openDetail(data.row.id)}>
          {data.row.no}
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
        <ElLink underline={false} type="primary" onClick={() => openCustomerDetail(data.row.customerId)}>
          {data.row.customerName}
        </ElLink>
      )
    }
  },
  {
    field: 'contractNo',
    label: '合同编号',
    width: '180px',
    slots: {
      default: (data) =>
        data.row.contractId ? (
          <ElLink underline={false} type="primary" onClick={() => openContractDetail(data.row.contractId)}>
            {data.row.contract?.no}
          </ElLink>
        ) : (
          data.row.contract?.no || ''
        )
    }
  },
  { field: 'returnTime', label: '回款日期', width: '150px', formatter: dateFormatter2 },
  { field: 'price', label: '回款金额(元)', width: '140px', formatter: erpPriceTableColumnFormatter },
  {
    field: 'returnType',
    label: '回款方式',
    width: '130px',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.CRM_RECEIVABLE_RETURN_TYPE} value={data.row.returnType} />
    }
  },
  { field: 'remark', label: '备注', width: '200px' },
  {
    field: 'contractTotalPrice',
    label: '合同金额（元）',
    width: '140px',
    slots: {
      default: (data) => <>{erpPriceInputFormatter(data.row.contract?.totalPrice || 0)}</>
    }
  },
  { field: 'ownerUserName', label: '负责人', width: '120px' },
  { field: 'ownerUserDeptName', label: '所属部门', width: '100px' },
  { field: 'updateTime', label: '更新时间', width: '180px', formatter: dateFormatter },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  { field: 'creatorName', label: '创建人', width: '120px' },
  {
    field: 'auditStatus',
    label: '回款状态',
    width: '120px',
    fixed: 'right',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.CRM_AUDIT_STATUS} value={data.row.auditStatus} />
    }
  },
  {
    field: 'action',
    label: '操作',
    width: '180px',
    fixed: 'right',
    slots: {
      default: (data) => (
        <>
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>
              编辑
            </BaseButton>
          ) : null}
          {canUpdate && data.row.auditStatus === 0 ? (
            <BaseButton link type="primary" onClick={() => handleSubmit(data.row)}>
              提交审核
            </BaseButton>
          ) : null}
          {canUpdate && data.row.auditStatus !== 0 ? (
            <BaseButton link type="primary" onClick={() => handleProcessDetail(data.row)}>
              查看审批
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
