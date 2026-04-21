<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-hasPermi="['ai:api-key:create']" type="primary" @click="openForm('create')">
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

  <ApiKeyForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { getIntDictOptions, DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { ApiKeyApi, type ApiKeyVO } from '@/api/ai/model/apiKey'
import ApiKeyForm from './ApiKeyForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'AiApiKey' })

const message = useMessage()
const { t } = useI18n()

const formRef = ref()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '名称',
    component: 'Input',
    componentProps: { placeholder: '请输入名称', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'platform',
    label: '平台',
    component: 'Select',
    componentProps: {
      placeholder: '请选择平台',
      clearable: true,
      options: getStrDictOptions(DICT_TYPE.AI_PLATFORM),
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

const { tableObject, tableMethods, register: tableRegister } = useTable<ApiKeyVO>({
  getListApi: async (params) => await ApiKeyApi.getApiKeyPage(params)
})

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await ApiKeyApi.deleteApiKey(id)
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
    slots: {
      default: (data) => <dict-tag type={DICT_TYPE.AI_PLATFORM} value={data.row.platform} />
    }
  },
  { field: 'name', label: '名称' },
  { field: 'apiKey', label: '密钥' },
  { field: 'url', label: '自定义 API URL' },
  {
    field: 'status',
    label: '状态',
    slots: {
      default: (data) => <dict-tag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  {
    field: 'action',
    label: '操作',
    slots: {
      default: (data) => (
        <>
          <BaseButton
            v-hasPermi={['ai:api-key:update']}
            link
            type="primary"
            onClick={() => openForm('update', data.row.id)}
          >
            编辑
          </BaseButton>
          <BaseButton
            v-hasPermi={['ai:api-key:delete']}
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
