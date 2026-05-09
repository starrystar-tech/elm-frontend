<template>
  <div class="panel-wrap">
    <section class="config-section">
      <h4 class="section-title">客户回收</h4>
      <div class="section-body">
        <div class="line-item">
          <el-switch v-model="form.recycleFirstVisitEnabled" active-text="" inactive-text="" />
          <span>首咨客户</span>
          <el-input-number v-model="form.recycleFirstVisitDays" :min="1" :max="365" :controls="false" />
          <span>天未回访，自动进入公海</span>
        </div>
        <div class="line-item">
          <el-switch v-model="form.recycleNoDealEnabled" active-text="" inactive-text="" />
          <span>分配后</span>
          <el-input-number v-model="form.recycleNoDealDays" :min="1" :max="365" :controls="false" />
          <span>天未成交，自动进入公海</span>
        </div>
      </div>
    </section>

    <el-divider />

    <section class="config-section">
      <h4 class="section-title">领取客户</h4>
      <div class="section-body">
        <div class="line-item">
          <el-switch v-model="form.reclaimBanEnabled" active-text="" inactive-text="" />
          <span>放弃客户后，</span>
          <el-input-number v-model="form.reclaimBanDays" :min="1" :max="365" :controls="false" />
          <span>天内不可再领取</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

defineOptions({ name: 'ClueConfigTab' })

const form = reactive({
  recycleFirstVisitEnabled: false,
  recycleFirstVisitDays: 3,
  recycleNoDealEnabled: false,
  recycleNoDealDays: 7,
  reclaimBanEnabled: false,
  reclaimBanDays: 1
})
</script>

<style scoped>
.panel-wrap {
  padding: 8px 6px;
}
.config-section {
  margin-bottom: 20px;
}
.section-title {
  margin: 0 0 18px;
  font-size: 15px;
  font-weight: 600;
  position: relative;
  padding-left: 14px;
}
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  width: 4px;
  height: 16px;
  background: var(--el-color-primary);
  border-radius: 2px;
}
.section-body {
  margin-left: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.line-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
