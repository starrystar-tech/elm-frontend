<template>
    <Dialog v-model="dialogVisible" title="发送短信" width="620px">
        <el-form label-width="100px">
            <el-form-item label="发送对象">
                <span>{{ clueIds.length }} 条线索</span>
            </el-form-item>
            <el-form-item label="短信模板" required>
                <el-select
                    v-model="selectedTemplateId"
                    filterable
                    clearable
                    placeholder="请选择短信模板"
                    style="width: 100%"
                >
                    <el-option
                        v-for="item in templateOptions"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="模板内容">
                <div class="w-full rounded-4px bg-[var(--el-fill-color-light)] p-12px text-13px line-height-22px">
                    {{ selectedTemplate?.content || '请选择短信模板后预览内容' }}
                </div>
            </el-form-item>
            <el-form-item label="模板参数">
                <div v-if="selectedTemplate?.params?.length" class="flex flex-wrap gap-8px">
                    <el-tag v-for="param in selectedTemplate.params" :key="param" size="small">
                        {{ param }}
                    </el-tag>
                </div>
                <span v-else class="text-[var(--el-text-color-secondary)]">无模板参数</span>
            </el-form-item>
        </el-form>
        <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
            发送结果说明：提交后由后端异步发送，本页面仅提示“已提交发送”。
        </div>
        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="loading" @click="handleSubmit">发送</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import * as ClueApi from '@/api/crm/clue'
import * as SmsTemplateApi from '@/api/system/sms/smsTemplate'

defineOptions({ name: 'ClueSmsDialog' })

interface NonSystemNotifySmsTemplateVO {
    id: number
    code: string
    name: string
    content: string
    params?: string[]
}

const message = useMessage()
const dialogVisible = ref(false)
const loading = ref(false)
const clueIds = ref<number[]>([])
const selectedTemplateId = ref<number>()
const templateOptions = ref<NonSystemNotifySmsTemplateVO[]>([])

const selectedTemplate = computed(() =>
    templateOptions.value.find((item) => item.id === selectedTemplateId.value)
)

const open = async (ids: number[]) => {
    clueIds.value = ids
    selectedTemplateId.value = undefined
    dialogVisible.value = true
    templateOptions.value = await SmsTemplateApi.getNonSystemNotifySmsTemplateList()
}

const emit = defineEmits(['success'])

const handleSubmit = async () => {
    if (!clueIds.value.length) {
        message.warning('请选择线索')
        return
    }
    if (!selectedTemplateId.value) {
        message.warning('请选择短信模板')
        return
    }
    loading.value = true
    try {
        await ClueApi.batchSendSms({
            clueIds: clueIds.value,
            templateId: selectedTemplateId.value
        })
        message.success('短信发送已提交')
        dialogVisible.value = false
        emit('success')
    } finally {
        loading.value = false
    }
}

defineExpose({ open })
</script>
