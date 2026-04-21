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
      :stripe="true"
      :show-overflow-tooltip="true"
      @register="tableRegister"
    />
  </ContentWrap>

  <DiyTemplateForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as DiyTemplateApi from '@/api/mall/promotion/diy/template'
import DiyTemplateForm from './DiyTemplateForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'DiyTemplate' })

const canCreate = hasPermission(['promotion:diy-template:create'])
const canUpdate = hasPermission(['promotion:diy-template:update'])
const canUse = hasPermission(['promotion:diy-template:use'])
const canDelete = hasPermission(['promotion:diy-template:delete'])

const message = useMessage()
const formRef = ref()
const { push } = useRouter()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '模板名称',
    component: 'Input',
    componentProps: { placeholder: '请输入模板名称', clearable: true, style: { width: '240px' } }
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

const { tableObject, tableMethods, register: tableRegister } = useTable<DiyTemplateApi.DiyTemplateVO>({
  getListApi: async (params) => await DiyTemplateApi.getDiyTemplatePage(params)
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
    await DiyTemplateApi.deleteDiyTemplate(id)
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const handleUse = async (row: DiyTemplateApi.DiyTemplateVO) => {
  try {
    await message.confirm(`是否使用模板“${row.name}”?`)
    await DiyTemplateApi.useDiyTemplate(row.id!)
    message.success('使用成功')
    await tableMethods.getList()
  } catch {}
}

const handleDecorate = (id: number) => {
  push({ name: 'DiyTemplateDecorate', params: { id } })
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'id', label: '编号', align: 'center' },
  {
    field: 'previewPicUrls',
    label: '预览图',
    align: 'center',
    slots: {
      default: (data) =>
        data.row.previewPicUrls?.map((url: string, index: number) => (
          <el-image
            class="h-40px max-w-40px"
            key={index}
            src={url}
            preview-src-list={data.row.previewPicUrls}
            initial-index={index}
            preview-teleported
          />
        ))
    }
  },
  { field: 'name', label: '模板名称', align: 'center', minWidth: '180' },
  {
    field: 'used',
    label: '是否使用',
    align: 'center',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.used} />
    }
  },
  { field: 'remark', label: '备注', align: 'center', minWidth: '180' },
  { field: 'createTime', label: '创建时间', align: 'center', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    align: 'center',
    width: '220',
    slots: {
      default: (data) => (
        <>
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => handleDecorate(data.row.id)}>
              装修
            </BaseButton>
          ) : null}
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>
              编辑
            </BaseButton>
          ) : null}
          {!data.row.used && canUse ? (
            <BaseButton link type="primary" onClick={() => handleUse(data.row)}>
              使用
            </BaseButton>
          ) : null}
          {!data.row.used && canDelete ? (
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
