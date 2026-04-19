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
      @register="tableRegister"
    />
  </ContentWrap>

  <ProductForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { ElLink } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as ProductApi from '@/api/crm/product'
import ProductForm from './ProductForm.vue'
import { erpPriceTableColumnFormatter } from '@/utils'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'CrmProduct' })

const canCreate = hasPermission(['crm:product:create'])
const canUpdate = hasPermission(['crm:product:update'])
const canDelete = hasPermission(['crm:product:delete'])
const canExport = hasPermission(['crm:product:export'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '产品名称',
    component: 'Input',
    componentProps: { placeholder: '请输入产品名称', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.CRM_PRODUCT_STATUS),
      style: { width: '240px' }
    }
  }
])

const formRef = ref<InstanceType<typeof ProductForm>>()
const { push } = useRouter()

const { tableObject, tableMethods, register: tableRegister } = useTable<ProductApi.ProductVO>({
  getListApi: async (params) => await ProductApi.getProductPage(params),
  delListApi: async (id) => await ProductApi.deleteProduct(id as number),
  exportListApi: async (params) => await ProductApi.exportProduct(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)
const openForm = (type: string, id?: number) => formRef.value?.open(type, id)
const openDetail = (id: number) => push({ name: 'CrmProductDetail', params: { id } })

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleExport = async () => {
  await tableMethods.exportList('产品.xls')
}

const tableColumns = reactive<TableColumn[]>([
  {
    field: 'name',
    label: '产品名称',
    width: '160px',
    slots: {
      default: (data) => (
        <ElLink underline={false} type="primary" onClick={() => openDetail(data.row.id)}>
          {data.row.name}
        </ElLink>
      )
    }
  },
  { field: 'categoryName', label: '产品类型', width: '160px' },
  {
    field: 'unit',
    label: '产品单位',
    slots: { default: (data) => <DictTag type={DICT_TYPE.CRM_PRODUCT_UNIT} value={data.row.unit} /> }
  },
  { field: 'no', label: '产品编码' },
  { field: 'price', label: '价格（元）', width: '100px', formatter: erpPriceTableColumnFormatter },
  { field: 'description', label: '产品描述', width: '150px' },
  {
    field: 'status',
    label: '上架状态',
    width: '120px',
    slots: { default: (data) => <DictTag type={DICT_TYPE.CRM_PRODUCT_STATUS} value={data.row.status} /> }
  },
  { field: 'ownerUserName', label: '负责人', width: '120px' },
  { field: 'updateTime', label: '更新时间', width: '180px', formatter: dateFormatter },
  { field: 'creatorName', label: '创建人', width: '120px' },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '160px',
    fixed: 'right',
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

onActivated(() => {
  tableMethods.getList()
})

onMounted(() => {
  tableMethods.getList()
})
</script>
