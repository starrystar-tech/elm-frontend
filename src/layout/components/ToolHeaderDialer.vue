<template>
    <div ref="rootRef" class="tool-header-dialer">
        <div ref="referenceRef" class="tool-header-dialer__reference">
            <slot></slot>
        </div>

        <Teleport to="body">
            <div v-show="popoverVisible" ref="panelRef" class="dialer-panel" :style="panelStyle">
                <div class="dialer-status">
                    <span class="dialer-status__dot" :class="`is-${statusType}`"></span>
                    <span class="dialer-status__text">{{ statusText || '空闲' }}</span>
                    <strong v-if="showDuration" class="dialer-status__timer">
                        {{ durationText }}
                    </strong>
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
                    <ElButton plain @click="handleClear">清空</ElButton>
                    <ElButton type="danger" plain @click="handleHangup">挂断</ElButton>
                </div>

                <div v-if="statusMessage" class="dialer-message">{{ statusMessage }}</div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElButton } from 'element-plus'

defineOptions({ name: 'ToolHeaderDialer' })

const props = withDefaults(
    defineProps<{
        modelValue?: string
        statusText?: string
        statusType?: string
        statusMessage?: string
        durationText?: string
        showDuration?: boolean
        dialing?: boolean
        outboundEnabled?: boolean
    }>(),
    {
        modelValue: '',
        statusText: '空闲',
        statusType: 'idle',
        statusMessage: '',
        durationText: '00:00',
        showDuration: false,
        dialing: false,
        outboundEnabled: false
    }
)

const emit = defineEmits<{
    'update:modelValue': [value: string]
    keypadInput: []
    dial: []
    hangup: []
}>()

const popoverVisible = ref(false)
const rootRef = ref<HTMLElement>()
const referenceRef = ref<HTMLElement>()
const panelRef = ref<HTMLElement>()
const panelTop = ref(0)
const panelLeft = ref(0)
const keepOpenUntil = ref(0)

const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

const mobile = computed({
    get: () => props.modelValue || '',
    set: (value: string) => emit('update:modelValue', value)
})

const panelStyle = computed(() => ({
    top: `${panelTop.value}px`,
    left: `${panelLeft.value}px`
}))

const updatePanelPosition = async () => {
    await nextTick()
    if (!referenceRef.value) return
    const rect = referenceRef.value.getBoundingClientRect()
    const panelWidth = panelRef.value?.offsetWidth || 360
    const viewportWidth = window.innerWidth
    const maxLeft = Math.max(12, viewportWidth - panelWidth - 12)
    panelTop.value = rect.bottom + 10
    panelLeft.value = Math.min(Math.max(12, rect.right - panelWidth), maxLeft)
}

const openDialer = async () => {
    keepOpenUntil.value = Date.now() + 300
    popoverVisible.value = true
    await updatePanelPosition()
}

const holdOpen = (duration = 500) => {
    keepOpenUntil.value = Date.now() + duration
    popoverVisible.value = true
}

const handleDocumentPointerDown = (event: MouseEvent) => {
    const target = event.target as Node | null
    if (!target || !popoverVisible.value) return
    if (Date.now() < keepOpenUntil.value) return
    if (rootRef.value?.contains(target) || panelRef.value?.contains(target)) return
    popoverVisible.value = false
}

const appendKey = (key: string) => {
    popoverVisible.value = true
    updatePanelPosition()
    mobile.value += key
    emit('keypadInput')
}

const handleClear = () => {
    popoverVisible.value = true
    updatePanelPosition()
    mobile.value = ''
    emit('keypadInput')
}

const handleHangup = () => {
    popoverVisible.value = true
    emit('hangup')
}

const handleDial = () => {
    popoverVisible.value = true
    emit('dial')
}

defineExpose({
    openDialer,
    holdOpen,
    handleDial,
    handleHangup,
    dialing: computed(() => props.dialing)
})

onMounted(() => {
    document.addEventListener('mousedown', handleDocumentPointerDown)
    window.addEventListener('resize', updatePanelPosition)
    window.addEventListener('scroll', updatePanelPosition, true)
})

onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleDocumentPointerDown)
    window.removeEventListener('resize', updatePanelPosition)
    window.removeEventListener('scroll', updatePanelPosition, true)
})
</script>

<style lang="scss" scoped>
.tool-header-dialer {
    position: relative;
}

.tool-header-dialer__reference {
    width: 100%;
}

.dialer-panel {
    position: fixed;
    z-index: 4000;
    width: 360px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow:
        0 18px 48px rgba(15, 23, 42, 0.18),
        inset 0 1px 0 rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(18px);
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

        &.is-dialing,
        &.is-ringing {
            background: #e6a23c;
            box-shadow: 0 0 0 4px rgba(230, 162, 60, 0.14);
        }

        &.is-submitted,
        &.is-registered {
            background: #67c23a;
            box-shadow: 0 0 0 4px rgba(103, 194, 58, 0.14);
        }

        &.is-inCall {
            background: #409eff;
            box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.14);
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

    &__timer {
        margin-left: auto;
        font-size: 13px;
        font-weight: 700;
        color: var(--el-color-primary);
        font-variant-numeric: tabular-nums;
    }
}

.dialer-keypad {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
}

.dialer-key {
    height: 38px;
    border: 1px solid var(--el-border-color);
    border-radius: 10px;
    background: var(--el-bg-color);
    font-size: 16px;
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
    gap: 8px;
}

.dialer-message {
    min-height: 20px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
}
</style>
