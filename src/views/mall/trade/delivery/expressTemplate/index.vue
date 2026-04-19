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

  <ExpressTemplateForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as DeliveryExpressTemplateApi from '@/api/mall/trade/delivery/expressTemplate'
import ExpressTemplateForm from './ExpressTemplateForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'DeliveryExpressTemplate' })

const canCreate = hasPermission(['trade:delivery:express-template:create'])
const canUpdate = hasPermission(['trade:delivery:express-template:update'])
const canDelete = hasPermission(['trade:delivery:express-template:delete'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '模板名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入模板名称',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'chargeMode',
    label: '计费方式',
    component: 'Select',
    componentProps: {
      placeholder: '计费方式',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.EXPRESS_CHARGE_MODE),
      style: { width: '240px' }
    }
  }
])

const formRef = ref<InstanceType<typeof ExpressTemplateForm>>()

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await DeliveryExpressTemplateApi.getDeliveryExpressTemplatePage(params),
  delListApi: async (id) => await DeliveryExpressTemplateApi.deleteDeliveryExpressTemplate(id as number)
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
  { field: 'id', label: '编号', minWidth: '60px' },
  { field: 'name', label: '模板名称', minWidth: '100px' },
  {
    field: 'chargeMode',
    label: '计费方式',
    minWidth: '100px',
    align: 'center',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.EXPRESS_CHARGE_MODE} value={data.row.chargeMode} />
    }
  },
  { field: 'sort', label: '排序', minWidth: '100px' },
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
