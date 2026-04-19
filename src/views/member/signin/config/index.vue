<template>
  <ContentWrap>
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
    </div>
    <Table :columns="tableColumns" :data="list" :loading="loading" />
  </ContentWrap>

  <SignInConfigForm ref="formRef" @success="getList" />
</template>

<script lang="tsx" setup>
import { reactive, ref } from 'vue'
import * as SignInConfigApi from '@/api/member/signin/config'
import SignInConfigForm from './SignInConfigForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import { ContentWrap } from '@/components/ContentWrap'
import { Table, type TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'SignInConfig' })

const canCreate = hasPermission(['point:sign-in-config:create'])
const canUpdate = hasPermission(['point:sign-in-config:update'])
const canDelete = hasPermission(['point:sign-in-config:delete'])
const message = useMessage()

const loading = ref(true)
const list = ref<SignInConfigApi.SignInConfigVO[]>([])

const getList = async () => {
  loading.value = true
  try {
    list.value = await SignInConfigApi.getSignInConfigList()
  } finally {
    loading.value = false
  }
}

const formRef = ref<InstanceType<typeof SignInConfigForm>>()
const openForm = (type: string, id?: number) => formRef.value?.open(type, id)

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await SignInConfigApi.deleteSignInConfig(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'day', label: '签到天数', formatter: (_r, _c, value) => ['第', value, '天'].join(' ') },
  { field: 'point', label: '奖励积分' },
  { field: 'experience', label: '奖励经验' },
  { field: 'status', label: '状态', slots: { default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} /> } },
  { field: 'action', label: '操作', slots: { default: (data) => <>{canUpdate ? <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>编辑</BaseButton> : null}{canDelete ? <BaseButton link type="danger" onClick={() => handleDelete(data.row.id)}>删除</BaseButton> : null}</> } }
])

onMounted(() => getList())
</script>
