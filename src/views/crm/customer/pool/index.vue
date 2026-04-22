<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canExport" type="primary" plain :loading="exportLoading" @click="handleExport">
        导出
      </BaseButton>
    </div>
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
import { computed, reactive, watch } from 'vue'
import { ElLink } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as CustomerApi from '@/api/crm/customer'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'CrmCustomerPool' })

const canExport = hasPermission(['crm:customer:export'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '客户名称',
    component: 'Input',
    componentProps: { placeholder: '请输入客户名称', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'mobile',
    label: '手机',
    component: 'Input',
    componentProps: { placeholder: '请输入手机', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'industryId',
    label: '所属行业',
    component: 'Select',
    componentProps: {
      placeholder: '请选择所属行业',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_INDUSTRY),
      style: { width: '240px' }
    }
  },
  {
    field: 'level',
    label: '客户级别',
    component: 'Select',
    componentProps: {
      placeholder: '请选择客户级别',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_LEVEL),
      style: { width: '240px' }
    }
  },
  {
    field: 'source',
    label: '客户来源',
    component: 'Select',
    componentProps: {
      placeholder: '请选择客户来源',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_SOURCE),
      style: { width: '240px' }
    }
  }
])

const { currentRoute, push } = useRouter()
const { tableObject, tableMethods, register: tableRegister } = useTable<CustomerApi.CustomerVO>({
  getListApi: async (params) =>
    await CustomerApi.getCustomerPage({
      ...params,
      pool: true
    }),
  exportListApi: async (params) =>
    await CustomerApi.exportCustomer({
      ...params,
      pool: true
    })
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams({
    ...params,
    pool: true
  })
}

const openDetail = (id: number) => {
  push({ name: 'CrmCustomerDetail', params: { id } })
}

const handleExport = async () => {
  await tableMethods.exportList('客户公海.xls')
}

const tableColumns = reactive<TableColumn[]>([
  {
    field: 'name',
    label: '客户名称',
    width: '160px',
    fixed: 'left',
    slots: {
      default: (data) => (
        <ElLink underline={false} type="primary" onClick={() => openDetail(data.row.id)}>
          {data.row.name}
        </ElLink>
      )
    }
  },
  {
    field: 'source',
    label: '客户来源',
    width: '100px',
    slots: { default: (data) => <DictTag type={DICT_TYPE.CRM_CUSTOMER_SOURCE} value={data.row.source} /> }
  },
  { field: 'mobile', label: '手机', width: '120px' },
  { field: 'telephone', label: '电话', width: '130px' },
  { field: 'email', label: '邮箱', width: '180px' },
  {
    field: 'level',
    label: '客户级别',
    width: '135px',
    slots: { default: (data) => <DictTag type={DICT_TYPE.CRM_CUSTOMER_LEVEL} value={data.row.level} /> }
  },
  {
    field: 'industryId',
    label: '客户行业',
    width: '100px',
    slots: { default: (data) => <DictTag type={DICT_TYPE.CRM_CUSTOMER_INDUSTRY} value={data.row.industryId} /> }
  },
  { field: 'contactNextTime', label: '下次联系时间', width: '180px', formatter: dateFormatter },
  { field: 'remark', label: '备注', width: '200px' },
  {
    field: 'dealStatus',
    label: '成交状态',
    slots: { default: (data) => <DictTag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.dealStatus} /> }
  },
  { field: 'contactLastTime', label: '最后跟进时间', width: '180px', formatter: dateFormatter },
  { field: 'contactLastContent', label: '最后跟进记录', width: '200px' },
  { field: 'updateTime', label: '更新时间', width: '180px', formatter: dateFormatter },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  { field: 'creatorName', label: '创建人', width: '100px' }
])

watch(
  () => currentRoute.value,
  () => {
    tableMethods.getList()
  }
)

onMounted(() => {
  tableMethods.setSearchParams({ pool: true })
})
</script>
