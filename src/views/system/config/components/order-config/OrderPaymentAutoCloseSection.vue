<template>
  <section class="config-section">
    <h4 class="section-title">支付自动关闭设置</h4>
    <div class="section-body">
      <el-form-item prop="paymentAutoClose.value">
        <div class="line-item">
          <span>支付记录超过</span>
          <el-form-item prop="paymentAutoClose.value" class="inline-item">
            <el-input-number v-model="model.value" :min="1" :max="9999" />
          </el-form-item>
          <el-form-item prop="paymentAutoClose.unit" class="inline-item">
            <el-select v-model="model.unit" style="width: 96px">
              <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <span>未支付时自动关闭</span>
        </div>
      </el-form-item>
    </div>
  </section>
</template>

<script setup lang="ts">
defineOptions({ name: 'OrderPaymentAutoCloseSection' })

defineProps<{
  options: { label: string; value: number }[]
}>()

const model = defineModel<{
  value: number
  unit: number
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
.inline-item {
  margin-bottom: 0;
}
</style>
