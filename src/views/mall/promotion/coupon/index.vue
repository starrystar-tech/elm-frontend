<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <el-tabs v-model="activeTab" type="card" @tab-change="onTabChange">
      <el-tab-pane v-for="tab in statusTabs" :key="tab.value" :label="tab.label" :name="tab.value" />
    </el-tabs>
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
</template>

<script setup lang="tsx" name="PromotionCoupon">
import { computed, reactive, ref } from 'vue'
import { deleteCoupon, getCouponPage } from '@/api/mall/promotion/coupon/coupon'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { discountFormat } from '@/views/mall/promotion/coupon/formatter'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'PromotionCoupon' })

const canDelete = hasPermission(['promotion:coupon:delete'])
const message = useMessage()

const activeTab = ref('all')
const statusTabs = reactive<{ label: string; value: string | number }[]>([
  { label: '全部', value: 'all' }
])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'nickname',
    label: '会员昵称',
    component: 'Input',
    componentProps: { placeholder: '请输入会员昵称', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'createTime',
    label: '领取时间',
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

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await getCouponPage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams({
    ...params,
    status: activeTab.value === 'all' ? undefined : activeTab.value
  })
}

const handleDelete = async (id: number) => {
  try {
    await message.confirm(
      '回收将会收回会员领取的待使用的优惠券，已使用的将无法回收，确定要回收所选优惠券吗？'
    )
    await deleteCoupon(id)
    message.notifySuccess('回收成功')
    await tableMethods.getList()
  } catch {}
}

const onTabChange = (tabName: string | number) => {
  activeTab.value = String(tabName)
  tableMethods.setSearchParams({
    status: tabName === 'all' ? undefined : tabName
  })
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'nickname', label: '会员昵称', minWidth: '100' },
  { field: 'name', label: '优惠券名称', minWidth: '140' },
  {
    field: 'productScope',
    label: '类型',
    slots: {
      default: (data) => (
        <DictTag type={DICT_TYPE.PROMOTION_PRODUCT_SCOPE} value={data.row.productScope} />
      )
    }
  },
  {
    field: 'discount',
    label: '优惠',
    minWidth: '100',
    slots: {
      default: (data) => (
        <>
          <DictTag type={DICT_TYPE.PROMOTION_DISCOUNT_TYPE} value={data.row.discountType} />
          {discountFormat(data.row)}
        </>
      )
    }
  },
  {
    field: 'takeType',
    label: '领取方式',
    slots: {
      default: (data) => (
        <DictTag type={DICT_TYPE.PROMOTION_COUPON_TAKE_TYPE} value={data.row.takeType} />
      )
    }
  },
  {
    field: 'status',
    label: '状态',
    slots: {
      default: (data) => (
        <DictTag type={DICT_TYPE.PROMOTION_COUPON_STATUS} value={data.row.status} />
      )
    }
  },
  { field: 'createTime', label: '领取时间', width: '180', formatter: dateFormatter },
  { field: 'useTime', label: '使用时间', width: '180', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    slots: {
      default: (data) =>
        canDelete ? (
          <BaseButton link type="danger" onClick={() => handleDelete(data.row.id)}>
            回收
          </BaseButton>
        ) : null
    }
  }
])

onMounted(() => {
  tableMethods.getList()
  for (const dict of getIntDictOptions(DICT_TYPE.PROMOTION_COUPON_STATUS)) {
    statusTabs.push({
      label: dict.label,
      value: dict.value as string
    })
  }
})
</script>
