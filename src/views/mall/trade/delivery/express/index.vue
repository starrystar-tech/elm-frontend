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
      @register="tableRegister"
    />
  </ContentWrap>

  <ExpressForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as DeliveryExpressApi from '@/api/mall/trade/delivery/express'
import ExpressForm from './ExpressForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'Express' })

const canCreate = hasPermission(['trade:delivery:express:create'])
const canUpdate = hasPermission(['trade:delivery:express:update'])
const canDelete = hasPermission(['trade:delivery:express:delete'])
const canExport = hasPermission(['trade:delivery:express:export'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'code',
    label: '快递公司编号',
    component: 'Input',
    componentProps: {
      placeholder: '请输快递公司编号',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'name',
    label: '快递公司名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输快递公司名称',
      clearable: true,
      style: { width: '240px' }
    }
  }
])

const formRef = ref<InstanceType<typeof ExpressForm>>()

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await DeliveryExpressApi.getDeliveryExpressPage(params),
  delListApi: async (id) => await DeliveryExpressApi.deleteDeliveryExpress(id as number),
  exportListApi: async (params) => await DeliveryExpressApi.exportDeliveryExpressApi(params)
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
  await tableMethods.exportList('快递公司.xls')
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'code', label: '公司编码' },
  { field: 'name', label: '公司名称' },
  {
    field: 'logo',
    label: '公司 logo ',
    slots: {
      default: (data) =>
        data.row.logo ? <img src={data.row.logo} alt="公司logo" class="h-40px" /> : null
    }
  },
  { field: 'sort', label: '排序', align: 'center' },
  {
    field: 'status',
    label: '开启状态',
    align: 'center',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
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

onMounted(() => {
  tableMethods.getList()
})
</script>
