<template>
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="720px">
        <el-form
            ref="formRef"
            v-loading="formLoading"
            :model="formData"
            :rules="formRules"
            label-width="130px"
        >
            <div class="form-section-title">应用信息配置</div>
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
                <el-input
                    v-model="formData.appSecret"
                    type="password"
                    show-password
                    placeholder="请输入应用 Secret"
                    clearable
                />
            </el-form-item>
            <el-form-item label="Token" prop="token">
                <el-input v-model="formData.token" placeholder="请输入回调 Token" clearable />
            </el-form-item>
            <el-form-item label="EncodingAESKey" prop="encodingAesKey">
                <el-input
                    v-model="formData.encodingAesKey"
                    placeholder="请输入回调 EncodingAESKey"
                    clearable
                />
            </el-form-item>
            <el-form-item label="回调唯一编码" prop="num">
                <el-input v-model="formData.num" placeholder="请输入回调唯一编码" clearable>
                    <template #append>
                        <el-button @click="formData.num = generateCallbackCode()">随机生成</el-button>
                    </template>
                </el-input>
            </el-form-item>
            <el-divider />
            <div class="form-section-title">企业会话存档配置</div>
            <el-form-item label="privateKey" prop="archivePrivateKey">
                <el-input
                    v-model="formData.archivePrivateKey"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入 privateKey"
                    clearable
                />
            </el-form-item>
            <el-form-item label="version" prop="archiveVersion">
                <el-input v-model="formData.archiveVersion" placeholder="请输入 version" clearable />
            </el-form-item>
            <el-form-item label="secret" prop="archiveSecret">
                <el-input
                    v-model="formData.archiveSecret"
                    type="password"
                    show-password
                    placeholder="请输入 secret"
                    clearable
                />
            </el-form-item>
            <el-form-item label="publicKey" prop="archivePublicKey">
                <el-input
                    v-model="formData.archivePublicKey"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入 publicKey"
                    clearable
                />
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

const generateCallbackCode = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID().replace(/-/g, '')
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

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
    num: '',
    contactSecret: '',
    customerSecret: '',
    archivePrivateKey: '',
    archiveVersion: '',
    archiveSecret: '',
    archivePublicKey: '',
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
        num: generateCallbackCode(),
        contactSecret: '',
        customerSecret: '',
        archivePrivateKey: '',
        archiveVersion: '',
        archiveSecret: '',
        archivePublicKey: '',
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

<style scoped>
.form-section-title {
    padding: 10px 12px;
    margin-bottom: 14px;
    background: var(--el-fill-color-lighter);
    border-left: 4px solid var(--el-color-primary);
    border-radius: 4px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}
</style>
