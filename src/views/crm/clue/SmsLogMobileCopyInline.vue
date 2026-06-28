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
    copyMobileByClueId,
    showCopyMobileSuccessMessage
} from '@/views/crm/clue/mobileCopyCore.mjs'

type MobileField = 'mobile' | 'mobile2'

const props = defineProps<{
    mobile?: string
    clueId?: number
    primaryMobile?: string
    secondaryMobile?: string
}>()

const message = useMessage()

const normalizeMobile = (value?: string | null) => (value || '').trim()

const maskMobile = (value?: string | null) => {
    const mobile = normalizeMobile(value)
    if (!mobile) return ''
    if (mobile.length < 7) return mobile
    return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`
}

const resolveMobileField = (): MobileField | undefined => {
    const displayMobile = normalizeMobile(props.mobile)
    const candidates = [
        {
            field: 'mobile' as const,
            value: normalizeMobile(props.primaryMobile)
        },
        {
            field: 'mobile2' as const,
            value: normalizeMobile(props.secondaryMobile)
        }
    ].filter((item) => item.value)

    if (!candidates.length) {
        return undefined
    }

    const exactMatch = candidates.find((item) => item.value === displayMobile)
    if (exactMatch) {
        return exactMatch.field
    }

    const maskedMatch = candidates.find((item) => maskMobile(item.value) === displayMobile)
    if (maskedMatch) {
        return maskedMatch.field
    }

    if (candidates.length === 1) {
        return candidates[0].field
    }

    return undefined
}

const handleCopy = async () => {
    if (!props.mobile) {
        return
    }

    const mobileField = resolveMobileField()
    if (props.clueId && mobileField) {
        await copyMobileByClueId({
            clueId: Number(props.clueId),
            onSuccess: showCopyMobileSuccessMessage,
            onWarning: message.warning,
            copyApi: ClueApi.copyClueMobile,
            writeClipboard: (text) => navigator.clipboard.writeText(text),
            mobileField
        })
        return
    }

    if (props.clueId) {
        message.warning('未能识别该短信对应的手机号')
        return
    }

    await navigator.clipboard.writeText(props.mobile)
    showCopyMobileSuccessMessage('复制成功')
}
</script>
