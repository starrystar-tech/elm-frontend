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
</template>

<script lang="tsx" setup>
import { ElTag } from 'element-plus'
import { reactive } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as SignInRecordApi from '@/api/member/signin/record'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'SignInRecord' })

const searchSchema = reactive<FormSchema[]>([
  { field: 'nickname', label: '签到用户', component: 'Input', componentProps: { placeholder: '请输入签到用户', clearable: true, style: { width: '240px' } } },
  { field: 'day', label: '签到天数', component: 'Input', componentProps: { placeholder: '请输入签到天数', clearable: true, style: { width: '240px' } } },
  { field: 'createTime', label: '签到时间', component: 'DatePicker', componentProps: { type: 'daterange', valueFormat: 'YYYY-MM-DD HH:mm:ss', startPlaceholder: '开始日期', endPlaceholder: '结束日期', defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')], style: { width: '240px' } } }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<SignInRecordApi.SignInRecordVO>({ getListApi: async (params) => await SignInRecordApi.getSignInRecordPage(params) })
const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号' },
  { field: 'nickname', label: '签到用户' },
  { field: 'day', label: '签到天数', formatter: (_r, _c, value) => ['第', value, '天'].join(' ') },
  {
    field: 'point',
    label: '获得积分',
    width: '100px',
    slots: {
      default: (data) =>
        data.row.point > 0 ? (
          <ElTag class="ml-2" type="success" effect="dark">+{data.row.point}</ElTag>
        ) : (
          <ElTag class="ml-2" type="danger" effect="dark">{data.row.point}</ElTag>
        )
    }
  },
  { field: 'createTime', label: '签到时间', formatter: dateFormatter }
])

onMounted(() => tableMethods.getList())
</script>
