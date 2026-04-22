<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton v-if="canExport" type="primary" plain :loading="exportLoading" @click="handleExport">
        导出
      </BaseButton>
      <BaseButton type="danger" @click="toggleExpandAll">展开/折叠</BaseButton>
    </div>
    <Table
      v-if="refreshTable"
      :columns="tableColumns"
      :data="list"
      :loading="loading"
      :stripe="true"
      :show-overflow-tooltip="true"
      row-key="id"
      :default-expand-all="isExpandAll"
    />
  </ContentWrap>

  <ProductCategoryForm ref="formRef" @success="getList" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { handleTree } from '@/utils/tree'
import { ProductCategoryApi, ProductCategoryVO } from '@/api/erp/product/category'
import ProductCategoryForm from './ProductCategoryForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ErpProductCategory' })

const canCreate = hasPermission(['erp:product-category:create'])
const canUpdate = hasPermission(['erp:product-category:update'])
const canDelete = hasPermission(['erp:product-category:delete'])
const canExport = hasPermission(['erp:product-category:export'])

const loading = ref(true)
const list = ref<ProductCategoryVO[]>([])
const queryParams = reactive({
  name: undefined,
  status: undefined
})
const formRef = ref<InstanceType<typeof ProductCategoryForm>>()
const exportLoading = ref(false)
const isExpandAll = ref(true)
const refreshTable = ref(true)

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '分类名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入分类名称',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '开启状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择开启状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
      style: { width: '240px' }
    }
  }
])

const getList = async () => {
  loading.value = true
  try {
    const data = await ProductCategoryApi.getProductCategoryList(queryParams)
    list.value = handleTree(data, 'id', 'parentId')
  } finally {
    loading.value = false
  }
}

const setSearchParams = async (params: Recordable) => {
  Object.assign(queryParams, params)
  await getList()
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  const message = useMessage()
  const { t } = useI18n()
  try {
    await message.delConfirm()
    await ProductCategoryApi.deleteProductCategory(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const handleExport = async () => {
  const message = useMessage()
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await ProductCategoryApi.exportProductCategory(queryParams)
    const download = await import('@/utils/download')
    download.default.excel(data, '产品分类.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

const toggleExpandAll = async () => {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  await nextTick()
  refreshTable.value = true
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'code', label: '编码', align: 'center' },
  { field: 'name', label: '名称', align: 'center' },
  { field: 'sort', label: '排序', align: 'center' },
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

onMounted(() => {
  getList()
})
</script>
