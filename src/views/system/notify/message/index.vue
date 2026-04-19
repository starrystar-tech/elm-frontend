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

  <NotifyMessageDetail ref="detailRef" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as NotifyMessageApi from '@/api/system/notify/message'
import NotifyMessageDetail from './NotifyMessageDetail.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'SystemNotifyMessage' })

const canQuery = hasPermission(['system:notify-message:query'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'userId',
    label: '用户编号',
    component: 'Input',
    componentProps: {
      placeholder: '请输入用户编号',
      clearable: true,
      style: { width: '240px' }
    }
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
    field: 'templateCode',
    label: '模板编码',
    component: 'Input',
    componentProps: {
      placeholder: '请输入模板编码',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'templateType',
    label: '模版类型',
    component: 'Select',
    componentProps: {
      placeholder: '请选择模版类型',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE),
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

const detailRef = ref<InstanceType<typeof NotifyMessageDetail>>()
const openDetail = (data: NotifyMessageApi.NotifyMessageVO) => {
  detailRef.value?.open(data)
}

const { tableObject, tableMethods, register: tableRegister } =
  useTable<NotifyMessageApi.NotifyMessageVO>({
    getListApi: async (params) => await NotifyMessageApi.getNotifyMessagePage(params)
  })

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号' },
  {
    field: 'userType',
    label: '用户类型',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.USER_TYPE} value={data.row.userType} />
    }
  },
  { field: 'userId', label: '用户编号', width: '80px' },
  { field: 'templateCode', label: '模板编码', width: '80px' },
  { field: 'templateNickname', label: '发送人名称', width: '180px' },
  { field: 'templateContent', label: '模版内容', width: '200px', showOverflowTooltip: true },
  { field: 'templateParams', label: '模版参数', width: '180px', showOverflowTooltip: true },
  {
    field: 'templateType',
    label: '模版类型',
    width: '120px',
    slots: {
      default: (data) => (
        <DictTag type={DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE} value={data.row.templateType} />
      )
    }
  },
  {
    field: 'readStatus',
    label: '是否已读',
    width: '100px',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.readStatus} />
    }
  },
  { field: 'readTime', label: '阅读时间', width: '180px', formatter: dateFormatter },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '100px',
    fixed: 'right',
    slots: {
      default: (data) =>
        canQuery ? (
          <BaseButton link type="primary" onClick={() => openDetail(data.row as NotifyMessageApi.NotifyMessageVO)}>
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
