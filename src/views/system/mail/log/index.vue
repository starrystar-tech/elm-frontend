<template>
  <ContentWrap>
    <Search
      :schema="searchSchema"
      label-width="100px"
      @reset="setSearchParams"
      @search="setSearchParams"
    />
    <div class="mb-10px">
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
      @register="tableRegister"
    />
  </ContentWrap>

  <MailLogDetail ref="detailRef" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as MailAccountApi from '@/api/system/mail/account'
import * as MailLogApi from '@/api/system/mail/log'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import MailLogDetail from './MailLogDetail.vue'

defineOptions({ name: 'SystemMailLog' })

const canQuery = hasPermission(['system:mail-log:query'])
const canExport = hasPermission(['system:mail-log:export'])
const accountList = ref<MailAccountApi.MailAccountVO[]>([])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'toMail',
    label: '接收邮箱',
    component: 'Input',
    componentProps: {
      placeholder: '请输入接收邮箱',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'accountId',
    label: '邮箱账号',
    component: 'Select',
    componentProps: {
      placeholder: '请选择邮箱账号',
      clearable: true,
      options: [],
      style: { width: '240px' }
    }
  },
  {
    field: 'templateId',
    label: '模板编号',
    component: 'Input',
    componentProps: {
      placeholder: '请输入模板编号',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'sendStatus',
    label: '发送状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择发送状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.SYSTEM_MAIL_SEND_STATUS),
      style: { width: '240px' }
    }
  },
  {
    field: 'userId',
    label: '用户编号',
    component: 'Input',
    componentProps: {
      placeholder: '请输入用户编号',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'userType',
    label: '用户类型',
    component: 'Select',
    componentProps: {
      placeholder: '请选择用户类型',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.USER_TYPE),
      style: { width: '240px' }
    }
  },
  {
    field: 'sendTime',
    label: '发送时间',
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

const detailRef = ref<InstanceType<typeof MailLogDetail>>()
const openDetail = (data: MailLogApi.MailLogVO) => {
  detailRef.value?.open(data)
}

const { tableObject, tableMethods, register: tableRegister } = useTable<MailLogApi.MailLogVO>({
  getListApi: async (params) => await MailLogApi.getMailLogPage(params),
  exportListApi: async (params) => await MailLogApi.exportMailLog(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const getAccountMail = (accountId: number) => {
  const account = accountList.value.find((item) => item.id === accountId)
  return account?.mail || ''
}

const handleExport = async () => {
  await tableMethods.exportList('邮件日志.xls')
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号' },
  { field: 'sendTime', label: '发送时间', formatter: dateFormatter, width: '180px' },
  {
    field: 'toMails',
    label: '接收邮箱',
    minWidth: '180px',
    slots: {
      default: (data) => <>{(data.row.toMails || []).join(', ')}</>
    }
  },
  { field: 'userId', label: '用户编号' },
  {
    field: 'userType',
    label: '用户类型',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.USER_TYPE} value={data.row.userType} />
    }
  },
  { field: 'templateTitle', label: '邮件标题', width: '200px' },
  {
    field: 'sendStatus',
    label: '发送状态',
    width: '120px',
    slots: {
      default: (data) => (
        <DictTag type={DICT_TYPE.SYSTEM_MAIL_SEND_STATUS} value={data.row.sendStatus} />
      )
    }
  },
  {
    field: 'accountId',
    label: '邮箱账号',
    width: '200px',
    slots: {
      default: (data) => <>{getAccountMail(data.row.accountId)}</>
    }
  },
  { field: 'templateId', label: '模板编号' },
  {
    field: 'action',
    label: '操作',
    width: '100px',
    fixed: 'right',
    slots: {
      default: (data) =>
        canQuery ? (
          <BaseButton link type="primary" onClick={() => openDetail(data.row as MailLogApi.MailLogVO)}>
            详情
          </BaseButton>
        ) : null
    }
  }
])

onMounted(async () => {
  accountList.value = await MailAccountApi.getSimpleMailAccountList()
  searchSchema[1].componentProps = {
    ...(searchSchema[1].componentProps || {}),
    options: accountList.value.map((account) => ({
      label: account.mail,
      value: account.id
    }))
  }
  await tableMethods.getList()
})
</script>
