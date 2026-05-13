<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton type="danger" @click="toggleExpandAll">展开/折叠</BaseButton>
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
      v-if="refreshTable"
      :columns="tableColumns"
      :data="list"
      :loading="loading"
      row-key="id"
      :default-expand-all="isExpandAll"
      selection
      @selection-change="handleRowCheckboxChange"
    />
  </ContentWrap>

  <DeptForm ref="formRef" @success="getList" />
</template>

<script setup lang="tsx">
import { computed, nextTick, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import DeptForm from './DeptForm.vue'
import * as UserApi from '@/api/system/user'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'SystemDept' })

const canCreate = hasPermission(['system:dept:create'])
const canUpdate = hasPermission(['system:dept:update'])
const canDelete = hasPermission(['system:dept:delete'])

const message = useMessage()
const searchParams = reactive({
  name: undefined,
  status: undefined
})
const loading = ref(true)
const list = ref<DeptApi.DeptVO[]>([])
const isExpandAll = ref(true)
const refreshTable = ref(true)
const userList = ref<UserApi.UserVO[]>([])
const checkedIds = ref<number[]>([])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '部门名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入部门名称',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '部门状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择部门状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
      style: { width: '240px' }
    }
  }
])

const formRef = ref<InstanceType<typeof DeptForm>>()
const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const getList = async () => {
  loading.value = true
  try {
    const data = await DeptApi.getDeptList({
      pageNo: 1,
      pageSize: 100,
      ...searchParams
    })
    list.value = handleTree(data)
  } finally {
    loading.value = false
  }
}

const setSearchParams = async (params: Recordable) => {
  Object.assign(searchParams, params)
  await getList()
}

const toggleExpandAll = () => {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  nextTick(() => {
    refreshTable.value = true
  })
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DeptApi.deleteDept(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

const handleRowCheckboxChange = (rows: DeptApi.DeptVO[]) => {
  checkedIds.value = rows.map((row) => row.id)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await DeptApi.deleteDeptList(checkedIds.value)
    checkedIds.value = []
    message.success('删除成功')
    await getList()
  } catch {}
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'name', label: '部门名称' },
  {
    field: 'deptType',
    label: '部门类型',
    slots: {
      default: (data) => <DictTag type="system_dept_type" value={data.row.deptType} />
    }
  },
  {
    field: 'leader',
    label: '负责人',
    slots: {
      default: (data) => <>{userList.value.find((user) => user.id === data.row.leaderUserId)?.nickname}</>
    }
  },
  { field: 'sort', label: '排序' },
  {
    field: 'status',
    label: '状态',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '140px',
    slots: {
      default: (data) => {
        const row = data.row as DeptApi.DeptVO
        return (
          <>
            {canUpdate ? (
              <BaseButton link type="primary" onClick={() => openForm('update', row.id)}>
                修改
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
  userList.value = await UserApi.getSimpleUserList()
  await getList()
})
</script>
