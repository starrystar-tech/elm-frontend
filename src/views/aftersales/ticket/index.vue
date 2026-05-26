<template>
  <ContentWrap>
    <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
    <div class="action-btn-wrap">
      <BaseButton type="primary" @click="openAssign">分配处理人</BaseButton>
    </div>
    <Table
      selection
      v-model:currentPage="tableObject.currentPage"
      v-model:pageSize="tableObject.pageSize"
      :columns="tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{ total: tableObject.total }"
      @register="tableRegister"
    />
    <AftersalesAssignDialog ref="assignRef" @success="tableMethods.getList()" />
    <AftersalesDetailDialog ref="detailRef" />
  </ContentWrap>
</template>

<script setup lang="tsx">
import { computed, onMounted } from 'vue'
import { ElLink } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { dateFormatter } from '@/utils/formatTime'
import * as AftersalesApi from '@/api/crm/aftersales'
import * as HeadteacherApi from '@/api/crm/allocation/headteacher'
import {
  buildBaseSearchSchema,
  buildPageParams,
  getAftersalesPriorityLabel,
  getAftersalesStatusLabel,
  getAftersalesTypeLabel
} from '../config'
import AftersalesAssignDialog from '../components/AftersalesAssignDialog.vue'
import AftersalesDetailDialog from '../components/AftersalesDetailDialog.vue'

defineOptions({ name: 'AftersalesTicket' })

const message = useMessage()
const assignRef = ref()
const detailRef = ref()
const handlerOptions = ref<{ label: string; value: number }[]>([])

const searchSchema = computed<FormSchema[]>(() => buildBaseSearchSchema(handlerOptions.value))

const { tableObject, tableMethods, register: tableRegister } = useTable<AftersalesApi.AftersalesRespVO>({
  getListApi: async (params) => await AftersalesApi.getAftersalesPage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(buildPageParams(params))
}

const openAssign = async () => {
  const selections = await tableMethods.getSelections()
  if (!selections.length) {
    message.warning('请先选择工单')
    return
  }
  assignRef.value.open(selections.map((item) => item.id))
}

const claim = async (row: AftersalesApi.AftersalesRespVO) => {
  await AftersalesApi.claimAftersales(row.id)
  message.success('领取成功')
  await tableMethods.getList()
}

const tableColumns = computed<TableColumn[]>(() => [
  {
    field: 'ticketNo',
    label: '工单号',
    minWidth: '170px',
    fixed: 'left',
    slots: {
      default: (data) => (
        <ElLink type="primary" underline={false} onClick={() => detailRef.value.open(data.row.id)}>
          {data.row.ticketNo}
        </ElLink>
      )
    }
  },
  { field: 'clueId', label: '线索ID', minWidth: '90px' },
  { field: 'orderNo', label: '订单编号', minWidth: '160px' },
  { field: 'customerName', label: '客户', minWidth: '100px' },
  { field: 'customerMobile', label: '手机号', minWidth: '130px' },
  { field: 'ticketType', label: '类型', minWidth: '100px', formatter: (_r, _c, v) => getAftersalesTypeLabel(v) },
  { field: 'priority', label: '优先级', minWidth: '90px', formatter: (_r, _c, v) => getAftersalesPriorityLabel(v) },
  { field: 'status', label: '状态', minWidth: '100px', formatter: (_r, _c, v) => getAftersalesStatusLabel(v) },
  { field: 'processResult', label: '处理结果', minWidth: '160px', showOverflowTooltip: true },
  { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter },
  { field: 'handlerUserName', label: '处理人', minWidth: '100px' },
  { field: 'receiveTime', label: '领取时间', minWidth: '170px', formatter: dateFormatter },
  { field: 'processTime', label: '处理时间', minWidth: '170px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '160px',
    fixed: 'right',
    slots: {
      default: (data) => {
        const row = data.row as AftersalesApi.AftersalesRespVO
        return (
          <>
            <BaseButton link type="primary" onClick={() => detailRef.value.open(row.id)}>
              查看
            </BaseButton>
            {!row.handlerUserId ? (
              <BaseButton link type="warning" onClick={() => claim(row)}>
                领取
              </BaseButton>
            ) : null}
          </>
        )
      }
    }
  }
])

onMounted(async () => {
  const list = await HeadteacherApi.getHeadteacherSimpleList()
  handlerOptions.value = (list || []).map((item) => ({ label: item.nickname || item.username, value: item.id }))
  await tableMethods.getList()
})
</script>
