<template>
  <div class="todo-panel">
    <button
      v-for="item in items"
      :key="item.code"
      class="todo-panel__item"
      type="button"
      @click="$emit('navigate', item.path)"
    >
      <div class="todo-panel__title-row">
        <span class="todo-panel__title">{{ item.title }}</span>
        <span class="todo-panel__count">{{ item.count }}</span>
      </div>
      <div class="todo-panel__desc">{{ item.description }}</div>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { HomeDashboardTodoItemVO } from '@/api/home'

defineProps<{
  items: HomeDashboardTodoItemVO[]
}>()

defineEmits<{
  navigate: [path: string]
}>()
</script>

<style scoped>
.todo-panel {
  display: grid;
  gap: 12px;
}

.todo-panel__item {
  padding: 16px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: linear-gradient(180deg, #fff, #f8fafc);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.todo-panel__item:hover {
  transform: translateX(4px);
  border-color: #86efac;
  box-shadow: 0 12px 28px rgba(22, 163, 74, 0.08);
}

.todo-panel__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.todo-panel__title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.todo-panel__count {
  min-width: 28px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.todo-panel__desc {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
}
</style>
