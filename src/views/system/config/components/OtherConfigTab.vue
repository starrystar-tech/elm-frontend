<template>
  <div class="panel-wrap">
    <el-form ref="formRef" :model="form" :rules="rules" v-loading="loading" label-width="0">
      <section class="config-section">
        <h4 class="section-title">通用设置</h4>
        <div class="section-body">
          <el-form-item prop="exportNeedSuperAdminVerify">
            <div class="line-item">
              <el-switch v-model="form.exportNeedSuperAdminVerify" />
              <span>开启后，批量导出时需超管的验证码授权，超管手机号为</span>
              <el-form-item prop="exportVerifySuperAdminMobile" class="inline-item">
                <el-input v-model="form.exportVerifySuperAdminMobile" style="width: 160px" />
              </el-form-item>
            </div>
          </el-form-item>
          <el-form-item prop="mobileCopyLimitEnabled">
            <div class="line-item">
              <el-switch v-model="form.mobileCopyLimitEnabled" />
              <span>开启后，每人每日最多复制</span>
              <el-form-item prop="mobileCopyLimitTimes" class="inline-item">
                <el-input-number v-model="form.mobileCopyLimitTimes" :min="0" :max="999" />
              </el-form-item>
              <span>次手机号</span>
            </div>
          </el-form-item>
          <el-form-item prop="mobileEncryptEnabled">
            <div class="line-item">
              <el-switch v-model="form.mobileEncryptEnabled" />
              <span>开启后，手机号中间 4 位加密</span>
            </div>
          </el-form-item>
        </div>
      </section>

      <el-divider />

      <section class="config-section">
        <h4 class="section-title">工单设置</h4>
        <div class="section-body">
          <el-form-item prop="workOrderTimeoutWarningEnabled">
            <div class="line-item">
              <el-switch v-model="form.workOrderTimeoutWarningEnabled" />
              <span>领取工单后开启超时预警，超时</span>
              <el-form-item prop="workOrderTimeoutWarningDays" class="inline-item">
                <el-input-number v-model="form.workOrderTimeoutWarningDays" :min="0" :max="999" />
              </el-form-item>
              <span>天未处理发送预警</span>
            </div>
          </el-form-item>
        </div>
      </section>

      <div class="action-wrap">
        <el-button type="primary" :loading="saving" :disabled="!canUpdate" @click="handleSave">保存</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { hasPermission } from '@/directives/permission/hasPermi'
import * as OtherSettingConfigApi from '@/api/crm/otherSettingConfig'

defineOptions({ name: 'OtherConfigTab' })

const message = useMessage()
const canUpdate = hasPermission(['crm:other-setting-config:update'])

const loading = ref(false)
const saving = ref(false)
const formRef = ref()

const form = reactive<OtherSettingConfigApi.OtherSettingConfigVO>({
  exportNeedSuperAdminVerify: false,
  exportVerifySuperAdminMobile: '',
  mobileCopyLimitEnabled: false,
  mobileCopyLimitTimes: 0,
  mobileEncryptEnabled: true,
  workOrderTimeoutWarningEnabled: false,
  workOrderTimeoutWarningDays: 1
})

const rules = reactive({
  exportNeedSuperAdminVerify: [{ required: true, message: '批量导出验证码授权开关不能为空', trigger: 'change' }],
  exportVerifySuperAdminMobile: [
    { required: true, message: '超管手机号不能为空', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '超管手机号格式不正确', trigger: 'blur' }
  ],
  mobileCopyLimitEnabled: [{ required: true, message: '每日复制手机号限制开关不能为空', trigger: 'change' }],
  mobileCopyLimitTimes: [{ required: true, message: '每日复制手机号次数不能为空', trigger: 'change' }],
  mobileEncryptEnabled: [{ required: true, message: '手机号加密开关不能为空', trigger: 'change' }],
  workOrderTimeoutWarningEnabled: [{ required: true, message: '工单超时预警开关不能为空', trigger: 'change' }],
  workOrderTimeoutWarningDays: [{ required: true, message: '工单超时预警天数不能为空', trigger: 'change' }]
})

const loadConfig = async () => {
  loading.value = true
  try {
    const data = await OtherSettingConfigApi.getOtherSettingConfig()
    if (data) Object.assign(form, data)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  saving.value = true
  try {
    await OtherSettingConfigApi.saveOtherSettingConfig(form)
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
.action-wrap {
  margin-top: 8px;
  padding-left: 14px;
}
</style>
