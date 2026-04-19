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
      stripe
      show-overflow-tooltip
      @register="tableRegister"
    />
  </ContentWrap>

  <GroupForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as GroupApi from '@/api/member/group'
import GroupForm from './GroupForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'MemberGroup' })

const canCreate = hasPermission(['member:group:create'])
const canUpdate = hasPermission(['member:group:update'])
const canDelete = hasPermission(['member:group:delete'])

const searchSchema = reactive<FormSchema[]>([
  { field: 'name', label: '分组名称', component: 'Input', componentProps: { placeholder: '请输入分组名称', clearable: true, style: { width: '240px' } } },
  { field: 'status', label: '状态', component: 'Select', componentProps: { placeholder: '请选择状态', clearable: true, options: getIntDictOptions(DICT_TYPE.COMMON_STATUS), style: { width: '240px' } } },
  { field: 'createTime', label: '创建时间', component: 'DatePicker', componentProps: { type: 'daterange', valueFormat: 'YYYY-MM-DD HH:mm:ss', startPlaceholder: '开始日期', endPlaceholder: '结束日期', defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')], style: { width: '240px' } } }
])

const formRef = ref<InstanceType<typeof GroupForm>>()
const openForm = (type: string, id?: number) => formRef.value?.open(type, id)
const { tableObject, tableMethods, register: tableRegister } = useTable<GroupApi.GroupVO>({ getListApi: async (params) => await GroupApi.getGroupPage(params), delListApi: async (id) => await GroupApi.deleteGroup(id as number) })
const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)
const handleDelete = async (id: number) => tableMethods.delList(id, false)

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号', minWidth: '60px' },
  { field: 'name', label: '名称', minWidth: '80px' },
  { field: 'remark', label: '备注', minWidth: '100px' },
  { field: 'status', label: '状态', minWidth: '70px', slots: { default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} /> } },
  { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '150px',
    slots: {
      default: (data) => {
        const row = data.row as GroupApi.GroupVO
        return (
          <>
            {canUpdate ? <BaseButton link type="primary" onClick={() => openForm('update', row.id)}>编辑</BaseButton> : null}
            {canDelete ? <BaseButton link type="danger" onClick={() => handleDelete(row.id)}>删除</BaseButton> : null}
          </>
        )
      }
    }
  }
])

onMounted(() => tableMethods.getList())
</script>
