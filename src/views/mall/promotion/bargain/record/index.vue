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
      :stripe="true"
      :show-overflow-tooltip="true"
      @register="tableRegister"
    />
  </ContentWrap>
  <BargainRecordListDialog ref="recordListDialogRef" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as BargainRecordApi from '@/api/mall/promotion/bargain/bargainRecord'
import { fenToYuanFormat } from '@/utils/formatter'
import BargainRecordListDialog from './BargainRecordListDialog.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { BaseButton } from '@/components/Button'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'PromotionBargainRecord' })

const canQuery = hasPermission(['promotion:bargain-help:query'])
const recordListDialogRef = ref()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'status',
    label: '砍价状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择砍价状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.PROMOTION_BARGAIN_RECORD_STATUS),
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

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await BargainRecordApi.getBargainRecordPage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openRecordListDialog = (id?: number) => {
  recordListDialogRef.value?.open(id)
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'id', label: '编号', minWidth: '50' },
  {
    field: 'nickname',
    label: '发起用户',
    minWidth: '120',
    slots: {
      default: (data) => (
        <>
          <el-image
            src={data.row.avatar}
            class="h-20px w-20px"
            preview-src-list={[data.row.avatar]}
            preview-teleported
          />
          <span class="ml-4px">{data.row.nickname}</span>
        </>
      )
    }
  },
  { field: 'createTime', label: '发起时间', width: '180px', formatter: dateFormatter },
  { field: 'activity.name', label: '砍价活动', minWidth: '150' },
  {
    field: 'activity.bargainMinPrice',
    label: '最低价',
    minWidth: '100',
    formatter: fenToYuanFormat
  },
  { field: 'bargainPrice', label: '当前价', minWidth: '100', formatter: fenToYuanFormat },
  { field: 'activity.helpMaxCount', label: '总砍价次数', minWidth: '100' },
  { field: 'helpCount', label: '剩余砍价次数', minWidth: '100' },
  {
    field: 'status',
    label: '砍价状态',
    slots: {
      default: (data) => (
        <DictTag type={DICT_TYPE.PROMOTION_BARGAIN_RECORD_STATUS} value={data.row.status} />
      )
    }
  },
  { field: 'endTime', label: '结束时间', width: '180px', formatter: dateFormatter },
  { field: 'orderId', label: '订单编号', align: 'center' },
  {
    field: 'action',
    label: '操作',
    slots: {
      default: (data) =>
        canQuery ? (
          <BaseButton link type="primary" onClick={() => openRecordListDialog(data.row.id)}>
            助力
          </BaseButton>
        ) : null
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
