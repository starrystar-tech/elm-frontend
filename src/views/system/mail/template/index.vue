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

  <MailTemplateForm ref="formRef" @success="tableMethods.getList" />
  <MailTemplateSendForm ref="sendFormRef" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as MailTemplateApi from '@/api/system/mail/template'
import * as MailAccountApi from '@/api/system/mail/account'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import MailTemplateForm from './MailTemplateForm.vue'
import MailTemplateSendForm from './MailTemplateSendForm.vue'

defineOptions({ name: 'SystemMailTemplate' })

const canCreate = hasPermission(['system:mail-template:create'])
const canUpdate = hasPermission(['system:mail-template:update'])
const canDelete = hasPermission(['system:mail-template:delete'])
const canSend = hasPermission(['system:mail-template:send-mail'])

const accountList = ref<MailAccountApi.MailAccountVO[]>([])
const checkedIds = ref<number[]>([])
const message = useMessage()

const searchSchema = reactive<FormSchema[]>([
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

const formRef = ref<InstanceType<typeof MailTemplateForm>>()
const sendFormRef = ref<InstanceType<typeof MailTemplateSendForm>>()

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const openSendForm = (id: number) => {
  sendFormRef.value?.open(id)
}

const { tableObject, tableMethods, register: tableRegister } = useTable<MailTemplateApi.MailTemplateVO>({
  getListApi: async (params) => await MailTemplateApi.getMailTemplatePage(params),
  delListApi: async (id) => await MailTemplateApi.deleteMailTemplate(id as number)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleRowCheckboxChange = (rows: MailTemplateApi.MailTemplateVO[]) => {
  checkedIds.value = rows.map((row) => row.id).filter(Boolean) as number[]
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await MailTemplateApi.deleteMailTemplateList(checkedIds.value)
    checkedIds.value = []
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const getAccountMail = (accountId: number) => {
  const account = accountList.value.find((item) => item.id === accountId)
  return account?.mail || ''
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'code', label: '模板编码', width: '120px', showOverflowTooltip: true },
  { field: 'name', label: '模板名称', width: '120px', showOverflowTooltip: true },
  { field: 'title', label: '模板标题', width: '150px', showOverflowTooltip: true },
  { field: 'content', label: '模板内容', width: '200px', showOverflowTooltip: true },
  {
    field: 'accountId',
    label: '邮箱账号',
    width: '180px',
    slots: {
      default: (data) => <>{getAccountMail(data.row.accountId)}</>
    }
  },
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
        const row = data.row as MailTemplateApi.MailTemplateVO
        return (
          <>
            {canUpdate ? (
              <BaseButton link type="primary" onClick={() => openForm('update', row.id)}>
                修改
              </BaseButton>
            ) : null}
            {canSend ? (
              <BaseButton link type="primary" onClick={() => openSendForm(row.id)}>
                测试
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

onMounted(async () => {
  accountList.value = await MailAccountApi.getSimpleMailAccountList()
  searchSchema[2].componentProps = {
    ...(searchSchema[2].componentProps || {}),
    options: accountList.value.map((account) => ({
      label: account.mail,
      value: account.id
    }))
  }
  await tableMethods.getList()
})
</script>
