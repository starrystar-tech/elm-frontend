<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canExport" type="primary" plain :loading="exportLoading" @click="handleExport">
        导出
      </BaseButton>
    </div>
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

  <JobLogDetail ref="detailRef" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import JobLogDetail from './JobLogDetail.vue'
import * as JobLogApi from '@/api/infra/jobLog'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'InfraJobLog' })

const { query } = useRoute()
const canQuery = hasPermission(['infra:job:query'])
const canExport = hasPermission(['infra:job:export'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'handlerName',
    label: '处理器的名字',
    component: 'Input',
    componentProps: {
      placeholder: '请输入处理器的名字',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'beginTime',
    label: '开始执行时间',
    component: 'DatePicker',
    componentProps: {
      type: 'date',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
      placeholder: '选择开始执行时间',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'endTime',
    label: '结束执行时间',
    component: 'DatePicker',
    componentProps: {
      type: 'date',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
      placeholder: '选择结束执行时间',
      clearable: true,
      defaultTime: new Date('1 23:59:59'),
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '任务状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择任务状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.INFRA_JOB_LOG_STATUS),
      style: { width: '240px' }
    }
  }
])

const detailRef = ref<InstanceType<typeof JobLogDetail>>()

const { tableObject, tableMethods, register: tableRegister } = useTable<JobLogApi.JobLogVO>({
  getListApi: async (params) =>
    await JobLogApi.getJobLogPage({
      ...params,
      jobId: query.id
    }),
  exportListApi: async (params) =>
    await JobLogApi.exportJobLog({
      ...params,
      jobId: query.id
    })
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openDetail = (id?: number) => {
  detailRef.value?.open(id)
}

const handleExport = async () => {
  await tableMethods.exportList('定时任务执行日志.xls')
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '日志编号' },
  { field: 'jobId', label: '任务编号' },
  { field: 'handlerName', label: '处理器的名字' },
  { field: 'handlerParam', label: '处理器的参数' },
  { field: 'executeIndex', label: '第几次执行' },
  {
    field: 'executeTime',
    label: '执行时间',
    width: '180px',
    slots: {
      default: (data) => <>{formatDate(data.row.beginTime) + ' ~ ' + formatDate(data.row.endTime)}</>
    }
  },
  {
    field: 'duration',
    label: '执行时长',
    slots: {
      default: (data) => <>{data.row.duration + ' 毫秒'}</>
    }
  },
  {
    field: 'status',
    label: '任务状态',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.INFRA_JOB_LOG_STATUS} value={data.row.status} />
    }
  },
  {
    field: 'action',
    label: '操作',
    width: '100px',
    slots: {
      default: (data) =>
        canQuery ? (
          <BaseButton link type="primary" onClick={() => openDetail(data.row.id)}>
            详细
          </BaseButton>
        ) : null
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
