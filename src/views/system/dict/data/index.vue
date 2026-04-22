<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton v-if="canExport" type="primary" plain :loading="exportLoading" @click="handleExport">
        导出
      </BaseButton>
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

  <DictDataForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as DictDataApi from '@/api/system/dict/dict.data'
import * as DictTypeApi from '@/api/system/dict/dict.type'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import DictDataForm from './DictDataForm.vue'

defineOptions({ name: 'SystemDictData' })

const route = useRoute()
const canCreate = hasPermission(['system:dict:create'])
const canUpdate = hasPermission(['system:dict:update'])
const canDelete = hasPermission(['system:dict:delete'])
const canExport = hasPermission(['system:dict:export'])

const dictTypeList = ref<DictTypeApi.DictTypeVO[]>([])
const formRef = ref<InstanceType<typeof DictDataForm>>()
const checkedIds = ref<number[]>([])
const message = useMessage()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'dictType',
    label: '字典名称',
    component: 'Select',
    componentProps: {
      options: [],
      clearable: false,
      style: { width: '240px' }
    }
  },
  {
    field: 'label',
    label: '字典标签',
    component: 'Input',
    componentProps: {
      placeholder: '请输入字典标签',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      placeholder: '数据状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
      style: { width: '240px' }
    }
  }
])

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id, tableObject.params.dictType)
}

const { tableObject, tableMethods, register: tableRegister } = useTable<DictDataApi.DictDataVO>({
  getListApi: async (params) => await DictDataApi.getDictDataPage(params),
  delListApi: async (id) => await DictDataApi.deleteDictData(id as number),
  exportListApi: async (params) => await DictDataApi.exportDictData(params),
  defaultParams: {
    dictType: route.params.dictType,
    label: '',
    status: undefined
  }
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleRowCheckboxChange = (rows: DictDataApi.DictDataVO[]) => {
  checkedIds.value = rows.map((row) => row.id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await DictDataApi.deleteDictDataList(checkedIds.value)
    checkedIds.value = []
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const handleExport = async () => {
  await tableMethods.exportList('字典数据.xls')
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '字典编码' },
  { field: 'label', label: '字典标签' },
  { field: 'value', label: '字典键值' },
  { field: 'sort', label: '字典排序' },
  {
    field: 'status',
    label: '状态',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'colorType', label: '颜色类型' },
  { field: 'cssClass', label: 'CSS Class' },
  { field: 'remark', label: '备注', showOverflowTooltip: true },
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
        const row = data.row as DictDataApi.DictDataVO
        return (
          <>
            {canUpdate ? (
              <BaseButton link type="primary" onClick={() => openForm('update', row.id)}>
                编辑
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

onMounted(async () => {
  dictTypeList.value = await DictTypeApi.getSimpleDictTypeList()
  searchSchema[0].componentProps = {
    ...(searchSchema[0].componentProps || {}),
    options: dictTypeList.value.map((item) => ({
      label: item.name,
      value: item.type
    }))
  }
  await tableMethods.getList()
})
</script>
