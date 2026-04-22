<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton v-if="canExport" type="primary" plain :loading="exportLoading" @click="handleExport">
        导出
      </BaseButton>
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

  <TenantForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { ElTag } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as TenantApi from '@/api/system/tenant'
import * as TenantPackageApi from '@/api/system/tenantPackage'
import TenantForm from './TenantForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'SystemTenant' })

const canCreate = hasPermission(['system:tenant:create'])
const canUpdate = hasPermission(['system:tenant:update'])
const canDelete = hasPermission(['system:tenant:delete'])
const canExport = hasPermission(['system:tenant:export'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '租户名',
    component: 'Input',
    componentProps: {
      placeholder: '请输入租户名',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'contactName',
    label: '联系人',
    component: 'Input',
    componentProps: {
      placeholder: '请输入联系人',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'contactMobile',
    label: '联系手机',
    component: 'Input',
    componentProps: {
      placeholder: '请输入联系手机',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '租户状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择租户状态',
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

const packageList = ref<TenantPackageApi.TenantPackageVO[]>([])
const checkedIds = ref<number[]>([])
const message = useMessage()
const formRef = ref<InstanceType<typeof TenantForm>>()

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const { tableObject, tableMethods, register: tableRegister } = useTable<TenantApi.TenantVO>({
  getListApi: async (params) => await TenantApi.getTenantPage(params),
  delListApi: async (id) => await TenantApi.deleteTenant(id as number),
  exportListApi: async (params) => await TenantApi.exportTenant(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleRowCheckboxChange = (rows: TenantApi.TenantVO[]) => {
  checkedIds.value = rows.map((row) => row.id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await TenantApi.deleteTenantList(checkedIds.value)
    checkedIds.value = []
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const handleExport = async () => {
  await tableMethods.exportList('租户列表.xls')
}

const getPackageTag = (packageId: number) => {
  if (packageId === 0) {
    return <ElTag type="danger">系统租户</ElTag>
  }
  const pkg = packageList.value.find((item) => item.id === packageId)
  return pkg ? <ElTag type="success">{pkg.name}</ElTag> : <span>-</span>
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '租户编号' },
  { field: 'name', label: '租户名' },
  {
    field: 'packageId',
    label: '租户套餐',
    slots: {
      default: (data) => getPackageTag(data.row.packageId)
    }
  },
  { field: 'contactName', label: '联系人' },
  { field: 'contactMobile', label: '联系手机' },
  {
    field: 'accountCount',
    label: '账号额度',
    slots: {
      default: (data) => <ElTag>{data.row.accountCount}</ElTag>
    }
  },
  { field: 'expireTime', label: '过期时间', width: '180px', formatter: dateFormatter },
  {
    field: 'websites',
    label: '站点',
    minWidth: '220px',
    slots: {
      default: (data) => (
        <>
          {(data.row.websites || []).length
            ? (data.row.websites || []).map((website: string) => (
                <ElTag class="mr-1 mb-1">{website}</ElTag>
              ))
            : '-'}
        </>
      )
    }
  },
  {
    field: 'status',
    label: '租户状态',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    minWidth: '110px',
    fixed: 'right',
    slots: {
      default: (data) => {
        const row = data.row as TenantApi.TenantVO
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

onMounted(async () => {
  packageList.value = await TenantPackageApi.getTenantPackageList()
  await tableMethods.getList()
})
</script>
