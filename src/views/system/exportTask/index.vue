<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />

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
</template>

<script setup lang="tsx">
import { computed, reactive } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { downloadByUrl } from '@/utils/filt'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import * as ExportTaskApi from '@/api/system/exportTask'

defineOptions({ name: 'SystemExportTaskCenter' })

const bizTypeOptions = [
  { label: '名片查询', value: 'crm_clue_page_export' },
  { label: '静默数据', value: 'crm_clue_silent_page_export' },
  { label: '客户管理', value: 'crm_clue_management_page_export' }
]

const statusOptions = [
  { label: '生成中', value: 0 },
  { label: '生成失败', value: 1 },
  { label: '生成完成', value: 2 },
  { label: '文件已过期', value: 3 }
]

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'bizType',
    label: '业务类型',
    component: 'Select',
    componentProps: {
      clearable: true,
      options: bizTypeOptions,
      style: { width: '220px' }
    }
  },
  {
    field: 'status',
    label: '任务状态',
    component: 'Select',
    componentProps: {
      clearable: true,
      options: statusOptions,
      style: { width: '220px' }
    }
  },
  {
    field: 'taskName',
    label: '任务名称',
    component: 'Input',
    componentProps: {
      clearable: true,
      placeholder: '请输入任务名称',
      style: { width: '220px' }
    }
  }
])

const {
  tableObject,
  tableMethods,
  register: tableRegister
} = useTable<ExportTaskApi.ExportTaskVO>({
  getListApi: async (params) =>
    await ExportTaskApi.getExportTaskPage(params as ExportTaskApi.ExportTaskPageReqVO)
})

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'taskName', label: '任务名称', minWidth: '140px' },
  { field: 'statusDesc', label: '任务状态', width: '110px' },
  { field: 'fileName', label: '文件名', minWidth: '220px' },
  { field: 'totalCount', label: '数据量', width: '100px' },
  { field: 'fileSize', label: '文件大小(KB)', width: '120px' },
  { field: 'failReason', label: '失败原因', minWidth: '180px' },
  { field: 'startedAt', label: '开始时间', minWidth: '170px', formatter: dateFormatter },
  { field: 'finishedAt', label: '完成时间', minWidth: '170px', formatter: dateFormatter },
  { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '120px',
    fixed: 'right',
    slots: {
      default: (data) =>
        data.row.status === 2 && data.row.fileUrl ? (
          <BaseButton
            link
            type="primary"
            onClick={() =>
              downloadByUrl({
                url: data.row.fileUrl,
                fileName: data.row.fileName
              })
            }
          >
            下载
          </BaseButton>
        ) : (
          <span>-</span>
        )
    }
  }
])

const setSearchParams = (params: Record<string, any>) => {
  tableMethods.setSearchParams(params)
}

onMounted(() => {
  ExportTaskApi.markExportTaskCenterViewed()
  tableMethods.getList()
})
</script>
