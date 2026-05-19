<template>
  <section class="config-section">
    <h4 class="section-title">通知设置</h4>
    <div class="section-body">
      <el-form-item prop="notify.financeAuditPayOrderNotifyEnabled">
        <div class="line-item">
          <el-switch v-model="model.financeAuditPayOrderNotifyEnabled" />
          <span>开启后，下单人将收到财务审核支付单的通知</span>
        </div>
      </el-form-item>
    </div>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'OrderNotifySection' })

const model = defineModel<{
  financeAuditPayOrderNotifyEnabled: boolean
}>({ required: true })
</script>

<style scoped>
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
