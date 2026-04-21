<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton v-if="canExport" type="success" :loading="exportLoading" @click="handleExport">
        导出
      </BaseButton>
      <BaseButton
        v-if="canDelete"
        type="danger"
        :disabled="selectionList.length === 0"
        @click="handleDelete(selectionList.map((item) => item.id))"
      >
        删除
      </BaseButton>
    </div>
    <Table
      v-model:currentPage="tableObject.currentPage"
      v-model:pageSize="tableObject.pageSize"
      :columns="tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{ total: tableObject.total }"
      :stripe="true"
      :show-overflow-tooltip="true"
      selection
      @register="tableRegister"
      @selection-change="handleSelectionChange"
    />
  </ContentWrap>

  <FinanceReceiptForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter2 } from '@/utils/formatTime'
import { FinanceReceiptApi, FinanceReceiptVO } from '@/api/erp/finance/receipt'
import FinanceReceiptForm from './FinanceReceiptForm.vue'
import { UserVO } from '@/api/system/user'
import * as UserApi from '@/api/system/user'
import { erpPriceTableColumnFormatter } from '@/utils'
import { SupplierApi, SupplierVO } from '@/api/erp/purchase/supplier'
import { AccountApi, AccountVO } from '@/api/erp/finance/account'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ErpFinanceReceipt' })

const canCreate = hasPermission(['erp:finance-receipt:create'])
const canQuery = hasPermission(['erp:finance-receipt:query'])
const canUpdate = hasPermission(['erp:finance-receipt:update'])
const canUpdateStatus = hasPermission(['erp:finance-receipt:update-status'])
const canDelete = hasPermission(['erp:finance-receipt:delete'])
const canExport = hasPermission(['erp:finance-receipt:export'])

const message = useMessage()
const formRef = ref()
const supplierList = ref<SupplierVO[]>([])
const userList = ref<UserVO[]>([])
const accountList = ref<AccountVO[]>([])
const selectionList = ref<FinanceReceiptVO[]>([])

const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'no',
    label: '收款单号',
    component: 'Input',
    componentProps: { placeholder: '请输入收款单号', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'receiptTime',
    label: '收款时间',
    component: 'DatePicker',
    componentProps: {
      type: 'daterange',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
      style: { width: '240px' }
    }
  },
  {
    field: 'supplierId',
    label: '供应商',
    component: 'Select',
    componentProps: {
      placeholder: '请选择供应商',
      clearable: true,
      filterable: true,
      options: supplierList.value.map((item) => ({ label: item.name, value: item.id })),
      style: { width: '240px' }
    }
  },
  {
    field: 'creator',
    label: '创建人',
    component: 'Select',
    componentProps: {
      placeholder: '请选择创建人',
      clearable: true,
      filterable: true,
      options: userList.value.map((item) => ({ label: item.nickname, value: item.id })),
      style: { width: '240px' }
    }
  },
  {
    field: 'financeUserId',
    label: '财务人员',
    component: 'Select',
    componentProps: {
      placeholder: '请选择财务人员',
      clearable: true,
      filterable: true,
      options: userList.value.map((item) => ({ label: item.nickname, value: item.id })),
      style: { width: '240px' }
    }
  },
  {
    field: 'accountId',
    label: '收款账户',
    component: 'Select',
    componentProps: {
      placeholder: '请选择收款账户',
      clearable: true,
      filterable: true,
      options: accountList.value.map((item) => ({ label: item.name, value: item.id })),
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.ERP_AUDIT_STATUS),
      style: { width: '240px' }
    }
  },
  {
    field: 'remark',
    label: '备注',
    component: 'Input',
    componentProps: { placeholder: '请输入备注', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'bizNo',
    label: '采购单号',
    component: 'Input',
    componentProps: { placeholder: '请输入采购单号', clearable: true, style: { width: '240px' } }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<FinanceReceiptVO>({
  getListApi: async (params) => await FinanceReceiptApi.getFinanceReceiptPage(params),
  exportListApi: async (params) => await FinanceReceiptApi.exportFinanceReceipt(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleSelectionChange = (rows: FinanceReceiptVO[]) => {
  selectionList.value = rows
}

const handleDelete = async (ids: number[]) => {
  try {
    await message.delConfirm()
    await FinanceReceiptApi.deleteFinanceReceipt(ids)
    message.success('删除成功')
    selectionList.value = selectionList.value.filter((item) => !ids.includes(item.id))
    await tableMethods.getList()
  } catch {}
}

const handleUpdateStatus = async (id: number, status: number) => {
  try {
    await message.confirm(`确定${status === 20 ? '审批' : '反审批'}该收款单吗？`)
    await FinanceReceiptApi.updateFinanceReceiptStatus(id, status)
    message.success(`${status === 20 ? '审批' : '反审批'}成功`)
    await tableMethods.getList()
  } catch {}
}

const handleExport = async () => {
  await tableMethods.exportList('收款单.xls')
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'no', label: '收款单号', minWidth: '180', align: 'center' },
  { field: 'supplierName', label: '供应商', align: 'center' },
  {
    field: 'receiptTime',
    label: '收款时间',
    width: '120px',
    align: 'center',
    formatter: dateFormatter2
  },
  { field: 'creatorName', label: '创建人', align: 'center' },
  { field: 'financeUserName', label: '财务人员', align: 'center' },
  { field: 'accountName', label: '收款账户', align: 'center' },
  { field: 'totalPrice', label: '合计收款', align: 'center', formatter: erpPriceTableColumnFormatter },
  {
    field: 'discountPrice',
    label: '优惠金额',
    align: 'center',
    formatter: erpPriceTableColumnFormatter
  },
  {
    field: 'receiptPrice',
    label: '实际收款',
    align: 'center',
    formatter: erpPriceTableColumnFormatter
  },
  {
    field: 'status',
    label: '状态',
    width: '90',
    align: 'center',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.ERP_AUDIT_STATUS} value={data.row.status} />
    }
  },
  {
    field: 'action',
    label: '操作',
    width: '220',
    fixed: 'right',
    align: 'center',
    slots: {
      default: (data) => (
        <>
          {canQuery ? (
            <BaseButton link onClick={() => openForm('detail', data.row.id)}>
              详情
            </BaseButton>
          ) : null}
          {canUpdate ? (
            <BaseButton
              link
              type="primary"
              disabled={data.row.status === 20}
              onClick={() => openForm('update', data.row.id)}
            >
              编辑
            </BaseButton>
          ) : null}
          {canUpdateStatus && data.row.status === 10 ? (
            <BaseButton
              link
              type="primary"
              onClick={() => handleUpdateStatus(data.row.id, 20)}
            >
              审批
            </BaseButton>
          ) : null}
          {canUpdateStatus && data.row.status !== 10 ? (
            <BaseButton
              link
              type="danger"
              onClick={() => handleUpdateStatus(data.row.id, 10)}
            >
              反审批
            </BaseButton>
          ) : null}
          {canDelete ? (
            <BaseButton link type="danger" onClick={() => handleDelete([data.row.id])}>
              删除
            </BaseButton>
          ) : null}
        </>
      )
    }
  }
])

onMounted(async () => {
  await tableMethods.getList()
  supplierList.value = await SupplierApi.getSupplierSimpleList()
  userList.value = await UserApi.getSimpleUserList()
  accountList.value = await AccountApi.getAccountSimpleList()
})
</script>
