<template>
  <ContentWrap>
    <div class="mb-12px flex justify-between items-center">
      <div class="text-16px font-600">企微自建应用</div>
      <BaseButton v-if="canCreate" type="primary" @click="openCreate">新增应用</BaseButton>
    </div>

    <el-row :gutter="16" v-loading="loading">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in list" :key="item.id" class="mb-16px">
        <el-card shadow="hover" class="app-card">
          <div class="flex justify-between items-start mb-10px">
            <el-tag :type="item.enabled ? 'success' : 'info'">{{ item.enabled ? '已上线' : '已下线' }}</el-tag>
            <div>
              <BaseButton v-if="canUpdate" link type="primary" @click="openEdit(item)">编辑</BaseButton>
              <BaseButton v-if="canDelete" link type="danger" @click="handleDelete(item.id!)">删除</BaseButton>
            </div>
          </div>
          <div class="flex items-center gap-12px">
            <el-avatar :size="48" shape="square" :src="item.appLogo">
              {{ (item.appName || '应用').slice(0, 1) }}
            </el-avatar>
            <div class="app-meta">
              <div class="font-600 text-15px">{{ item.appName || '未命名应用' }}</div>
              <div class="text-12px text-[var(--el-text-color-secondary)] mt-4px">
                企业：{{ item.companyName || '-' }}
              </div>
              <div class="text-12px text-[var(--el-text-color-secondary)] mt-4px">
                CorpId：{{ item.corpId || '-' }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="!loading && list.length === 0" description="暂无自建应用" />

    <el-dialog v-model="dialogVisible" :title="formData.id ? '编辑应用' : '新增应用'" width="720px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="130px">
        <el-form-item label="应用名称" prop="appName">
          <el-input v-model="formData.appName" placeholder="请输入应用名称" clearable />
        </el-form-item>
        <el-form-item label="应用图片" prop="appLogo">
          <el-input v-model="formData.appLogo" placeholder="请输入图片 URL" clearable />
        </el-form-item>
        <el-form-item label="应用状态" prop="enabled">
          <el-switch v-model="formData.enabled" active-text="上线" inactive-text="下线" />
        </el-form-item>
        <el-divider />
        <el-form-item label="企业名称" prop="companyName">
          <el-input v-model="formData.companyName" placeholder="请输入企业名称" clearable />
        </el-form-item>
        <el-form-item label="企业 ID" prop="corpId">
          <el-input v-model="formData.corpId" placeholder="请输入企业 CorpId" clearable />
        </el-form-item>
        <el-form-item label="应用 AgentId" prop="agentId">
          <el-input v-model="formData.agentId" placeholder="请输入应用 AgentId" clearable />
        </el-form-item>
        <el-form-item label="应用 Secret" prop="appSecret">
          <el-input v-model="formData.appSecret" type="password" show-password placeholder="请输入应用 Secret" clearable />
        </el-form-item>
        <el-form-item label="回调 Token" prop="token">
          <el-input v-model="formData.token" placeholder="请输入回调 Token" clearable />
        </el-form-item>
        <el-form-item label="回调 EncodingAESKey" prop="encodingAesKey">
          <el-input v-model="formData.encodingAesKey" placeholder="请输入回调 EncodingAESKey" clearable />
        </el-form-item>
        <el-form-item label="通讯录 Secret" prop="contactSecret">
          <el-input v-model="formData.contactSecret" type="password" show-password placeholder="通讯录场景可填" clearable />
        </el-form-item>
        <el-form-item label="客户联系 Secret" prop="customerSecret">
          <el-input v-model="formData.customerSecret" type="password" show-password placeholder="客户联系场景可填" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <BaseButton @click="dialogVisible = false">取消</BaseButton>
        <BaseButton type="primary" :loading="saveLoading" @click="handleSave">保存</BaseButton>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import * as WeappApi from '@/api/system/weapp'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'SystemWeworkConfig' })

const message = useMessage()
const canCreate = hasPermission(['system:weapp-config:create'])
const canUpdate = hasPermission(['system:weapp-config:update'])
const canDelete = hasPermission(['system:weapp-config:delete'])

const loading = ref(false)
const saveLoading = ref(false)
const dialogVisible = ref(false)
const list = ref<WeappApi.WeappConfigVO[]>([])
const formRef = ref<FormInstance>()

const emptyForm = (): WeappApi.WeappConfigVO => ({
  companyName: '',
  appName: '',
  appLogo: '',
  corpId: '',
  agentId: '',
  appSecret: '',
  token: '',
  encodingAesKey: '',
  contactSecret: '',
  customerSecret: '',
  enabled: true
})

const formData = reactive<WeappApi.WeappConfigVO>(emptyForm())

const rules: FormRules = {
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  companyName: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  corpId: [{ required: true, message: '请输入企业 CorpId', trigger: 'blur' }],
  agentId: [{ required: true, message: '请输入应用 AgentId', trigger: 'blur' }],
  appSecret: [{ required: true, message: '请输入应用 Secret', trigger: 'blur' }]
}

const loadList = async () => {
  loading.value = true
  try {
    list.value = await WeappApi.getWeappConfigList()
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  Object.assign(formData, emptyForm(), { id: undefined })
  dialogVisible.value = true
}

const openEdit = (row: WeappApi.WeappConfigVO) => {
  Object.assign(formData, emptyForm(), row)
  dialogVisible.value = true
}

const handleSave = async () => {
  const form = formRef.value
  if (!form) return
  await form.validate()
  saveLoading.value = true
  try {
    if (formData.id) {
      await WeappApi.updateWeappConfig({ ...formData })
    } else {
      await WeappApi.createWeappConfig({ ...formData })
    }
    message.success('保存成功')
    dialogVisible.value = false
    await loadList()
  } finally {
    saveLoading.value = false
  }
}

const handleDelete = async (id: number) => {
  await message.delConfirm()
  await WeappApi.deleteWeappConfig(id)
  message.success('删除成功')
  await loadList()
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.app-card {
  border-radius: 10px;
}

.app-meta {
  min-width: 0;
}
</style>
