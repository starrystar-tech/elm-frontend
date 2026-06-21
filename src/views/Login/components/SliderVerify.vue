<template>
  <div
    ref="trackRef"
    class="slider-verify"
    :class="{
      'is-success': verified,
      'is-dragging': dragging
    }"
  >
    <div class="slider-verify__fill" :style="{ width: `${fillWidth}px` }"></div>
    <div class="slider-verify__text">
      {{ verified ? successText : text }}
    </div>
    <div
      class="slider-verify__handle"
      :style="{ transform: `translateX(${handleX}px)` }"
      @mousedown="startDrag"
      @touchstart.prevent="startDrag"
    >
      <Icon :icon="verified ? 'ep:select' : 'ep:d-arrow-right'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@/components/Icon'

defineOptions({ name: 'SliderVerify' })

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    text?: string
    successText?: string
  }>(),
  {
    modelValue: false,
    text: '请按住滑块，拖动到最右边',
    successText: '验证通过'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
  reset: []
}>()

const trackRef = ref<HTMLElement>()
const dragging = ref(false)
const verified = ref(props.modelValue)
const handleX = ref(0)
const fillWidth = ref(56)
const startX = ref(0)
const startOffset = ref(0)
const HANDLE_WIDTH = 56

const maxOffset = computed(() => {
  const trackWidth = trackRef.value?.clientWidth || 0
  return Math.max(trackWidth - HANDLE_WIDTH, 0)
})

const syncPosition = (offset: number) => {
  handleX.value = offset
  fillWidth.value = offset + HANDLE_WIDTH
}

const finishVerify = () => {
  verified.value = true
  dragging.value = false
  syncPosition(maxOffset.value)
  emit('update:modelValue', true)
  emit('success')
  removeListeners()
}

const reset = () => {
  verified.value = false
  dragging.value = false
  syncPosition(0)
  emit('update:modelValue', false)
  emit('reset')
}

const onMove = (event: MouseEvent | TouchEvent) => {
  if (!dragging.value || verified.value) {
    return
  }
  const clientX = 'touches' in event ? event.touches[0]?.clientX || 0 : event.clientX
  const nextOffset = Math.min(Math.max(startOffset.value + clientX - startX.value, 0), maxOffset.value)
  syncPosition(nextOffset)
}

const onEnd = () => {
  if (!dragging.value) {
    return
  }
  if (handleX.value >= maxOffset.value - 6) {
    finishVerify()
    return
  }
  dragging.value = false
  syncPosition(0)
  removeListeners()
}

const addListeners = () => {
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onEnd)
  window.addEventListener('touchmove', onMove, { passive: false })
  window.addEventListener('touchend', onEnd)
}

const removeListeners = () => {
  window.removeEventListener('mousemove', onMove)
  window.removeEventListener('mouseup', onEnd)
  window.removeEventListener('touchmove', onMove)
  window.removeEventListener('touchend', onEnd)
}

const startDrag = (event: MouseEvent | TouchEvent) => {
  if (verified.value) {
    return
  }
  dragging.value = true
  startX.value = 'touches' in event ? event.touches[0]?.clientX || 0 : event.clientX
  startOffset.value = handleX.value
  addListeners()
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      verified.value = true
      syncPosition(maxOffset.value)
      return
    }
    if (verified.value || handleX.value !== 0) {
      verified.value = false
      dragging.value = false
      syncPosition(0)
    }
  }
)

onMounted(() => {
  syncPosition(verified.value ? maxOffset.value : 0)
})

onBeforeUnmount(() => {
  removeListeners()
})

defineExpose({
  reset
})
</script>

<style scoped lang="scss">
.slider-verify {
  position: relative;
  width: 100%;
  height: 48px;
  overflow: hidden;
  user-select: none;
  background: #f5f6fa;
  border: 1px solid #f0f1f5;
  border-radius: 4px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &.is-dragging {
    border-color: #dfe3eb;
    box-shadow: none;
  }

  &.is-success {
    border-color: #67c23a;
    background: #f0f9eb;

    .slider-verify__text {
      color: #67c23a;
    }
  }
}

.slider-verify__fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: 68px;
  background: linear-gradient(90deg, rgb(255 255 255 / 92%), rgb(255 255 255 / 18%));
  transition: width 0.2s ease;
}

.slider-verify__text {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 64px;
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #c2c7d0;
  white-space: nowrap;
}

.slider-verify:not(.is-success) .slider-verify__text {
  color: transparent;
  background: linear-gradient(
    90deg,
    #c2c7d0 0%,
    #c2c7d0 30%,
    #f9fafc 48%,
    #c2c7d0 66%,
    #c2c7d0 100%
  );
  background-size: 220% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: slider-placeholder-shimmer 2.4s linear infinite;
}

.slider-verify__handle {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 100%;
  font-size: 20px;
  color: #a7acb5;
  cursor: grab;
  background: #fff;
  border-right: 1px solid #f1f2f6;
  border-radius: 4px;
  box-shadow: 0 10px 24px rgb(31 35 41 / 10%);
  transition: transform 0.2s ease;

  &:active {
    cursor: grabbing;
  }
}

@keyframes slider-placeholder-shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -20% 0;
  }
}
</style>
