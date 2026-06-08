<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="resetSearch" @search="setSearchParams" />
    <div class="mb-10px flex flex-wrap gap-10px">
      <BaseButton @click="handleUpdateList">标记已读</BaseButton>
      <BaseButton @click="handleUpdateAll()">全部已读</BaseButton>
      <BaseButton v-if="currentCategory" @click="handleUpdateAll(currentCategory)">当前分类全部已读</BaseButton>
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
import { ElTag } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as NotifyMessageApi from '@/api/system/notify/message'
import MyNotifyMessageDetail from './MyNotifyMessageDetail.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn, type TableExpose } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'SystemMyNotify' })

const message = useMessage()
const tableRef = ref<TableExpose>()
const detailRef = ref<InstanceType<typeof MyNotifyMessageDetail>>()
const selectedIds = ref<number[]>([])
const currentCategory = ref('')

const categoryOptions = [
  { label: '预约提醒', value: 'appointment' },
  { label: '工单提醒', value: 'work_order' },
  { label: '支付确认提醒', value: 'payment' }
]

const readStatusOptions = [
  { label: '未读', value: 0 },
  { label: '已读', value: 1 }
]

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'category',
    label: '提醒分类',
    component: 'Select',
    componentProps: {
      placeholder: '请选择提醒分类',
      clearable: true,
      options: categoryOptions,
      style: { width: '240px' }
    }
  },
  {
    field: 'readStatus',
    label: '读取状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择读取状态',
      clearable: true,
      options: readStatusOptions,
      style: { width: '240px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<NotifyMessageApi.NotifyMessageVO>({
  getListApi: async (params) => await NotifyMessageApi.getMyNotifyMessagePage(params)
})

const setSearchParams = (params: Recordable) => {
  currentCategory.value = params?.category || ''
  tableMethods.setSearchParams(params)
}

const resetSearch = async (params: Recordable) => {
  selectedIds.value = []
  currentCategory.value = ''
  tableRef.value?.clearSelection()
  tableMethods.setSearchParams(params)
}

const isRead = (row: NotifyMessageApi.NotifyMessageVO) => Number(row.readStatus) === 1

const handleReadOne = async (id: number) => {
  await NotifyMessageApi.updateNotifyMessageRead(id)
}

const openDetail = async (data: NotifyMessageApi.NotifyMessageVO) => {
  const detailData = { ...data }
  if (!isRead(data)) {
    await handleReadOne(data.id)
    detailData.readStatus = 1
    detailData.readTime = new Date()
    await tableMethods.getList()
  }
  detailRef.value?.open(detailData)
}

const handleUpdateAll = async (category?: string) => {
  await NotifyMessageApi.updateAllNotifyMessageRead(category)
  message.success('操作成功')
  tableRef.value?.clearSelection()
  selectedIds.value = []
  await tableMethods.getList()
}

const handleUpdateList = async () => {
  if (selectedIds.value.length === 0) {
    return
  }
  await NotifyMessageApi.updateNotifyMessageRead(selectedIds.value)
  message.success('标记已读成功')
  tableRef.value?.clearSelection()
  selectedIds.value = []
  await tableMethods.getList()
}

const selectable = (row: NotifyMessageApi.NotifyMessageVO) => !isRead(row)

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
  { field: 'categoryName', label: '提醒分类', width: '120px' },
  { field: 'customerName', label: '客户姓名', width: '120px' },
  { field: 'customerMobile', label: '手机号', width: '140px' },
  { field: 'displayContent', label: '提醒内容', minWidth: '360px', showOverflowTooltip: true },
  { field: 'triggerTime', label: '触发时间', width: '180px', formatter: dateFormatter },
  {
    field: 'readStatus',
    label: '读取状态',
    width: '100px',
    slots: {
      default: (data) => (
        <ElTag type={Number(data.row.readStatus) === 1 ? 'success' : 'danger'}>
          {Number(data.row.readStatus) === 1 ? '已读' : '未读'}
        </ElTag>
      )
    }
  },
  { field: 'readTime', label: '读取时间', width: '180px', formatter: dateFormatter },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '120px',
    fixed: 'right',
    slots: {
      default: (data) => (
        <BaseButton
          link
          type={Number(data.row.readStatus) === 1 ? 'primary' : 'warning'}
          onClick={() => openDetail(data.row as NotifyMessageApi.NotifyMessageVO)}
        >
          {Number(data.row.readStatus) === 1 ? '详情' : '已读'}
        </BaseButton>
      )
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
