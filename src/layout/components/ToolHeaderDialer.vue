<template>
    <ElPopover
        :width="360"
        placement="bottom"
        trigger="focus"
        popper-class="tool-header-dialer-popper"
    >
        <template #reference>
            <div class="tool-header-dialer__reference">
                <slot></slot>
            </div>
        </template>

        <div class="dialer-panel">
            <div class="dialer-status">
                <span class="dialer-status__dot" :class="`is-${statusType}`"></span>
                <span class="dialer-status__text">{{ statusText }}</span>
            </div>
            <div class="dialer-keypad">
                <button
                    v-for="key in keypadKeys"
                    :key="key"
                    type="button"
                    class="dialer-key"
                    @click="appendKey(key)"
                >
                    {{ key }}
                </button>
            </div>

            <div class="dialer-actions">
                <ElButton plain type="text" @click="handleDelete">删除</ElButton>
                <ElButton plain type="text" @click="handleClear">清空</ElButton>
                <ElButton type="danger" plain @click="handleHangup">挂断</ElButton>
                <ElButton type="primary" :loading="dialing" @click="handleDial">呼叫</ElButton>
            </div>

            <div v-if="statusMessage" class="dialer-message">{{ statusMessage }}</div>
        </div>
    </ElPopover>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElButton, ElInput, ElPopover, ElTooltip } from 'element-plus'
import { dialOutboundCall } from '@/api/system/call'

defineOptions({ name: 'ToolHeaderDialer' })

const props = withDefaults(
    defineProps<{
        modelValue?: string
    }>(),
    {
        modelValue: ''
    }
)

const emit = defineEmits<{
    'update:modelValue': [value: string]
    keypadInput: []
}>()

type DialerStatus = 'idle' | 'dialing' | 'submitted' | 'failed' | 'hungup'

const message = useMessage()
const dialing = ref(false)
const status = ref<DialerStatus>('idle')
const statusMessage = ref('')

const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

const statusTextMap: Record<DialerStatus, string> = {
    idle: '空闲',
    dialing: '拨号中',
    submitted: '已提交',
    failed: '拨号失败',
    hungup: '已挂断'
}

const statusText = computed(() => statusTextMap[status.value])
const statusType = computed(() => status.value)
const mobile = computed({
    get: () => props.modelValue || '',
    set: (value: string) => emit('update:modelValue', value)
})

const appendKey = (key: string) => {
    if (mobile.value.length >= 11 && /^\d$/.test(key)) {
        return
    }
    mobile.value += key
    emit('keypadInput')
}

const handleDelete = () => {
    mobile.value = mobile.value.slice(0, -1)
    emit('keypadInput')
}

const handleClear = () => {
    mobile.value = ''
    emit('keypadInput')
    if (status.value === 'failed' || status.value === 'hungup') {
        status.value = 'idle'
        statusMessage.value = ''
    }
}

const handleHangup = () => {
    dialing.value = false
    status.value = 'hungup'
    statusMessage.value = mobile.value
        ? `已结束当前拨号会话：${mobile.value}`
        : '已结束当前拨号会话'
}

const handleDial = async () => {
    const targetMobile = mobile.value.trim()
    if (!/^1\d{10}$/.test(targetMobile)) {
        message.warning('请输入正确的 11 位手机号')
        return
    }
    if (dialing.value) {
        return
    }
    dialing.value = true
    status.value = 'dialing'
    statusMessage.value = `正在发起外呼：${targetMobile}`
    try {
        const data = await dialOutboundCall({ mobile: targetMobile })
        status.value = 'submitted'
        statusMessage.value = data?.message || `外呼请求已提交：${targetMobile}`
        message.success(`外呼请求已提交：${targetMobile}`)
    } catch (error: any) {
        status.value = 'failed'
        statusMessage.value = error?.message || '外呼失败'
        message.error(error?.message || '外呼失败')
    } finally {
        dialing.value = false
    }
}

defineExpose({
    handleDial,
    handleHangup,
    dialing,
    statusText,
    statusMessage
})
</script>

<style lang="scss" scoped>
.tool-header-dialer__reference {
    width: 100%;
}

.dialer-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.dialer-status {
    display: flex;
    align-items: center;
    gap: 8px;

    &__dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #c0c4cc;

        &.is-idle {
            background: #909399;
        }

        &.is-dialing {
            background: #e6a23c;
            box-shadow: 0 0 0 4px rgba(230, 162, 60, 0.14);
        }

        &.is-submitted {
            background: #67c23a;
            box-shadow: 0 0 0 4px rgba(103, 194, 58, 0.14);
        }

        &.is-failed {
            background: #f56c6c;
            box-shadow: 0 0 0 4px rgba(245, 108, 108, 0.14);
        }

        &.is-hungup {
            background: #909399;
        }
    }

    &__text {
        font-size: 13px;
        font-weight: 600;
    }
}

.dialer-display {
    width: 100%;
}

.dialer-keypad {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
}

.dialer-key {
    height: 44px;
    border: 1px solid var(--el-border-color);
    border-radius: 12px;
    background: var(--el-bg-color);
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    transition: all 0.2s ease;

    &:hover {
        border-color: var(--el-color-primary);
        color: var(--el-color-primary);
    }
}

.dialer-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.dialer-message {
    min-height: 20px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
}
</style>
