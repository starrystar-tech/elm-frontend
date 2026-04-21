<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton
        v-hasPermi="['bpm:process-listener:create']"
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

  <ProcessListenerForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { ProcessListenerApi, ProcessListenerVO } from '@/api/bpm/processListener'
import ProcessListenerForm from './ProcessListenerForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'BpmProcessListener' })

const message = useMessage()
const { t } = useI18n()

const formRef = ref<InstanceType<typeof ProcessListenerForm>>()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '名字',
    component: 'Input',
    componentProps: { placeholder: '请输入名字', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'type',
    label: '类型',
    component: 'Select',
    componentProps: {
      placeholder: '请选择类型',
      clearable: true,
      options: getStrDictOptions(DICT_TYPE.BPM_PROCESS_LISTENER_TYPE),
      style: { width: '240px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<ProcessListenerVO>({
  getListApi: async (params) => await ProcessListenerApi.getProcessListenerPage(params)
})

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ProcessListenerApi.deleteProcessListener(id)
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
    field: 'type',
    label: '类型',
    slots: {
      default: (data) => (
        <dict-tag type={DICT_TYPE.BPM_PROCESS_LISTENER_TYPE} value={data.row.type} />
      )
    }
  },
  {
    field: 'status',
    label: '状态',
    slots: {
      default: (data) => <dict-tag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'event', label: '事件' },
  {
    field: 'valueType',
    label: '值类型',
    slots: {
      default: (data) => (
        <dict-tag type={DICT_TYPE.BPM_PROCESS_LISTENER_VALUE_TYPE} value={data.row.valueType} />
      )
    }
  },
  { field: 'value', label: '值' },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    slots: {
      default: (data) => (
        <>
          <BaseButton
            v-hasPermi={['bpm:process-listener:update']}
            link
            type="primary"
            onClick={() => openForm('update', data.row.id)}
          >
            编辑
          </BaseButton>
          <BaseButton
            v-hasPermi={['bpm:process-listener:delete']}
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
