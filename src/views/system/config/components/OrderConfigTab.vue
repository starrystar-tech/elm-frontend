<template>
  <div class="panel-wrap">
    <el-form ref="formRef" :model="form" :rules="rules" v-loading="loading" label-width="0">
      <OrderNotifySection v-model="form.notify" />
      <el-divider />
      <OrderPermissionSection v-model="form.permission" />
      <el-divider />
      <OrderPaymentAutoCloseSection v-model="form.paymentAutoClose" :options="timeUnitOptions" />

      <div class="action-wrap">
        <el-button type="primary" :loading="saving" :disabled="!canUpdate" @click="handleSave">保存</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { hasPermission } from '@/directives/permission/hasPermi'
import * as OrderSettingConfigApi from '@/api/crm/orderSettingConfig'
import OrderNotifySection from './order-config/OrderNotifySection.vue'
import OrderPermissionSection from './order-config/OrderPermissionSection.vue'
import OrderPaymentAutoCloseSection from './order-config/OrderPaymentAutoCloseSection.vue'
import { buildDefaultOrderSettingConfig, ORDER_TIME_UNIT_OPTIONS } from './orderConfigForm.mjs'

defineOptions({ name: 'OrderConfigTab' })

const message = useMessage()
const canUpdate = hasPermission(['crm:order-setting-config:update'])

const loading = ref(false)
const saving = ref(false)
const formRef = ref()

const timeUnitOptions = ORDER_TIME_UNIT_OPTIONS
const form = reactive<OrderSettingConfigApi.OrderSettingConfigVO>(buildDefaultOrderSettingConfig())

const rules = reactive({
  'notify.financeAuditPayOrderNotifyEnabled': [{ required: true, message: '财务审核支付单通知开关不能为空', trigger: 'change' }],
  'permission.paidOrderModifyStudentLocked': [{ required: true, message: '已确认支付订单修改学员信息限制开关不能为空', trigger: 'change' }],
  'permission.paidOrderVoidLocked': [{ required: true, message: '已确认支付订单作废限制开关不能为空', trigger: 'change' }],
  'paymentAutoClose.value': [{ required: true, message: '支付记录自动关闭时间值不能为空', trigger: 'change' }],
  'paymentAutoClose.unit': [{ required: true, message: '支付记录自动关闭时间单位不能为空', trigger: 'change' }]
})

const buildPayload = (): OrderSettingConfigApi.OrderSettingConfigVO => ({
  ...form,
  notify: { ...form.notify },
  permission: { ...form.permission },
  paymentAutoClose: { ...form.paymentAutoClose }
})

const loadConfig = async () => {
  loading.value = true
  try {
    const data = await OrderSettingConfigApi.getOrderSettingConfig()
    if (data) Object.assign(form, buildDefaultOrderSettingConfig(), data)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  saving.value = true
  try {
    await OrderSettingConfigApi.saveOrderSettingConfig(buildPayload())
    message.success('保存成功')
    await loadConfig()
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.panel-wrap {
  padding: 8px 6px;
}
.action-wrap {
  margin-top: 8px;
  padding-left: 14px;
}
</style>
