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
import { Icon } from '@/components/Icon'
import {
    buildCopySuccessMessage,
    copyMobileByClueId,
    showCopyMobileSuccessMessage
} from './mobileCopyCore.mjs'

type CopyMobileResult = {
    mobile: string
    usedCount?: number
    remainingCount?: number
}

const props = defineProps<{
    mobile?: string
    clueId?: number
    directCopy?: boolean
    mobileField?: string
    copyDirectApi?: (mobile: string) => Promise<CopyMobileResult>
}>()

const message = useMessage()

const handleCopy = async () => {
    if (!props.clueId && props.copyDirectApi) {
        const result = await props.copyDirectApi(props.mobile!)
        await navigator.clipboard.writeText(result.mobile)
        showCopyMobileSuccessMessage(buildCopySuccessMessage(result))
        return
    }
    if (props.directCopy || !props.clueId) {
        await navigator.clipboard.writeText(props.mobile!)
        showCopyMobileSuccessMessage('复制成功')
        return
    }
    await copyMobileByClueId({
        clueId: Number(props.clueId),
        onSuccess: showCopyMobileSuccessMessage,
        onWarning: message.warning,
        copyApi: ClueApi.copyClueMobile,
        writeClipboard: (text) => navigator.clipboard.writeText(text),
        mobileField: props.mobileField || 'mobile'
    })
}
</script>
