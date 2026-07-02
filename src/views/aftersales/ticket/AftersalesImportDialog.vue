<template>
    <Dialog v-model="dialogVisible" title="批量导入工单" width="560px" append-to-body>
        <div class="mb-12px flex items-start justify-between gap-12px text-13px line-height-22px">
            <span class="text-[var(--el-text-color-secondary)]">
                模板字段：订单编号、工单类型、优先级、申请原因、补充备注。支持 `.xlsx`、`.xls`。
            </span>
            <el-button link type="primary" :loading="downloadLoading" @click="downloadTemplate">
                下载模板
            </el-button>
        </div>
        <el-upload
            v-model:file-list="fileList"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            action="none"
            drag
        >
            <Icon icon="ep:upload" />
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>

        <template v-if="importResult" #footer>
            <div class="w-full text-left">
                <div class="mb-8px text-13px">
                    成功 {{ importResult.successOrderNos?.length || 0 }} 条，失败
                    {{ Object.keys(importResult.failureOrderNos || {}).length }} 条
                </div>
                <div
                    v-if="importResult.successOrderNos?.length"
                    class="mb-8px max-h-120px overflow-auto rounded-4px bg-[var(--el-fill-color-light)] p-8px text-12px"
                >
                    成功订单编号：{{ importResult.successOrderNos.join('，') }}
                </div>
                <div
                    v-if="Object.keys(importResult.failureOrderNos || {}).length"
                    class="mb-12px max-h-180px overflow-auto rounded-4px bg-[var(--el-fill-color-light)] p-8px text-12px"
                >
                    <div
                        v-for="(reason, orderNo) in importResult.failureOrderNos"
                        :key="orderNo"
                        class="mb-4px"
                    >
                        {{ orderNo }}：{{ reason }}
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
import * as AftersalesApi from '@/api/crm/aftersales'
import download from '@/utils/download'

defineOptions({ name: 'AftersalesImportDialog' })

const message = useMessage()
const dialogVisible = ref(false)
const loading = ref(false)
const downloadLoading = ref(false)
const fileList = ref<UploadUserFile[]>([])
const importResult = ref<AftersalesApi.AftersalesImportRespVO | null>(null)

const emit = defineEmits(['success'])

const open = () => {
    dialogVisible.value = true
    fileList.value = []
    importResult.value = null
}

const downloadTemplate = async () => {
    downloadLoading.value = true
    try {
        const res = await AftersalesApi.downloadAftersalesImportTemplate()
        download.excel(res, '售后工单导入模板.xlsx')
    } finally {
        downloadLoading.value = false
    }
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
        importResult.value = (await AftersalesApi.importAftersales(formData)).data
        message.success('工单导入完成')
        emit('success')
    } finally {
        loading.value = false
    }
}

defineExpose({ open })
</script>
