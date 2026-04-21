<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
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

  <AccountForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { reactive, ref } from 'vue'
import * as AccountApi from '@/api/mp/account'
import AccountForm from './AccountForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'MpAccount' })

const canCreate = hasPermission(['mp:account:create'])
const canUpdate = hasPermission(['mp:account:update'])
const canDelete = hasPermission(['mp:account:delete'])
const canQrCode = hasPermission(['mp:account:qr-code'])
const canClearQuota = hasPermission(['mp:account:clear-quota'])

const message = useMessage()
const { t } = useI18n()
const formRef = ref()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '名称',
    component: 'Input',
    componentProps: { placeholder: '请输入名称', clearable: true, style: { width: '240px' } }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<AccountApi.AccountVO>({
  getListApi: async (params) => await AccountApi.getAccountPage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await AccountApi.deleteAccount(id)
    message.success(t('common.delSuccess'))
    await tableMethods.getList()
  } catch {}
}

const handleGenerateQrCode = async (row: any) => {
  try {
    await message.confirm(`是否确认生成公众号账号编号为"${row.name}"的二维码?`)
    await AccountApi.generateAccountQrCode(row.id)
    message.success('生成二维码成功')
    await tableMethods.getList()
  } catch {}
}

const handleCleanQuota = async (row: any) => {
  try {
    await message.confirm(`是否确认清空生成公众号账号编号为"${row.name}"的 API 配额?`)
    await AccountApi.clearAccountQuota(row.id)
    message.success('清空 API 配额成功')
  } catch {}
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'name', label: '名称', align: 'center' },
  { field: 'account', label: '微信号', align: 'center', width: '180' },
  { field: 'appId', label: 'appId', align: 'center', width: '180' },
  {
    field: 'serverUrl',
    label: '服务器地址(URL)',
    align: 'center',
    width: '360',
    slots: {
      default: (data) => <span>{`http://服务端地址/admin-api/mp/open/${data.row.appId}`}</span>
    }
  },
  {
    field: 'qrCodeUrl',
    label: '二维码',
    align: 'center',
    slots: {
      default: (data) => (
        <>
          {data.row.qrCodeUrl ? (
            <img
              src={data.row.qrCodeUrl}
              alt="二维码"
              style={{ display: 'inline-block', height: '100px' }}
            />
          ) : null}
          {canQrCode ? (
            <BaseButton link type="primary" onClick={() => handleGenerateQrCode(data.row)}>
              生成二维码
            </BaseButton>
          ) : null}
        </>
      )
    }
  },
  { field: 'remark', label: '备注', align: 'center' },
  {
    field: 'action',
    label: '操作',
    align: 'center',
    width: '220',
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
          {canClearQuota ? (
            <BaseButton link type="danger" onClick={() => handleCleanQuota(data.row)}>
              清空 API 配额
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
