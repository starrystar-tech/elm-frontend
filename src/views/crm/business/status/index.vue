<template>
  <ContentWrap>
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
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

  <BusinessStatusForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as BusinessStatusApi from '@/api/crm/business/status'
import BusinessStatusForm from './BusinessStatusForm.vue'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'CrmBusinessStatus' })

const canCreate = hasPermission(['crm:business-status:create'])
const canUpdate = hasPermission(['crm:business-status:update'])
const canDelete = hasPermission(['crm:business-status:delete'])

const formRef = ref<InstanceType<typeof BusinessStatusForm>>()

const { tableObject, tableMethods, register: tableRegister } =
  useTable<BusinessStatusApi.BusinessStatusTypeVO>({
    getListApi: async (params) => await BusinessStatusApi.getBusinessStatusPage(params),
    delListApi: async (id) => await BusinessStatusApi.deleteBusinessStatus(id as number)
  })

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'name', label: '状态组名' },
  {
    field: 'deptNames',
    label: '应用部门',
    slots: {
      default: (data) => (
        <>{data.row?.deptNames?.length > 0 ? data.row.deptNames.join(' ') : '全公司'}</>
      )
    }
  },
  { field: 'creator', label: '创建人' },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
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
  tableMethods.getList()
})
</script>
