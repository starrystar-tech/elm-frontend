<template>
  <el-row :gutter="12">
    <el-col :span="6">
      <ContentWrap class="h-[110px] pb-0!">
        <div class="flex items-center">
          <div
            class="h-[50px] w-[50px] flex items-center justify-center"
            style="color: rgb(24 144 255); background-color: rgb(24 144 255 / 10%)"
          >
            <Icon :size="23" icon="fa:user-times" />
          </div>
          <div class="ml-[20px]">
            <div class="mb-8px text-14px text-gray-400">参与人数(个)</div>
            <CountTo :duration="2600" :end-val="recordSummary.userCount" :start-val="0" class="text-20px" />
          </div>
        </div>
      </ContentWrap>
    </el-col>
    <el-col :span="6">
      <ContentWrap class="h-[110px]">
        <div class="flex items-center">
          <div
            class="h-[50px] w-[50px] flex items-center justify-center"
            style="color: rgb(162 119 255); background-color: rgb(162 119 255 / 10%)"
          >
            <Icon :size="23" icon="fa:user-plus" />
          </div>
          <div class="ml-[20px]">
            <div class="mb-8px text-14px text-gray-400">成团数量(个)</div>
            <CountTo :duration="2600" :end-val="recordSummary.successCount" :start-val="0" class="text-20px" />
          </div>
        </div>
      </ContentWrap>
    </el-col>
    <el-col :span="6">
      <ContentWrap class="h-[110px]">
        <div class="flex items-center">
          <div
            class="h-[50px] w-[50px] flex items-center justify-center"
            style="color: rgb(162 119 255); background-color: rgb(162 119 255 / 10%)"
          >
            <Icon :size="23" icon="fa:user-plus" />
          </div>
          <div class="ml-[20px]">
            <div class="mb-8px text-14px text-gray-400">虚拟成团(个)</div>
            <CountTo :duration="2600" :end-val="recordSummary.virtualGroupCount" :start-val="0" class="text-20px" />
          </div>
        </div>
      </ContentWrap>
    </el-col>
  </el-row>

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

  <CombinationRecordListDialog ref="combinationRecordListRef" />
</template>
<script lang="tsx" setup>
import CombinationRecordListDialog from './CombinationRecordListDialog.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter, defaultShortcuts } from '@/utils/formatTime'
import { createImageViewer } from '@/components/ImageViewer'
import * as CombinationRecordApi from '@/api/mall/promotion/combination/combinationRecord'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { BaseButton } from '@/components/Button'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'PromotionCombinationRecord' })

const canQuery = hasPermission(['promotion:combination-record:query'])
const combinationRecordListRef = ref()

const recordSummary = ref({
  successCount: 0,
  userCount: 0,
  virtualGroupCount: 0
})

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'createTime',
    label: '创建时间',
    component: 'DatePicker',
    componentProps: {
      type: 'daterange',
      shortcuts: defaultShortcuts,
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '拼团状态',
    component: 'Select',
    componentProps: {
      placeholder: '全部',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.PROMOTION_COMBINATION_RECORD_STATUS),
      style: { width: '240px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<CombinationRecordApi.CombinationRecordVO>({
  getListApi: async (params) => await CombinationRecordApi.getCombinationRecordPage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openRecordListDialog = (row: CombinationRecordApi.CombinationRecordVO) => {
  combinationRecordListRef.value?.open(row.headId || row.id)
}

const imagePreview = (imgUrl: string) => {
  createImageViewer({
    urlList: [imgUrl]
  })
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'id', label: '编号', minWidth: '50', align: 'center' },
  {
    field: 'avatar',
    label: '头像',
    minWidth: '80',
    align: 'center',
    slots: {
      default: (data) => <el-avatar src={data.row.avatar} />
    }
  },
  { field: 'nickname', label: '昵称', minWidth: '100', align: 'center' },
  {
    field: 'headId',
    label: '开团团长',
    minWidth: '100',
    align: 'center',
    slots: {
      default: (data) => (
        <span>
          {data.row.headId
            ? (tableObject.tableList as CombinationRecordApi.CombinationRecordVO[]).find((item) => item.id === data.row.headId)?.nickname
            : data.row.nickname}
        </span>
      )
    }
  },
  { field: 'startTime', label: '开团时间', width: '180', align: 'center', formatter: dateFormatter },
  {
    field: 'spuName',
    label: '拼团商品',
    minWidth: '300',
    align: 'center',
    showOverflowTooltip: true,
    slots: {
      default: (data) => (
        <>
          <el-image src={data.row.picUrl} class="mr-5px h-30px w-30px align-middle" onClick={() => imagePreview(data.row.picUrl)} />
          <span class="align-middle">{data.row.spuName}</span>
        </>
      )
    }
  },
  { field: 'userSize', label: '几人团', minWidth: '100', align: 'center' },
  { field: 'userCount', label: '参与人数', minWidth: '100', align: 'center' },
  { field: 'createTime', label: '参团时间', width: '180', align: 'center', formatter: dateFormatter },
  { field: 'endTime', label: '结束时间', width: '180', align: 'center', formatter: dateFormatter },
  {
    field: 'status',
    label: '拼团状态',
    minWidth: '150',
    align: 'center',
    slots: {
      default: (data) => (
        <DictTag type={DICT_TYPE.PROMOTION_COMBINATION_RECORD_STATUS} value={data.row.status} />
      )
    }
  },
  {
    field: 'action',
    label: '操作',
    align: 'center',
    fixed: 'right',
    slots: {
      default: (data) =>
        canQuery ? (
          <BaseButton link type="primary" onClick={() => openRecordListDialog(data.row)}>
            查看拼团
          </BaseButton>
        ) : null
    }
  }
])

const getSummary = async () => {
  recordSummary.value = await CombinationRecordApi.getCombinationRecordSummary()
}

onMounted(async () => {
  await getSummary()
  await tableMethods.getList()
})
</script>
