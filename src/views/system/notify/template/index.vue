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

  <NotifyTemplateForm ref="formRef" @success="tableMethods.getList" />
  <NotifyTemplateSendForm ref="sendFormRef" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as NotifyTemplateApi from '@/api/system/notify/template'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import NotifyTemplateForm from './NotifyTemplateForm.vue'
import NotifyTemplateSendForm from './NotifyTemplateSendForm.vue'

defineOptions({ name: 'NotifySmsTemplate' })

const canCreate = hasPermission(['system:notify-template:create'])
const canUpdate = hasPermission(['system:notify-template:update'])
const canDelete = hasPermission(['system:notify-template:delete'])
const canSend = hasPermission(['system:notify-template:send-notify'])
const checkedIds = ref<number[]>([])
const message = useMessage()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '模板名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入模板名称',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'code',
    label: '模板编号',
    component: 'Input',
    componentProps: {
      placeholder: '请输入模版编码',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择开启状态',
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

const formRef = ref<InstanceType<typeof NotifyTemplateForm>>()
const sendFormRef = ref<InstanceType<typeof NotifyTemplateSendForm>>()

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const openSendForm = (row: NotifyTemplateApi.NotifyTemplateVO) => {
  sendFormRef.value?.open(row.id)
}

const { tableObject, tableMethods, register: tableRegister } =
  useTable<NotifyTemplateApi.NotifyTemplateVO>({
    getListApi: async (params) => await NotifyTemplateApi.getNotifyTemplatePage(params),
    delListApi: async (id) => await NotifyTemplateApi.deleteNotifyTemplate(id as number)
  })

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleRowCheckboxChange = (rows: NotifyTemplateApi.NotifyTemplateVO[]) => {
  checkedIds.value = rows.map((row) => row.id!).filter(Boolean) as number[]
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await NotifyTemplateApi.deleteNotifyTemplateList(checkedIds.value)
    checkedIds.value = []
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'code', label: '模板编码', width: '120px', showOverflowTooltip: true },
  { field: 'name', label: '模板名称', width: '120px', showOverflowTooltip: true },
  {
    field: 'type',
    label: '类型',
    slots: {
      default: (data) => (
        <DictTag type={DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE} value={data.row.type} />
      )
    }
  },
  { field: 'nickname', label: '发送人名称' },
  { field: 'content', label: '模板内容', width: '200px', showOverflowTooltip: true },
  {
    field: 'status',
    label: '开启状态',
    width: '80px',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  {
    field: 'createTime',
    label: '创建时间',
    formatter: dateFormatter,
    width: '180px'
  },
  {
    field: 'action',
    label: '操作',
    width: '210px',
    slots: {
      default: (data) => {
        const row = data.row as NotifyTemplateApi.NotifyTemplateVO
        return (
          <>
            {canUpdate ? (
              <BaseButton link type="primary" onClick={() => openForm('update', row.id)}>
                修改
              </BaseButton>
            ) : null}
            {canSend ? (
              <BaseButton link type="primary" onClick={() => openSendForm(row)}>
                测试
              </BaseButton>
            ) : null}
            {canDelete ? (
              <BaseButton link type="danger" onClick={() => handleDelete(row.id!)}>
                删除
              </BaseButton>
            ) : null}
          </>
        )
      }
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
