<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="720px">
    <el-form ref="formRef" v-loading="formLoading" :model="formData" :rules="formRules" label-width="130px">
      <el-form-item label="应用名称" prop="appName">
        <el-input v-model="formData.appName" placeholder="请输入应用名称" clearable />
      </el-form-item>
      <el-form-item label="应用图片" prop="appLogo">
        <UploadImg v-model="formData.appLogo" :limit="1" height="80px" width="80px" />
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
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import type { FormRules } from 'element-plus'
import * as WeappApi from '@/api/system/weapp'

defineOptions({ name: 'SystemWeworkForm' })

const message = useMessage()
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formRef = ref()

const formData = ref<WeappApi.WeappConfigVO>({
  id: undefined,
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

const formRules = reactive<FormRules>({
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  companyName: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  corpId: [{ required: true, message: '请输入企业 CorpId', trigger: 'blur' }],
  agentId: [{ required: true, message: '请输入应用 AgentId', trigger: 'blur' }],
  appSecret: [{ required: true, message: '请输入应用 Secret', trigger: 'blur' }]
})

const resetForm = () => {
  formData.value = {
    id: undefined,
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
  }
  formRef.value?.resetFields()
}

const open = async (type: string, row?: WeappApi.WeappConfigVO) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增应用' : '编辑应用'
  formType.value = type
  resetForm()
  if (row) {
    formData.value = { ...formData.value, ...row }
  }
}
defineExpose({ open })

const emit = defineEmits(['success'])
const submitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await WeappApi.createWeappConfig(formData.value)
      message.success('创建成功')
    } else {
      await WeappApi.updateWeappConfig(formData.value)
      message.success('更新成功')
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
