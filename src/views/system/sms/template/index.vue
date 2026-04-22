<template>
  <ContentWrap>
    <Search
      :schema="searchSchema"
      label-width="150px"
      @reset="setSearchParams"
      @search="setSearchParams"
    />
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
      <BaseButton v-if="canExport" type="primary" plain :loading="exportLoading" @click="handleExport">
        导出
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

  <SmsTemplateForm ref="formRef" @success="tableMethods.getList" />
  <SmsTemplateSendForm ref="sendFormRef" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions, getDictLabel } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as SmsTemplateApi from '@/api/system/sms/smsTemplate'
import * as SmsChannelApi from '@/api/system/sms/smsChannel'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import SmsTemplateForm from './SmsTemplateForm.vue'
import SmsTemplateSendForm from './SmsTemplateSendForm.vue'

defineOptions({ name: 'SystemSmsTemplate' })

const canCreate = hasPermission(['system:sms-template:create'])
const canUpdate = hasPermission(['system:sms-template:update'])
const canDelete = hasPermission(['system:sms-template:delete'])
const canExport = hasPermission(['system:sms-template:export'])
const canSend = hasPermission(['system:sms-template:send-sms'])

const channelList = ref<SmsChannelApi.SmsChannelVO[]>([])
const checkedIds = ref<number[]>([])
const message = useMessage()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'type',
    label: '短信类型',
    component: 'Select',
    componentProps: {
      placeholder: '请选择短信类型',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE),
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '开启状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择开启状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
      style: { width: '240px' }
    }
  },
  {
    field: 'code',
    label: '模板编码',
    component: 'Input',
    componentProps: {
      placeholder: '请输入模板编码',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'apiTemplateId',
    label: '短信 API 的模板编号',
    component: 'Input',
    componentProps: {
      placeholder: '请输入短信 API 的模板编号',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'channelId',
    label: '短信渠道',
    component: 'Select',
    componentProps: {
      placeholder: '请选择短信渠道',
      clearable: true,
      options: [],
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
      style: { width: '240px' }
    }
  }
])

const formRef = ref<InstanceType<typeof SmsTemplateForm>>()
const sendFormRef = ref<InstanceType<typeof SmsTemplateSendForm>>()

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const openSendForm = (id: number) => {
  sendFormRef.value?.open(id)
}

const { tableObject, tableMethods, register: tableRegister } = useTable<SmsTemplateApi.SmsTemplateVO>({
  getListApi: async (params) => await SmsTemplateApi.getSmsTemplatePage(params),
  delListApi: async (id) => await SmsTemplateApi.deleteSmsTemplate(id as number),
  exportListApi: async (params) => await SmsTemplateApi.exportSmsTemplate(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleRowCheckboxChange = (rows: SmsTemplateApi.SmsTemplateVO[]) => {
  checkedIds.value = rows.map((row) => row.id!).filter(Boolean) as number[]
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await SmsTemplateApi.deleteSmsTemplateList(checkedIds.value)
    checkedIds.value = []
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const handleExport = async () => {
  await tableMethods.exportList('短信模板.xls')
}

const getChannelName = (channelId?: number) => {
  const channel = channelList.value.find((item) => item.id === channelId)
  if (!channel) return ''
  return `${channel.signature}【 ${getDictLabel(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE, channel.code)}】`
}

const tableColumns = reactive<TableColumn[]>([
  {
    field: 'type',
    label: '短信类型',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE} value={data.row.type} />
    }
  },
  { field: 'code', label: '模板编码', width: '150px', showOverflowTooltip: true },
  { field: 'name', label: '模板名称', width: '180px', showOverflowTooltip: true },
  { field: 'content', label: '模板内容', width: '300px', showOverflowTooltip: true },
  { field: 'apiTemplateId', label: '短信 API 的模板编号', width: '180px', showOverflowTooltip: true },
  {
    field: 'channelId',
    label: '短信渠道',
    width: '220px',
    slots: {
      default: (data) => <>{getChannelName(data.row.channelId)}</>
    }
  },
  {
    field: 'status',
    label: '开启状态',
    width: '100px',
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
        const row = data.row as SmsTemplateApi.SmsTemplateVO
        return (
          <>
            {canUpdate ? (
              <BaseButton link type="primary" onClick={() => openForm('update', row.id)}>
                修改
              </BaseButton>
            ) : null}
            {canSend ? (
              <BaseButton link type="primary" onClick={() => openSendForm(row.id!)}>
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

onMounted(async () => {
  channelList.value = await SmsChannelApi.getSimpleSmsChannelList()
  searchSchema[4].componentProps = {
    ...(searchSchema[4].componentProps || {}),
    options: channelList.value.map((channel) => ({
      label: `${channel.signature}【 ${getDictLabel(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE, channel.code)}】`,
      value: channel.id
    }))
  }
  await tableMethods.getList()
})
</script>
