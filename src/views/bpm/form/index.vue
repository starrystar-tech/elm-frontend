<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-hasPermi="['bpm:form:create']" type="primary" @click="openForm('create')">
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

  <Dialog v-model="detailVisible" title="表单详情" width="800">
    <form-create :option="detailData.option" :rule="detailData.rule" />
  </Dialog>
</template>

<script lang="tsx" setup>
import { reactive, ref, watch } from 'vue'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as FormApi from '@/api/bpm/form'
import { setConfAndFields2 } from '@/utils/formCreate'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { Dialog } from '@/components/Dialog'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'BpmForm' })

const message = useMessage()
const { t } = useI18n()
const { currentRoute, push } = useRouter()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '表单名',
    component: 'Input',
    componentProps: { placeholder: '请输入表单名', clearable: true, style: { width: '240px' } }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await FormApi.getFormPage(params)
})

const openForm = (type: string, id?: number | string) => {
  const toRouter: { name: string; query: { type: string; id?: number | string } } = {
    name: 'BpmFormEditor',
    query: { type }
  }
  if (typeof id === 'number' || typeof id === 'string') {
    toRouter.query.id = id
  }
  push(toRouter)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await FormApi.deleteForm(id)
    message.success(t('common.delSuccess'))
    await tableMethods.getList()
  } catch {}
}

const detailVisible = ref(false)
const detailData = ref({
  rule: [],
  option: {}
})

const openDetail = async (id: number) => {
  const data = await FormApi.getForm(id)
  setConfAndFields2(detailData, data.conf, data.fields)
  detailVisible.value = true
}

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号' },
  { field: 'name', label: '表单名' },
  {
    field: 'status',
    label: '状态',
    slots: {
      default: (data) => <dict-tag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'remark', label: '备注' },
  { field: 'createTime', label: '创建时间', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    slots: {
      default: (data) => (
        <>
          <BaseButton
            v-hasPermi={['bpm:form:update']}
            link
            type="primary"
            onClick={() => openForm('copy', data.row.id)}
          >
            复制
          </BaseButton>
          <BaseButton
            v-hasPermi={['bpm:form:update']}
            link
            type="primary"
            onClick={() => openForm('update', data.row.id)}
          >
            编辑
          </BaseButton>
          <BaseButton
            v-hasPermi={['bpm:form:query']}
            link
            onClick={() => openDetail(data.row.id)}
          >
            详情
          </BaseButton>
          <BaseButton
            v-hasPermi={['bpm:form:delete']}
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

watch(
  () => currentRoute.value,
  () => {
    tableMethods.getList()
  },
  { immediate: true }
)
</script>
