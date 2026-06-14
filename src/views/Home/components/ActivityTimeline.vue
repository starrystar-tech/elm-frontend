<template>
  <div class="activity-timeline">
    <div v-for="item in items" :key="`${item.type}-${item.time}-${item.content}`" class="activity-item">
      <button class="activity-item__icon" type="button" @click="$emit('navigate', item.path)">
        <Icon :icon="item.icon" :size="18" />
      </button>
      <div class="activity-item__content">
        <div class="activity-item__top">
          <span class="activity-item__title">{{ item.title }}</span>
          <span class="activity-item__time">{{ formatTime(item.time) }}</span>
        </div>
        <div class="activity-item__desc">{{ item.content }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { HomeDashboardActivityVO } from '@/api/home'

defineProps<{
  items: HomeDashboardActivityVO[]
}>()

defineEmits<{
  navigate: [path: string]
}>()

const formatTime = (time?: string) => {
  if (!time) return '-'
  return dayjs(time).format('MM-DD HH:mm')
}
</script>

<style scoped>
.activity-timeline {
  display: grid;
  gap: 18px;
}

.activity-item {
  display: flex;
  gap: 14px;
}

.activity-item__icon {
  position: relative;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #1d4ed8, #06b6d4);
  color: #fff;
  flex-shrink: 0;
  cursor: pointer;
}

.activity-item:nth-child(4n + 1) .activity-item__icon {
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.3), transparent 28%),
    linear-gradient(135deg, #1d4ed8, #06b6d4);
}

.activity-item:nth-child(4n + 2) .activity-item__icon {
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.3), transparent 28%),
    linear-gradient(135deg, #0f766e, #38bdf8);
}

.activity-item:nth-child(4n + 3) .activity-item__icon {
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.28), transparent 28%),
    linear-gradient(135deg, #7c3aed, #2563eb);
}

.activity-item:nth-child(4n) .activity-item__icon {
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.3), transparent 28%),
    linear-gradient(135deg, #ea580c, #ef4444);
}

.activity-item__content {
  flex: 1;
  min-width: 0;
  padding-bottom: 18px;
  border-bottom: 1px solid #edf2f7;
}

.activity-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.activity-item__title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.activity-item__time {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
}

.activity-item__desc {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: #475569;
}

.activity-item:last-child .activity-item__content {
  padding-bottom: 0;
  border-bottom: 0;
}
</style>
