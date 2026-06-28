<template>
    <Dialog v-model="dialogVisible" title="支付凭证" width="520px" append-to-body>
        <el-form v-loading="loading" label-width="110px">
            <el-form-item label="支付凭证">
                <UploadImg
                    v-model="payProofUrl"
                    :drag="false"
                    :show-btn-text="false"
                    directory="crm_order_pay_proof"
                    width="96px"
                    height="96px"
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

defineOptions({ name: 'PayProofDialog' })

const emit = defineEmits<{
    success: []
}>()

const dialogVisible = ref(false)
const loading = ref(false)
const message = useMessage()
const recordId = ref<number>()
const payProofUrl = ref('')

const open = (row: OrderApi.OrderPayRecordRespVO) => {
    dialogVisible.value = true
    recordId.value = row.id
    payProofUrl.value = row.payProofUrl || ''
}

const submitForm = async () => {
    loading.value = true
    try {
        await OrderApi.updatePayRecordProof({
            id: recordId.value!,
            payProofUrl: payProofUrl.value || ''
        })
        message.success('支付截图已更新')
        dialogVisible.value = false
        emit('success')
    } finally {
        loading.value = false
    }
}

defineExpose({ open })
</script>
