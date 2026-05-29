<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />

    <div class="action-btn-wrap">
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

  <CampusForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import * as CampusApi from '@/api/system/campus'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import type { FormSchema } from '@/types/form'
import { useTable } from '@/hooks/web/useTable'
import { hasPermission } from '@/directives/permission/hasPermi'
import CampusForm from './CampusForm.vue'

defineOptions({ name: 'SystemCampus' })

const canCreate = hasPermission(['system:campus:create'])
const canUpdate = hasPermission(['system:campus:update'])

const message = useMessage()
const formRef = ref<InstanceType<typeof CampusForm>>()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '校区名称',
    component: 'Input',
    componentProps: {
      clearable: true,
      placeholder: '请输入校区名称',
      style: { width: '220px' }
    }
  },
  {
    field: 'hasTeacher',
    label: '分配班主任',
    component: 'Select',
    componentProps: {
      clearable: true,
      placeholder: '请选择',
      options: [
        { label: '是', value: true },
        { label: '否', value: false }
      ],
      style: { width: '220px' }
    }
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      clearable: true,
      placeholder: '请选择状态',
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
      style: { width: '220px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<CampusApi.CampusVO>({
  getListApi: async (params) => await CampusApi.getCampusPage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleUpdateStatus = async (row: CampusApi.CampusVO) => {
  const text = row.status === CommonStatusEnum.ENABLE ? '停用' : '启用'
  try {
    await message.confirm(`确认要${text}【${row.name}】吗？`)
    await CampusApi.updateCampusStatus({
      id: row.id!,
      status: row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
    })
    message.success(text + '成功')
    await tableMethods.getList()
  } catch {}
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号', width: '90px' },
  { field: 'name', label: '校区名称', minWidth: '180px' },
  {
    field: 'isDefault',
    label: '默认校区',
    width: '110px',
    slots: {
      default: (data) => (data.row.isDefault ? '是' : '否')
    }
  },
  {
    field: 'hasTeacher',
    label: '分配班主任',
    width: '130px',
    slots: {
      default: (data) => (data.row.hasTeacher ? '是' : '否')
    }
  },
  {
    field: 'contractSignCompany',
    label: '绑定签约公司',
    minWidth: '180px',
    slots: {
      default: (data) =>
        data.row.contractSignCompany?.companyShortName ||
        data.row.contractSignCompany?.companyFullName ||
        '-'
    }
  },
  {
    field: 'status',
    label: '状态',
    width: '100px',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  {
    field: 'remark',
    label: '备注',
    minWidth: '180px',
    slots: {
      default: (data) => data.row.remark || '-'
    }
  },
  {
    field: 'createTime',
    label: '创建时间',
    width: '180px',
    formatter: dateFormatter
  },
  {
    field: 'action',
    label: '操作',
    width: '170px',
    fixed: 'right',
    slots: {
      default: (data) => {
        const row = data.row as CampusApi.CampusVO
        return (
          <>
            {canUpdate ? (
              <BaseButton link type="primary" onClick={() => openForm('update', row.id)}>
                编辑
              </BaseButton>
            ) : null}
            {canUpdate ? (
              <BaseButton link type="primary" onClick={() => handleUpdateStatus(row)}>
                {row.status === CommonStatusEnum.ENABLE ? '停用' : '启用'}
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

<style scoped>
.action-btn-wrap {
  margin-bottom: 10px;
}
</style>
