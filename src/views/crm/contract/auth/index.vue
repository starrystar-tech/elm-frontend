<template>
  <ContentWrap>
    <div class="contract-company-card">
      <div class="contract-company-card__title">签约公司信息</div>
      <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
      <div class="action-btn-wrap">
        <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增公司</BaseButton>
      </div>
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

  <CompanyForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import * as SignCompanyApi from '@/api/system/contract/signCompany'
import CompanyForm from './CompanyForm.vue'

defineOptions({ name: 'ContractAuth' })

const canCreate = hasPermission(['system:contract-sign-company:create'])
const canUpdate = hasPermission(['system:contract-sign-company:update'])
const canDelete = hasPermission(['system:contract-sign-company:delete'])

const message = useMessage()
const formRef = ref<InstanceType<typeof CompanyForm>>()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'companyName',
    label: '公司名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入公司名称',
      clearable: true,
      style: { width: '220px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<SignCompanyApi.ContractSignCompanyVO>({
  getListApi: async (params) => await SignCompanyApi.getContractSignCompanyPage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: 'create' | 'update', id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  await message.confirm('确认删除该签约公司吗？')
  await SignCompanyApi.deleteContractSignCompany(id)
  message.success('删除成功')
  await tableMethods.getList()
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'companyFullName', label: '公司全称', minWidth: '240px' },
  { field: 'companyShortName', label: '公司简称', minWidth: '160px' },
  { field: 'unifiedSocialCreditCode', label: '统一社会信用代码', minWidth: '180px' },
  { field: 'legalRepresentative', label: '法定代表人', minWidth: '120px' },
  { field: 'contactPhone', label: '联系电话', minWidth: '140px' },
  { field: 'registeredAddress', label: '注册地址', minWidth: '220px' },
  { field: 'openCorpId', label: '法大大企业标识', minWidth: '180px' },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '150px',
    fixed: 'right',
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

<style scoped>
.contract-company-card__title {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
