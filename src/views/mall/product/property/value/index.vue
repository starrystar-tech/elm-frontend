<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
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

  <ValueForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as PropertyApi from '@/api/mall/product/property'
import ValueForm from './ValueForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ProductPropertyValue' })

const canCreate = hasPermission(['product:property:create'])
const canUpdate = hasPermission(['product:property:update'])
const canDelete = hasPermission(['product:property:delete'])

const { params } = useRoute()
const propertyId = Number(params.propertyId)
const formRef = ref<InstanceType<typeof ValueForm>>()
const propertyOptions = ref<any[]>([])

const searchSchema = computed<FormSchema[]>(() => [
  {
    field: 'propertyId',
    label: '属性项',
    component: 'Select',
    componentProps: {
      disabled: true,
      options: propertyOptions.value.map((item) => ({ label: item.name, value: item.id })),
      style: { width: '240px' }
    }
  },
  {
    field: 'name',
    label: '名称',
    component: 'Input',
    componentProps: { placeholder: '请输入名称', clearable: true, style: { width: '240px' } }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) =>
    await PropertyApi.getPropertyValuePage({
      ...params,
      propertyId
    }),
  delListApi: async (id) => await PropertyApi.deletePropertyValue(id as number)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams({
    ...params,
    propertyId
  })
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, propertyId, id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'id', label: '编号', align: 'center', minWidth: '60px' },
  { field: 'name', label: '属性值名称', align: 'center', minWidth: '150px' },
  { field: 'remark', label: '备注', align: 'center', showOverflowTooltip: true },
  { field: 'createTime', label: '创建时间', align: 'center', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    align: 'center',
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

onMounted(async () => {
  tableMethods.setSearchParams({ propertyId })
  propertyOptions.value.push(await PropertyApi.getProperty(propertyId))
})
</script>
