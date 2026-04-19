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
      row-key="id"
      default-expand-all
      @register="tableRegister"
    />
  </ContentWrap>

  <BrandForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as ProductBrandApi from '@/api/mall/product/brand'
import BrandForm from './BrandForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ProductBrand' })

const canCreate = hasPermission(['product:brand:create'])
const canUpdate = hasPermission(['product:brand:update'])
const canDelete = hasPermission(['product:brand:delete'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '品牌名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入品牌名称',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
      style: { width: '240px' }
    }
  },
  {
    field: 'createTime',
    label: '创建时间',
    component: 'DatePicker',
    componentProps: {
      type: 'daterange',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
      style: { width: '240px' }
    }
  }
])

const formRef = ref<InstanceType<typeof BrandForm>>()

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await ProductBrandApi.getBrandParam(params),
  delListApi: async (id) => await ProductBrandApi.deleteBrand(id as number)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'name', label: '品牌名称', sortable: true },
  {
    field: 'picUrl',
    label: '品牌图片',
    align: 'center',
    slots: {
      default: (data) =>
        data.row.picUrl ? <img src={data.row.picUrl} alt="品牌图片" class="h-30px" /> : null
    }
  },
  { field: 'sort', label: '品牌排序', align: 'center' },
  {
    field: 'status',
    label: '开启状态',
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
