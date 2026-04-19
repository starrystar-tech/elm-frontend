<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <el-tabs v-model="activeName" @tab-click="handleTabClick">
      <el-tab-pane label="我负责的" name="1" />
      <el-tab-pane label="我参与的" name="2" />
      <el-tab-pane label="下属负责的" name="3" />
    </el-tabs>
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton v-if="canExport" type="success" :loading="exportLoading" @click="handleExport">
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
      @register="tableRegister"
    />
  </ContentWrap>

  <BusinessForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { ElLink, type TabsPaneContext } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as BusinessApi from '@/api/crm/business'
import BusinessForm from './BusinessForm.vue'
import { erpPriceTableColumnFormatter } from '@/utils'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'CrmBusiness' })

const canCreate = hasPermission(['crm:business:create'])
const canUpdate = hasPermission(['crm:business:update'])
const canDelete = hasPermission(['crm:business:delete'])
const canExport = hasPermission(['crm:business:export'])

const activeName = ref('1')

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '商机名称',
    component: 'Input',
    componentProps: { placeholder: '请输入商机名称', clearable: true, style: { width: '240px' } }
  }
])

const formRef = ref<InstanceType<typeof BusinessForm>>()
const { push } = useRouter()

const { tableObject, tableMethods, register: tableRegister } = useTable<BusinessApi.BusinessVO>({
  getListApi: async (params) =>
    await BusinessApi.getBusinessPage({
      ...params,
      sceneType: activeName.value
    }),
  delListApi: async (id) => await BusinessApi.deleteBusiness(id as number),
  exportListApi: async (params) =>
    await BusinessApi.exportBusiness({
      ...params,
      sceneType: activeName.value
    })
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams({
    ...params,
    sceneType: activeName.value
  })
}

const handleTabClick = (tab: TabsPaneContext) => {
  activeName.value = String(tab.paneName)
  tableMethods.setSearchParams({
    ...(tableObject.params || {}),
    sceneType: activeName.value
  })
}

const openDetail = (id: number) => {
  push({ name: 'CrmBusinessDetail', params: { id } })
}

const openCustomerDetail = (id: number) => {
  push({ name: 'CrmCustomerDetail', params: { id } })
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleExport = async () => {
  await tableMethods.exportList('商机.xls')
}

const tableColumns = reactive<TableColumn[]>([
  {
    field: 'name',
    label: '商机名称',
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
    field: 'customerName',
    label: '客户名称',
    width: '120px',
    fixed: 'left',
    slots: {
      default: (data) => (
        <ElLink
          underline={false}
          type="primary"
          onClick={() => openCustomerDetail(data.row.customerId)}
        >
          {data.row.customerName}
        </ElLink>
      )
    }
  },
  {
    field: 'totalPrice',
    label: '商机金额（元）',
    width: '140px',
    formatter: erpPriceTableColumnFormatter
  },
  { field: 'dealTime', label: '预计成交日期', width: '180px', formatter: dateFormatter },
  { field: 'remark', label: '备注', width: '200px' },
  { field: 'contactNextTime', label: '下次联系时间', width: '180px', formatter: dateFormatter },
  { field: 'ownerUserName', label: '负责人', width: '100px' },
  { field: 'ownerUserDeptName', label: '所属部门', width: '100px' },
  { field: 'contactLastTime', label: '最后跟进时间', width: '180px', formatter: dateFormatter },
  { field: 'updateTime', label: '更新时间', width: '180px', formatter: dateFormatter },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  { field: 'creatorName', label: '创建人', width: '100px' },
  { field: 'statusTypeName', label: '商机状态组', width: '140px', fixed: 'right' },
  { field: 'statusName', label: '商机阶段', width: '120px', fixed: 'right' },
  {
    field: 'action',
    label: '操作',
    width: '130px',
    fixed: 'right',
    slots: {
      default: (data) => (
        <>
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>
              编辑
            </BaseButton>
          ) : null}
          {canDelete ? (
            <BaseButton link type="danger" onClick={() => handleDelete(data.row.id)}>
              删除
            </BaseButton>
          ) : null}
        </>
      )
    }
  }
])

onMounted(() => {
  tableMethods.setSearchParams({ sceneType: activeName.value })
})
</script>
