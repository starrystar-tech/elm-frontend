<template>
    <transition name="incoming-toast">
        <div v-if="incomingToastVisible" class="incoming-toast" role="alert">
            <div class="incoming-toast__pulse"></div>
            <div class="incoming-toast__content">
                <div class="incoming-toast__eyebrow">来电提醒</div>
                <div class="incoming-toast__caller">{{ incomingToastCaller }}</div>
                <div class="incoming-toast__hint">
                    网页分机正在响铃，请尽快处理
                    <template v-if="incomingRingEnableRequired">
                        ，当前浏览器拦截了铃声，请点击“启用铃声”
                    </template>
                </div>
            </div>
            <div class="incoming-toast__actions">
                <!-- <el-button
          v-if="incomingRingEnableRequired"
          type="warning"
          size="small"
          class="incoming-toast__button"
          @click="manuallyEnableIncomingRing"
        >
          启用铃声
        </el-button> -->
                <el-button
                    type="success"
                    plain
                    size="small"
                    class="incoming-toast__button"
                    @click="answerBrowserCall"
                >
                    接听
                </el-button>
                <el-button
                    type="danger"
                    plain
                    size="small"
                    class="incoming-toast__button"
                    @click="hangupBrowserCall"
                >
                    拒绝
                </el-button>
            </div>
        </div>
    </transition>

    <audio ref="remoteAudioRef" autoplay playsinline class="hidden-audio"></audio>
    <audio ref="localAudioRef" autoplay playsinline muted class="hidden-audio"></audio>
</template>

<script setup lang="ts">
import { useBrowserPhone } from '@/hooks/web/useBrowserPhone'

defineOptions({ name: 'GlobalBrowserPhoneHost' })

const {
    incomingToastVisible,
    incomingToastCaller,
    incomingRingEnableRequired,
    remoteAudioRef,
    localAudioRef,
    manuallyEnableIncomingRing,
    answerBrowserCall,
    hangupBrowserCall,
    initBrowserPhone
} = useBrowserPhone()

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

.incoming-toast {
    position: fixed;
    top: 116px;
    right: 24px;
    z-index: 1800;
    pointer-events: none;
    display: flex;
    align-items: center;
    gap: 16px;
    width: min(420px, calc(100vw - 32px));
    padding: 18px 18px 18px 16px;
    border: 1px solid rgba(250, 204, 21, 0.28);
    border-radius: 20px;
    background:
        radial-gradient(circle at top left, rgba(250, 204, 21, 0.22), transparent 34%),
        linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.94));
    box-shadow:
        0 24px 50px rgba(15, 23, 42, 0.28),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(16px);
}

.incoming-toast__pulse {
    position: relative;
    width: 14px;
    height: 14px;
    flex: none;
    border-radius: 999px;
    background: #facc15;
    box-shadow: 0 0 0 10px rgba(250, 204, 21, 0.14);
}

.incoming-toast__pulse::after {
    content: '';
    position: absolute;
    inset: -8px;
    border: 1px solid rgba(250, 204, 21, 0.45);
    border-radius: 999px;
    animation: incoming-toast-pulse 1.6s ease-out infinite;
}

.incoming-toast__content {
    min-width: 0;
    flex: 1;
}

.incoming-toast__eyebrow {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(250, 204, 21, 0.9);
}

.incoming-toast__caller {
    margin-top: 6px;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.1;
    color: #f8fafc;
    word-break: break-all;
}

.incoming-toast__hint {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.5;
    color: rgba(226, 232, 240, 0.82);
}

.incoming-toast__actions {
    display: grid;
    gap: 8px;
}

.incoming-toast__button {
    width: 100%;
    margin-left: 0 !important;
    pointer-events: auto;
}

@keyframes incoming-toast-pulse {
    0% {
        transform: scale(0.8);
        opacity: 0.85;
    }
    100% {
        transform: scale(1.45);
        opacity: 0;
    }
}

@media (max-width: 768px) {
    .incoming-toast {
        top: 88px;
        right: 16px;
        left: 16px;
        width: auto;
        align-items: flex-start;
        flex-direction: column;
    }

    .incoming-toast__actions {
        width: 100%;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>
