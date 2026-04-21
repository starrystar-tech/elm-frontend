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

<script lang="tsx" setup>
import { reactive } from 'vue'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter, formatPast2 } from '@/utils/formatTime'
import * as TaskApi from '@/api/bpm/task'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'BpmManagerTask' })

const { push } = useRouter()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '任务名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入任务名称',
      clearable: true,
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

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await TaskApi.getTaskManagerPage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleAudit = (row: Recordable) => {
  push({
    name: 'BpmProcessInstanceDetail',
    query: {
      id: row.processInstance.id
    }
  })
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'processInstance.name', label: '流程', width: '180' },
  { field: 'processInstance.startUser.nickname', label: '发起人', width: '100' },
  { field: 'createTime', label: '发起时间', width: '180', formatter: dateFormatter },
  { field: 'name', label: '当前任务', width: '180' },
  { field: 'createTime', label: '任务开始时间', width: '180', formatter: dateFormatter },
  { field: 'endTime', label: '任务结束时间', width: '180', formatter: dateFormatter },
  { field: 'assigneeUser.nickname', label: '审批人', width: '100' },
  {
    field: 'status',
    label: '审批状态',
    width: '120',
    slots: {
      default: (data) => <dict-tag type={DICT_TYPE.BPM_TASK_STATUS} value={data.row.status} />
    }
  },
  { field: 'reason', label: '审批建议', minWidth: '180' },
  {
    field: 'durationInMillis',
    label: '耗时',
    width: '160',
    slots: {
      default: (data) => <span>{formatPast2(data.row.durationInMillis)}</span>
    }
  },
  { field: 'processInstanceId', label: '流程编号', showOverflowTooltip: true },
  { field: 'id', label: '任务编号', showOverflowTooltip: true },
  {
    field: 'action',
    label: '操作',
    fixed: 'right',
    width: '80',
    slots: {
      default: (data) => (
        <el-button link type="primary" onClick={() => handleAudit(data.row)}>
          历史
        </el-button>
      )
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
