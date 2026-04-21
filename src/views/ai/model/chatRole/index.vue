<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton
        v-hasPermi="['ai:chat-role:create']"
        type="primary"
        @click="openForm('create')"
      >
        新增
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

  <ChatRoleForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { getBoolDictOptions, DICT_TYPE } from '@/utils/dict'
import { ChatRoleApi, type ChatRoleVO } from '@/api/ai/model/chatRole'
import ChatRoleForm from './ChatRoleForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'AiChatRole' })

const message = useMessage()
const { t } = useI18n()

const formRef = ref()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '角色名称',
    component: 'Input',
    componentProps: { placeholder: '请输入角色名称', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'category',
    label: '角色类别',
    component: 'Input',
    componentProps: { placeholder: '请输入角色类别', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'publicStatus',
    label: '是否公开',
    component: 'Select',
    componentProps: {
      placeholder: '请选择是否公开',
      clearable: true,
      options: getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING),
      style: { width: '240px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<ChatRoleVO>({
  getListApi: async (params) => await ChatRoleApi.getChatRolePage(params)
})

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ChatRoleApi.deleteChatRole(id)
    message.success(t('common.delSuccess'))
    await tableMethods.getList()
  } catch {}
}

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'name', label: '角色名称' },
  { field: 'modelName', label: '绑定模型' },
  {
    field: 'avatar',
    label: '角色头像',
    slots: {
      default: (data) => <el-image src={data.row.avatar} class="w-32px h-32px" />
    }
  },
  { field: 'category', label: '角色类别' },
  { field: 'description', label: '角色描述' },
  { field: 'systemMessage', label: '角色设定' },
  {
    field: 'knowledgeIds',
    label: '知识库',
    slots: {
      default: (data) => (
        <span>
          {!data.row.knowledgeIds || data.row.knowledgeIds.length === 0
            ? '-'
            : `引用 ${data.row.knowledgeIds.length} 个`}
        </span>
      )
    }
  },
  {
    field: 'toolIds',
    label: '工具',
    slots: {
      default: (data) => (
        <span>
          {!data.row.toolIds || data.row.toolIds.length === 0
            ? '-'
            : `引用 ${data.row.toolIds.length} 个`}
        </span>
      )
    }
  },
  {
    field: 'publicStatus',
    label: '是否公开',
    slots: {
      default: (data) => (
        <dict-tag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.publicStatus} />
      )
    }
  },
  {
    field: 'status',
    label: '状态',
    slots: {
      default: (data) => <dict-tag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'sort', label: '角色排序' },
  {
    field: 'action',
    label: '操作',
    slots: {
      default: (data) => (
        <>
          <BaseButton
            v-hasPermi={['ai:chat-role:update']}
            link
            type="primary"
            onClick={() => openForm('update', data.row.id)}
          >
            编辑
          </BaseButton>
          <BaseButton
            v-hasPermi={['ai:chat-role:delete']}
            link
            type="danger"
            onClick={() => handleDelete(data.row.id)}
          >
            删除
          </BaseButton>
        </>
      )
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
