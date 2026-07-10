<template>
    <transition name="incoming-toast">
        <div v-if="panelVisible" class="call-panel" role="alert">
            <div class="call-panel__header">
                <div class="call-panel__status-wrap">
                    <span class="call-panel__status-dot" :class="`is-${panelTone}`"></span>
                    <span class="call-panel__status">{{ panelTitle }}</span>
                </div>
                <span v-if="showDuration" class="call-panel__duration">{{ formattedCallDuration }}</span>
            </div>
            <div class="call-panel__number">{{ panelNumber }}</div>
            <div class="call-panel__hint">
                {{ panelHint }}
                <template v-if="incomingRingEnableRequired">，当前浏览器拦截了铃声</template>
            </div>
            <div class="call-panel__actions">
                <el-button
                    v-if="incomingCall"
                    type="success"
                    plain
                    size="small"
                    class="call-panel__button"
                    @click="answerBrowserCall"
                >
                    接听
                </el-button>
                <el-button
                    type="danger"
                    plain
                    size="small"
                    class="call-panel__button"
                    @click="hangupBrowserCall"
                >
                    {{ incomingCall ? '拒绝' : '挂断' }}
                </el-button>
            </div>
        </div>
    </transition>

    <audio ref="remoteAudioRef" autoplay playsinline class="hidden-audio"></audio>
    <audio ref="localAudioRef" autoplay playsinline muted class="hidden-audio"></audio>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBrowserPhone } from '@/hooks/web/useBrowserPhone'

defineOptions({ name: 'GlobalBrowserPhoneHost' })

const {
    incomingCall,
    activeCall,
    browserStatus,
    incomingToastVisible,
    incomingToastCaller,
    currentBrowserCaller,
    currentBrowserCallee,
    incomingRingEnableRequired,
    remoteAudioRef,
    localAudioRef,
    formattedCallDuration,
    answerBrowserCall,
    hangupBrowserCall,
    initBrowserPhone
} = useBrowserPhone()

const panelVisible = computed(
    () =>
        incomingToastVisible.value ||
        incomingCall.value ||
        activeCall.value ||
        browserStatus.value === '呼叫中' ||
        browserStatus.value === '挂断中'
)

const showDuration = computed(() => browserStatus.value === '通话中')

const panelTitle = computed(() => {
    if (incomingCall.value || incomingToastVisible.value) return '来电提醒'
    if (browserStatus.value === '通话中') return '通话中'
    if (browserStatus.value === '呼叫中') return '呼叫中'
    if (browserStatus.value === '挂断中') return '挂断中'
    return browserStatus.value || '通话状态'
})

const panelHint = computed(() => {
    if (incomingCall.value || incomingToastVisible.value) {
        return '网页分机正在响铃，请尽快处理'
    }
    if (browserStatus.value === '通话中') return '当前正在通话，可在这里直接挂断'
    if (browserStatus.value === '呼叫中') return '正在等待对方接听'
    if (browserStatus.value === '挂断中') return '挂断请求已发送，等待对端确认'
    return '浏览器分机状态更新中'
})

const formatPanelNumber = (value?: string) => {
    const normalized = String(value || '').trim()
    if (!normalized) return '--'
    if (/^1\d+$/.test(normalized)) return normalized
    if (/^\d{3}8\d+$/.test(normalized)) return normalized.slice(4)
    return normalized
}

const panelNumber = computed(() => {
    if (incomingCall.value || incomingToastVisible.value) {
        return formatPanelNumber(incomingToastCaller.value || currentBrowserCaller.value)
    }
    return formatPanelNumber(currentBrowserCallee.value || currentBrowserCaller.value)
})

const panelTone = computed(() => {
    if (incomingCall.value || incomingToastVisible.value) return 'warning'
    if (browserStatus.value === '通话中') return 'success'
    if (browserStatus.value === '挂断中') return 'danger'
    return 'primary'
})

onMounted(() => {
    void initBrowserPhone()
})
</script>

<style scoped>
.hidden-audio {
    display: none;
}

.incoming-toast-enter-active,
.incoming-toast-leave-active {
    transition:
        opacity 0.22s ease,
        transform 0.22s ease;
}

.incoming-toast-enter-from,
.incoming-toast-leave-to {
    opacity: 0;
    transform: translate3d(0, -12px, 0) scale(0.98);
}

.call-panel {
    position: fixed;
    top: 116px;
    right: 24px;
    z-index: 5800;
    width: min(340px, calc(100vw - 32px));
    padding: 16px;
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.96);
    box-shadow:
        0 24px 50px rgba(15, 23, 42, 0.28),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(16px);
    color: #f8fafc;
}

.call-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.call-panel__status-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
}

.call-panel__status-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    flex: none;
}

.call-panel__status-dot.is-warning {
    background: #facc15;
    box-shadow: 0 0 0 6px rgba(250, 204, 21, 0.16);
}

.call-panel__status-dot.is-success {
    background: #4ade80;
    box-shadow: 0 0 0 6px rgba(74, 222, 128, 0.16);
}

.call-panel__status-dot.is-danger {
    background: #fb7185;
    box-shadow: 0 0 0 6px rgba(251, 113, 133, 0.16);
}

.call-panel__status-dot.is-primary {
    background: #60a5fa;
    box-shadow: 0 0 0 6px rgba(96, 165, 250, 0.16);
}

.call-panel__status {
    font-size: 13px;
    font-weight: 600;
}

.call-panel__duration {
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    color: rgba(226, 232, 240, 0.9);
}

.call-panel__number {
    margin-top: 12px;
    font-size: 24px;
    line-height: 1.15;
    font-weight: 700;
    word-break: break-all;
}

.call-panel__hint {
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.5;
    color: rgba(226, 232, 240, 0.82);
}

.call-panel__actions {
    display: flex;
    gap: 8px;
    margin-top: 14px;
}

.call-panel__button {
    flex: 1;
    margin-left: 0 !important;
}

@media (max-width: 768px) {
    .call-panel {
        top: 88px;
        right: 16px;
        left: 16px;
        width: auto;
    }

    .call-panel__actions {
        width: 100%;
    }
}
</style>
