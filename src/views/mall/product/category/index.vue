<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
    </div>
    <Table
      :columns="tableColumns"
      :data="list"
      :loading="loading"
      row-key="id"
      default-expand-all
    />
  </ContentWrap>

  <CategoryForm ref="formRef" @success="getList" />
</template>

<script lang="tsx" setup>
import { reactive, ref } from 'vue'
import { DICT_TYPE } from '@/utils/dict'
import { handleTree } from '@/utils/tree'
import { dateFormatter } from '@/utils/formatTime'
import * as ProductCategoryApi from '@/api/mall/product/category'
import CategoryForm from './CategoryForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ProductCategory' })

const canCreate = hasPermission(['product:category:create'])
const canUpdate = hasPermission(['product:category:update'])
const canDelete = hasPermission(['product:category:delete'])
const canQuerySpu = hasPermission(['product:spu:query'])

const loading = ref(true)
const list = ref<any[]>([])
const queryParams = reactive({
  name: undefined
})
const formRef = ref<InstanceType<typeof CategoryForm>>()
const router = useRouter()

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
  }
])

const getList = async () => {
  loading.value = true
  try {
    const data = await ProductCategoryApi.getCategoryList(queryParams)
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
    await ProductCategoryApi.deleteCategory(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const handleViewSpu = (id: number) => {
  router.push({
    name: 'ProductSpu',
    query: { categoryId: id }
  })
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'name', label: '名称', minWidth: '240px', sortable: true },
  {
    field: 'picUrl',
    label: '分类图标',
    align: 'center',
    minWidth: '80px',
    slots: {
      default: (data) => <img src={data.row.picUrl} alt="移动端分类图" class="h-36px" />
    }
  },
  { field: 'sort', label: '排序', align: 'center', minWidth: '150px' },
  {
    field: 'status',
    label: '状态',
    align: 'center',
    minWidth: '150px',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'createTime', label: '创建时间', align: 'center', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    align: 'center',
    minWidth: '180px',
    slots: {
      default: (data) => (
        <>
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>
              编辑
            </BaseButton>
          ) : null}
          {canQuerySpu && data.row.parentId > 0 ? (
            <BaseButton link type="primary" onClick={() => handleViewSpu(data.row.id)}>
              查看商品
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
