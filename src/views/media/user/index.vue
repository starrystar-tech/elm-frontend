<template>
  <ContentWrap>
    <Search
      :schema="searchSchema"
      label-width="68px"
      @reset="setSearchParams"
      @search="setSearchParams"
    />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton v-if="canExport" type="primary" plain :loading="exportLoading" @click="handleExport">
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
      stripe
      show-overflow-tooltip
      @register="tableRegister"
    />
  </ContentWrap>

  <UserForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { UserApi, UserVO } from '@/api/media/user'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import UserForm from './UserForm.vue'

/** 媒体用户测试 列表 */
defineOptions({ name: 'MediaUser' })

const canCreate = hasPermission(['media:user:create'])
const canExport = hasPermission(['media:user:export'])
const canUpdate = hasPermission(['media:user:update'])
const canDelete = hasPermission(['media:user:delete'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '姓名',
    component: 'Input',
    componentProps: {
      placeholder: '请输入姓名',
      clearable: true,
      style: {
        width: '240px'
      }
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
      style: {
        width: '240px'
      }
    }
  }
])

const formRef = ref<InstanceType<typeof UserForm>>()

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const { tableObject, tableMethods, register: tableRegister } = useTable<UserVO>({
  getListApi: async (params) => await UserApi.getUserPage(params),
  delListApi: async (id) => await UserApi.deleteUser(id as number),
  exportListApi: async (params) => await UserApi.exportUser(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const tableColumns = reactive<TableColumn[]>([
  {
    field: 'id',
    label: '唯一标识'
  },
  {
    field: 'name',
    label: '姓名'
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
    width: '140px',
    slots: {
      default: (data) => {
        const row = data.row as UserVO
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

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

/** 导出按钮操作 */
const handleExport = async () => {
  await tableMethods.exportList('媒体用户测试.xls')
}

/** 初始化 **/
onMounted(() => {
  tableMethods.getList()
})
</script>
