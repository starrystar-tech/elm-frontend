<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
    <el-form label-width="110px">
      <el-form-item label="导出手机号">
        <el-switch
          v-model="form.exportPlainMobile"
          inline-prompt
          active-text="明文"
          inactive-text="脱敏"
        />
      </el-form-item>
      <el-form-item v-if="verifyConfig.needSendAuthCode" label="验证码">
        <div class="w-full flex gap-8px items-start">
          <el-input
            v-model="form.authCode"
            placeholder="请输入导出验证码"
            maxlength="6"
            clearable
          />
          <el-button :disabled="countdown > 0 || sendingCode" :loading="sendingCode" @click="handleSendCode">
            {{ countdown > 0 ? `${countdown}s后重发` : '发送验证码' }}
          </el-button>
        </div>
        <div class="mt-6px text-12px text-[var(--el-text-color-secondary)]">
          已发送到：{{ verifyMobiles }}
          <template v-if="expireMinutes">，有效期 {{ expireMinutes }} 分钟</template>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确认导出</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import * as OtherSettingConfigApi from '@/api/crm/otherSettingConfig'
import * as ExportTaskApi from '@/api/system/exportTask'

defineOptions({ name: 'ExportTaskDialog' })

interface OpenOptions {
  title: string
  bizType: string
  submit: (payload: { authCode?: string; exportPlainMobile?: boolean }) => Promise<unknown>
}

const emit = defineEmits<{
  success: []
}>()

const message = useMessage()
const dialogVisible = ref(false)
const dialogTitle = ref('创建导出任务')
const bizType = ref('')
const submitting = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const expireMinutes = ref<number | undefined>()
const timer = ref<number | undefined>()
const submitHandler = ref<OpenOptions['submit']>()
const verifyConfig = reactive<OtherSettingConfigApi.ExportVerifyConfigVO>({
  needSendAuthCode: false,
  mobile: []
})
const form = reactive({
  authCode: '',
  exportPlainMobile: false
})

const verifyMobiles = computed(() =>
  verifyConfig.mobile?.length ? verifyConfig.mobile.join('、') : '未配置接收手机号'
)

const clearTimer = () => {
  if (timer.value) {
    window.clearInterval(timer.value)
    timer.value = undefined
  }
}

const startCountdown = () => {
  clearTimer()
  countdown.value = 60
  timer.value = window.setInterval(() => {
    if (countdown.value <= 1) {
      countdown.value = 0
      clearTimer()
      return
    }
    countdown.value -= 1
  }, 1000)
}

const handleSendCode = async () => {
  if (!bizType.value) {
    return
  }
  sendingCode.value = true
  try {
    const resp = await ExportTaskApi.sendExportAuthCode({ bizType: bizType.value })
    verifyConfig.needSendAuthCode = !!resp?.needSendAuthCode
    verifyConfig.mobile = resp?.mobile || []
    expireMinutes.value = resp?.expireMinutes
    if (verifyConfig.needSendAuthCode) {
      startCountdown()
      message.success('验证码已发送')
    }
  } finally {
    sendingCode.value = false
  }
}

const handleSubmit = async () => {
  if (!submitHandler.value) {
    return
  }
  if (verifyConfig.needSendAuthCode && !form.authCode.trim()) {
    message.warning('请输入导出验证码')
    return
  }
  submitting.value = true
  try {
    await submitHandler.value({
      authCode: verifyConfig.needSendAuthCode ? form.authCode.trim() : undefined,
      exportPlainMobile: form.exportPlainMobile
    })
    dialogVisible.value = false
    emit('success')
  } finally {
    submitting.value = false
  }
}

const open = async (options: OpenOptions) => {
  dialogTitle.value = options.title
  bizType.value = options.bizType
  submitHandler.value = options.submit
  form.authCode = ''
  form.exportPlainMobile = false
  expireMinutes.value = undefined
  countdown.value = 0
  clearTimer()
  const config = await OtherSettingConfigApi.getExportVerifyConfig()
  verifyConfig.needSendAuthCode = !!config?.needSendAuthCode
  verifyConfig.mobile = config?.mobile || []
  dialogVisible.value = true
  if (verifyConfig.needSendAuthCode) {
    await handleSendCode()
  }
}

onBeforeUnmount(() => {
  clearTimer()
})

defineExpose({ open })
</script>
