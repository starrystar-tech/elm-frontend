<template>
  <ContentWrap>
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
      :columns="tableColumns"
      :data="list"
      :loading="loading"
      selection
      @selection-change="handleRowCheckboxChange"
    />
  </ContentWrap>

  <DataSourceConfigForm ref="formRef" @success="getList" />
</template>

<script lang="tsx" setup>
import { reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as DataSourceConfigApi from '@/api/infra/dataSourceConfig'
import DataSourceConfigForm from './DataSourceConfigForm.vue'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'InfraDataSourceConfig' })

const message = useMessage()
const { t } = useI18n()

const canCreate = hasPermission(['infra:data-source-config:create'])
const canUpdate = hasPermission(['infra:data-source-config:update'])
const canDelete = hasPermission(['infra:data-source-config:delete'])

const loading = ref(true)
const list = ref<DataSourceConfigApi.DataSourceConfigVO[]>([])
const checkedIds = ref<number[]>([])
const formRef = ref<InstanceType<typeof DataSourceConfigForm>>()

const getList = async () => {
  loading.value = true
  try {
    list.value = await DataSourceConfigApi.getDataSourceConfigList()
  } finally {
    loading.value = false
  }
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DataSourceConfigApi.deleteDataSourceConfig(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const handleRowCheckboxChange = (rows: DataSourceConfigApi.DataSourceConfigVO[]) => {
  checkedIds.value = rows.map((row) => row.id!).filter((id) => id !== 0 && Boolean(id)) as number[]
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await DataSourceConfigApi.deleteDataSourceConfigList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '主键编号' },
  { field: 'name', label: '数据源名称' },
  { field: 'url', label: '数据源连接', showOverflowTooltip: true },
  { field: 'username', label: '用户名' },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '140px',
    slots: {
      default: (data) => (
        <>
          {canUpdate ? (
            <BaseButton
              link
              type="primary"
              disabled={data.row.id === 0}
              onClick={() => openForm('update', data.row.id)}
            >
              编辑
            </BaseButton>
          ) : null}
          {canDelete ? (
            <BaseButton
              link
              type="danger"
              disabled={data.row.id === 0}
              onClick={() => handleDelete(data.row.id)}
            >
              删除
            </BaseButton>
          ) : null}
        </>
      )
    }
  }
])

onMounted(() => {
  getList()
})
</script>
