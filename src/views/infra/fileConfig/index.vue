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

  <FileConfigForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { reactive, ref } from 'vue'
import * as FileConfigApi from '@/api/infra/fileConfig'
import FileConfigForm from './FileConfigForm.vue'
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

defineOptions({ name: 'InfraFileConfig' })

const message = useMessage()
const { t } = useI18n()

const canCreate = hasPermission(['infra:file-config:create'])
const canUpdate = hasPermission(['infra:file-config:update'])
const canDelete = hasPermission(['infra:file-config:delete'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '配置名',
    component: 'Input',
    componentProps: {
      placeholder: '请输入配置名',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'storage',
    label: '存储器',
    component: 'Select',
    componentProps: {
      placeholder: '请选择存储器',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.INFRA_FILE_STORAGE),
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

const formRef = ref<InstanceType<typeof FileConfigForm>>()
const checkedIds = ref<number[]>([])

const { tableObject, tableMethods, register: tableRegister } =
  useTable<FileConfigApi.FileConfigVO>({
    getListApi: async (params) => await FileConfigApi.getFileConfigPage(params),
    delListApi: async (id) => await FileConfigApi.deleteFileConfig(id as number)
  })

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleRowCheckboxChange = (rows: FileConfigApi.FileConfigVO[]) => {
  checkedIds.value = rows.map((row) => row.id).filter(Boolean)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await FileConfigApi.deleteFileConfigList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    await tableMethods.getList()
  } catch {}
}

const handleMaster = async (id: number) => {
  try {
    await message.confirm('是否确认修改配置编号为"' + id + '"的数据项为主配置?')
    await FileConfigApi.updateFileConfigMaster(id)
    message.success(t('common.updateSuccess'))
    await tableMethods.getList()
  } catch {}
}

const handleTest = async (id: number) => {
  try {
    const response = await FileConfigApi.testFileConfig(id)
    await message.confirm('是否要访问该文件？', '测试上传成功')
    window.open(response, '_blank')
  } catch {}
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号' },
  { field: 'name', label: '配置名' },
  {
    field: 'storage',
    label: '存储器',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.INFRA_FILE_STORAGE} value={data.row.storage} />
    }
  },
  { field: 'remark', label: '备注' },
  {
    field: 'master',
    label: '主配置',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.master} />
    }
  },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '240px',
    slots: {
      default: (data) => (
        <>
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>
              编辑
            </BaseButton>
          ) : null}
          {canUpdate ? (
            <BaseButton
              link
              type="primary"
              disabled={data.row.master}
              onClick={() => handleMaster(data.row.id)}
            >
              主配置
            </BaseButton>
          ) : null}
          <BaseButton link type="primary" onClick={() => handleTest(data.row.id)}>
            测试
          </BaseButton>
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
