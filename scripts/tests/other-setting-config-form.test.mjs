import assert from 'node:assert/strict'
import {
  buildDefaultOtherSettingConfig,
  parseReceiverText,
  stringifyReceivers
} from '../../src/views/system/config/components/otherConfigForm.mjs'

const config = buildDefaultOtherSettingConfig()
assert.equal(config.general.mobileCopyLimitEnabled, false)
assert.equal(config.systemNotify.workOrderTimeoutWarningUnit, 3)
assert.deepEqual(config.smsNotify.exportVerify.receivers, [])
assert.equal(config.smsNotify.mobileCopyWarning.minutes, 1)

assert.deepEqual(parseReceiverText('13800000000\n13900000000, 13800000000'), [
  '13800000000',
  '13900000000'
])
assert.equal(stringifyReceivers(['13800000000', '13900000000']), '13800000000\n13900000000')

console.log('other-setting-config form assertions passed')
