<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canExport" type="success" :loading="exportLoading" @click="handleExport">
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

  <ApiAccessLogDetail ref="detailRef" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import * as ApiAccessLogApi from '@/api/infra/apiAccessLog'
import ApiAccessLogDetail from './ApiAccessLogDetail.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'InfraApiAccessLog' })

const canQuery = hasPermission(['infra:api-access-log:query'])
const canExport = hasPermission(['infra:api-access-log:export'])

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
    field: 'beginTime',
    label: '请求时间',
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
    field: 'duration',
    label: '执行时长',
    component: 'Input',
    componentProps: { placeholder: '请输入执行时长', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'resultCode',
    label: '结果码',
    component: 'Input',
    componentProps: { placeholder: '请输入结果码', clearable: true, style: { width: '240px' } }
  }
])

const detailRef = ref<InstanceType<typeof ApiAccessLogDetail>>()

const { tableObject, tableMethods, register: tableRegister } = useTable<ApiAccessLogApi.ApiAccessLogVO>({
  getListApi: async (params) => await ApiAccessLogApi.getApiAccessLogPage(params),
  exportListApi: async (params) => await ApiAccessLogApi.exportApiAccessLog(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)
const openDetail = (data: ApiAccessLogApi.ApiAccessLogVO) => detailRef.value?.open(data)
const handleExport = async () => tableMethods.exportList('API 访问日志.xls')

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '日志编号', width: '100px', fixed: 'left' },
  { field: 'userId', label: '用户编号' },
  {
    field: 'userType',
    label: '用户类型',
    slots: { default: (data) => <DictTag type={DICT_TYPE.USER_TYPE} value={data.row.userType} /> }
  },
  { field: 'applicationName', label: '应用名', width: '150px' },
  { field: 'requestMethod', label: '请求方法', width: '80px' },
  { field: 'requestUrl', label: '请求地址', width: '500px' },
  {
    field: 'beginTime',
    label: '请求时间',
    width: '180px',
    slots: { default: (data) => <>{formatDate(data.row.beginTime)}</> }
  },
  {
    field: 'duration',
    label: '执行时长',
    width: '120px',
    slots: { default: (data) => <>{data.row.duration} ms</> }
  },
  {
    field: 'status',
    label: '操作结果',
    minWidth: '220px',
    slots: {
      default: (data) => (
        <>{data.row.resultCode === 0 ? '成功' : '失败(' + data.row.resultMsg + ')'}</>
      )
    }
  },
  { field: 'operateModule', label: '操作模块', width: '180px' },
  { field: 'operateName', label: '操作名', width: '180px' },
  {
    field: 'operateType',
    label: '操作类型',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.INFRA_OPERATE_TYPE} value={data.row.operateType} />
    }
  },
  {
    field: 'action',
    label: '操作',
    width: '70px',
    fixed: 'right',
    slots: {
      default: (data) =>
        canQuery ? (
          <BaseButton link type="primary" onClick={() => openDetail(data.row)}>
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
