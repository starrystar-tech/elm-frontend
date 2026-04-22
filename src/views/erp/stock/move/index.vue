<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton v-if="canExport" type="primary" plain :loading="exportLoading" @click="handleExport">
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

  <StockMoveForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter2 } from '@/utils/formatTime'
import { StockMoveApi, StockMoveVO } from '@/api/erp/stock/move'
import StockMoveForm from './StockMoveForm.vue'
import { ProductApi, ProductVO } from '@/api/erp/product/product'
import { WarehouseApi, WarehouseVO } from '@/api/erp/stock/warehouse'
import { UserVO } from '@/api/system/user'
import * as UserApi from '@/api/system/user'
import { erpCountTableColumnFormatter, erpPriceTableColumnFormatter } from '@/utils'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ErpStockMove' })

const canCreate = hasPermission(['erp:stock-move:create'])
const canQuery = hasPermission(['erp:stock-move:query'])
const canUpdate = hasPermission(['erp:stock-move:update'])
const canUpdateStatus = hasPermission(['erp:stock-move:update-status'])
const canDelete = hasPermission(['erp:stock-move:delete'])
const canExport = hasPermission(['erp:stock-move:export'])

const message = useMessage()
const formRef = ref()
const productList = ref<ProductVO[]>([])
const warehouseList = ref<WarehouseVO[]>([])
const userList = ref<UserVO[]>([])
const selectionList = ref<StockMoveVO[]>([])

const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'no',
    label: '调度单号',
    component: 'Input',
    componentProps: { placeholder: '请输入调度单号', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'productId',
    label: '产品',
    component: 'Select',
    componentProps: {
      placeholder: '请选择产品',
      clearable: true,
      filterable: true,
      options: productList.value.map((item) => ({ label: item.name, value: item.id })),
      style: { width: '240px' }
    }
  },
  {
    field: 'moveTime',
    label: '调度时间',
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
    field: 'fromWarehouseId',
    label: '仓库',
    component: 'Select',
    componentProps: {
      placeholder: '请选择仓库',
      clearable: true,
      filterable: true,
      options: warehouseList.value.map((item) => ({ label: item.name, value: item.id })),
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
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<StockMoveVO>({
  getListApi: async (params) => await StockMoveApi.getStockMovePage(params),
  exportListApi: async (params) => await StockMoveApi.exportStockMove(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleSelectionChange = (rows: StockMoveVO[]) => {
  selectionList.value = rows
}

const handleDelete = async (ids: number[]) => {
  try {
    await message.delConfirm()
    await StockMoveApi.deleteStockMove(ids)
    message.success('删除成功')
    selectionList.value = selectionList.value.filter((item) => !ids.includes(item.id))
    await tableMethods.getList()
  } catch {}
}

const handleUpdateStatus = async (id: number, status: number) => {
  try {
    await message.confirm(`确定${status === 20 ? '审批' : '反审批'}该调度单吗？`)
    await StockMoveApi.updateStockMoveStatus(id, status)
    message.success(`${status === 20 ? '审批' : '反审批'}成功`)
    await tableMethods.getList()
  } catch {}
}

const handleExport = async () => {
  await tableMethods.exportList('库存调度单.xls')
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'no', label: '调度单号', align: 'center', minWidth: '180' },
  { field: 'productNames', label: '产品信息', align: 'center', minWidth: '200' },
  { field: 'moveTime', label: '调度时间', align: 'center', width: '120px', formatter: dateFormatter2 },
  { field: 'creatorName', label: '创建人', align: 'center' },
  {
    field: 'totalCount',
    label: '数量',
    align: 'center',
    formatter: erpCountTableColumnFormatter
  },
  {
    field: 'totalPrice',
    label: '金额',
    align: 'center',
    formatter: erpPriceTableColumnFormatter
  },
  {
    field: 'status',
    label: '状态',
    align: 'center',
    width: '90',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.ERP_AUDIT_STATUS} value={data.row.status} />
    }
  },
  {
    field: 'action',
    label: '操作',
    align: 'center',
    width: '220',
    fixed: 'right',
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
  productList.value = await ProductApi.getProductSimpleList()
  warehouseList.value = await WarehouseApi.getWarehouseSimpleList()
  userList.value = await UserApi.getSimpleUserList()
})
</script>
