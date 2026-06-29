<template>
    <Dialog v-model="dialogVisible" title="订单支付" width="560px" append-to-body>
        <el-form
            ref="formRef"
            v-loading="loading"
            :model="formData"
            :rules="formRules"
            label-width="120px"
        >
            <el-form-item label="支付渠道" prop="payMethod">
                <el-select
                    v-model="formData.payMethod"
                    placeholder="请选择支付渠道"
                    class="!w-full"
                >
                    <el-option
                        v-for="item in PAY_METHOD_OPTIONS"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="支付金额（元）" prop="payAmount">
                <el-input v-model="formData.payAmount" placeholder="请输入支付金额" clearable />
            </el-form-item>
            <el-form-item label="支付截图">
                <UploadImg
                    v-model="formData.payProofUrl"
                    :drag="false"
                    :show-btn-text="false"
                    directory="crm_order_pay_proof"
                    width="96px"
                    height="96px"
                />
            </el-form-item>
            <el-form-item label="支付备注">
                <el-input
                    v-model="formData.remark"
                    type="textarea"
                    :rows="3"
                    maxlength="255"
                    show-word-limit
                    placeholder="请输入支付备注"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button :loading="loading" type="primary" @click="submitForm">确 定</el-button>
            <el-button :disabled="loading" @click="dialogVisible = false">取 消</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { UploadImg } from '@/components/UploadFile'
import * as OrderApi from '@/api/crm/order'
import { PAY_METHOD_OPTIONS } from '../utils'

defineOptions({ name: 'OrderPayDialog' })

const emit = defineEmits<{
    success: []
}>()

const dialogVisible = ref(false)
const loading = ref(false)
const formRef = ref()
const message = useMessage()
const formData = ref({
    orderId: undefined as number | undefined,
    payMethod: '微信支付',
    payAmount: '',
    payProofUrl: '',
    remark: ''
})

const validatePayAmount = (_rule: any, value: string, callback: (error?: Error) => void) => {
    const amountText = String(value || '').trim()
    if (!amountText) {
        callback(new Error('请输入支付金额'))
        return
    }
    if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(amountText)) {
        callback(new Error('请输入正确金额'))
        return
    }
    if (Number(amountText) <= 0) {
        callback(new Error('支付金额必须大于 0'))
        return
    }
    callback()
}

const formRules = reactive({
    payMethod: [{ required: true, message: '请选择支付渠道', trigger: 'change' }],
    payAmount: [{ validator: validatePayAmount, trigger: 'blur' }]
})

const resetForm = () => {
    formData.value = {
        orderId: undefined,
        payMethod: '微信支付',
        payAmount: '',
        payProofUrl: '',
        remark: ''
    }
    formRef.value?.resetFields()
}

const open = (orderId: number, defaultAmount?: string) => {
    resetForm()
    dialogVisible.value = true
    formData.value.orderId = orderId
    formData.value.payAmount = defaultAmount || ''
}

const submitForm = async () => {
    await formRef.value?.validate()
    loading.value = true
    try {
        await OrderApi.payOrder({
            orderId: formData.value.orderId!,
            payAmount: Math.round(Number(formData.value.payAmount) * 100),
            payMethod: formData.value.payMethod,
            payProofUrl: formData.value.payProofUrl || '',
            remark: formData.value.remark?.trim() || undefined
        })
        message.success('支付记录已生成，待财务确认')
        dialogVisible.value = false
        emit('success')
    } finally {
        loading.value = false
    }
}

defineExpose({ open })
</script>
