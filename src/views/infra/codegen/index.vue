<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" plain @click="openImportTable">导入</BaseButton>
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

  <ImportTable ref="importRef" @success="tableMethods.getList" />
  <PreviewCode ref="previewRef" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import * as CodegenApi from '@/api/infra/codegen'
import * as DataSourceConfigApi from '@/api/infra/dataSourceConfig'
import ImportTable from './ImportTable.vue'
import PreviewCode from './PreviewCode.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'InfraCodegen' })

const message = useMessage()
const { t } = useI18n()
const { push } = useRouter()

const canCreate = hasPermission(['infra:codegen:create'])
const canDelete = hasPermission(['infra:codegen:delete'])
const canPreview = hasPermission(['infra:codegen:preview'])
const canUpdate = hasPermission(['infra:codegen:update'])
const canDownload = hasPermission(['infra:codegen:download'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'tableName',
    label: '表名称',
    component: 'Input',
    componentProps: { placeholder: '请输入表名称', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'tableComment',
    label: '表描述',
    component: 'Input',
    componentProps: { placeholder: '请输入表描述', clearable: true, style: { width: '240px' } }
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

const dataSourceConfigList = ref<DataSourceConfigApi.DataSourceConfigVO[]>([])
const importRef = ref<InstanceType<typeof ImportTable>>()
const previewRef = ref<InstanceType<typeof PreviewCode>>()
const checkedIds = ref<number[]>([])

const { tableObject, tableMethods, register: tableRegister } =
  useTable<CodegenApi.CodegenTableVO>({
    getListApi: async (params) => await CodegenApi.getCodegenTablePage(params),
    delListApi: async (id) => await CodegenApi.deleteCodegenTable(id as number)
  })

const dataSourceNameMap = computed<Record<number, string>>(() =>
  dataSourceConfigList.value.reduce(
    (acc, item) => {
      acc[item.id!] = item.name
      return acc
    },
    {} as Record<number, string>
  )
)

const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)
const openImportTable = () => importRef.value?.open()
const handleUpdate = (id: number) => push('/codegen/edit?id=' + id)
const handlePreview = (row: CodegenApi.CodegenTableVO) => previewRef.value?.open(row.id)

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleRowCheckboxChange = (rows: CodegenApi.CodegenTableVO[]) => {
  checkedIds.value = rows.map((row) => row.id)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await CodegenApi.deleteCodegenTableList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    await tableMethods.getList()
  } catch {}
}

const handleSyncDB = async (row: CodegenApi.CodegenTableVO) => {
  try {
    await message.confirm('确认要强制同步' + row.tableName + '表结构吗?', t('common.reminder'))
    await CodegenApi.syncCodegenFromDB(row.id)
    message.success('同步成功')
  } catch {}
}

const handleGenTable = async (row: CodegenApi.CodegenTableVO) => {
  const res = await CodegenApi.downloadCodegen(row.id)
  download.zip(res, 'codegen-' + row.className + '.zip')
}

const tableColumns = reactive<TableColumn[]>([
  {
    field: 'dataSourceConfigId',
    label: '数据源',
    slots: {
      default: (data) => <>{dataSourceNameMap.value[data.row.dataSourceConfigId] || ''}</>
    }
  },
  { field: 'tableName', label: '表名称', width: '200px' },
  { field: 'tableComment', label: '表描述', width: '200px', showOverflowTooltip: true },
  { field: 'className', label: '实体', width: '200px' },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  { field: 'updateTime', label: '更新时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '320px',
    fixed: 'right',
    slots: {
      default: (data) => (
        <>
          {canPreview ? (
            <BaseButton link type="primary" onClick={() => handlePreview(data.row)}>
              预览
            </BaseButton>
          ) : null}
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => handleUpdate(data.row.id)}>
              编辑
            </BaseButton>
          ) : null}
          {canDelete ? (
            <BaseButton link type="danger" onClick={() => handleDelete(data.row.id)}>
              删除
            </BaseButton>
          ) : null}
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => handleSyncDB(data.row)}>
              同步
            </BaseButton>
          ) : null}
          {canDownload ? (
            <BaseButton link type="primary" onClick={() => handleGenTable(data.row)}>
              生成代码
            </BaseButton>
          ) : null}
        </>
      )
    }
  }
])

onMounted(async () => {
  await tableMethods.getList()
  dataSourceConfigList.value = await DataSourceConfigApi.getDataSourceConfigList()
})
</script>
