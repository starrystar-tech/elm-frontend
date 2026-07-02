<template>
    <Dialog v-model="dialogVisible" title="处理工单" width="520px" append-to-body>
        <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
            <el-form-item label="处理结果" prop="aftersalesResult">
                <el-select v-model="formData.aftersalesResult" class="!w-full">
                    <el-option
                        v-for="item in AFTERSALES_RESULT_OPTIONS"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item v-if="formData.aftersalesResult === 3" label="退款金额" prop="refundAmount">
                <el-input-number
                    v-model="formData.refundAmount"
                    :min="0"
                    :precision="2"
                    controls-position="right"
                    class="!w-full"
                />
            </el-form-item>
            <el-form-item v-if="formData.aftersalesResult === 2" label="挽单金额" prop="retainAmount">
                <el-input-number
                    v-model="formData.retainAmount"
                    :min="0"
                    :precision="2"
                    controls-position="right"
                    class="!w-full"
                />
            </el-form-item>
            <el-form-item label="备注" prop="processResult">
                <el-input
                    v-model="formData.processResult"
                    type="textarea"
                    :rows="4"
                    maxlength="500"
                    show-word-limit
                    placeholder="请输入处理备注"
                />
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
import { AFTERSALES_RESULT_OPTIONS } from '../config'

defineOptions({ name: 'AftersalesProcessDialog' })

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const formData = ref<AftersalesApi.AftersalesProcessReqVO>({
    id: 0,
    aftersalesResult: undefined,
    processResult: '',
    refundAmount: undefined,
    retainAmount: undefined
})
const formRules = reactive({
    aftersalesResult: [{ required: true, message: '请选择处理结果', trigger: 'change' }],
    processResult: [{ max: 500, message: '备注长度不能超过 500 个字符', trigger: 'blur' }]
})

const emit = defineEmits(['success'])

const open = (row: AftersalesApi.AftersalesRespVO) => {
    formData.value = {
        id: row.id,
        aftersalesResult: row.aftersalesResult && row.aftersalesResult > 0 ? row.aftersalesResult : undefined,
        processResult: row.processResult || '',
        refundAmount: row.refundAmount,
        retainAmount: row.retainAmount
    }
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate?.())
}
defineExpose({ open })

const submitForm = async () => {
    await formRef.value.validate()
    formLoading.value = true
    try {
        await AftersalesApi.processAftersales({
            id: formData.value.id,
            aftersalesResult: formData.value.aftersalesResult,
            processResult: formData.value.processResult?.trim() || undefined,
            refundAmount: formData.value.aftersalesResult === 3 ? formData.value.refundAmount || 0 : undefined,
            retainAmount: formData.value.aftersalesResult === 2 ? formData.value.retainAmount || 0 : undefined
        })
        message.success('处理成功')
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}
</script>
