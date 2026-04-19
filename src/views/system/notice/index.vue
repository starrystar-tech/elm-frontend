<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
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

  <NoticeForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as NoticeApi from '@/api/system/notice'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import NoticeForm from './NoticeForm.vue'

defineOptions({ name: 'SystemNotice' })

const canCreate = hasPermission(['system:notice:create'])
const canUpdate = hasPermission(['system:notice:update'])
const canDelete = hasPermission(['system:notice:delete'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'title',
    label: '公告标题',
    component: 'Input',
    componentProps: {
      placeholder: '请输入公告标题',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '公告状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择公告状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
      style: { width: '240px' }
    }
  }
])

const formRef = ref<InstanceType<typeof NoticeForm>>()
const checkedIds = ref<number[]>([])
const message = useMessage()

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const { tableObject, tableMethods, register: tableRegister } = useTable<NoticeApi.NoticeVO>({
  getListApi: async (params) => await NoticeApi.getNoticePage(params),
  delListApi: async (id) => await NoticeApi.deleteNotice(id as number)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleRowCheckboxChange = (rows: NoticeApi.NoticeVO[]) => {
  checkedIds.value = rows.map((row) => row.id!).filter(Boolean) as number[]
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await NoticeApi.deleteNoticeList(checkedIds.value)
    checkedIds.value = []
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const handlePush = async (id: number) => {
  try {
    await message.confirm('是否推送所选中通知？')
    await NoticeApi.pushNotice(id)
    message.success('推送成功')
  } catch {}
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '公告编号' },
  { field: 'title', label: '公告标题' },
  {
    field: 'type',
    label: '公告类型',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.SYSTEM_NOTICE_TYPE} value={data.row.type} />
    }
  },
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
    width: '210px',
    slots: {
      default: (data) => {
        const row = data.row as NoticeApi.NoticeVO
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
            {canUpdate ? (
              <BaseButton link type="success" onClick={() => handlePush(row.id!)}>
                推送
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
