<template>
    <Dialog v-model="dialogVisible" title="投诉标签导入" width="560px">
        <div class="mb-12px flex items-start justify-between gap-12px text-13px line-height-22px">
            <span class="text-[var(--el-text-color-secondary)]">
                导入模板需包含两列：客户编号、投诉标签名称；多个投诉标签请使用英文逗号分隔。
            </span>
            <el-link
                class="w-100px"
                :href="COMPLAINT_TAG_IMPORT_TEMPLATE_URL"
                target="_blank"
                type="primary"
            >
                下载模板
            </el-link>
        </div>
        <el-upload
            v-model:file-list="fileList"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls,.csv"
            action="none"
            drag
        >
            <Icon icon="ep:upload" />
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>

        <template v-if="importResult" #footer>
            <div class="w-full text-left">
                <div class="mb-8px text-13px">
                    成功 {{ importResult.successCustomerIds?.length || 0 }} 条，失败
                    {{ Object.keys(importResult.failureCustomerIds || {}).length }} 条
                </div>
                <div
                    v-if="importResult.successCustomerIds?.length"
                    class="mb-8px max-h-120px overflow-auto rounded-4px bg-[var(--el-fill-color-light)] p-8px text-12px"
                >
                    成功客户编号：{{ importResult.successCustomerIds.join('，') }}
                </div>
                <div
                    v-if="Object.keys(importResult.failureCustomerIds || {}).length"
                    class="mb-12px max-h-180px overflow-auto rounded-4px bg-[var(--el-fill-color-light)] p-8px text-12px"
                >
                    <div
                        v-for="(reason, customerId) in importResult.failureCustomerIds"
                        :key="customerId"
                        class="mb-4px"
                    >
                        {{ customerId }}：{{ reason }}
                    </div>
                </div>
                <div class="flex justify-end gap-8px">
                    <el-button @click="dialogVisible = false">关闭</el-button>
                    <el-button type="primary" :loading="loading" @click="handleImport">
                        重新导入
                    </el-button>
                </div>
            </div>
        </template>
        <template v-else #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="loading" @click="handleImport">开始导入</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import type { UploadUserFile } from 'element-plus'
import * as ClueApi from '@/api/crm/clue'

defineOptions({ name: 'ComplaintTagImportDialog' })

const COMPLAINT_TAG_IMPORT_TEMPLATE_URL =
    'https://file.bgwa.cn/bgwa/20260603/%E6%8A%95%E8%AF%89%E6%A0%87%E7%AD%BE%E5%AF%BC%E5%85%A5%E6%A8%A1%E6%9D%BF_1780474034873.xlsx'

const message = useMessage()
const dialogVisible = ref(false)
const loading = ref(false)
const fileList = ref<UploadUserFile[]>([])
const importResult = ref<ClueApi.ClueComplaintTagImportRespVO | null>(null)

const emit = defineEmits(['success'])

const open = () => {
    dialogVisible.value = true
    fileList.value = []
    importResult.value = null
}

const handleImport = async () => {
    if (!fileList.value.length) {
        message.warning('请先选择导入文件')
        return
    }
    loading.value = true
    try {
        const formData = new FormData()
        formData.append('file', fileList.value[0].raw as Blob)
        importResult.value = await ClueApi.importComplaintTags(formData)
        message.success('投诉标签导入完成')
        emit('success')
    } finally {
        loading.value = false
    }
}

defineExpose({ open })
</script>
