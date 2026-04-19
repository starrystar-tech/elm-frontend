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

  <SmsChannelForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as SmsChannelApi from '@/api/system/sms/smsChannel'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import SmsChannelForm from './SmsChannelForm.vue'

defineOptions({ name: 'SystemSmsChannel' })

const canCreate = hasPermission(['system:sms-channel:create'])
const canUpdate = hasPermission(['system:sms-channel:update'])
const canDelete = hasPermission(['system:sms-channel:delete'])
const checkedIds = ref<number[]>([])
const message = useMessage()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'signature',
    label: '短信签名',
    component: 'Input',
    componentProps: {
      placeholder: '请输入短信签名',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '启用状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择启用状态',
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

const formRef = ref<InstanceType<typeof SmsChannelForm>>()
const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const { tableObject, tableMethods, register: tableRegister } = useTable<SmsChannelApi.SmsChannelVO>({
  getListApi: async (params) => await SmsChannelApi.getSmsChannelPage(params),
  delListApi: async (id) => await SmsChannelApi.deleteSmsChannel(id as number)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleRowCheckboxChange = (rows: SmsChannelApi.SmsChannelVO[]) => {
  checkedIds.value = rows.map((row) => row.id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await SmsChannelApi.deleteSmsChannelList(checkedIds.value)
    checkedIds.value = []
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号' },
  { field: 'signature', label: '短信签名' },
  {
    field: 'code',
    label: '渠道编码',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE} value={data.row.code} />
    }
  },
  {
    field: 'status',
    label: '启用状态',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'remark', label: '备注', showOverflowTooltip: true },
  { field: 'apiKey', label: '短信 API 的账号', showOverflowTooltip: true, width: '180px' },
  { field: 'apiSecret', label: '短信 API 的密钥', showOverflowTooltip: true, width: '180px' },
  { field: 'callbackUrl', label: '回调地址', showOverflowTooltip: true, width: '180px' },
  {
    field: 'createTime',
    label: '创建时间',
    formatter: dateFormatter,
    width: '180px'
  },
  {
    field: 'action',
    label: '操作',
    width: '140px',
    slots: {
      default: (data) => {
        const row = data.row as SmsChannelApi.SmsChannelVO
        return (
          <>
            {canUpdate ? (
              <BaseButton link type="primary" onClick={() => openForm('update', row.id)}>
                编辑
              </BaseButton>
            ) : null}
            {canDelete ? (
              <BaseButton link type="danger" onClick={() => handleDelete(row.id)}>
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
