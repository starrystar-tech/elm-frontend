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

  <OperateLogDetail ref="detailRef" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as OperateLogApi from '@/api/system/operatelog'
import * as UserApi from '@/api/system/user'
import OperateLogDetail from './OperateLogDetail.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'SystemOperateLog' })

const canQuery = hasPermission(['system:operate-log:query'])
const canExport = hasPermission(['system:operate-log:export'])

const userList = ref<UserApi.UserVO[]>([])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'userId',
    label: '操作人',
    component: 'Select',
    componentProps: {
      placeholder: '请输入操作人员',
      clearable: true,
      filterable: true,
      options: [],
      style: { width: '240px' }
    }
  },
  {
    field: 'type',
    label: '操作模块',
    component: 'Input',
    componentProps: {
      placeholder: '请输入操作模块',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'subType',
    label: '操作名',
    component: 'Input',
    componentProps: {
      placeholder: '请输入操作名',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'action',
    label: '操作内容',
    component: 'Input',
    componentProps: {
      placeholder: '请输入操作名',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'createTime',
    label: '操作时间',
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
    field: 'bizId',
    label: '业务编号',
    component: 'Input',
    componentProps: {
      placeholder: '请输入业务编号',
      clearable: true,
      style: { width: '240px' }
    }
  }
])

const detailRef = ref<InstanceType<typeof OperateLogDetail>>()
const openDetail = (data: OperateLogApi.OperateLogVO) => {
  detailRef.value?.open(data)
}

const { tableObject, tableMethods, register: tableRegister } = useTable<OperateLogApi.OperateLogVO>({
  getListApi: async (params) => await OperateLogApi.getOperateLogPage(params),
  exportListApi: async (params) => await OperateLogApi.exportOperateLog(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleExport = async () => {
  await tableMethods.exportList('操作日志.xls')
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '日志编号', width: '100px' },
  { field: 'userName', label: '操作人', width: '120px' },
  { field: 'type', label: '操作模块', width: '120px' },
  { field: 'subType', label: '操作名', width: '160px' },
  { field: 'action', label: '操作内容' },
  { field: 'createTime', label: '操作时间', formatter: dateFormatter, width: '180px' },
  { field: 'bizId', label: '业务编号', width: '120px' },
  { field: 'userIp', label: '操作 IP', width: '120px' },
  {
    field: 'actionCol',
    label: '操作',
    width: '60px',
    fixed: 'right',
    slots: {
      default: (data) =>
        canQuery ? (
          <BaseButton link type="primary" onClick={() => openDetail(data.row as OperateLogApi.OperateLogVO)}>
            详情
          </BaseButton>
        ) : null
    }
  }
])

onMounted(async () => {
  userList.value = await UserApi.getSimpleUserList()
  searchSchema[0].componentProps = {
    ...(searchSchema[0].componentProps || {}),
    options: userList.value.map((user) => ({
      label: user.nickname,
      value: user.id
    }))
  }
  await tableMethods.getList()
})
</script>
