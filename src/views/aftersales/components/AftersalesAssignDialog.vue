<template>
    <Dialog v-model="dialogVisible" title="分配处理人" width="420px" append-to-body>
        <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
            <el-form-item label="班主任" prop="handlerUserId">
                <HeadteacherSelect v-model="formData.handlerUserId" />
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
import HeadteacherSelect from '@/components/HeadteacherSelect.vue'

defineOptions({ name: 'AftersalesAssignDialog' })

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const ids = ref<number[]>([])
const formData = ref({
    handlerUserId: undefined as number | undefined
})
const formRules = reactive({
    handlerUserId: [{ required: true, message: '请选择处理人', trigger: 'change' }]
})

const emit = defineEmits(['success'])

const open = (selectedIds: number[]) => {
    ids.value = selectedIds
    formData.value.handlerUserId = undefined
    dialogVisible.value = true
}
defineExpose({ open })

const submitForm = async () => {
    await formRef.value.validate()
    formLoading.value = true
    try {
        await AftersalesApi.assignAftersales({
            ids: ids.value,
            handlerUserId: formData.value.handlerUserId!
        })
        message.success('分配成功')
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}
</script>
