import assert from 'node:assert/strict'
import {
  buildDefaultOrderSettingConfig,
  ORDER_TIME_UNIT_OPTIONS
} from '../../src/views/system/config/components/orderConfigForm.mjs'

const config = buildDefaultOrderSettingConfig()

assert.equal(config.notify.financeAuditPayOrderNotifyEnabled, false)
assert.equal(config.permission.paidOrderModifyStudentLocked, false)
assert.equal(config.permission.paidOrderVoidLocked, true)
assert.equal(config.paymentAutoClose.value, 30)
assert.equal(config.paymentAutoClose.unit, 1)
assert.deepEqual(ORDER_TIME_UNIT_OPTIONS, [
  { label: '分钟', value: 1 },
  { label: '小时', value: 2 }
])

console.log('order-setting-config form assertions passed')
