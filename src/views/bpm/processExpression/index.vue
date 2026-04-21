<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton
        v-hasPermi="['bpm:process-expression:create']"
        type="primary"
        @click="openForm('create')"
      >
        新增
      </BaseButton>
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

  <ProcessExpressionForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { ProcessExpressionApi, ProcessExpressionVO } from '@/api/bpm/processExpression'
import ProcessExpressionForm from './ProcessExpressionForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'BpmProcessExpression' })

const message = useMessage()
const { t } = useI18n()

const formRef = ref<InstanceType<typeof ProcessExpressionForm>>()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '名字',
    component: 'Input',
    componentProps: { placeholder: '请输入名字', clearable: true, style: { width: '240px' } }
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
      defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
      style: { width: '240px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<ProcessExpressionVO>({
  getListApi: async (params) => await ProcessExpressionApi.getProcessExpressionPage(params)
})

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProcessExpressionApi.deleteProcessExpression(id)
    message.success(t('common.delSuccess'))
    await tableMethods.getList()
  } catch {}
}

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号' },
  { field: 'name', label: '名字' },
  {
    field: 'status',
    label: '状态',
    slots: {
      default: (data) => <dict-tag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'expression', label: '表达式' },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    slots: {
      default: (data) => (
        <>
          <BaseButton
            v-hasPermi={['bpm:process-expression:update']}
            link
            type="primary"
            onClick={() => openForm('update', data.row.id)}
          >
            编辑
          </BaseButton>
          <BaseButton
            v-hasPermi={['bpm:process-expression:delete']}
            link
            type="danger"
            onClick={() => handleDelete(data.row.id)}
          >
            删除
          </BaseButton>
        </>
      )
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
