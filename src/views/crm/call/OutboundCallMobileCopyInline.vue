<template>
    <span class="inline-flex items-center gap-6px">
        <span>{{ mobile || '--' }}</span>
        <el-button
            v-if="mobile"
            link
            type="primary"
            title="复制手机号"
            @click="handleCopy"
        >
            <Icon icon="ep:copy-document" :size="14" />
        </el-button>
    </span>
</template>

<script setup lang="ts">
import * as ClueApi from '@/api/crm/clue'
import * as OutboundCallRecordApi from '@/api/system/call/record'
import { Icon } from '@/components/Icon'
import {
    copyMobileByClueId,
    showCopyMobileSuccessMessage
} from '@/views/crm/clue/mobileCopyCore.mjs'

const props = defineProps<{
    mobile?: string
    recordId?: number
    clueId?: number
}>()

const message = useMessage()

const handleCopy = async () => {
    if (!props.mobile) {
        return
    }
    if (props.recordId) {
        const result = await OutboundCallRecordApi.copyOutboundCallRecordMobile(props.recordId)
        await navigator.clipboard.writeText(result.mobile)
        showCopyMobileSuccessMessage(
            typeof result.usedCount === 'number' && typeof result.remainingCount === 'number'
                ? `今日已复制${result.usedCount}次，今日还可复制${result.remainingCount}次`
                : '复制成功'
        )
        return
    }
    if (props.clueId) {
        await copyMobileByClueId({
            clueId: Number(props.clueId),
            onSuccess: showCopyMobileSuccessMessage,
            onWarning: message.warning,
            copyApi: ClueApi.copyClueMobile,
            writeClipboard: (text) => navigator.clipboard.writeText(text)
        })
        return
    }
    await navigator.clipboard.writeText(props.mobile)
    showCopyMobileSuccessMessage('复制成功')
}
</script>
