<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton type="primary" @click="openForm">上传文件</BaseButton>
      <BaseButton
        v-if="canDelete"
        type="danger"
        :disabled="checkedIds.length === 0"
        @click="handleDeleteBatch"
      >
        批量删除
      </BaseButton>
    </div>
    <Table
      v-model:currentPage="tableObject.currentPage"
      v-model:pageSize="tableObject.pageSize"
      :columns="tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{ total: tableObject.total }"
      selection
      @register="tableRegister"
      @selection-change="handleRowCheckboxChange"
    />
  </ContentWrap>

  <FileForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { reactive, ref } from 'vue'
import { ElImage, ElLink } from 'element-plus'
import { fileSizeFormatter } from '@/utils'
import { dateFormatter } from '@/utils/formatTime'
import * as FileApi from '@/api/infra/file'
import FileForm from './FileForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'InfraFile' })

const message = useMessage()
const { t } = useI18n()
const canDelete = hasPermission(['infra:file:delete'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'path',
    label: '文件路径',
    component: 'Input',
    componentProps: { placeholder: '请输入文件路径', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'type',
    label: '文件类型',
    component: 'Input',
    componentProps: { placeholder: '请输入文件类型', clearable: true, style: { width: '240px' } }
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

const formRef = ref<InstanceType<typeof FileForm>>()
const checkedIds = ref<number[]>([])

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await FileApi.getFilePage(params),
  delListApi: async (id) => await FileApi.deleteFile(id as number)
})

const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)
const openForm = () => formRef.value?.open()

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    message.success('复制成功')
  })
}

const handleRowCheckboxChange = (rows: Recordable[]) => {
  checkedIds.value = rows.map((row) => row.id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await FileApi.deleteFileList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    await tableMethods.getList()
  } catch {}
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'name', label: '文件名', showOverflowTooltip: true },
  { field: 'path', label: '文件路径', showOverflowTooltip: true },
  { field: 'url', label: 'URL', showOverflowTooltip: true },
  { field: 'size', label: '文件大小', width: '120px', formatter: fileSizeFormatter },
  { field: 'type', label: '文件类型', width: '180px' },
  {
    field: 'preview',
    label: '文件内容',
    width: '110px',
    slots: {
      default: (data) =>
        data.row.type.includes('image') ? (
          <ElImage
            class="h-80px w-80px"
            lazy
            src={data.row.url}
            previewSrcList={[data.row.url]}
            previewTeleported
            fit="cover"
          />
        ) : data.row.type.includes('pdf') ? (
          <ElLink type="primary" href={data.row.url} underline={false} target="_blank">
            预览
          </ElLink>
        ) : (
          <ElLink type="primary" href={data.row.url} underline={false} target="_blank" download>
            下载
          </ElLink>
        )
    }
  },
  { field: 'createTime', label: '上传时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '140px',
    slots: {
      default: (data) => (
        <>
          <BaseButton link type="primary" onClick={() => copyToClipboard(data.row.url)}>
            复制链接
          </BaseButton>
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
