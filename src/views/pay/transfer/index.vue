<template>
  <ContentWrap>
    <Search
      :schema="searchSchema"
      label-width="100px"
      @reset="setSearchParams"
      @search="setSearchParams"
    />
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
    <TransferDetail ref="detailRef" />
  </ContentWrap>
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { ElTag } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as TransferApi from '@/api/pay/transfer'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import TransferDetail from './TransferDetail.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'PayTransfer' })

const canExport = hasPermission(['pay:transfer:export'])

const searchSchema = reactive<FormSchema[]>([
  { field: 'no', label: '转账单号', component: 'Input', componentProps: { placeholder: '请输入转账单号', clearable: true, style: { width: '240px' } } },
  { field: 'channelCode', label: '转账渠道', component: 'Select', componentProps: { placeholder: '请选择支付渠道', clearable: true, options: getStrDictOptions(DICT_TYPE.PAY_CHANNEL_CODE), style: { width: '240px' } } },
  { field: 'merchantTransferId', label: '商户单号', component: 'Input', componentProps: { placeholder: '请输入商户单号', clearable: true, style: { width: '240px' } } },
  { field: 'type', label: '类型', component: 'Select', componentProps: { placeholder: '请选择类型', clearable: true, options: getStrDictOptions(DICT_TYPE.PAY_TRANSFER_TYPE), style: { width: '240px' } } },
  { field: 'status', label: '转账状态', component: 'Select', componentProps: { placeholder: '请选择转账状态', clearable: true, options: getStrDictOptions(DICT_TYPE.PAY_TRANSFER_STATUS), style: { width: '240px' } } },
  { field: 'userName', label: '收款人姓名', component: 'Input', componentProps: { placeholder: '请输入收款人姓名', clearable: true, style: { width: '240px' } } },
  { field: 'accountNo', label: '收款人账号', component: 'Input', componentProps: { placeholder: '请输入收款人账号', clearable: true, style: { width: '240px' } } },
  { field: 'channelTransferNo', label: '渠道单号', component: 'Input', componentProps: { placeholder: '渠道单号', clearable: true, style: { width: '240px' } } },
  { field: 'createTime', label: '创建时间', component: 'DatePicker', componentProps: { type: 'daterange', valueFormat: 'YYYY-MM-DD HH:mm:ss', startPlaceholder: '开始日期', endPlaceholder: '结束日期', defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')], style: { width: '240px' } } }
])

const detailRef = ref<InstanceType<typeof TransferDetail>>()
const openDetail = (id: number) => {
  detailRef.value?.open(id)
}

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await TransferApi.getTransferPage(params),
  exportListApi: async (params) => await TransferApi.exportTransfer(params)
})

const exportLoading = computed(() => tableObject.exportLoading)
const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)
const handleExport = async () => tableMethods.exportList('转账单.xls')

const tableColumns = reactive<TableColumn[]>([
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'status',
    label: '转账状态',
    width: '120px',
    slots: { default: (data) => <DictTag type={DICT_TYPE.PAY_TRANSFER_STATUS} value={data.row.status} /> }
  },
  {
    field: 'orderInfo',
    label: '订单号',
    width: '300px',
    align: 'left',
    slots: {
      default: (data) => (
        <>
          <p class="transfer-font"><ElTag size="small">商户</ElTag>{data.row.merchantTransferId}</p>
          {data.row.no ? <p class="transfer-font"><ElTag size="small" type="warning">转账</ElTag>{data.row.no}</p> : null}
          {data.row.channelTransferNo ? <p class="transfer-font"><ElTag size="small" type="success">渠道</ElTag>{data.row.channelTransferNo}</p> : null}
        </>
      )
    }
  },
  { field: 'userName', label: '收款人姓名', width: '120px' },
  { field: 'userAccount', label: '收款账号', width: '200px', align: 'left' },
  { field: 'subject', label: '转账标题', width: '120px' },
  {
    field: 'channelCode',
    label: '转账渠道',
    slots: { default: (data) => <DictTag type={DICT_TYPE.PAY_CHANNEL_CODE} value={data.row.channelCode} /> }
  },
  { field: 'successTime', label: '转账成功时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '100px',
    fixed: 'right',
    slots: {
      default: (data) => (
        <BaseButton link type="primary" onClick={() => openDetail(data.row.id)}>
          详情
        </BaseButton>
      )
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>

<style scoped>
.transfer-font {
  padding: 2px 0;
  font-size: 12px;
}
</style>
