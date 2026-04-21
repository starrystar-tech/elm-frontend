<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-hasPermi="['ai:model:create']" type="primary" @click="openForm('create')">
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

  <ModelForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { ModelApi, type ModelVO } from '@/api/ai/model/model'
import { ApiKeyApi, type ApiKeyVO } from '@/api/ai/model/apiKey'
import ModelForm from './ModelForm.vue'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'AiModel' })

const message = useMessage()
const { t } = useI18n()

const formRef = ref()
const apiKeyList = ref<ApiKeyVO[]>([])

const apiKeyMap = computed(() =>
  apiKeyList.value.reduce(
    (map, item) => {
      map[item.id] = item.name
      return map
    },
    {} as Record<number, string>
  )
)

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '模型名字',
    component: 'Input',
    componentProps: { placeholder: '请输入模型名字', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'model',
    label: '模型标识',
    component: 'Input',
    componentProps: { placeholder: '请输入模型标识', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'platform',
    label: '模型平台',
    component: 'Select',
    componentProps: {
      placeholder: '请选择模型平台',
      clearable: true,
      options: getStrDictOptions(DICT_TYPE.AI_PLATFORM),
      style: { width: '240px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<ModelVO>({
  getListApi: async (params) => await ModelApi.getModelPage(params)
})

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ModelApi.deleteModel(id)
    message.success(t('common.delSuccess'))
    await tableMethods.getList()
  } catch {}
}

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const tableColumns = reactive<TableColumn[]>([
  {
    field: 'platform',
    label: '所属平台',
    minWidth: '100',
    slots: {
      default: (data) => <dict-tag type={DICT_TYPE.AI_PLATFORM} value={data.row.platform} />
    }
  },
  {
    field: 'type',
    label: '模型类型',
    minWidth: '100',
    slots: {
      default: (data) => <dict-tag type={DICT_TYPE.AI_MODEL_TYPE} value={data.row.type} />
    }
  },
  { field: 'name', label: '模型名字', minWidth: '180' },
  { field: 'model', label: '模型标识', minWidth: '180' },
  {
    field: 'keyId',
    label: 'API 秘钥',
    minWidth: '140',
    slots: {
      default: (data) => <span>{apiKeyMap.value[data.row.keyId] || '-'}</span>
    }
  },
  { field: 'sort', label: '排序', minWidth: '80' },
  {
    field: 'status',
    label: '状态',
    minWidth: '80',
    slots: {
      default: (data) => <dict-tag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'temperature', label: '温度参数', minWidth: '80' },
  { field: 'maxTokens', label: '回复数 Token 数', minWidth: '140' },
  { field: 'maxContexts', label: '上下文数量', minWidth: '100' },
  {
    field: 'action',
    label: '操作',
    width: '180',
    fixed: 'right',
    slots: {
      default: (data) => (
        <>
          <BaseButton
            v-hasPermi={['ai:model:update']}
            link
            type="primary"
            onClick={() => openForm('update', data.row.id)}
          >
            编辑
          </BaseButton>
          <BaseButton
            v-hasPermi={['ai:model:delete']}
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

onMounted(async () => {
  await tableMethods.getList()
  apiKeyList.value = await ApiKeyApi.getApiKeySimpleList()
})
</script>
