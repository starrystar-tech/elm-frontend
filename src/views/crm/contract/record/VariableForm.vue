<template>
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
        <el-form
            ref="formRef"
            v-loading="formLoading"
            :model="formData"
            :rules="formRules"
            label-width="100px"
        >
            <el-form-item label="合同变量" prop="variableName">
                <el-input
                    v-model="formData.variableName"
                    placeholder="请输入合同变量名"
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
import * as VariableApi from '@/api/system/contract/variable'

defineOptions({ name: 'VariableForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref<'create' | 'update'>('create')
const formRef = ref()

const formData = ref<VariableApi.ContractVariableVO>({
    id: undefined,
    variableName: ''
})

const formRules = reactive({
    variableName: [{ required: true, message: '合同变量名不能为空', trigger: 'blur' }]
})

const resetForm = () => {
    formData.value = {
        id: undefined,
        variableName: ''
    }
    formRef.value?.resetFields()
}

const open = async (type: 'create' | 'update', id?: number) => {
    dialogVisible.value = true
    dialogTitle.value = t('action.' + type)
    formType.value = type
    resetForm()
    if (type === 'update' && id) {
        formLoading.value = true
        try {
            formData.value = await VariableApi.getContractVariable(id)
        } finally {
            formLoading.value = false
        }
    }
}

const emit = defineEmits(['success'])

const submitForm = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return
    formLoading.value = true
    try {
        if (formType.value === 'create') {
            await VariableApi.createContractVariable(formData.value)
            message.success(t('common.createSuccess'))
        } else {
            await VariableApi.updateContractVariable(formData.value)
            message.success(t('common.updateSuccess'))
        }
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}

defineExpose({ open })
</script>
