<template>
  <ContentWrap>
    <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
    <div class="action-btn-wrap">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增合同变量</BaseButton>
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

  <VariableForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import * as VariableApi from '@/api/system/contract/variable'
import VariableForm from './VariableForm.vue'

defineOptions({ name: 'ContractRecord' })

const canCreate = hasPermission(['system:contract-variable:create'])
const canUpdate = hasPermission(['system:contract-variable:update'])
const canDelete = hasPermission(['system:contract-variable:delete'])

const message = useMessage()
const formRef = ref<InstanceType<typeof VariableForm>>()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'variableName',
    label: '合同变量',
    component: 'Input',
    componentProps: {
      placeholder: '请输入合同变量名',
      clearable: true,
      style: { width: '260px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<VariableApi.ContractVariableVO>({
  getListApi: async (params) => await VariableApi.getContractVariablePage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: 'create' | 'update', id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  await message.confirm('确认删除该合同变量吗？')
  await VariableApi.deleteContractVariable(id)
  message.success('删除成功')
  await tableMethods.getList()
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号', width: '90px' },
  { field: 'variableName', label: '合同变量名', minWidth: '260px' },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '150px',
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
  tableMethods.getList()
})
</script>
