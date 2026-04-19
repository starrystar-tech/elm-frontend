<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <el-tabs v-model="activeName" @tab-click="handleTabClick">
      <el-tab-pane label="我负责的" name="1" />
      <el-tab-pane label="我参与的" name="2" />
      <el-tab-pane label="下属负责的" name="3" />
    </el-tabs>
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
      @register="tableRegister"
    />
  </ContentWrap>

  <ClueForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { ElLink, type TabsPaneContext } from 'element-plus'
import { DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as ClueApi from '@/api/crm/clue'
import ClueForm from './ClueForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'CrmClue' })

const canCreate = hasPermission(['crm:clue:create'])
const canUpdate = hasPermission(['crm:clue:update'])
const canDelete = hasPermission(['crm:clue:delete'])
const canExport = hasPermission(['crm:clue:export'])

const activeName = ref('1')

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '线索名称',
    component: 'Input',
    componentProps: { placeholder: '请输入线索名称', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'transformStatus',
    label: '转化状态',
    component: 'Select',
    componentProps: {
      options: [
        { label: '未转化', value: false },
        { label: '已转化', value: true }
      ],
      style: { width: '240px' }
    }
  },
  {
    field: 'mobile',
    label: '手机号',
    component: 'Input',
    componentProps: { placeholder: '请输入手机号', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'telephone',
    label: '电话',
    component: 'Input',
    componentProps: { placeholder: '请输入电话', clearable: true, style: { width: '240px' } }
  }
])

const formRef = ref<InstanceType<typeof ClueForm>>()
const { push } = useRouter()

const { tableObject, tableMethods, register: tableRegister } = useTable<ClueApi.ClueVO>({
  getListApi: async (params) =>
    await ClueApi.getCluePage({
      transformStatus: false,
      ...params,
      sceneType: activeName.value
    }),
  delListApi: async (id) => await ClueApi.deleteClue(id as number),
  exportListApi: async (params) =>
    await ClueApi.exportClue({
      transformStatus: false,
      ...params,
      sceneType: activeName.value
    })
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams({
    sceneType: activeName.value,
    transformStatus: false,
    ...params
  })
}

const handleTabClick = (tab: TabsPaneContext) => {
  activeName.value = String(tab.paneName)
  tableMethods.setSearchParams({
    ...(tableObject.params || {}),
    sceneType: activeName.value
  })
}

const openDetail = (id: number) => {
  push({ name: 'CrmClueDetail', params: { id } })
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleExport = async () => {
  await tableMethods.exportList('线索.xls')
}

const tableColumns = reactive<TableColumn[]>([
  {
    field: 'name',
    label: '线索名称',
    width: '160px',
    fixed: 'left',
    slots: {
      default: (data) => (
        <ElLink underline={false} type="primary" onClick={() => openDetail(data.row.id)}>
          {data.row.name}
        </ElLink>
      )
    }
  },
  {
    field: 'source',
    label: '线索来源',
    width: '100px',
    slots: { default: (data) => <DictTag type={DICT_TYPE.CRM_CUSTOMER_SOURCE} value={data.row.source} /> }
  },
  { field: 'mobile', label: '手机', width: '120px' },
  { field: 'telephone', label: '电话', width: '130px' },
  { field: 'email', label: '邮箱', width: '180px' },
  { field: 'detailAddress', label: '地址', width: '180px' },
  {
    field: 'industryId',
    label: '客户行业',
    width: '100px',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.CRM_CUSTOMER_INDUSTRY} value={data.row.industryId} />
    }
  },
  {
    field: 'level',
    label: '客户级别',
    width: '135px',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.CRM_CUSTOMER_LEVEL} value={data.row.level} />
    }
  },
  { field: 'contactNextTime', label: '下次联系时间', width: '180px', formatter: dateFormatter },
  { field: 'remark', label: '备注', width: '200px' },
  { field: 'contactLastTime', label: '最后跟进时间', width: '180px', formatter: dateFormatter },
  { field: 'contactLastContent', label: '最后跟进记录', width: '200px' },
  { field: 'ownerUserName', label: '负责人', width: '100px' },
  { field: 'ownerUserDeptName', label: '所属部门', width: '100px' },
  { field: 'updateTime', label: '更新时间', width: '180px', formatter: dateFormatter },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  { field: 'creatorName', label: '创建人', width: '100px' },
  {
    field: 'action',
    label: '操作',
    minWidth: '110px',
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
  tableMethods.setSearchParams({ sceneType: activeName.value, transformStatus: false })
})
</script>
