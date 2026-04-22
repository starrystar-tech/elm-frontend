<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
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
      :stripe="true"
      :show-overflow-tooltip="true"
      @register="tableRegister"
    />
  </ContentWrap>

  <ProductUnitForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { ProductUnitApi, ProductUnitVO } from '@/api/erp/product/unit'
import ProductUnitForm from './ProductUnitForm.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ErpProductUnit' })

const canCreate = hasPermission(['erp:product-unit:create'])
const canUpdate = hasPermission(['erp:product-unit:update'])
const canDelete = hasPermission(['erp:product-unit:delete'])
const canExport = hasPermission(['erp:product-unit:export'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '单位名字',
    component: 'Input',
    componentProps: {
      placeholder: '请输入单位名字',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '单位状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择单位状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
      style: { width: '240px' }
    }
  }
])

const formRef = ref<InstanceType<typeof ProductUnitForm>>()

const { tableObject, tableMethods, register: tableRegister } = useTable<ProductUnitVO>({
  getListApi: async (params) => await ProductUnitApi.getProductUnitPage(params),
  delListApi: async (id) => await ProductUnitApi.deleteProductUnit(id as number),
  exportListApi: async (params) => await ProductUnitApi.exportProductUnit(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleExport = async () => {
  await tableMethods.exportList('产品单位.xls')
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'name', label: '名字', align: 'center' },
  {
    field: 'status',
    label: '状态',
    align: 'center',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  {
    field: 'createTime',
    label: '创建时间',
    align: 'center',
    width: '180px',
    formatter: dateFormatter
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
