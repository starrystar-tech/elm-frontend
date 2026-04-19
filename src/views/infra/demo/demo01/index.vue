<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton v-if="canExport" type="success" :loading="exportLoading" @click="handleExport">
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
      row-key="id"
      selection
      @register="tableRegister"
      @selection-change="handleRowCheckboxChange"
    />
  </ContentWrap>

  <Demo01ContactForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { Demo01ContactApi, Demo01Contact } from '@/api/infra/demo/demo01'
import Demo01ContactForm from './Demo01ContactForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'Demo01Contact' })

const message = useMessage()
const { t } = useI18n()

const canCreate = hasPermission(['infra:demo01-contact:create'])
const canUpdate = hasPermission(['infra:demo01-contact:update'])
const canDelete = hasPermission(['infra:demo01-contact:delete'])
const canExport = hasPermission(['infra:demo01-contact:export'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '名字',
    component: 'Input',
    componentProps: { placeholder: '请输入名字', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'sex',
    label: '性别',
    component: 'Select',
    componentProps: {
      placeholder: '请选择性别',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX),
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
      style: { width: '220px' }
    }
  }
])

const formRef = ref<InstanceType<typeof Demo01ContactForm>>()
const checkedIds = ref<number[]>([])

const { tableObject, tableMethods, register: tableRegister } = useTable<Demo01Contact>({
  getListApi: async (params) => await Demo01ContactApi.getDemo01ContactPage(params),
  delListApi: async (id) => await Demo01ContactApi.deleteDemo01Contact(id as number),
  exportListApi: async (params) => await Demo01ContactApi.exportDemo01Contact(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)
const openForm = (type: string, id?: number) => formRef.value?.open(type, id)

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await Demo01ContactApi.deleteDemo01ContactList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    await tableMethods.getList()
  } catch {}
}

const handleRowCheckboxChange = (records: Demo01Contact[]) => {
  checkedIds.value = records.map((item) => item.id)
}

const handleExport = async () => {
  await tableMethods.exportList('示例联系人.xls')
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号' },
  { field: 'name', label: '名字' },
  {
    field: 'sex',
    label: '性别',
    slots: { default: (data) => <DictTag type={DICT_TYPE.SYSTEM_USER_SEX} value={data.row.sex} /> }
  },
  { field: 'birthday', label: '出生年', width: '180px', formatter: dateFormatter },
  { field: 'description', label: '简介' },
  { field: 'avatar', label: '头像' },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    minWidth: '120px',
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
