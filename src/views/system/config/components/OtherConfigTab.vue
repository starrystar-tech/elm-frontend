<template>
  <div class="panel-wrap">
    <section class="config-section">
      <h4 class="section-title">通用设置</h4>
      <div class="section-body">
        <div class="line-item">
          <el-switch v-model="form.exportAuthEnabled" active-text="" inactive-text="" />
          <span>开启后，批量导出时需超管的验证码授权，超管手机号为</span>
          <el-input v-model="form.superAdminPhone" style="width: 150px" />
        </div>
        <div class="line-item">
          <el-switch v-model="form.copyLimitEnabled" active-text="" inactive-text="" />
          <span>开启后，每人每日最多复制</span>
          <el-input-number v-model="form.copyLimitTimes" :min="1" :max="999" :controls="false" />
          <span>次手机号</span>
        </div>
      </div>
    </section>

    <el-divider />

    <section class="config-section">
      <h4 class="section-title">其他设置</h4>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

defineOptions({ name: 'OtherConfigTab' })

const form = reactive({
  exportAuthEnabled: false,
  superAdminPhone: '18000001234',
  copyLimitEnabled: false,
  copyLimitTimes: 7
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
