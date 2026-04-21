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
      :stripe="true"
      :show-overflow-tooltip="true"
      @register="tableRegister"
    />
  </ContentWrap>

  <DiyPageForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as DiyPageApi from '@/api/mall/promotion/diy/page'
import DiyPageForm from './DiyPageForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'DiyPage' })

const canCreate = hasPermission(['promotion:diy-page:create'])
const canUpdate = hasPermission(['promotion:diy-page:update'])
const canDelete = hasPermission(['promotion:diy-page:delete'])

const message = useMessage()
const formRef = ref()
const { push } = useRouter()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '页面名称',
    component: 'Input',
    componentProps: { placeholder: '请输入页面名称', clearable: true, style: { width: '240px' } }
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

const { tableObject, tableMethods, register: tableRegister } = useTable<DiyPageApi.DiyPageVO>({
  getListApi: async (params) => await DiyPageApi.getDiyPagePage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DiyPageApi.deleteDiyPage(id)
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const handleDecorate = (id: number) => {
  push({ name: 'DiyPageDecorate', params: { id } })
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'id', label: '编号', align: 'center' },
  {
    field: 'previewPicUrls',
    label: '预览图',
    align: 'center',
    slots: {
      default: (data) =>
        data.row.previewPicUrls?.map((url: string, index: number) => (
          <el-image
            class="h-40px max-w-40px"
            key={index}
            src={url}
            preview-src-list={data.row.previewPicUrls}
            initial-index={index}
            preview-teleported
          />
        ))
    }
  },
  { field: 'name', label: '页面名称', align: 'center' },
  { field: 'remark', label: '备注', align: 'center' },
  { field: 'createTime', label: '创建时间', align: 'center', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    align: 'center',
    slots: {
      default: (data) => (
        <>
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => handleDecorate(data.row.id)}>
              装修
            </BaseButton>
          ) : null}
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
