<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
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
      :stripe="true"
      :show-overflow-tooltip="true"
      @register="tableRegister"
    />
  </ContentWrap>

  <CustomerForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE } from '@/utils/dict'
import { CustomerApi, CustomerVO } from '@/api/erp/sale/customer'
import CustomerForm from './CustomerForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ErpCustomer' })

const canCreate = hasPermission(['erp:customer:create'])
const canUpdate = hasPermission(['erp:customer:update'])
const canDelete = hasPermission(['erp:customer:delete'])
const canExport = hasPermission(['erp:customer:export'])

const message = useMessage()
const formRef = ref<InstanceType<typeof CustomerForm>>()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '名称',
    component: 'Input',
    componentProps: { placeholder: '请输入名称', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'mobile',
    label: '手机号码',
    component: 'Input',
    componentProps: { placeholder: '请输入手机号码', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'telephone',
    label: '联系电话',
    component: 'Input',
    componentProps: { placeholder: '请输入联系电话', clearable: true, style: { width: '240px' } }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<CustomerVO>({
  getListApi: async (params) => await CustomerApi.getCustomerPage(params),
  exportListApi: async (params) => await CustomerApi.exportCustomer(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await CustomerApi.deleteCustomer(id)
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const handleExport = async () => {
  await tableMethods.exportList('客户.xls')
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'name', label: '名称', align: 'center' },
  { field: 'contact', label: '联系人', align: 'center' },
  { field: 'mobile', label: '手机号码', align: 'center' },
  { field: 'telephone', label: '联系电话', align: 'center' },
  { field: 'email', label: '电子邮箱', align: 'center' },
  { field: 'remark', label: '备注', align: 'center' },
  { field: 'sort', label: '排序', align: 'center' },
  {
    field: 'status',
    label: '状态',
    align: 'center',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  {
    field: 'action',
    label: '操作',
    align: 'center',
    width: '140px',
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
