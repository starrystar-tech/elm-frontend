<template>
  <ContentWrap>
    <Search
      :schema="searchSchema"
      label-width="90px"
      @reset="setSearchParams"
      @search="setSearchParams"
    />
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
</template>

<script setup lang="tsx">
import { reactive } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as OAuth2AccessTokenApi from '@/api/system/oauth2/token'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'SystemTokenClient' })

const message = useMessage()
const canDelete = hasPermission(['system:oauth2-token:delete'])

const searchSchema = reactive<FormSchema[]>([
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
    field: 'clientId',
    label: '客户端编号',
    component: 'Input',
    componentProps: {
      placeholder: '请输入客户端编号',
      clearable: true,
      style: { width: '240px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } =
  useTable<OAuth2AccessTokenApi.OAuth2TokenVO>({
    getListApi: async (params) => await OAuth2AccessTokenApi.getAccessTokenPage(params)
  })

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleForceLogout = async (accessToken: string) => {
  try {
    await message.confirm('是否要强制退出用户')
    await OAuth2AccessTokenApi.deleteAccessToken(accessToken)
    message.success('操作成功')
    await tableMethods.getList()
  } catch {}
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'accessToken', label: '访问令牌', width: '300px' },
  { field: 'refreshToken', label: '刷新令牌', width: '300px' },
  { field: 'userId', label: '用户编号' },
  {
    field: 'userType',
    label: '用户类型',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.USER_TYPE} value={data.row.userType} />
    }
  },
  { field: 'expiresTime', label: '过期时间', width: '180px', formatter: dateFormatter },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '100px',
    slots: {
      default: (data) =>
        canDelete ? (
          <BaseButton link type="danger" onClick={() => handleForceLogout(data.row.accessToken)}>
            强退
          </BaseButton>
        ) : null
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
