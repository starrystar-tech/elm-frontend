<!-- ERP 产品列表 -->
<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
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
      :stripe="true"
      :show-overflow-tooltip="true"
      @register="tableRegister"
    />
  </ContentWrap>

  <ProductForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { ProductApi, ProductVO } from '@/api/erp/product/product'
import { ProductCategoryApi, ProductCategoryVO } from '@/api/erp/product/category'
import ProductForm from './ProductForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import { defaultProps, handleTree } from '@/utils/tree'
import { erpPriceTableColumnFormatter } from '@/utils'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ErpProduct' })

const canCreate = hasPermission(['erp:product:create'])
const canUpdate = hasPermission(['erp:product:update'])
const canDelete = hasPermission(['erp:product:delete'])
const canExport = hasPermission(['erp:product:export'])

const message = useMessage()
const formRef = ref<InstanceType<typeof ProductForm>>()
const categoryList = ref<ProductCategoryVO[]>([])

const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'name',
    label: '名称',
    component: 'Input',
    componentProps: { placeholder: '请输入名称', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'categoryId',
    label: '分类',
    component: 'TreeSelect',
    componentProps: {
      data: categoryList.value,
      props: defaultProps,
      checkStrictly: true,
      defaultExpandAll: true,
      placeholder: '请输入分类',
      clearable: true,
      style: { width: '240px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<ProductVO>({
  getListApi: async (params) => await ProductApi.getProductPage(params),
  exportListApi: async (params) => await ProductApi.exportProduct(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProductApi.deleteProduct(id)
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const handleExport = async () => {
  await tableMethods.exportList('产品.xls')
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'barCode', label: '条码', align: 'center' },
  { field: 'name', label: '名称', align: 'center' },
  { field: 'standard', label: '规格', align: 'center' },
  { field: 'categoryName', label: '分类', align: 'center' },
  { field: 'unitName', label: '单位', align: 'center' },
  {
    field: 'purchasePrice',
    label: '采购价格',
    align: 'center',
    formatter: erpPriceTableColumnFormatter
  },
  {
    field: 'salePrice',
    label: '销售价格',
    align: 'center',
    formatter: erpPriceTableColumnFormatter
  },
  {
    field: 'minPrice',
    label: '最低价格',
    align: 'center',
    formatter: erpPriceTableColumnFormatter
  },
  {
    field: 'status',
    label: '状态',
    align: 'center',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'createTime', label: '创建时间', align: 'center', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    align: 'center',
    width: '140px',
    slots: {
      default: (data) => (
        <>
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>
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

onMounted(async () => {
  await tableMethods.getList()
  const categoryData = await ProductCategoryApi.getProductCategorySimpleList()
  categoryList.value = handleTree(categoryData, 'id', 'parentId')
})
</script>
