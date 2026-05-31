<template>
    <Dialog v-model="dialogVisible" title="批量设置班主任" width="420px">
        <el-form
            ref="formRef"
            v-loading="formLoading"
            :model="formData"
            :rules="formRules"
            label-width="100px"
        >
            <el-form-item label="班主任" prop="headteacherUserId">
                <HeadteacherSelect v-model="formData.headteacherUserId" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="dialogVisible = false">取 消</el-button>
        </template>
    </Dialog>
</template>

<script lang="ts" setup>
import * as ClueApi from '@/api/crm/clue'
import HeadteacherSelect from '@/components/HeadteacherSelect.vue'

const emit = defineEmits(['success'])
const message = useMessage()

const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const clueIds = ref<number[]>([])
const formData = ref({
    headteacherUserId: undefined as number | undefined
})
const formRules = reactive({
    headteacherUserId: [{ required: true, message: '请选择班主任', trigger: 'change' }]
})

const open = async (ids: number[]) => {
    dialogVisible.value = true
    resetForm()
    clueIds.value = ids
}

const submitForm = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return
    formLoading.value = true
    try {
        await ClueApi.batchUpdateHeadteacher({
            clueIds: clueIds.value,
            headteacherUserId: formData.value.headteacherUserId!
        })
        message.success('设置班主任成功')
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}

const resetForm = () => {
    clueIds.value = []
    formData.value = {
        headteacherUserId: undefined
    }
    formRef.value?.resetFields()
}

defineExpose({ open })
</script>
