<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="getList" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton v-if="canExport" type="success" :loading="exportLoading" @click="handleExport">
        导出
      </BaseButton>
      <BaseButton type="danger" @click="toggleExpandAll">展开/折叠</BaseButton>
    </div>
    <Table
      v-if="refreshTable"
      :columns="tableColumns"
      :data="list"
      :loading="loading"
      row-key="id"
      :default-expand-all="isExpandAll"
    />
  </ContentWrap>

  <Demo02CategoryForm ref="formRef" @success="getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { handleTree } from '@/utils/tree'
import * as Demo02CategoryApi from '@/api/infra/demo/demo02'
import Demo02CategoryForm from './Demo02CategoryForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'Demo02Category' })

const message = useMessage()
const { t } = useI18n()

const canCreate = hasPermission(['infra:demo02-category:create'])
const canUpdate = hasPermission(['infra:demo02-category:update'])
const canDelete = hasPermission(['infra:demo02-category:delete'])
const canExport = hasPermission(['infra:demo02-category:export'])

const searchParams = reactive<Recordable>({
  name: undefined,
  createTime: []
})

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '名字',
    component: 'Input',
    componentProps: { placeholder: '请输入名字', clearable: true, style: { width: '240px' } }
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

const loading = ref(true)
const list = ref<Recordable[]>([])
const exportLoading = ref(false)
const formRef = ref<InstanceType<typeof Demo02CategoryForm>>()
const isExpandAll = ref(true)
const refreshTable = ref(true)

const setSearchParams = (params: Recordable) => {
  Object.assign(searchParams, params)
  getList()
}

const getList = async () => {
  loading.value = true
  try {
    const data = await Demo02CategoryApi.getDemo02CategoryList()
    const filtered = data.filter((item) => {
      const matchName = !searchParams.name || item.name?.includes(searchParams.name)
      return matchName
    })
    list.value = handleTree(filtered, 'id', 'parentId')
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
    await Demo02CategoryApi.deleteDemo02Category(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await Demo02CategoryApi.exportDemo02Category(searchParams)
    const download = await import('@/utils/download')
    download.default.excel(data, '示例分类.xls')
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
  { field: 'id', label: '编号' },
  { field: 'name', label: '名字' },
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
