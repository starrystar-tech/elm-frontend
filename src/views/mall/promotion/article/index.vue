<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
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

  <ArticleForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, ref } from 'vue'
import { ElImage } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as ArticleApi from '@/api/mall/promotion/article'
import ArticleForm from './ArticleForm.vue'
import * as ArticleCategoryApi from '@/api/mall/promotion/articleCategory'
import { createImageViewer } from '@/components/ImageViewer'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'PromotionArticle' })

const canCreate = hasPermission(['promotion:article:create'])
const canUpdate = hasPermission(['promotion:article:update'])
const canDelete = hasPermission(['promotion:article:delete'])

const categoryList = ref<ArticleCategoryApi.ArticleCategoryVO[]>([])
const formRef = ref<InstanceType<typeof ArticleForm>>()

const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'categoryId',
    label: '文章分类',
    component: 'Select',
    componentProps: {
      placeholder: '全部',
      clearable: true,
      options: categoryList.value.map((item) => ({ label: item.name, value: item.id })),
      style: { width: '240px' }
    }
  },
  {
    field: 'title',
    label: '文章标题',
    component: 'Input',
    componentProps: { placeholder: '请输入文章标题', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
      style: { width: '240px' }
    }
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

const imagePreview = (imgUrl: string) => {
  createImageViewer({ urlList: [imgUrl] })
}

const { tableObject, tableMethods, register: tableRegister } = useTable<ArticleApi.ArticleVO>({
  getListApi: async (params) => await ArticleApi.getArticlePage(params),
  delListApi: async (id) => await ArticleApi.deleteArticle(id as number)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'id', label: 'ID', align: 'center', minWidth: '180px' },
  {
    field: 'picUrl',
    label: '封面',
    align: 'center',
    minWidth: '80px',
    slots: {
      default: (data) => (
        <ElImage
          src={data.row.picUrl}
          class="h-30px w-30px"
          onClick={() => imagePreview(data.row.picUrl)}
        />
      )
    }
  },
  { field: 'title', label: '标题', align: 'center', minWidth: '180px' },
  {
    field: 'categoryId',
    label: '分类',
    align: 'center',
    minWidth: '180px',
    slots: {
      default: (data) => <>{categoryList.value.find((item) => item.id === data.row.categoryId)?.name || ''}</>
    }
  },
  { field: 'browseCount', label: '浏览量', align: 'center', minWidth: '180px' },
  { field: 'author', label: '作者', align: 'center', minWidth: '180px' },
  { field: 'introduction', label: '文章简介', align: 'center', minWidth: '250px' },
  { field: 'sort', label: '排序', align: 'center', minWidth: '60px' },
  {
    field: 'status',
    label: '状态',
    align: 'center',
    minWidth: '60px',
    slots: { default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} /> }
  },
  { field: 'createTime', label: '发布时间', align: 'center', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    align: 'center',
    fixed: 'right',
    width: '120px',
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
  tableMethods.getList()
  categoryList.value =
    (await ArticleCategoryApi.getSimpleArticleCategoryList()) as ArticleCategoryApi.ArticleCategoryVO[]
})
</script>
