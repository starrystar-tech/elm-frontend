<template>
  <ContentWrap>
    <Search
      :schema="searchSchema"
      label-width="100px"
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

  <OrderDetail ref="detailRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { ElTag } from 'element-plus'
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as OrderApi from '@/api/pay/order'
import OrderDetail from './OrderDetail.vue'
import { getAppList } from '@/api/pay/app'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'PayOrder' })

const canQuery = hasPermission(['pay:order:query'])
const canExport = hasPermission(['pay:order:export'])
const appList = ref<any[]>([])

const searchSchema = reactive<FormSchema[]>([
  { field: 'appId', label: '应用编号', component: 'Select', componentProps: { clearable: true, placeholder: '请选择应用信息', options: [], style: { width: '240px' } } },
  { field: 'channelCode', label: '支付渠道', component: 'Select', componentProps: { clearable: true, placeholder: '请选择支付渠道', options: getStrDictOptions(DICT_TYPE.PAY_CHANNEL_CODE), style: { width: '240px' } } },
  { field: 'merchantOrderId', label: '商户单号', component: 'Input', componentProps: { clearable: true, placeholder: '请输入商户单号', style: { width: '240px' } } },
  { field: 'no', label: '支付单号', component: 'Input', componentProps: { clearable: true, placeholder: '请输入支付单号', style: { width: '240px' } } },
  { field: 'channelOrderNo', label: '渠道单号', component: 'Input', componentProps: { clearable: true, placeholder: '请输入渠道单号', style: { width: '240px' } } },
  { field: 'status', label: '支付状态', component: 'Select', componentProps: { clearable: true, placeholder: '请选择支付状态', options: getIntDictOptions(DICT_TYPE.PAY_ORDER_STATUS), style: { width: '240px' } } },
  { field: 'createTime', label: '创建时间', component: 'DatePicker', componentProps: { type: 'daterange', valueFormat: 'YYYY-MM-DD HH:mm:ss', startPlaceholder: '开始日期', endPlaceholder: '结束日期', defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')], style: { width: '240px' } } }
])

const detailRef = ref<InstanceType<typeof OrderDetail>>()
const openDetail = (id: number) => detailRef.value?.open(id)

const { tableObject, tableMethods, register: tableRegister } = useTable<OrderApi.OrderVO>({
  getListApi: async (params) => await OrderApi.getOrderPage(params),
  exportListApi: async (params) => await OrderApi.exportOrder(params)
})

const exportLoading = computed(() => tableObject.exportLoading)
const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)
const handleExport = async () => tableMethods.exportList('支付订单.xls')
const yuan = (fen: number) => `￥${parseFloat(String(fen / 100)).toFixed(2)}`

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号', width: '80px' },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  { field: 'amount', label: '支付金额', width: '100px', slots: { default: (data) => <>{yuan(data.row.amount || data.row.price)}</> } },
  { field: 'refundAmount', label: '退款金额', width: '100px', slots: { default: (data) => <>{yuan(data.row.refundAmount || data.row.refundPrice || 0)}</> } },
  { field: 'channelFeeAmount', label: '手续金额', width: '100px', slots: { default: (data) => <>{yuan(data.row.channelFeeAmount || data.row.channelFeePrice || 0)}</> } },
  {
    field: 'orderInfo',
    label: '订单号',
    width: '300px',
    align: 'left',
    slots: {
      default: (data) => (
        <>
          <p class="order-font"><ElTag size="small">商户</ElTag> {data.row.merchantOrderId}</p>
          {data.row.no ? <p class="order-font"><ElTag size="small" type="warning">支付</ElTag> {data.row.no}</p> : null}
          {data.row.channelOrderNo ? <p class="order-font"><ElTag size="small" type="success">渠道</ElTag> {data.row.channelOrderNo}</p> : null}
        </>
      )
    }
  },
  { field: 'status', label: '支付状态', slots: { default: (data) => <DictTag type={DICT_TYPE.PAY_ORDER_STATUS} value={data.row.status} /> } },
  { field: 'channelCode', label: '支付渠道', width: '140px', slots: { default: (data) => <DictTag type={DICT_TYPE.PAY_CHANNEL_CODE} value={data.row.channelCode} /> } },
  { field: 'successTime', label: '支付时间', width: '180px', formatter: dateFormatter },
  { field: 'appName', label: '支付应用', width: '100px' },
  { field: 'subject', label: '商品标题', width: '180px' },
  { field: 'action', label: '操作', width: '100px', fixed: 'right', slots: { default: (data) => canQuery ? <BaseButton link type="primary" onClick={() => openDetail(data.row.id)}>详情</BaseButton> : null } }
])

onMounted(async () => {
  appList.value = await getAppList()
  searchSchema[0].componentProps = { ...(searchSchema[0].componentProps || {}), options: appList.value.map((item) => ({ label: item.name, value: item.id })) }
  await tableMethods.getList()
})
</script>
<style>
.order-font {
  padding: 2px 0;
  font-size: 12px;
}
</style>
