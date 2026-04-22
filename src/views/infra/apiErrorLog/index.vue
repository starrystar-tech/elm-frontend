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

  <ApiErrorLogDetail ref="detailRef" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as ApiErrorLogApi from '@/api/infra/apiErrorLog'
import ApiErrorLogDetail from './ApiErrorLogDetail.vue'
import { InfraApiErrorLogProcessStatusEnum } from '@/utils/constants'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'InfraApiErrorLog' })

const message = useMessage()
const canQuery = hasPermission(['infra:api-error-log:query'])
const canExport = hasPermission(['infra:api-error-log:export'])
const canUpdateStatus = hasPermission(['infra:api-error-log:update-status'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'userId',
    label: '用户编号',
    component: 'Input',
    componentProps: { placeholder: '请输入用户编号', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'userType',
    label: '用户类型',
    component: 'Select',
    componentProps: {
      placeholder: '请选择用户类型',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.USER_TYPE),
      style: { width: '240px' }
    }
  },
  {
    field: 'applicationName',
    label: '应用名',
    component: 'Input',
    componentProps: { placeholder: '请输入应用名', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'exceptionTime',
    label: '异常时间',
    component: 'DatePicker',
    componentProps: {
      type: 'daterange',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
      style: { width: '240px' }
    }
  },
  {
    field: 'processStatus',
    label: '处理状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择处理状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS),
      style: { width: '240px' }
    }
  }
])

const detailRef = ref<InstanceType<typeof ApiErrorLogDetail>>()

const { tableObject, tableMethods, register: tableRegister } = useTable<ApiErrorLogApi.ApiErrorLogVO>({
  getListApi: async (params) => await ApiErrorLogApi.getApiErrorLogPage(params),
  exportListApi: async (params) => await ApiErrorLogApi.exportApiErrorLog(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)
const openDetail = (data: ApiErrorLogApi.ApiErrorLogVO) => detailRef.value?.open(data)
const handleExport = async () => tableMethods.exportList('异常日志.xls')

const handleProcess = async (id: number, processStatus: number) => {
  try {
    const type = processStatus === InfraApiErrorLogProcessStatusEnum.DONE ? '已处理' : '已忽略'
    await message.confirm('确认标记为' + type + '?')
    await ApiErrorLogApi.updateApiErrorLogPage(id, processStatus)
    await message.success(type)
    await tableMethods.getList()
  } catch {}
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '日志编号' },
  { field: 'userId', label: '用户编号' },
  {
    field: 'userType',
    label: '用户类型',
    slots: { default: (data) => <DictTag type={DICT_TYPE.USER_TYPE} value={data.row.userType} /> }
  },
  { field: 'applicationName', label: '应用名', width: '200px' },
  { field: 'requestMethod', label: '请求方法', width: '80px' },
  { field: 'requestUrl', label: '请求地址', width: '180px' },
  { field: 'exceptionTime', label: '异常发生时间', width: '180px', formatter: dateFormatter },
  { field: 'exceptionName', label: '异常名', width: '180px' },
  {
    field: 'processStatus',
    label: '处理状态',
    slots: {
      default: (data) => (
        <DictTag
          type={DICT_TYPE.INFRA_API_ERROR_LOG_PROCESS_STATUS}
          value={data.row.processStatus}
        />
      )
    }
  },
  {
    field: 'action',
    label: '操作',
    width: '200px',
    slots: {
      default: (data) => (
        <>
          {canQuery ? (
            <BaseButton link type="primary" onClick={() => openDetail(data.row)}>
              详细
            </BaseButton>
          ) : null}
          {canUpdateStatus &&
          data.row.processStatus === InfraApiErrorLogProcessStatusEnum.INIT ? (
            <BaseButton
              link
              type="primary"
              onClick={() =>
                handleProcess(data.row.id, InfraApiErrorLogProcessStatusEnum.DONE)
              }
            >
              已处理
            </BaseButton>
          ) : null}
          {canUpdateStatus &&
          data.row.processStatus === InfraApiErrorLogProcessStatusEnum.INIT ? (
            <BaseButton
              link
              type="primary"
              onClick={() =>
                handleProcess(data.row.id, InfraApiErrorLogProcessStatusEnum.IGNORE)
              }
            >
              已忽略
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
