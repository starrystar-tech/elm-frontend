<template>
  <ContentWrap>
    <Search
      :schema="searchSchema"
      label-width="120px"
      @reset="setSearchParams"
      @search="setSearchParams"
    />
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

  <RefundDetail ref="detailRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { ElTag } from 'element-plus'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as RefundApi from '@/api/pay/refund'
import * as AppApi from '@/api/pay/app'
import RefundDetail from './RefundDetail.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'PayRefund' })

const canQuery = hasPermission(['pay:order:query'])
const canExport = hasPermission(['system:tenant:export'])
const appList = ref<AppApi.AppVO[]>([])

const searchSchema = reactive<FormSchema[]>([
  { field: 'appId', label: '应用编号', component: 'Select', componentProps: { clearable: true, placeholder: '请选择应用信息', options: [], style: { width: '240px' } } },
  { field: 'channelCode', label: '退款渠道', component: 'Select', componentProps: { clearable: true, placeholder: '请选择退款渠道', options: getStrDictOptions(DICT_TYPE.PAY_CHANNEL_CODE), style: { width: '240px' } } },
  { field: 'merchantOrderId', label: '商户支付单号', component: 'Input', componentProps: { clearable: true, placeholder: '请输入商户支付单号', style: { width: '240px' } } },
  { field: 'merchantRefundId', label: '商户退款单号', component: 'Input', componentProps: { clearable: true, placeholder: '请输入商户退款单号', style: { width: '240px' } } },
  { field: 'channelOrderNo', label: '渠道支付单号', component: 'Input', componentProps: { clearable: true, placeholder: '请输入渠道支付单号', style: { width: '240px' } } },
  { field: 'channelRefundNo', label: '渠道退款单号', component: 'Input', componentProps: { clearable: true, placeholder: '请输入渠道退款单号', style: { width: '240px' } } },
  { field: 'status', label: '退款状态', component: 'Select', componentProps: { clearable: true, placeholder: '请选择退款状态', options: getIntDictOptions(DICT_TYPE.PAY_REFUND_STATUS), style: { width: '240px' } } },
  { field: 'createTime', label: '创建时间', component: 'DatePicker', componentProps: { type: 'daterange', valueFormat: 'YYYY-MM-DD HH:mm:ss', startPlaceholder: '开始日期', endPlaceholder: '结束日期', defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')], style: { width: '240px' } } }
])

const detailRef = ref<InstanceType<typeof RefundDetail>>()
const openDetail = (id: number) => {
  detailRef.value?.open(id)
}

const { tableObject, tableMethods, register: tableRegister } = useTable<RefundApi.RefundVO>({
  getListApi: async (params) => await RefundApi.getRefundPage(params),
  exportListApi: async (params) => await RefundApi.exportRefund(params)
})

const exportLoading = computed(() => tableObject.exportLoading)
const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)
const handleExport = async () => tableMethods.exportList('支付订单.xls')

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号' },
  { field: 'createTime', label: '创建时间', width: '170px', formatter: dateFormatter },
  { field: 'merchantRefundId', label: '退款单号', width: '180px' },
  { field: 'refundAmount', label: '退款金额' },
  {
    field: 'orderInfo',
    label: '订单号',
    width: '260px',
    slots: {
      default: (data) => (
        <>
          <p class="order-font"><ElTag size="small">商户</ElTag> {data.row.merchantOrderId}</p>
          <p class="order-font"><ElTag size="small" type="success">渠道</ElTag> {data.row.channelOrderNo}</p>
        </>
      )
    }
  },
  {
    field: 'status',
    label: '退款状态',
    width: '100px',
    slots: { default: (data) => <DictTag type={DICT_TYPE.PAY_REFUND_STATUS} value={data.row.status} /> }
  },
  {
    field: 'channelCode',
    label: '退款渠道',
    width: '140px',
    slots: { default: (data) => <DictTag type={DICT_TYPE.PAY_CHANNEL_CODE} value={data.row.channelCode} /> }
  },
  { field: 'successTime', label: '成功时间', width: '180px', formatter: dateFormatter },
  { field: 'appName', label: '支付应用', width: '100px' },
  {
    field: 'action',
    label: '操作',
    width: '100px',
    fixed: 'right',
    slots: {
      default: (data) =>
        canQuery ? (
          <BaseButton link type="primary" onClick={() => openDetail(data.row.id)}>
            详情
          </BaseButton>
        ) : null
    }
  }
])

onMounted(async () => {
  appList.value = await AppApi.getAppList()
  searchSchema[0].componentProps = {
    ...(searchSchema[0].componentProps || {}),
    options: appList.value.map((item) => ({ label: item.name, value: item.id }))
  }
  await tableMethods.getList()
})
</script>

<style>
.order-font {
  padding: 2px 0;
  font-size: 12px;
}
</style>
