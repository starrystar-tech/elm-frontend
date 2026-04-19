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

  <ArticleCategoryForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { reactive, ref } from 'vue'
import { ElImage } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as ArticleCategoryApi from '@/api/mall/promotion/articleCategory'
import ArticleCategoryForm from './ArticleCategoryForm.vue'
import { createImageViewer } from '@/components/ImageViewer'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'PromotionArticleCategory' })

const canCreate = hasPermission(['promotion:article-category:create'])
const canUpdate = hasPermission(['promotion:article-category:update'])
const canDelete = hasPermission(['promotion:article-category:delete'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '分类名称',
    component: 'Input',
    componentProps: { placeholder: '请输入分类名称', clearable: true, style: { width: '240px' } }
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

const formRef = ref<InstanceType<typeof ArticleCategoryForm>>()
const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await ArticleCategoryApi.getArticleCategoryPage(params),
  delListApi: async (id) => await ArticleCategoryApi.deleteArticleCategory(id as number)
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

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号', align: 'center', minWidth: '100px' },
  { field: 'name', label: '分类名称', align: 'center', minWidth: '240px' },
  {
    field: 'picUrl',
    label: '分类图图',
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
  {
    field: 'status',
    label: '状态',
    align: 'center',
    minWidth: '150px',
    slots: { default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} /> }
  },
  { field: 'sort', label: '排序', align: 'center', minWidth: '150px' },
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
  tableMethods.getList()
})
</script>
