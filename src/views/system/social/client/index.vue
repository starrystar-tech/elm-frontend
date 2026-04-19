<template>
  <ContentWrap>
    <Search
      :schema="searchSchema"
      label-width="130px"
      @reset="setSearchParams"
      @search="setSearchParams"
    />
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
      stripe
      show-overflow-tooltip
      @register="tableRegister"
    />
  </ContentWrap>

  <SocialClientForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as SocialClientApi from '@/api/system/social/client'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import SocialClientForm from './SocialClientForm.vue'

defineOptions({ name: 'SocialClient' })

const canCreate = hasPermission(['system:social-client:create'])
const canUpdate = hasPermission(['system:social-client:update'])
const canDelete = hasPermission(['system:social-client:delete'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '应用名',
    component: 'Input',
    componentProps: {
      placeholder: '请输入应用名',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'socialType',
    label: '社交平台',
    component: 'Select',
    componentProps: {
      placeholder: '请选择社交平台',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.SYSTEM_SOCIAL_TYPE),
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
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
      style: { width: '240px' }
    }
  }
])

const formRef = ref<InstanceType<typeof SocialClientForm>>()

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const { tableObject, tableMethods, register: tableRegister } = useTable<SocialClientApi.SocialClientVO>(
  {
    getListApi: async (params) => await SocialClientApi.getSocialClientPage(params),
    delListApi: async (id) => await SocialClientApi.deleteSocialClient(id as number)
  }
)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号' },
  { field: 'name', label: '应用名' },
  {
    field: 'socialType',
    label: '社交平台',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.SYSTEM_SOCIAL_TYPE} value={data.row.socialType} />
    }
  },
  {
    field: 'userType',
    label: '用户类型',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.USER_TYPE} value={data.row.userType} />
    }
  },
  { field: 'clientId', label: '客户端编号', width: '180px' },
  {
    field: 'status',
    label: '状态',
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
    width: '140px',
    slots: {
      default: (data) => {
        const row = data.row as SocialClientApi.SocialClientVO
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
