<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="getList" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
    </div>
    <Table :columns="tableColumns" :data="list" :loading="loading" row-key="id" default-expand-all />
  </ContentWrap>

  <ProductCategoryForm ref="formRef" @success="getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as ProductCategoryApi from '@/api/crm/product/category'
import ProductCategoryForm from './ProductCategoryForm.vue'
import { handleTree } from '@/utils/tree'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'CrmProductCategory' })

const message = useMessage()
const { t } = useI18n()

const canCreate = hasPermission(['crm:product-category:create'])
const canUpdate = hasPermission(['crm:product-category:update'])
const canDelete = hasPermission(['crm:product-category:delete'])

const searchParams = reactive<Recordable>({ name: undefined })
const loading = ref(true)
const list = ref<any[]>([])
const formRef = ref<InstanceType<typeof ProductCategoryForm>>()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '名称',
    component: 'Input',
    componentProps: { placeholder: '请输入名称', clearable: true, style: { width: '240px' } }
  }
])

const setSearchParams = (params: Recordable) => {
  Object.assign(searchParams, params)
  getList()
}

const getList = async () => {
  loading.value = true
  try {
    const data = await ProductCategoryApi.getProductCategoryList(searchParams)
    list.value = handleTree(data, 'id', 'parentId')
  } finally {
    loading.value = false
  }
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProductCategoryApi.deleteProductCategory(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'id', label: '分类编号' },
  { field: 'name', label: '分类名称' },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
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
