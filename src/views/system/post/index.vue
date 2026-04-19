<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton v-if="canExport" type="success" :loading="exportLoading" @click="handleExport">
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

  <PostForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as PostApi from '@/api/system/post'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import PostForm from './PostForm.vue'

defineOptions({ name: 'SystemPost' })

const canCreate = hasPermission(['system:post:create'])
const canUpdate = hasPermission(['system:post:update'])
const canDelete = hasPermission(['system:post:delete'])
const canExport = hasPermission(['system:post:export'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '岗位名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入岗位名称',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'code',
    label: '岗位编码',
    component: 'Input',
    componentProps: {
      placeholder: '请输入岗位编码',
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

const formRef = ref<InstanceType<typeof PostForm>>()
const checkedIds = ref<number[]>([])

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const { tableObject, tableMethods, register: tableRegister } = useTable<PostApi.PostVO>({
  getListApi: async (params) => await PostApi.getPostPage(params),
  delListApi: async (id) => await PostApi.deletePost(id as number),
  exportListApi: async (params) => await PostApi.exportPost(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleRowCheckboxChange = (rows: PostApi.PostVO[]) => {
  checkedIds.value = rows.map((row) => row.id!).filter(Boolean) as number[]
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  const message = useMessage()
  try {
    await message.delConfirm()
    await PostApi.deletePostList(checkedIds.value)
    checkedIds.value = []
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const handleExport = async () => {
  await tableMethods.exportList('岗位列表.xls')
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '岗位编号' },
  { field: 'name', label: '岗位名称' },
  { field: 'code', label: '岗位编码' },
  { field: 'sort', label: '岗位顺序' },
  { field: 'remark', label: '岗位备注' },
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
    width: '150px',
    slots: {
      default: (data) => {
        const row = data.row as PostApi.PostVO
        return (
          <>
            {canUpdate ? (
              <BaseButton link type="primary" onClick={() => openForm('update', row.id)}>
                编辑
              </BaseButton>
            ) : null}
            {canDelete ? (
              <BaseButton link type="danger" onClick={() => handleDelete(row.id!)}>
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
