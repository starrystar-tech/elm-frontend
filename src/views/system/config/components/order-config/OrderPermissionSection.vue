<template>
  <section class="config-section">
    <h4 class="section-title">权限限制设置</h4>
    <div class="section-body">
      <el-form-item prop="permission.paidOrderModifyStudentLocked">
        <div class="line-item">
          <el-switch v-model="model.paidOrderModifyStudentLocked" />
          <span>开启后，已确认支付的订单禁止修改学员基本信息</span>
        </div>
      </el-form-item>
      <el-form-item prop="permission.paidOrderVoidLocked">
        <div class="line-item">
          <el-switch v-model="model.paidOrderVoidLocked" />
          <span>开启后，已确认支付的订单禁止作废</span>
        </div>
      </el-form-item>
    </div>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'OrderPermissionSection' })

const model = defineModel<{
  paidOrderModifyStudentLocked: boolean
  paidOrderVoidLocked: boolean
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
