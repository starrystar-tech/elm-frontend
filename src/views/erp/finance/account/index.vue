<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton v-if="canExport" type="success" :loading="exportLoading" @click="handleExport">
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
      :stripe="true"
      :show-overflow-tooltip="true"
      @register="tableRegister"
    />
  </ContentWrap>

  <AccountForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { ElSwitch } from 'element-plus'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { AccountApi, AccountVO } from '@/api/erp/finance/account'
import AccountForm from './AccountForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ErpAccount' })

const canCreate = hasPermission(['erp:account:create'])
const canUpdate = hasPermission(['erp:account:update'])
const canDelete = hasPermission(['erp:account:delete'])
const canExport = hasPermission(['erp:account:export'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入名称',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'no',
    label: '编码',
    component: 'Input',
    componentProps: {
      placeholder: '请输入编码',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'remark',
    label: '备注',
    component: 'Input',
    componentProps: {
      placeholder: '请输入备注',
      clearable: true,
      style: { width: '240px' }
    }
  }
])

const formRef = ref<InstanceType<typeof AccountForm>>()

const { tableObject, tableMethods, register: tableRegister } = useTable<AccountVO>({
  getListApi: async (params) => await AccountApi.getAccountPage(params),
  delListApi: async (id) => await AccountApi.deleteAccount(id as number),
  exportListApi: async (params) => await AccountApi.exportAccount(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDefaultStatusChange = async (row: AccountVO) => {
  const message = useMessage()
  try {
    const text = row.defaultStatus ? '设置' : '取消'
    await message.confirm(`确认要${text}"${row.name}"默认吗?`)
    await AccountApi.updateAccountDefaultStatus(row.id, row.defaultStatus)
    await tableMethods.getList()
  } catch {
    row.defaultStatus = !row.defaultStatus
  }
}

const handleExport = async () => {
  await tableMethods.exportList('ERP 结算账户.xls')
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'name', label: '名称', align: 'center' },
  { field: 'no', label: '编码', align: 'center' },
  { field: 'remark', label: '备注', align: 'center' },
  {
    field: 'status',
    label: '状态',
    align: 'center',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'sort', label: '排序', align: 'center' },
  {
    field: 'defaultStatus',
    label: '是否默认',
    align: 'center',
    slots: {
      default: (data) => (
        <ElSwitch
          v-model={data.row.defaultStatus}
          active-value={true}
          inactive-value={false}
          disabled={!canUpdate}
          onChange={() => handleDefaultStatusChange(data.row)}
        />
      )
    }
  },
  { field: 'createTime', label: '创建时间', align: 'center', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    align: 'center',
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
        </>
      )
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
