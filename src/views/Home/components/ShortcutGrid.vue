<template>
  <div class="shortcut-grid">
    <button
      v-for="item in items"
      :key="item.path"
      class="shortcut-grid__item"
      type="button"
      @click="$emit('navigate', item.path)"
    >
      <div class="shortcut-grid__icon">
        <Icon :icon="item.icon" :size="20" />
      </div>
      <div class="shortcut-grid__text">{{ item.title }}</div>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { HomeDashboardShortcutVO } from '@/api/home'

defineProps<{
  items: HomeDashboardShortcutVO[]
}>()

defineEmits<{
  navigate: [path: string]
}>()
</script>

<style scoped>
.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.shortcut-grid__item {
  padding: 16px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #fff;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.shortcut-grid__item:hover {
  transform: translateY(-2px);
  border-color: #fdba74;
  background: #fffaf3;
}

.shortcut-grid__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, #f97316, #fb7185);
  color: #fff;
}

.shortcut-grid__item:nth-child(6n + 1) .shortcut-grid__icon {
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.34), transparent 28%),
    linear-gradient(135deg, #f97316, #fb7185);
}

.shortcut-grid__item:nth-child(6n + 2) .shortcut-grid__icon {
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.34), transparent 28%),
    linear-gradient(135deg, #f59e0b, #f97316);
}

.shortcut-grid__item:nth-child(6n + 3) .shortcut-grid__icon {
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.32), transparent 28%),
    linear-gradient(135deg, #ef4444, #f97316);
}

.shortcut-grid__item:nth-child(6n + 4) .shortcut-grid__icon {
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.34), transparent 28%),
    linear-gradient(135deg, #2563eb, #06b6d4);
}

.shortcut-grid__item:nth-child(6n + 5) .shortcut-grid__icon {
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.32), transparent 28%),
    linear-gradient(135deg, #0f766e, #22c55e);
}

.shortcut-grid__item:nth-child(6n) .shortcut-grid__icon {
  background:
    radial-gradient(circle at 30% 24%, rgba(255, 255, 255, 0.34), transparent 28%),
    linear-gradient(135deg, #7c3aed, #ec4899);
}

.shortcut-grid__text {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

@media (max-width: 1024px) {
  .shortcut-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
