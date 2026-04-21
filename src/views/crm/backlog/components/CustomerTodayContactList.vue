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
      :show-overflow-tooltip="true"
      :stripe="true"
      @register="tableRegister"
    />
  </ContentWrap>
</template>

<script lang="tsx" setup>
import { computed, reactive } from 'vue'
import * as CustomerApi from '@/api/crm/customer'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { CONTACT_STATUS, SCENE_TYPES } from './common'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'CrmCustomerTodayContactList' })

const { push } = useRouter()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'contactStatus',
    label: '状态',
    component: 'Select',
    componentProps: {
      placeholder: '状态',
      options: CONTACT_STATUS,
      style: { width: '240px' }
    }
  },
  {
    field: 'sceneType',
    label: '归属',
    component: 'Select',
    componentProps: {
      placeholder: '归属',
      options: SCENE_TYPES,
      style: { width: '240px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await CustomerApi.getCustomerPage(params),
  defaultParams: {
    contactStatus: 1,
    sceneType: 1,
    pool: null
  }
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openDetail = (id: number) => {
  push({ name: 'CrmCustomerDetail', params: { id } })
}

const tableColumns = computed<TableColumn[]>(() => [
  {
    field: 'name',
    label: '客户名称',
    fixed: 'left',
    width: '160',
    align: 'center',
    slots: {
      default: (data) => (
        <el-link underline={false} type="primary" onClick={() => openDetail(data.row.id)}>
          {data.row.name}
        </el-link>
      )
    }
  },
  {
    field: 'source',
    label: '客户来源',
    width: '100',
    align: 'center',
    slots: {
      default: (data) => <dict-tag type={DICT_TYPE.CRM_CUSTOMER_SOURCE} value={data.row.source} />
    }
  },
  { field: 'mobile', label: '手机', width: '120', align: 'center' },
  { field: 'telephone', label: '电话', width: '130', align: 'center' },
  { field: 'email', label: '邮箱', width: '180', align: 'center' },
  {
    field: 'level',
    label: '客户级别',
    width: '135',
    align: 'center',
    slots: {
      default: (data) => <dict-tag type={DICT_TYPE.CRM_CUSTOMER_LEVEL} value={data.row.level} />
    }
  },
  {
    field: 'industryId',
    label: '客户行业',
    width: '100',
    align: 'center',
    slots: {
      default: (data) => (
        <dict-tag type={DICT_TYPE.CRM_CUSTOMER_INDUSTRY} value={data.row.industryId} />
      )
    }
  },
  {
    field: 'contactNextTime',
    label: '下次联系时间',
    width: '180px',
    align: 'center',
    formatter: dateFormatter
  },
  { field: 'remark', label: '备注', width: '200', align: 'center' },
  {
    field: 'lockStatus',
    label: '锁定状态',
    align: 'center',
    slots: {
      default: (data) => <dict-tag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.lockStatus} />
    }
  },
  {
    field: 'dealStatus',
    label: '成交状态',
    align: 'center',
    slots: {
      default: (data) => <dict-tag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.dealStatus} />
    }
  },
  {
    field: 'contactLastTime',
    label: '最后跟进时间',
    width: '180px',
    align: 'center',
    formatter: dateFormatter
  },
  { field: 'contactLastContent', label: '最后跟进记录', width: '200', align: 'center' },
  { field: 'detailAddress', label: '地址', width: '180', align: 'center' },
  {
    field: 'poolDay',
    label: '距离进入公海天数',
    width: '140',
    align: 'center',
    slots: {
      default: (data) => <span>{data.row.poolDay} 天</span>
    }
  },
  { field: 'ownerUserName', label: '负责人', width: '100px', align: 'center' },
  { field: 'ownerUserDeptName', label: '所属部门', width: '100px', align: 'center' },
  { field: 'updateTime', label: '更新时间', width: '180px', align: 'center', formatter: dateFormatter },
  { field: 'createTime', label: '创建时间', width: '180px', align: 'center', formatter: dateFormatter },
  { field: 'creatorName', label: '创建人', width: '100px', align: 'center' }
])

onActivated(async () => {
  await tableMethods.getList()
})

onMounted(() => {
  tableMethods.getList()
})
</script>

<style lang="scss"></style>
