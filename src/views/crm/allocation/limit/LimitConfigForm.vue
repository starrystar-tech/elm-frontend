<template>
    <Dialog v-model="dialogVisible" :title="title" width="760px">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="170px">
            <!-- <el-form-item label="启用状态" prop="enabled">
        <el-switch v-model="formData.enabled" active-text="启用" inactive-text="停用" />
      </el-form-item> -->
            <el-form-item label="总客户上限" prop="totalCustomerLimit">
                <el-input-number v-model="formData.totalCustomerLimit" :min="0" :max="999999" />
            </el-form-item>
            <el-form-item label="首咨客户上限" prop="firstConsultCustomerLimit">
                <el-input-number
                    v-model="formData.firstConsultCustomerLimit"
                    :min="0"
                    :max="999999"
                />
            </el-form-item>
            <el-form-item label="复购客户上限" prop="repurchaseCustomerLimit">
                <el-input-number
                    v-model="formData.repurchaseCustomerLimit"
                    :min="0"
                    :max="999999"
                />
            </el-form-item>
            <el-form-item label="每日首咨领取上限" prop="dailyFirstConsultReceiveLimit">
                <el-input-number
                    v-model="formData.dailyFirstConsultReceiveLimit"
                    :min="0"
                    :max="999999"
                />
            </el-form-item>
            <el-form-item label="每日复购领取上限" prop="dailyRepurchaseReceiveLimit">
                <el-input-number
                    v-model="formData.dailyRepurchaseReceiveLimit"
                    :min="0"
                    :max="999999"
                />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
                <el-input v-model="formData.remark" type="textarea" :rows="2" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button type="primary" :loading="loading" @click="handleSubmit">确 定</el-button>
            <el-button @click="dialogVisible = false">取 消</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

defineOptions({ name: 'CrmAllocationLimitForm' })

const props = defineProps<{
    modelValue: boolean
    title: string
    loading?: boolean
    formData: Recordable
    rules?: Recordable
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit'): void
}>()

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value)
})

const formRef = ref()

const handleSubmit = async () => {
    const valid = await formRef.value?.validate?.()
    if (!valid) return
    emit('submit')
}
</script>
