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

  <TagForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as TagApi from '@/api/member/tag'
import TagForm from './TagForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'MemberTag' })

const canCreate = hasPermission(['member:tag:create'])
const canUpdate = hasPermission(['member:tag:update'])
const canDelete = hasPermission(['member:tag:delete'])

const searchSchema = reactive<FormSchema[]>([
  { field: 'name', label: '标签名称', component: 'Input', componentProps: { placeholder: '请输入标签名称', clearable: true, style: { width: '240px' } } },
  { field: 'createTime', label: '创建时间', component: 'DatePicker', componentProps: { type: 'daterange', valueFormat: 'YYYY-MM-DD HH:mm:ss', startPlaceholder: '开始日期', endPlaceholder: '结束日期', defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')], style: { width: '240px' } } }
])

const formRef = ref<InstanceType<typeof TagForm>>()
const openForm = (type: string, id?: number) => formRef.value?.open(type, id)
const { tableObject, tableMethods, register: tableRegister } = useTable<TagApi.TagVO>({ getListApi: async (params) => await TagApi.getMemberTagPage(params), delListApi: async (id) => await TagApi.deleteMemberTag(id as number) })
const setSearchParams = (params: Recordable) => tableMethods.setSearchParams(params)
const handleDelete = async (id: number) => tableMethods.delList(id, false)

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号', width: '150px' },
  { field: 'name', label: '标签名称' },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  { field: 'action', label: '操作', width: '150px', slots: { default: (data) => <>{canUpdate ? <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>编辑</BaseButton> : null}{canDelete ? <BaseButton link type="danger" onClick={() => handleDelete(data.row.id)}>删除</BaseButton> : null}</> } }
])

onMounted(() => tableMethods.getList())
</script>
