<template>
  <ContentWrap>
    <Search
      :schema="searchSchema"
      label-width="100px"
      @reset="setSearchParams"
      @search="setSearchParams"
    />
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

  <NotifyDetail ref="detailRef" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import * as PayNotifyApi from '@/api/pay/notify'
import * as PayAppApi from '@/api/pay/app'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import NotifyDetail from './NotifyDetail.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'PayNotify' })

const canQuery = hasPermission(['pay:notify:query'])
const appList = ref<any[]>([])

const searchSchema = reactive<FormSchema[]>([
  { field: 'appId', label: '应用编号', component: 'Select', componentProps: { placeholder: '请选择应用信息', clearable: true, filterable: true, options: [], style: { width: '240px' } } },
  { field: 'type', label: '通知类型', component: 'Select', componentProps: { placeholder: '请选择通知类型', clearable: true, options: getIntDictOptions(DICT_TYPE.PAY_NOTIFY_TYPE), style: { width: '240px' } } },
  { field: 'dataId', label: '关联编号', component: 'Input', componentProps: { placeholder: '请输入关联编号', clearable: true, style: { width: '240px' } } },
  { field: 'status', label: '通知状态', component: 'Select', componentProps: { placeholder: '请选择通知状态', clearable: true, options: getIntDictOptions(DICT_TYPE.PAY_NOTIFY_STATUS), style: { width: '240px' } } },
  { field: 'merchantOrderId', label: '商户订单编号', component: 'Input', componentProps: { placeholder: '请输入商户订单编号', clearable: true, style: { width: '240px' } } },
  { field: 'merchantRefundId', label: '商户退款编号', component: 'Input', componentProps: { placeholder: '请输入商户退款编号', clearable: true, style: { width: '240px' } } },
  { field: 'merchantTransferId', label: '商户转账编号', component: 'Input', componentProps: { placeholder: '请输入商户转账编号', clearable: true, style: { width: '240px' } } },
  { field: 'createTime', label: '创建时间', component: 'DatePicker', componentProps: { type: 'daterange', rangeSeparator: '-', valueFormat: 'YYYY-MM-DD HH:mm:ss', startPlaceholder: '开始日期', endPlaceholder: '结束日期', defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')], style: { width: '240px' } } }
])

const detailRef = ref<InstanceType<typeof NotifyDetail>>()
const openDetail = (id: number) => detailRef.value?.open(id)

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await PayNotifyApi.getNotifyTaskPage(params)
})

const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '任务编号' },
  { field: 'appName', label: '应用编号' },
  {
    field: 'merchant',
    label: '商户单信息',
    slots: {
      default: (data) => (
        <>
          {data.row.merchantOrderId ? <div>商户订单编号：{data.row.merchantOrderId}</div> : null}
          {data.row.merchantRefundId ? <div>商户退款编号：{data.row.merchantRefundId}</div> : null}
          {data.row.merchantTransferId ? <div>商户转账编号：{data.row.merchantTransferId}</div> : null}
        </>
      )
    }
  },
  { field: 'type', label: '通知类型', slots: { default: (data) => <DictTag type={DICT_TYPE.PAY_NOTIFY_TYPE} value={data.row.type} /> } },
  { field: 'dataId', label: '关联编号' },
  { field: 'status', label: '通知状态', slots: { default: (data) => <DictTag type={DICT_TYPE.PAY_NOTIFY_STATUS} value={data.row.status} /> } },
  { field: 'lastExecuteTime', label: '最后通知时间', width: '180px', formatter: dateFormatter },
  { field: 'nextNotifyTime', label: '下次通知时间', width: '180px', formatter: dateFormatter },
  {
    field: 'notifyTimes',
    label: '通知次数',
    slots: {
      default: (data) => <el-tag size="small" type="success">{data.row.notifyTimes} / {data.row.maxNotifyTimes}</el-tag>
    }
  },
  { field: 'action', label: '操作', slots: { default: (data) => canQuery ? <BaseButton link type="primary" onClick={() => openDetail(data.row.id)}>查看详情</BaseButton> : null } }
])

onMounted(async () => {
  appList.value = await PayAppApi.getAppList()
  searchSchema[0].componentProps = { ...(searchSchema[0].componentProps || {}), options: appList.value.map((item) => ({ label: item.name, value: item.id })) }
  await tableMethods.getList()
})
</script>
