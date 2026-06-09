<template>
    <Dialog v-model="dialogVisible" title="修改订单归属人" width="520px" append-to-body>
        <el-form
            ref="formRef"
            v-loading="formLoading"
            :model="formData"
            :rules="formRules"
            label-width="100px"
        >
            <el-form-item label="订单归属人" prop="ownerUserId">
                <el-input
                    v-model="ownerUserName"
                    readonly
                    clearable
                    placeholder="请选择订单归属人"
                    @click="openUserSelect"
                    @clear="clearOwner"
                >
                    <template #suffix>
                        <Icon icon="ep:search" />
                    </template>
                </el-input>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="dialogVisible = false">取 消</el-button>
        </template>
    </Dialog>

    <UserSelectForm ref="userSelectFormRef" @confirm="handleUserSelectConfirm" />
</template>

<script setup lang="ts">
import type { UserVO } from '@/api/system/user'
import UserSelectForm from '@/components/UserSelectForm/index.vue'

defineOptions({ name: 'BatchUpdateOwnerDialog' })

const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const userSelectFormRef = ref<InstanceType<typeof UserSelectForm>>()
const ownerUserName = ref('')
const formData = ref<{ ownerUserId?: number }>({
    ownerUserId: undefined
})

const formRules = reactive({
    ownerUserId: [{ required: true, message: '订单归属人不能为空', trigger: 'change' }]
})

const emit = defineEmits<{
    confirm: [ownerUserId: number]
}>()

const open = () => {
    dialogVisible.value = true
    resetForm()
}

const openUserSelect = () => {
    const selectedList = formData.value.ownerUserId
        ? [{ id: formData.value.ownerUserId, nickname: ownerUserName.value }]
        : []
    userSelectFormRef.value?.open(0, selectedList, { title: '选择订单归属人', multiple: false })
}

const handleUserSelectConfirm = (_id: any, userList: UserVO[]) => {
    const user = userList?.[0]
    formData.value.ownerUserId = user?.id
    ownerUserName.value = user?.nickname || user?.username || ''
}

const clearOwner = () => {
    formData.value.ownerUserId = undefined
    ownerUserName.value = ''
}

const submitForm = async () => {
    await formRef.value.validate()
    formLoading.value = true
    try {
        emit('confirm', formData.value.ownerUserId!)
        dialogVisible.value = false
    } finally {
        formLoading.value = false
    }
}

const resetForm = () => {
    formData.value = {
        ownerUserId: undefined
    }
    ownerUserName.value = ''
    formRef.value?.resetFields()
}

defineExpose({ open })
</script>
