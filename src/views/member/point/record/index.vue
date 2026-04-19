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
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as RecordApi from '@/api/member/point/record'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'PointRecord' })

const searchSchema = reactive<FormSchema[]>([
  { field: 'nickname', label: '用户', component: 'Input', componentProps: { placeholder: '请输入用户昵称', clearable: true, style: { width: '240px' } } },
  { field: 'bizType', label: '业务类型', component: 'Select', componentProps: { placeholder: '请选择业务类型', clearable: true, options: getIntDictOptions(DICT_TYPE.MEMBER_POINT_BIZ_TYPE), style: { width: '240px' } } },
  { field: 'title', label: '积分标题', component: 'Input', componentProps: { placeholder: '请输入积分标题', clearable: true, style: { width: '240px' } } },
  { field: 'createDate', label: '获得时间', component: 'DatePicker', componentProps: { type: 'daterange', valueFormat: 'YYYY-MM-DD HH:mm:ss', startPlaceholder: '开始日期', endPlaceholder: '结束日期', defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')], style: { width: '240px' } } }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<RecordApi.RecordVO>({ getListApi: async (params) => await RecordApi.getRecordPage(params) })
const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号', width: '180px' },
  { field: 'createTime', label: '获得时间', width: '180px', formatter: dateFormatter },
  { field: 'nickname', label: '用户', width: '200px' },
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
  { field: 'totalPoint', label: '总积分', width: '100px' },
  { field: 'title', label: '标题' },
  { field: 'description', label: '描述' },
  { field: 'bizId', label: '业务编码' },
  { field: 'bizType', label: '业务类型', slots: { default: (data) => <DictTag type={DICT_TYPE.MEMBER_POINT_BIZ_TYPE} value={data.row.bizType} /> } }
])

onMounted(() => tableMethods.getList())
</script>
