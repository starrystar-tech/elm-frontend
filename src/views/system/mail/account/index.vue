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

  <MailAccountForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as MailAccountApi from '@/api/system/mail/account'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import MailAccountForm from './MailAccountForm.vue'

defineOptions({ name: 'SystemMailAccount' })

const canCreate = hasPermission(['system:mail-account:create'])
const canUpdate = hasPermission(['system:mail-account:update'])
const canDelete = hasPermission(['system:mail-account:delete'])
const checkedIds = ref<number[]>([])
const message = useMessage()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'mail',
    label: '邮箱',
    component: 'Input',
    componentProps: {
      placeholder: '请输入邮箱',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'username',
    label: '用户名',
    component: 'Input',
    componentProps: {
      placeholder: '请输入用户名',
      clearable: true,
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

const formRef = ref<InstanceType<typeof MailAccountForm>>()
const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const { tableObject, tableMethods, register: tableRegister } = useTable<MailAccountApi.MailAccountVO>({
  getListApi: async (params) => await MailAccountApi.getMailAccountPage(params),
  delListApi: async (id) => await MailAccountApi.deleteMailAccount(id as number)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleRowCheckboxChange = (rows: MailAccountApi.MailAccountVO[]) => {
  checkedIds.value = rows.map((row) => row.id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await MailAccountApi.deleteMailAccountList(checkedIds.value)
    checkedIds.value = []
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号' },
  { field: 'mail', label: '邮箱' },
  { field: 'username', label: '用户名' },
  { field: 'host', label: 'SMTP 服务器域名' },
  { field: 'port', label: 'SMTP 服务器端口' },
  {
    field: 'sslEnable',
    label: '是否开启 SSL',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.sslEnable} />
    }
  },
  {
    field: 'starttlsEnable',
    label: '是否开启 STARTTLS',
    slots: {
      default: (data) => (
        <DictTag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.starttlsEnable} />
      )
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
    width: '140px',
    slots: {
      default: (data) => {
        const row = data.row as MailAccountApi.MailAccountVO
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
