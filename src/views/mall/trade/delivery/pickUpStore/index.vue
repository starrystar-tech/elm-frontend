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

  <DeliveryPickUpStoreForm ref="formRef" @success="tableMethods.getList" />
  <DeliveryPickUpStoreBindForm ref="formBindRef" />
</template>

<script lang="tsx" name="DeliveryPickUpStore" setup>
import { reactive, ref } from 'vue'
import * as DeliveryPickUpStoreApi from '@/api/mall/trade/delivery/pickUpStore'
import DeliveryPickUpStoreForm from './PickUpStoreForm.vue'
import DeliveryPickUpStoreBindForm from './DeliveryPickUpStoreBindForm.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

const canCreate = hasPermission(['trade:delivery:pick-up-store:create'])
const canUpdate = hasPermission(['trade:delivery:pick-up-store:update'])
const canDelete = hasPermission(['trade:delivery:pick-up-store:delete'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'phone',
    label: '门店手机',
    component: 'Input',
    componentProps: {
      placeholder: '请输门店手机',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'name',
    label: '门店名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输门店名称',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '门店状态',
    component: 'Select',
    componentProps: {
      placeholder: '门店状态',
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
      type: 'datetimerange',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      style: { width: '240px' }
    }
  }
])

const formRef = ref<InstanceType<typeof DeliveryPickUpStoreForm>>()
const formBindRef = ref<InstanceType<typeof DeliveryPickUpStoreBindForm>>()

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await DeliveryPickUpStoreApi.getDeliveryPickUpStorePage(params),
  delListApi: async (id) => await DeliveryPickUpStoreApi.deleteDeliveryPickUpStore(id as number)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const openFormBind = (id?: number) => {
  formBindRef.value?.open(id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号', minWidth: '80px' },
  {
    field: 'logo',
    label: '门店 logo',
    minWidth: '100px',
    slots: {
      default: (data) =>
        data.row.logo ? <img src={data.row.logo} alt="门店 logo" class="h-50px" /> : null
    }
  },
  { field: 'name', label: '门店名称', minWidth: '150px' },
  { field: 'phone', label: '门店手机', minWidth: '100px' },
  { field: 'detailAddress', label: '地址', minWidth: '100px' },
  {
    field: 'openingHours',
    label: '营业时间',
    minWidth: '180px',
    slots: {
      default: (data) => (
        <>
          {data.row.openingTime} ~ {data.row.closingTime}
        </>
      )
    }
  },
  {
    field: 'status',
    label: '开启状态',
    align: 'center',
    minWidth: '100px',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'createTime', label: '创建时间', align: 'center', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    align: 'center',
    minWidth: '110px',
    slots: {
      default: (data) => (
        <>
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>
              编辑
            </BaseButton>
          ) : null}
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => openFormBind(data.row.id)}>
              绑定店员
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
