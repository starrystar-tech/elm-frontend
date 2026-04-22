<!-- ERP 仓库列表 -->
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

  <WarehouseForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { ElSwitch } from 'element-plus'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { WarehouseApi, WarehouseVO } from '@/api/erp/stock/warehouse'
import WarehouseForm from './WarehouseForm.vue'
import { erpPriceTableColumnFormatter } from '@/utils'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ErpWarehouse' })

const canCreate = hasPermission(['erp:warehouse:create'])
const canUpdate = hasPermission(['erp:warehouse:update'])
const canDelete = hasPermission(['erp:warehouse:delete'])
const canExport = hasPermission(['erp:warehouse:export'])

const message = useMessage()
const formRef = ref<InstanceType<typeof WarehouseForm>>()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '仓库名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入仓库名称',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '仓库状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择仓库状态',
      clearable: true,
      options: [
        { label: '开启', value: 0 },
        { label: '关闭', value: 1 }
      ],
      style: { width: '240px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<WarehouseVO>({
  getListApi: async (params) => await WarehouseApi.getWarehousePage(params),
  exportListApi: async (params) => await WarehouseApi.exportWarehouse(params)
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
    await WarehouseApi.deleteWarehouse(id)
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const handleDefaultStatusChange = async (row: WarehouseVO) => {
  try {
    const text = row.defaultStatus ? '设置' : '取消'
    await message.confirm(`确认要${text}"${row.name}"默认吗?`)
    await WarehouseApi.updateWarehouseDefaultStatus(row.id, row.defaultStatus)
    await tableMethods.getList()
  } catch {
    row.defaultStatus = !row.defaultStatus
  }
}

const handleExport = async () => {
  await tableMethods.exportList('仓库.xls')
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'name', label: '仓库名称', align: 'center' },
  { field: 'address', label: '仓库地址', align: 'center' },
  {
    field: 'warehousePrice',
    label: '仓储费',
    align: 'center',
    formatter: erpPriceTableColumnFormatter
  },
  {
    field: 'truckagePrice',
    label: '搬运费',
    align: 'center',
    formatter: erpPriceTableColumnFormatter
  },
  { field: 'principal', label: '负责人', align: 'center' },
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
    field: 'defaultStatus',
    label: '是否默认',
    align: 'center',
    slots: {
      default: (data) => (
        <ElSwitch
          v-model={data.row.defaultStatus}
          active-value={true}
          inactive-value={false}
          disabled={!canUpdate}
          onChange={() => handleDefaultStatusChange(data.row)}
        />
      )
    }
  },
  { field: 'createTime', label: '创建时间', align: 'center', width: '180px', formatter: dateFormatter },
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
