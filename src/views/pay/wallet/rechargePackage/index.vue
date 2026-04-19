<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
    </div>
    <Table
      v-model:currentPage="tableObject.currentPage"
      v-model:pageSize="tableObject.pageSize"
      :columns="tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{ total: tableObject.total }"
      stripe
      show-overflow-tooltip
      @register="tableRegister"
    />
  </ContentWrap>

  <WalletRechargePackageForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as WalletRechargePackageApi from '@/api/pay/wallet/rechargePackage'
import WalletRechargePackageForm from './WalletRechargePackageForm.vue'
import { fenToYuan } from '@/utils'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'WalletRechargePackage' })

const canCreate = hasPermission(['pay:wallet-recharge-package:create'])
const canUpdate = hasPermission(['pay:wallet-recharge-package:update'])
const canDelete = hasPermission(['pay:wallet-recharge-package:delete'])

const searchSchema = reactive<FormSchema[]>([
  { field: 'name', label: '套餐名', component: 'Input', componentProps: { placeholder: '请输入套餐名', clearable: true, style: { width: '240px' } } },
  { field: 'status', label: '状态', component: 'Select', componentProps: { placeholder: '请选择状态', clearable: true, options: getIntDictOptions(DICT_TYPE.COMMON_STATUS), style: { width: '240px' } } },
  { field: 'createTime', label: '创建时间', component: 'DatePicker', componentProps: { type: 'daterange', valueFormat: 'YYYY-MM-DD HH:mm:ss', startPlaceholder: '开始日期', endPlaceholder: '结束日期', defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')], style: { width: '240px' } } }
])

const formRef = ref<InstanceType<typeof WalletRechargePackageForm>>()
const openForm = (type: string, id?: number) => formRef.value?.open(type, id)
const { tableObject, tableMethods, register: tableRegister } = useTable<WalletRechargePackageApi.WalletRechargePackageVO>({ getListApi: async (params) => await WalletRechargePackageApi.getWalletRechargePackagePage(params), delListApi: async (id) => await WalletRechargePackageApi.deleteWalletRechargePackage(id as number) })
const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)
const handleDelete = async (id: number) => tableMethods.delList(id, false)

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号' },
  { field: 'name', label: '套餐名' },
  { field: 'payPrice', label: '支付金额', slots: { default: (data) => <>{fenToYuan(data.row.payPrice)} 元</> } },
  { field: 'bonusPrice', label: '赠送金额', slots: { default: (data) => <>{fenToYuan(data.row.bonusPrice)} 元</> } },
  { field: 'status', label: '状态', slots: { default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} /> } },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  { field: 'action', label: '操作', slots: { default: (data) => <>{canUpdate ? <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>编辑</BaseButton> : null}{canDelete ? <BaseButton link type="danger" onClick={() => handleDelete(data.row.id)}>删除</BaseButton> : null}</> } }
])

onMounted(() => tableMethods.getList())
</script>
