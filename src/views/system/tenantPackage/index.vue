<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton
        v-if="canDelete"
        type="danger"
        :disabled="checkedIds.length === 0"
        @click="handleDeleteBatch"
      >
        批量删除
      </BaseButton>
    </div>
    <Table
      v-model:currentPage="tableObject.currentPage"
      v-model:pageSize="tableObject.pageSize"
      :columns="tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{ total: tableObject.total }"
      selection
      @register="tableRegister"
      @selection-change="handleRowCheckboxChange"
    />
  </ContentWrap>

  <TenantPackageForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as TenantPackageApi from '@/api/system/tenantPackage'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import TenantPackageForm from './TenantPackageForm.vue'

defineOptions({ name: 'SystemTenantPackage' })

const canCreate = hasPermission(['system:tenant-package:create'])
const canUpdate = hasPermission(['system:tenant-package:update'])
const canDelete = hasPermission(['system:tenant-package:delete'])
const checkedIds = ref<number[]>([])
const message = useMessage()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '套餐名',
    component: 'Input',
    componentProps: {
      placeholder: '请输入套餐名',
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
      style: { width: '240px' }
    }
  }
])

const formRef = ref<InstanceType<typeof TenantPackageForm>>()
const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const { tableObject, tableMethods, register: tableRegister } =
  useTable<TenantPackageApi.TenantPackageVO>({
    getListApi: async (params) => await TenantPackageApi.getTenantPackagePage(params),
    delListApi: async (id) => await TenantPackageApi.deleteTenantPackage(id as number)
  })

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleRowCheckboxChange = (rows: TenantPackageApi.TenantPackageVO[]) => {
  checkedIds.value = rows.map((row) => row.id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await TenantPackageApi.deleteTenantPackageList(checkedIds.value)
    checkedIds.value = []
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '套餐编号', width: '120px' },
  { field: 'name', label: '套餐名' },
  {
    field: 'status',
    label: '状态',
    width: '100px',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'remark', label: '备注' },
  {
    field: 'createTime',
    label: '创建时间',
    formatter: dateFormatter,
    width: '180px'
  },
  {
    field: 'action',
    label: '操作',
    width: '140px',
    slots: {
      default: (data) => {
        const row = data.row as TenantPackageApi.TenantPackageVO
        return (
          <>
            {canUpdate ? (
              <BaseButton link type="primary" onClick={() => openForm('update', row.id)}>
                修改
              </BaseButton>
            ) : null}
            {canDelete ? (
              <BaseButton link type="danger" onClick={() => handleDelete(row.id)}>
                删除
              </BaseButton>
            ) : null}
          </>
        )
      }
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
