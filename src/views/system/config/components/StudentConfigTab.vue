<template>
  <div class="placeholder-panel">
    <h3>学员设置</h3>
    <p>学员设置内容</p>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'StudentConfigTab' })
</script>

<style scoped>
.placeholder-panel {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--el-text-color-secondary);
}
</style>
