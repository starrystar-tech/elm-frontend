<template>
    <Dialog v-model="dialogVisible" title="处理工单" width="520px" append-to-body>
        <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
            <el-form-item label="处理状态" prop="status">
                <el-select v-model="formData.status" class="!w-full">
                    <el-option
                        v-for="item in statusOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="处理结果" prop="processResult">
                <el-input v-model="formData.processResult" type="textarea" :rows="4" />
            </el-form-item>
        </el-form>
        <template #footer>
            <BaseButton type="primary" :loading="formLoading" @click="submitForm">确 定</BaseButton>
            <BaseButton @click="dialogVisible = false">取 消</BaseButton>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { BaseButton } from '@/components/Button'
import * as AftersalesApi from '@/api/crm/aftersales'

defineOptions({ name: 'AftersalesProcessDialog' })

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const formData = ref<AftersalesApi.AftersalesProcessReqVO>({
    id: 0,
    status: 20,
    processResult: ''
})
const statusOptions = [
    { label: '已完成', value: 20 },
    { label: '已驳回', value: 30 }
]
const formRules = reactive({
    status: [{ required: true, message: '请选择处理状态', trigger: 'change' }],
    processResult: [{ required: true, message: '请输入处理结果', trigger: 'blur' }]
})

const emit = defineEmits(['success'])

const open = (row: AftersalesApi.AftersalesRespVO) => {
    formData.value = {
        id: row.id,
        status: 20,
        processResult: row.processResult || ''
    }
    dialogVisible.value = true
}
defineExpose({ open })

const submitForm = async () => {
    await formRef.value.validate()
    formLoading.value = true
    try {
        await AftersalesApi.processAftersales(formData.value)
        message.success('处理成功')
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}
</script>
