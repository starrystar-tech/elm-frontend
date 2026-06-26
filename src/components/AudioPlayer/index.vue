<template>
    <div class="audio-player">
        <div class="audio-controls" @click="togglePlay">
            <div class="play-btn" :class="{ playing: isPlaying }">
                <el-icon v-if="!isPlaying" icon="video-play" :size="18">
                    <VideoPlay />
                </el-icon>
                <el-icon v-else icon="video-pause" :size="18">
                    <VideoPause />
                </el-icon>
            </div>
        </div>
        <div class="audio-progress">
            <div class="progress-bar" @click="seekTo">
                <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
                <div class="progress-thumb" :style="{ left: progressPercent + '%' }"></div>
            </div>
        </div>
        <div class="audio-time">
            <span class="current-time">{{ formatTime(currentTime) }}</span>
            <span class="separator">/</span>
            <span class="total-time">{{ formatTime(duration) }}</span>
        </div>
        <audio
            ref="audioRef"
            :src="src"
            @timeupdate="onTimeUpdate"
            @ended="onEnded"
            @loadedmetadata="onLoadedMetadata"
        ></audio>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { VideoPlay, VideoPause } from '@element-plus/icons-vue'

const props = defineProps<{
    src: string
    duration?: number
}>()

const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

watch(
    () => props.duration,
    (val) => {
        if (val && val > 0) {
            duration.value = val
        }
    },
    { immediate: true }
)

const progressPercent = computed(() => {
    if (duration.value <= 0) return 0
    return Math.min((currentTime.value / duration.value) * 100, 100)
})

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const togglePlay = () => {
    if (!audioRef.value) return
    if (isPlaying.value) {
        audioRef.value.pause()
    } else {
        audioRef.value.play()
    }
    isPlaying.value = !isPlaying.value
}

const seekTo = (e: MouseEvent) => {
    if (!audioRef.value || duration.value <= 0) return
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration.value
    audioRef.value.currentTime = newTime
    currentTime.value = newTime
}

const onTimeUpdate = () => {
    if (audioRef.value) {
        currentTime.value = audioRef.value.currentTime
    }
}

const onEnded = () => {
    isPlaying.value = false
    currentTime.value = 0
}

const onLoadedMetadata = () => {
    if (audioRef.value && audioRef.value.duration && !duration.value) {
        duration.value = audioRef.value.duration
    }
}

onBeforeUnmount(() => {
    if (audioRef.value) {
        audioRef.value.pause()
        audioRef.value.src = ''
    }
})
</script>

<style lang="scss" scoped>
.audio-player {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 6px;
    background: #ffffff;
    border: 1px solid #e4e7ed;
    border-radius: 16px;
    min-width: 100px;
    box-shadow: none;
}

.audio-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.play-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    color: #409eff;

    &:hover {
        color: #66b1ff;
    }

    &.playing {
        color: #409eff;

        &:hover {
            color: #66b1ff;
        }
    }

    &:active {
        transform: scale(0.95);
    }
}

.audio-progress {
    flex: 1;
    min-width: 80px;
    padding: 0 2px;
}

.progress-bar {
    position: relative;
    height: 6px;
    background: #f0f2f5;
    border-radius: 3px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
        background: #e4e7ed;
    }

    &:hover .progress-fill {
        background: #c0c4cc;
    }
}

.progress-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: #dcdfe6;
    border-radius: 3px;
    transition: width 0.15s ease-out;
}

.progress-thumb {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    background: #ffffff;
    border: 2px solid #dcdfe6;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        transform: translate(-50%, -50%) scale(1.1);
        border-color: #c0c4cc;
    }
}

.audio-time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #606266;
    min-width: 70px;

    .separator {
        color: #c0c4cc;
    }
}
</style>
