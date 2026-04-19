<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="resetSearch" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton @click="handleUpdateList">标记已读</BaseButton>
      <BaseButton @click="handleUpdateAll">全部已读</BaseButton>
    </div>
    <Table
      ref="tableRef"
      v-model:currentPage="tableObject.currentPage"
      v-model:pageSize="tableObject.pageSize"
      :columns="tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{ total: tableObject.total }"
      row-key="id"
      @register="tableRegister"
      @selection-change="handleSelectionChange"
    />
  </ContentWrap>

  <MyNotifyMessageDetail ref="detailRef" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { DICT_TYPE, getBoolDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as NotifyMessageApi from '@/api/system/notify/message'
import MyNotifyMessageDetail from './MyNotifyMessageDetail.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn, type TableExpose } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'SystemMyNotify' })

const message = useMessage()
const tableRef = ref<TableExpose>()
const selectedIds = ref<number[]>([])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'readStatus',
    label: '是否已读',
    component: 'Select',
    componentProps: {
      placeholder: '请选择状态',
      clearable: true,
      options: getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING),
      style: { width: '240px' }
    }
  },
  {
    field: 'createTime',
    label: '发送时间',
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

const detailRef = ref<InstanceType<typeof MyNotifyMessageDetail>>()

const { tableObject, tableMethods, register: tableRegister } =
  useTable<NotifyMessageApi.NotifyMessageVO>({
    getListApi: async (params) => await NotifyMessageApi.getMyNotifyMessagePage(params)
  })

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const resetSearch = async (params: Recordable) => {
  selectedIds.value = []
  tableRef.value?.clearSelection()
  tableMethods.setSearchParams(params)
}

const handleReadOne = async (id: number) => {
  await NotifyMessageApi.updateNotifyMessageRead(id)
  await tableMethods.getList()
}

const openDetail = async (data: NotifyMessageApi.NotifyMessageVO) => {
  if (!data.readStatus) {
    await handleReadOne(data.id)
  }
  detailRef.value?.open(data)
}

const handleUpdateAll = async () => {
  await NotifyMessageApi.updateAllNotifyMessageRead()
  message.success('全部已读成功！')
  tableRef.value?.clearSelection()
  selectedIds.value = []
  await tableMethods.getList()
}

const handleUpdateList = async () => {
  if (selectedIds.value.length === 0) return
  await NotifyMessageApi.updateNotifyMessageRead(selectedIds.value)
  message.success('批量已读成功！')
  tableRef.value?.clearSelection()
  selectedIds.value = []
  await tableMethods.getList()
}

const selectable = (row: NotifyMessageApi.NotifyMessageVO) => !row.readStatus

const handleSelectionChange = (rows: NotifyMessageApi.NotifyMessageVO[]) => {
  selectedIds.value = rows?.map((row) => row.id) || []
}

const tableColumns = reactive<TableColumn[]>([
  {
    field: 'selection',
    type: 'selection',
    selectable,
    reserveSelection: true,
    width: '55'
  },
  { field: 'templateNickname', label: '发送人', width: '180px' },
  { field: 'createTime', label: '发送时间', width: '200px', formatter: dateFormatter },
  {
    field: 'templateType',
    label: '类型',
    width: '180px',
    slots: {
      default: (data) => (
        <DictTag type={DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE} value={data.row.templateType} />
      )
    }
  },
  { field: 'templateContent', label: '消息内容', showOverflowTooltip: true },
  {
    field: 'readStatus',
    label: '是否已读',
    width: '160px',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.readStatus} />
    }
  },
  { field: 'readTime', label: '阅读时间', width: '200px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '160px',
    slots: {
      default: (data) => (
        <BaseButton
          link
          type={data.row.readStatus ? 'primary' : 'warning'}
          onClick={() => openDetail(data.row as NotifyMessageApi.NotifyMessageVO)}
        >
          {data.row.readStatus ? '详情' : '已读'}
        </BaseButton>
      )
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
