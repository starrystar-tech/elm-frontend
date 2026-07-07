<template>
    <Dialog v-model="dialogVisible" title="批量打投诉标签" width="520px" append-to-body>
        <el-form ref="formRef" :model="formData" label-width="100px">
            <el-form-item
                label="投诉标签"
                prop="complaintTagIds"
                :rules="[
                    {
                        type: 'array',
                        required: true,
                        min: 1,
                        message: '请选择投诉标签',
                        trigger: 'change'
                    }
                ]"
            >
                <el-select
                    v-model="formData.complaintTagIds"
                    multiple
                    filterable
                    placeholder="请选择投诉标签"
                    class="!w-full"
                >
                    <el-option
                        v-for="item in complaintTagOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
            <!-- <div class="text-12px text-[var(--el-text-color-secondary)]">
                增量打标，不会覆盖已有投诉标签关系
            </div> -->
        </el-form>
        <template #footer>
            <BaseButton type="primary" :loading="formLoading" @click="submitForm">确 定</BaseButton>
            <BaseButton @click="dialogVisible = false">取 消</BaseButton>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { BaseButton } from '@/components/Button'
import * as ClueApi from '@/api/crm/clue'
import * as ComplaintTagApi from '@/api/system/complaintTag'

defineOptions({ name: 'AftersalesComplaintTagDialog' })

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const clueIds = ref<number[]>([])
const complaintTagOptions = ref<{ label: string; value: number }[]>([])
const formData = reactive({
    complaintTagIds: [] as number[]
})

const emit = defineEmits(['success'])

const loadComplaintTagOptions = async () => {
    const complaintTags = await ComplaintTagApi.getComplaintTagSimpleList()
    complaintTagOptions.value = (complaintTags || []).map((item) => ({
        label: item.name,
        value: Number(item.id)
    }))
}

const open = (selectedClueIds: number[]) => {
    clueIds.value = Array.from(
        new Set(
            (selectedClueIds || [])
                .map((item) => Number(item))
                .filter((item) => Number.isFinite(item) && item > 0)
        )
    )
    formData.complaintTagIds = []
    dialogVisible.value = true
    void loadComplaintTagOptions()
    nextTick(() => formRef.value?.clearValidate?.())
}
defineExpose({ open })

const submitForm = async () => {
    if (!clueIds.value.length) {
        message.warning('所选工单未关联客户，无法打投诉标签')
        return
    }
    await formRef.value.validate()
    formLoading.value = true
    try {
        await ClueApi.batchAppendComplaintTags({
            clueIds: clueIds.value,
            complaintTagIds: formData.complaintTagIds
        })
        message.success('批量打投诉标签成功')
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}
</script>
