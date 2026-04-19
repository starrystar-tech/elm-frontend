<template>
  <ContentWrap>
    <div class="mb-10px">
      <BaseButton type="primary" @click="openForm('create')">创建示例提现单</BaseButton>
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

  <DemoWithdrawForm ref="demoFormRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { ElTag } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as DemoWithdrawApi from '@/api/pay/demo/withdraw'
import DemoWithdrawForm from './DemoWithdrawForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'

defineOptions({ name: 'PayDemoWithdraw' })

const message = useMessage()
const demoFormRef = ref<InstanceType<typeof DemoWithdrawForm>>()

const { tableObject, tableMethods, register: tableRegister } =
  useTable<DemoWithdrawApi.PayDemoWithdrawVO>({
    getListApi: async (params) => await DemoWithdrawApi.getDemoWithdrawPage(params)
  })

const openForm = (type: string) => {
  demoFormRef.value?.open(type)
}

const handleTransfer = async (id: number) => {
  try {
    await message.confirm('确认要执行转账操作吗?')
    tableObject.loading = true
    const payTransferId = await DemoWithdrawApi.transferDemoWithdraw(id)
    message.success('转账提交成功，转账单号：' + payTransferId)
    await tableMethods.getList()
  } finally {
    tableObject.loading = false
  }
}

const formatPrice = (price?: number) => `￥${((price || 0) / 100).toFixed(2)}`

const tableColumns = reactive<TableColumn[]>([
  {
    field: 'action',
    label: '操作',
    width: '100px',
    slots: {
      default: (data) =>
        data.row.status === 0 && !data.row.payTransferId ? (
          <BaseButton link type="primary" onClick={() => handleTransfer(data.row.id)}>
            发起转账
          </BaseButton>
        ) : data.row.status === 20 ? (
          <BaseButton link type="warning" onClick={() => handleTransfer(data.row.id)}>
            重新转账
          </BaseButton>
        ) : null
    }
  },
  { field: 'id', label: '提现单编号', width: '100px' },
  { field: 'subject', label: '提现标题', minWidth: '120px' },
  {
    field: 'type',
    label: '提现类型',
    minWidth: '90px',
    slots: {
      default: (data) =>
        data.row.type === 1 ? (
          <ElTag>支付宝</ElTag>
        ) : data.row.type === 2 ? (
          <ElTag>微信余额</ElTag>
        ) : data.row.type === 3 ? (
          <ElTag>钱包余额</ElTag>
        ) : null
    }
  },
  {
    field: 'price',
    label: '提现金额',
    width: '120px',
    slots: { default: (data) => <>{formatPrice(data.row.price)}</> }
  },
  { field: 'userName', label: '收款人姓名', minWidth: '150px' },
  { field: 'userAccount', label: '收款人账号', minWidth: '250px' },
  {
    field: 'status',
    label: '提现状态',
    width: '100px',
    slots: {
      default: (data) => {
        if (data.row.status === 0 && !data.row.payTransferId) {
          return <ElTag type="warning">等待转账</ElTag>
        }
        if (data.row.status === 0 && data.row.payTransferId) {
          return <ElTag type="info">转账中</ElTag>
        }
        if (data.row.status === 10) {
          return <ElTag type="success">转账成功</ElTag>
        }
        if (data.row.status === 20) {
          return <ElTag type="danger">转账失败</ElTag>
        }
        return null
      }
    }
  },
  { field: 'payTransferId', label: '转账单号', minWidth: '120px' },
  {
    field: 'transferChannelCode',
    label: '转账渠道',
    minWidth: '180px',
    slots: {
      default: (data) => (
        <DictTag type={DICT_TYPE.PAY_CHANNEL_CODE} value={data.row.transferChannelCode} />
      )
    }
  },
  {
    field: 'transferTime',
    label: '转账时间',
    width: '180px',
    formatter: dateFormatter
  },
  {
    field: 'transferErrorMsg',
    label: '转账失败原因',
    minWidth: '200px'
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
