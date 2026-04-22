<!-- ERP 产品库存明细列表 -->
<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canExport" type="primary" plain :loading="exportLoading" @click="handleExport">
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
      :stripe="true"
      :show-overflow-tooltip="true"
      @register="tableRegister"
    />
  </ContentWrap>
</template>

<script setup lang="tsx">
import { computed, onActivated, onMounted, ref } from 'vue'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { StockRecordApi, StockRecordVO } from '@/api/erp/stock/record'
import { ProductApi, ProductVO } from '@/api/erp/product/product'
import { WarehouseApi, WarehouseVO } from '@/api/erp/stock/warehouse'
import { erpCountTableColumnFormatter } from '@/utils'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ErpStockRecord' })

const canExport = hasPermission(['erp:stock-record:export'])

const productList = ref<ProductVO[]>([])
const warehouseList = ref<WarehouseVO[]>([])

const searchSchema = computed<FormSchema[]>(() => [
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
    field: 'warehouseId',
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
    field: 'bizType',
    label: '类型',
    component: 'Select',
    componentProps: {
      placeholder: '请选择类型',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.ERP_STOCK_RECORD_BIZ_TYPE),
      style: { width: '240px' }
    }
  },
  {
    field: 'bizNo',
    label: '业务单号',
    component: 'Input',
    componentProps: { placeholder: '请输入业务单号', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'createTime',
    label: '创建时间',
    component: 'DatePicker',
    componentProps: {
      type: 'daterange',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
      style: { width: '240px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<StockRecordVO>({
  getListApi: async (params) => await StockRecordApi.getStockRecordPage(params),
  exportListApi: async (params) => await StockRecordApi.exportStockRecord(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleExport = async () => {
  await tableMethods.exportList('产品库存明细.xls')
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'productName', label: '产品名称', align: 'center' },
  { field: 'categoryName', label: '产品分类', align: 'center' },
  { field: 'unitName', label: '产品单位', align: 'center' },
  { field: 'warehouseName', label: '仓库编号', align: 'center' },
  {
    field: 'bizType',
    label: '类型',
    minWidth: '100',
    align: 'center',
    slots: {
      default: (data) => (
        <DictTag type={DICT_TYPE.ERP_STOCK_RECORD_BIZ_TYPE} value={data.row.bizType} />
      )
    }
  },
  { field: 'bizNo', label: '出入库单号', width: '200', align: 'center' },
  { field: 'createTime', label: '出入库日期', width: '180px', align: 'center', formatter: dateFormatter },
  { field: 'count', label: '出入库数量', align: 'center', formatter: erpCountTableColumnFormatter },
  {
    field: 'totalCount',
    label: '库存量',
    align: 'center',
    formatter: erpCountTableColumnFormatter
  },
  { field: 'creatorName', label: '操作人', align: 'center' }
])

onActivated(() => {
  tableMethods.getList()
})

onMounted(async () => {
  await tableMethods.getList()
  productList.value = await ProductApi.getProductSimpleList()
  warehouseList.value = await WarehouseApi.getWarehouseSimpleList()
})
</script>
