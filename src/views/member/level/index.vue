<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
    </div>
    <Table :columns="tableColumns" :data="list" :loading="loading" stripe show-overflow-tooltip />
  </ContentWrap>

  <LevelForm ref="formRef" @success="getList" />
</template>

<script setup lang="tsx">
import { ElImage } from 'element-plus'
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as LevelApi from '@/api/member/level'
import LevelForm from './LevelForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'MemberLevel' })

const canCreate = hasPermission(['member:level:create'])
const canUpdate = hasPermission(['member:level:update'])
const canDelete = hasPermission(['member:level:delete'])
const message = useMessage()

const loading = ref(true)
const list = ref<LevelApi.LevelVO[]>([])
const createSearchParams = () => ({ name: null, status: null })
const searchParams = reactive(createSearchParams())
const searchSchema = reactive<FormSchema[]>([
  { field: 'name', label: '等级名称', component: 'Input', componentProps: { placeholder: '请输入等级名称', clearable: true, style: { width: '240px' } } },
  { field: 'status', label: '状态', component: 'Select', componentProps: { placeholder: '请选择状态', clearable: true, options: getIntDictOptions(DICT_TYPE.COMMON_STATUS), style: { width: '240px' } } }
])

const getList = async () => {
  loading.value = true
  try {
    list.value = await LevelApi.getLevelList(searchParams)
  } finally {
    loading.value = false
  }
}
const setSearchParams = async (params: Recordable) => {
  Object.assign(searchParams, createSearchParams(), params)
  await getList()
}
const formRef = ref<InstanceType<typeof LevelForm>>()
const openForm = (type: string, id?: number) => formRef.value?.open(type, id)
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await LevelApi.deleteLevel(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '编号', minWidth: '60px' },
  { field: 'icon', label: '等级图标', minWidth: '80px', slots: { default: (data) => <ElImage src={data.row.icon} class="h-30px w-30px" previewSrcList={[data.row.icon]} /> } },
  { field: 'backgroundUrl', label: '等级背景图', minWidth: '100px', slots: { default: (data) => <ElImage src={data.row.backgroundUrl || data.row.bgUrl} class="h-30px w-30px" previewSrcList={[data.row.backgroundUrl || data.row.bgUrl]} /> } },
  { field: 'name', label: '等级名称', minWidth: '100px' },
  { field: 'level', label: '等级', minWidth: '60px' },
  { field: 'experience', label: '升级经验', minWidth: '80px' },
  { field: 'discountPercent', label: '享受折扣(%)', minWidth: '110px' },
  { field: 'status', label: '状态', minWidth: '70px', slots: { default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} /> } },
  { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter },
  { field: 'action', label: '操作', minWidth: '110px', fixed: 'right', slots: { default: (data) => <>{canUpdate ? <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>编辑</BaseButton> : null}{canDelete ? <BaseButton link type="danger" onClick={() => handleDelete(data.row.id)}>删除</BaseButton> : null}</> } }
])

onMounted(() => getList())
</script>
