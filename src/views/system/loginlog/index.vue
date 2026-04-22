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

  <LoginLogDetail ref="detailRef" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as LoginLogApi from '@/api/system/loginLog'
import LoginLogDetail from './LoginLogDetail.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'SystemLoginLog' })

const canQuery = hasPermission(['system:login-log:query'])
const canExport = hasPermission(['system:login-log:export'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'username',
    label: '用户名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入用户名称',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'userIp',
    label: '登录地址',
    component: 'Input',
    componentProps: {
      placeholder: '请输入登录地址',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'createTime',
    label: '登录日期',
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

const detailRef = ref<InstanceType<typeof LoginLogDetail>>()
const openDetail = (data: LoginLogApi.LoginLogVO) => {
  detailRef.value?.open(data)
}

const { tableObject, tableMethods, register: tableRegister } = useTable<LoginLogApi.LoginLogVO>({
  getListApi: async (params) => await LoginLogApi.getLoginLogPage(params),
  exportListApi: async (params) => await LoginLogApi.exportLoginLog(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleExport = async () => {
  await tableMethods.exportList('登录日志.xls')
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '日志编号' },
  {
    field: 'logType',
    label: '操作类型',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.SYSTEM_LOGIN_TYPE} value={data.row.logType} />
    }
  },
  { field: 'username', label: '用户名称', width: '180px' },
  { field: 'userIp', label: '登录地址', width: '180px' },
  { field: 'userAgent', label: '浏览器' },
  {
    field: 'result',
    label: '登陆结果',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.SYSTEM_LOGIN_RESULT} value={data.row.result} />
    }
  },
  {
    field: 'createTime',
    label: '登录日期',
    formatter: dateFormatter,
    width: '180px'
  },
  {
    field: 'action',
    label: '操作',
    width: '100px',
    slots: {
      default: (data) =>
        canQuery ? (
          <BaseButton link type="primary" onClick={() => openDetail(data.row as LoginLogApi.LoginLogVO)}>
            详情
          </BaseButton>
        ) : null
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
