<!-- ERP 产品库存列表 -->
<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
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
      :stripe="true"
      :show-overflow-tooltip="true"
      @register="tableRegister"
    />
  </ContentWrap>
</template>

<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue'
import { StockApi, StockVO } from '@/api/erp/stock/stock'
import { ProductApi, ProductVO } from '@/api/erp/product/product'
import { WarehouseApi, WarehouseVO } from '@/api/erp/stock/warehouse'
import { erpCountTableColumnFormatter } from '@/utils'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ErpStock' })

const canExport = hasPermission(['erp:stock:export'])

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
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<StockVO>({
  getListApi: async (params) => await StockApi.getStockPage(params),
  exportListApi: async (params) => await StockApi.exportStock(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleExport = async () => {
  await tableMethods.exportList('产品库存.xls')
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'productName', label: '产品名称', align: 'center' },
  { field: 'unitName', label: '产品单位', align: 'center' },
  { field: 'categoryName', label: '产品分类', align: 'center' },
  {
    field: 'count',
    label: '库存量',
    align: 'center',
    formatter: erpCountTableColumnFormatter
  },
  { field: 'warehouseName', label: '仓库', align: 'center' }
])

onMounted(async () => {
  await tableMethods.getList()
  productList.value = await ProductApi.getProductSimpleList()
  warehouseList.value = await WarehouseApi.getWarehouseSimpleList()
})
</script>
