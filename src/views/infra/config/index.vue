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
      selection
      @register="tableRegister"
      @selection-change="handleRowCheckboxChange"
    />
  </ContentWrap>

  <ConfigForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as ConfigApi from '@/api/infra/config'
import ConfigForm from './ConfigForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'InfraConfig' })

const canCreate = hasPermission(['infra:config:create'])
const canUpdate = hasPermission(['infra:config:update'])
const canDelete = hasPermission(['infra:config:delete'])
const canExport = hasPermission(['infra:config:export'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '参数名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入参数名称',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'key',
    label: '参数键名',
    component: 'Input',
    componentProps: {
      placeholder: '请输入参数键名',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'type',
    label: '系统内置',
    component: 'Select',
    componentProps: {
      placeholder: '请选择系统内置',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.INFRA_CONFIG_TYPE),
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

const formRef = ref<InstanceType<typeof ConfigForm>>()
const checkedIds = ref<number[]>([])

const { tableObject, tableMethods, register: tableRegister } = useTable<ConfigApi.ConfigVO>({
  getListApi: async (params) => await ConfigApi.getConfigPage(params),
  delListApi: async (id) => await ConfigApi.deleteConfig(id as number),
  exportListApi: async (params) => await ConfigApi.exportConfig(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleRowCheckboxChange = (rows: ConfigApi.ConfigVO[]) => {
  checkedIds.value = rows.map((row) => row.id!).filter(Boolean) as number[]
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  const message = useMessage()
  try {
    await message.delConfirm()
    await ConfigApi.deleteConfigList(checkedIds.value)
    checkedIds.value = []
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const handleExport = async () => {
  await tableMethods.exportList('参数配置.xls')
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '参数主键' },
  { field: 'category', label: '参数分类' },
  { field: 'name', label: '参数名称', showOverflowTooltip: true },
  { field: 'key', label: '参数键名', showOverflowTooltip: true },
  { field: 'value', label: '参数键值' },
  {
    field: 'visible',
    label: '是否可见',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.visible} />
    }
  },
  {
    field: 'type',
    label: '系统内置',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.INFRA_CONFIG_TYPE} value={data.row.type} />
    }
  },
  { field: 'remark', label: '备注', showOverflowTooltip: true },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
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
