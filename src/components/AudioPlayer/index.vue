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
        <div class="audio-actions">
            <el-select
                v-model="playbackRate"
                size="small"
                class="rate-select"
                popper-class="audio-rate-select-popper"
                @change="handlePlaybackRateChange"
                @click.stop
            >
                <el-option
                    v-for="item in playbackRateOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                />
            </el-select>
            <el-button
                link
                type="primary"
                class="download-btn"
                :loading="downloadLoading"
                @click.stop="downloadAudio"
            >
                <el-icon v-if="!downloadLoading" :size="14">
                    <Download />
                </el-icon>
            </el-button>
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
import { Download, VideoPlay, VideoPause } from '@element-plus/icons-vue'
import { downloadOutboundCallRecordAudio } from '@/api/system/call/record'

const props = defineProps<{
    src: string
    duration?: number
    recordId?: number
}>()

const audioRef = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const playbackRate = ref(1)
const downloadLoading = ref(false)
const playbackRateOptions = [
    { label: '1.0x', value: 1 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '2.0x', value: 2 }
]

watch(
    () => props.duration,
    (val) => {
        if (val && val > 0) {
            duration.value = val
        }
    },
    { immediate: true }
)

watch(
    () => props.src,
    () => {
        isPlaying.value = false
        currentTime.value = 0
        duration.value = props.duration && props.duration > 0 ? props.duration : 0
        playbackRate.value = 1
        if (audioRef.value) {
            audioRef.value.pause()
            audioRef.value.currentTime = 0
            audioRef.value.playbackRate = 1
        }
    }
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
        audioRef.value.playbackRate = playbackRate.value
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

const handlePlaybackRateChange = (value: number) => {
    if (!audioRef.value) return
    audioRef.value.playbackRate = value
}

const buildDownloadFileName = () => {
    try {
        const url = new URL(props.src, window.location.origin)
        const pathname = url.pathname.split('/').filter(Boolean)
        return pathname[pathname.length - 1] || 'audio'
    } catch (error) {
        return 'audio'
    }
}

const triggerBrowserDownload = (url: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

const downloadAudio = async () => {
    if (downloadLoading.value) return
    downloadLoading.value = true
    try {
    if (props.recordId) {
        try {
            await downloadOutboundCallRecordAudio(props.recordId)
        } catch (error) {}
    }
    if (!props.src) return
    const fileName = buildDownloadFileName()
    try {
        const response = await fetch(props.src)
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        triggerBrowserDownload(blobUrl, fileName)
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
    } catch (error) {
        triggerBrowserDownload(props.src, fileName)
    }
    } finally {
        downloadLoading.value = false
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
    width: 100%;
    box-sizing: border-box;
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
    min-width: 70px;
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
    min-width: 92px;
    flex-shrink: 0;

    .separator {
        color: #c0c4cc;
    }
}

.audio-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
}

.rate-select,
.download-btn {
    min-height: 24px;
    padding: 4px 6px;
}

.rate-select {
    width: 72px;
}
</style>
