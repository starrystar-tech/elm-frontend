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
      row-key="id"
      selection
      expand
      @register="tableRegister"
      @selection-change="handleRowCheckboxChange"
    >
      <template #expand="{ row }">
        <el-tabs model-value="demo03Course">
          <el-tab-pane label="学生课程" name="demo03Course">
            <Demo03CourseList :student-id="row.id" />
          </el-tab-pane>
          <el-tab-pane label="学生班级" name="demo03Grade">
            <Demo03GradeList :student-id="row.id" />
          </el-tab-pane>
        </el-tabs>
      </template>
    </Table>
  </ContentWrap>

  <Demo03StudentForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { Demo03Student, Demo03StudentApi } from '@/api/infra/demo/demo03/inner'
import Demo03StudentForm from './Demo03StudentForm.vue'
import Demo03CourseList from './components/Demo03CourseList.vue'
import Demo03GradeList from './components/Demo03GradeList.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'Demo03Student' })

const message = useMessage()
const { t } = useI18n()

const canCreate = hasPermission(['infra:demo03-student:create'])
const canUpdate = hasPermission(['infra:demo03-student:update'])
const canDelete = hasPermission(['infra:demo03-student:delete'])
const canExport = hasPermission(['infra:demo03-student:export'])

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

const formRef = ref<InstanceType<typeof Demo03StudentForm>>()
const checkedIds = ref<number[]>([])

const { tableObject, tableMethods, register: tableRegister } = useTable<Demo03Student>({
  getListApi: async (params) => await Demo03StudentApi.getDemo03StudentPage(params),
  delListApi: async (id) => await Demo03StudentApi.deleteDemo03Student(id as number),
  exportListApi: async (params) => await Demo03StudentApi.exportDemo03Student(params)
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
    await Demo03StudentApi.deleteDemo03StudentList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    await tableMethods.getList()
  } catch {}
}

const handleRowCheckboxChange = (records: Demo03Student[]) => {
  checkedIds.value = records.map((item) => item.id)
}

const handleExport = async () => {
  await tableMethods.exportList('学生.xls')
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号' },
  { field: 'name', label: '名字' },
  {
    field: 'sex',
    label: '性别',
    slots: { default: (data) => <DictTag type={DICT_TYPE.SYSTEM_USER_SEX} value={data.row.sex} /> }
  },
  { field: 'birthday', label: '出生日期', width: '180px', formatter: dateFormatter },
  { field: 'description', label: '简介' },
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
