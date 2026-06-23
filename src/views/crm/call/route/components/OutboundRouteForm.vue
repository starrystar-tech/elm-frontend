<template>
    <Dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="520px"
        append-to-body
        :modal="false"
    >
        <el-form
            ref="formRef"
            v-loading="formLoading"
            :model="formData"
            :rules="formRules"
            label-width="100px"
        >
            <el-form-item label="线路名称" prop="name">
                <el-input
                    v-model="formData.name"
                    maxlength="30"
                    show-word-limit
                    clearable
                    placeholder="请输入线路名称"
                />
            </el-form-item>
            <el-form-item label="号码前缀" prop="numberPrefix">
                <el-input
                    v-model="formData.numberPrefix"
                    maxlength="20"
                    clearable
                    placeholder="请输入号码前缀，如 0755"
                />
            </el-form-item>
            <el-form-item label="状态" prop="status">
                <el-radio-group v-model="formData.status">
                    <el-radio :value="0">启用</el-radio>
                    <el-radio :value="1">禁用</el-radio>
                </el-radio-group>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button type="primary" :loading="formLoading" @click="submitForm">确 定</el-button>
            <el-button @click="dialogVisible = false">取 消</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import * as OutboundRouteApi from '@/api/system/call/router'

defineOptions({ name: 'OutboundRouteForm' })

const emit = defineEmits(['success'])

const message = useMessage()
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formType = ref<'create' | 'update'>('create')
const formLoading = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive<OutboundRouteApi.OutboundRouteVO>({
    id: undefined,
    name: '',
    numberPrefix: '',
    status: 0
})

const formRules = reactive<FormRules>({
    name: [
        { required: true, message: '线路名称不能为空', trigger: 'blur' },
        { max: 30, message: '线路名称不能超过30个字符', trigger: 'blur' }
    ],
    numberPrefix: [
        { required: true, message: '号码前缀不能为空', trigger: 'blur' },
        { pattern: /^\d+$/, message: '号码前缀只能输入数字', trigger: 'blur' },
        { max: 20, message: '号码前缀不能超过20位', trigger: 'blur' }
    ],
    status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})

const resetForm = () => {
    formData.id = undefined
    formData.name = ''
    formData.numberPrefix = ''
    formData.status = 0
    formRef.value?.resetFields()
}

const open = async (type: 'create' | 'update', id?: number) => {
    dialogVisible.value = true
    dialogTitle.value = type === 'create' ? '新增线路' : '编辑线路'
    formType.value = type
    resetForm()
    if (type === 'update' && id) {
        formLoading.value = true
        try {
            const data = await OutboundRouteApi.getOutboundRoute(id)
            formData.id = data.id
            formData.name = data.name
            formData.numberPrefix = data.numberPrefix
            formData.status = data.status
        } finally {
            formLoading.value = false
        }
    }
}

const submitForm = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return
    formLoading.value = true
    try {
        const payload = {
            id: formData.id,
            name: formData.name.trim(),
            numberPrefix: formData.numberPrefix.trim(),
            status: formData.status
        }
        if (formType.value === 'create') {
            await OutboundRouteApi.createOutboundRoute(payload)
            message.success('新增成功')
        } else {
            await OutboundRouteApi.updateOutboundRoute(payload)
            message.success('保存成功')
        }
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}

defineExpose({ open })
</script>
