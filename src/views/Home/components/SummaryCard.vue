<template>
  <button class="summary-card" type="button" @click="$emit('navigate', item.path)">
    <div class="summary-card__icon">
      <Icon :icon="item.icon" :size="22" />
    </div>
    <div class="summary-card__main">
      <div class="summary-card__label">{{ item.title }}</div>
      <div class="summary-card__value">{{ item.value }}</div>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { HomeDashboardSummaryCardVO } from '@/api/home'

defineProps<{
  item: HomeDashboardSummaryCardVO
}>()

defineEmits<{
  navigate: [path: string]
}>()
</script>

<style scoped>
.summary-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border: 1px solid #d7e3f4;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(244, 114, 182, 0.16), transparent 34%),
    linear-gradient(145deg, #ffffff, #f7fafc);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.summary-card:hover {
  transform: translateY(-3px);
  border-color: #93c5fd;
  box-shadow: 0 20px 40px rgba(14, 116, 144, 0.12);
}

.summary-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, #0f766e, #0284c7);
  color: #fff;
  flex-shrink: 0;
}

.summary-card__main {
  min-width: 0;
}

.summary-card__label {
  font-size: 13px;
  color: #64748b;
}

.summary-card__value {
  margin-top: 8px;
  font-size: 30px;
  line-height: 1;
  font-weight: 700;
  color: #0f172a;
}
</style>
