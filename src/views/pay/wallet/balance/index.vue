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

  <WalletForm ref="formRef" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { fenToYuan } from '@/utils'
import * as WalletApi from '@/api/pay/wallet/balance'
import WalletForm from './WalletForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'WalletBalance' })

const formRef = ref<InstanceType<typeof WalletForm>>()

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

const { tableObject, tableMethods, register: tableRegister } = useTable<WalletApi.WalletVO>({
  getListApi: async (params) => await WalletApi.getWalletPage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (id?: number) => {
  formRef.value?.open(id)
}

const formatPrice = (price?: number) => `${fenToYuan(price || 0)} 元`

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号' },
  { field: 'userId', label: '用户编号' },
  {
    field: 'userType',
    label: '用户类型',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.USER_TYPE} value={data.row.userType} />
    }
  },
  {
    field: 'balance',
    label: '余额',
    slots: {
      default: (data) => <>{formatPrice(data.row.balance)}</>
    }
  },
  {
    field: 'totalExpense',
    label: '累计支出',
    slots: {
      default: (data) => <>{formatPrice(data.row.totalExpense)}</>
    }
  },
  {
    field: 'totalRecharge',
    label: '累计充值',
    slots: {
      default: (data) => <>{formatPrice(data.row.totalRecharge)}</>
    }
  },
  {
    field: 'freezePrice',
    label: '冻结金额',
    slots: {
      default: (data) => <>{formatPrice(data.row.freezePrice)}</>
    }
  },
  {
    field: 'createTime',
    label: '创建时间',
    width: '180px',
    formatter: dateFormatter
  },
  {
    field: 'action',
    label: '操作',
    width: '100px',
    slots: {
      default: (data) => (
        <BaseButton link type="primary" onClick={() => openForm(data.row.id)}>
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
