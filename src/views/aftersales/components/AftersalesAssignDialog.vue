<template>
    <Dialog v-model="dialogVisible" title="分配处理人" width="420px" append-to-body>
        <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
            <el-form-item label="处理人" prop="handlerUserId">
                <el-input
                    v-model="handlerUserName"
                    readonly
                    clearable
                    placeholder="请选择处理人"
                    @click="openUserSelect"
                    @clear="clearHandler"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <BaseButton type="primary" :loading="formLoading" @click="submitForm">确 定</BaseButton>
            <BaseButton @click="dialogVisible = false">取 消</BaseButton>
        </template>
    </Dialog>
    <UserSelectForm ref="userSelectFormRef" @confirm="handleUserSelectConfirm" />
</template>

<script setup lang="ts">
import { BaseButton } from '@/components/Button'
import UserSelectForm from '@/components/UserSelectForm/index.vue'
import * as AftersalesApi from '@/api/crm/aftersales'
import type { UserVO } from '@/api/system/user'

defineOptions({ name: 'AftersalesAssignDialog' })

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const userSelectFormRef = ref<InstanceType<typeof UserSelectForm>>()
const ids = ref<number[]>([])
const handlerUserName = ref('')
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
    handlerUserName.value = ''
    dialogVisible.value = true
}
defineExpose({ open })

const openUserSelect = () => {
    const selectedList = formData.value.handlerUserId
        ? [{ id: formData.value.handlerUserId, nickname: handlerUserName.value }]
        : []
    userSelectFormRef.value?.open(0, selectedList, { title: '选择处理人', multiple: false })
}

const handleUserSelectConfirm = (_id: any, userList: UserVO[]) => {
    const user = userList?.[0]
    formData.value.handlerUserId = user?.id
    handlerUserName.value = user?.nickname || user?.username || ''
}

const clearHandler = () => {
    formData.value.handlerUserId = undefined
    handlerUserName.value = ''
}

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
