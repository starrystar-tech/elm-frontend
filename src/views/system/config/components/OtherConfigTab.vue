<template>
    <div class="panel-wrap">
        <el-form ref="formRef" :model="form" :rules="rules" v-loading="loading" label-width="0">
            <section class="config-section">
                <h4 class="section-title">通用设置</h4>
                <div class="section-body">
                    <el-form-item prop="general.mobileCopyLimitEnabled">
                        <div class="line-item">
                            <el-switch v-model="form.general.mobileCopyLimitEnabled" />
                            <span>开启后，每人每日最多复制</span>
                            <el-form-item prop="general.mobileCopyLimitTimes" class="inline-item">
                                <el-input-number
                                    v-model="form.general.mobileCopyLimitTimes"
                                    :min="0"
                                    :max="999"
                                />
                            </el-form-item>
                            <span>次手机号</span>
                        </div>
                    </el-form-item>
                    <el-form-item prop="general.mobileEncryptEnabled">
                        <div class="line-item">
                            <el-switch v-model="form.general.mobileEncryptEnabled" />
                            <span>开启后，手机号中间 4 位加密</span>
                        </div>
                    </el-form-item>
                </div>
            </section>

            <el-divider />

            <section class="config-section">
                <h4 class="section-title">系统通知</h4>
                <div class="section-body">
                    <el-form-item prop="systemNotify.newWorkOrderNotifyEnabled">
                        <div class="line-item">
                            <el-switch v-model="form.systemNotify.newWorkOrderNotifyEnabled" />
                            <span>开启后，有新分配的工单将收到通知</span>
                        </div>
                    </el-form-item>
                    <el-form-item prop="systemNotify.workOrderTimeoutWarningEnabled">
                        <div class="line-item">
                            <el-switch v-model="form.systemNotify.workOrderTimeoutWarningEnabled" />
                            <span>领取工单后超时</span>
                            <el-form-item
                                prop="systemNotify.workOrderTimeoutWarningValue"
                                class="inline-item"
                            >
                                <el-input-number
                                    v-model="form.systemNotify.workOrderTimeoutWarningValue"
                                    :min="0"
                                    :max="999"
                                />
                            </el-form-item>
                            <el-form-item
                                prop="systemNotify.workOrderTimeoutWarningUnit"
                                class="inline-item"
                            >
                                <el-select
                                    v-model="form.systemNotify.workOrderTimeoutWarningUnit"
                                    style="width: 96px"
                                >
                                    <el-option
                                        v-for="item in timeUnitOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <span>未处理发送预警</span>
                        </div>
                    </el-form-item>
                    <el-form-item prop="systemNotify.appointmentReminderValue">
                        <div class="line-item">
                            <span>距预约或回访时间</span>
                            <el-form-item
                                prop="systemNotify.appointmentReminderValue"
                                class="inline-item"
                            >
                                <el-input-number
                                    v-model="form.systemNotify.appointmentReminderValue"
                                    :min="0"
                                    :max="999"
                                />
                            </el-form-item>
                            <el-form-item
                                prop="systemNotify.appointmentReminderUnit"
                                class="inline-item"
                            >
                                <el-select
                                    v-model="form.systemNotify.appointmentReminderUnit"
                                    style="width: 96px"
                                >
                                    <el-option
                                        v-for="item in timeUnitOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <span>时提醒预约人</span>
                        </div>
                    </el-form-item>
                </div>
            </section>

            <el-divider />
            <section class="config-section">
                <h4 class="section-title">外呼线路</h4>
                <div class="section-body">
                    <el-form-item label-width="0">
                        <div class="route-select-wrap">
                            <el-select
                                v-model="form.outboundRouteId"
                                clearable
                                filterable
                                placeholder="请选择外呼线路"
                                class="route-select"
                            >
                                <el-option
                                    v-for="item in outboundRouteOptions"
                                    :key="item.id"
                                    :label="`${item.name}（${item.numberPrefix}）${item.status === 1 ? ' - 已禁用' : ''}`"
                                    :value="item.id"
                                    :disabled="item.status === 1"
                                />
                            </el-select>
                        </div>
                    </el-form-item>
                </div>
            </section>

            <el-divider />

            <section class="config-section">
                <h4 class="section-title">短信通知</h4>
                <div class="section-body">
                    <div class="notify-card">
                        <el-form-item prop="smsNotify.exportVerify.enabled">
                            <div class="line-item">
                                <el-switch v-model="form.smsNotify.exportVerify.enabled" />
                                <span>开启后，批量导出时需验证码授权</span>
                            </div>
                        </el-form-item>
                        <el-form-item prop="receiverTexts.exportVerify">
                            <div class="receiver-block">
                                <div class="receiver-label">接收手机号</div>
                                <el-input
                                    v-model="receiverTexts.exportVerify"
                                    type="textarea"
                                    :rows="3"
                                    placeholder="每行一个手机号，或使用逗号分隔"
                                />
                            </div>
                        </el-form-item>
                    </div>

                    <div class="notify-card">
                        <el-form-item prop="smsNotify.mobileCopyWarning.enabled">
                            <div class="line-item">
                                <el-switch v-model="form.smsNotify.mobileCopyWarning.enabled" />
                                <span>开启后，</span>
                                <el-form-item
                                    prop="smsNotify.mobileCopyWarning.minutes"
                                    class="inline-item"
                                >
                                    <el-input-number
                                        v-model="form.smsNotify.mobileCopyWarning.minutes"
                                        :min="0"
                                        :max="999"
                                    />
                                </el-form-item>
                                <span>分钟内复制手机号达到</span>
                                <el-form-item
                                    prop="smsNotify.mobileCopyWarning.times"
                                    class="inline-item"
                                >
                                    <el-input-number
                                        v-model="form.smsNotify.mobileCopyWarning.times"
                                        :min="0"
                                        :max="999"
                                    />
                                </el-form-item>
                                <span>次时发送预警</span>
                            </div>
                        </el-form-item>
                        <el-form-item prop="receiverTexts.mobileCopyWarning">
                            <div class="receiver-block">
                                <div class="receiver-label">接收手机号</div>
                                <el-input
                                    v-model="receiverTexts.mobileCopyWarning"
                                    type="textarea"
                                    :rows="3"
                                    placeholder="每行一个手机号，或使用逗号分隔"
                                />
                            </div>
                        </el-form-item>
                    </div>

                    <div class="notify-card">
                        <el-form-item prop="smsNotify.recordingDownloadWarning.enabled">
                            <div class="line-item">
                                <el-switch
                                    v-model="form.smsNotify.recordingDownloadWarning.enabled"
                                />
                                <span>开启后，</span>
                                <el-form-item
                                    prop="smsNotify.recordingDownloadWarning.minutes"
                                    class="inline-item"
                                >
                                    <el-input-number
                                        v-model="form.smsNotify.recordingDownloadWarning.minutes"
                                        :min="0"
                                        :max="999"
                                    />
                                </el-form-item>
                                <span>分钟内下载录音达到</span>
                                <el-form-item
                                    prop="smsNotify.recordingDownloadWarning.times"
                                    class="inline-item"
                                >
                                    <el-input-number
                                        v-model="form.smsNotify.recordingDownloadWarning.times"
                                        :min="0"
                                        :max="999"
                                    />
                                </el-form-item>
                                <span>次时发送预警</span>
                            </div>
                        </el-form-item>
                        <el-form-item prop="receiverTexts.recordingDownloadWarning">
                            <div class="receiver-block">
                                <div class="receiver-label">接收手机号</div>
                                <el-input
                                    v-model="receiverTexts.recordingDownloadWarning"
                                    type="textarea"
                                    :rows="3"
                                    placeholder="每行一个手机号，或使用逗号分隔"
                                />
                            </div>
                        </el-form-item>
                    </div>

                    <div class="notify-card">
                        <el-form-item prop="smsNotify.newIpLoginWarning.enabled">
                            <div class="line-item">
                                <el-switch v-model="form.smsNotify.newIpLoginWarning.enabled" />
                                <span>开启后，新 IP 登录时发送预警</span>
                            </div>
                        </el-form-item>
                        <el-form-item prop="receiverTexts.newIpLoginWarning">
                            <div class="receiver-block">
                                <div class="receiver-label">接收手机号</div>
                                <el-input
                                    v-model="receiverTexts.newIpLoginWarning"
                                    type="textarea"
                                    :rows="3"
                                    placeholder="每行一个手机号，或使用逗号分隔"
                                />
                            </div>
                        </el-form-item>
                    </div>
                </div>
            </section>

            <div class="action-wrap">
                <el-button
                    type="primary"
                    :loading="saving"
                    :disabled="!canUpdate"
                    @click="handleSave"
                    >保存</el-button
                >
            </div>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { hasPermission } from '@/directives/permission/hasPermi'
import * as OtherSettingConfigApi from '@/api/crm/otherSettingConfig'
import * as OutboundRouteApi from '@/api/system/call/router'
import {
    buildDefaultOtherSettingConfig,
    parseReceiverText,
    stringifyReceivers
} from './otherConfigForm.mjs'

defineOptions({ name: 'OtherConfigTab' })

const message = useMessage()
const canUpdate = hasPermission(['crm:other-setting-config:update'])

const loading = ref(false)
const saving = ref(false)
const formRef = ref()

const timeUnitOptions = [
    { label: '分钟', value: 1 },
    { label: '小时', value: 2 },
    { label: '天', value: 3 }
]

const form = reactive<OtherSettingConfigApi.OtherSettingConfigVO>(buildDefaultOtherSettingConfig())
const outboundRouteOptions = ref<OutboundRouteApi.OutboundRouteVO[]>([])
const receiverTexts = reactive({
    exportVerify: '',
    mobileCopyWarning: '',
    recordingDownloadWarning: '',
    newIpLoginWarning: ''
})

const rules = reactive({
    'general.mobileCopyLimitEnabled': [
        { required: true, message: '每日复制手机号限制开关不能为空', trigger: 'change' }
    ],
    'general.mobileCopyLimitTimes': [
        { required: true, message: '每日复制手机号次数不能为空', trigger: 'change' }
    ],
    'general.mobileEncryptEnabled': [
        { required: true, message: '手机号加密开关不能为空', trigger: 'change' }
    ],
    'systemNotify.newWorkOrderNotifyEnabled': [
        { required: true, message: '新分配工单通知开关不能为空', trigger: 'change' }
    ],
    'systemNotify.workOrderTimeoutWarningEnabled': [
        { required: true, message: '工单超时预警开关不能为空', trigger: 'change' }
    ],
    'systemNotify.workOrderTimeoutWarningValue': [
        { required: true, message: '工单超时预警时间不能为空', trigger: 'change' }
    ],
    'systemNotify.workOrderTimeoutWarningUnit': [
        { required: true, message: '工单超时预警时间单位不能为空', trigger: 'change' }
    ],
    'systemNotify.appointmentReminderValue': [
        { required: true, message: '预约或回访提醒时间不能为空', trigger: 'change' }
    ],
    'systemNotify.appointmentReminderUnit': [
        { required: true, message: '预约或回访提醒时间单位不能为空', trigger: 'change' }
    ],
    'smsNotify.exportVerify.enabled': [
        { required: true, message: '导出验证码授权开关不能为空', trigger: 'change' }
    ],
    'smsNotify.mobileCopyWarning.enabled': [
        { required: true, message: '复制手机号预警开关不能为空', trigger: 'change' }
    ],
    'smsNotify.mobileCopyWarning.minutes': [
        { required: true, message: '复制手机号预警分钟数不能为空', trigger: 'change' }
    ],
    'smsNotify.mobileCopyWarning.times': [
        { required: true, message: '复制手机号预警次数不能为空', trigger: 'change' }
    ],
    'smsNotify.recordingDownloadWarning.enabled': [
        { required: true, message: '录音下载预警开关不能为空', trigger: 'change' }
    ],
    'smsNotify.recordingDownloadWarning.minutes': [
        { required: true, message: '录音下载预警分钟数不能为空', trigger: 'change' }
    ],
    'smsNotify.recordingDownloadWarning.times': [
        { required: true, message: '录音下载预警次数不能为空', trigger: 'change' }
    ],
    'smsNotify.newIpLoginWarning.enabled': [
        { required: true, message: '新IP登录预警开关不能为空', trigger: 'change' }
    ]
})

const syncReceiverTextsFromForm = () => {
    receiverTexts.exportVerify = stringifyReceivers(form.smsNotify.exportVerify.receivers)
    receiverTexts.mobileCopyWarning = stringifyReceivers(form.smsNotify.mobileCopyWarning.receivers)
    receiverTexts.recordingDownloadWarning = stringifyReceivers(
        form.smsNotify.recordingDownloadWarning.receivers
    )
    receiverTexts.newIpLoginWarning = stringifyReceivers(form.smsNotify.newIpLoginWarning.receivers)
}

const buildPayload = (): OtherSettingConfigApi.OtherSettingConfigVO => ({
    ...form,
    outboundRouteId: form.outboundRouteId,
    general: { ...form.general },
    systemNotify: { ...form.systemNotify },
    smsNotify: {
        exportVerify: {
            ...form.smsNotify.exportVerify,
            receivers: parseReceiverText(receiverTexts.exportVerify)
        },
        mobileCopyWarning: {
            ...form.smsNotify.mobileCopyWarning,
            receivers: parseReceiverText(receiverTexts.mobileCopyWarning)
        },
        recordingDownloadWarning: {
            ...form.smsNotify.recordingDownloadWarning,
            receivers: parseReceiverText(receiverTexts.recordingDownloadWarning)
        },
        newIpLoginWarning: {
            ...form.smsNotify.newIpLoginWarning,
            receivers: parseReceiverText(receiverTexts.newIpLoginWarning)
        }
    }
})

const loadOutboundRouteOptions = async () => {
    outboundRouteOptions.value = await OutboundRouteApi.getOutboundRouteSimpleList()
}

const hasInvalidReceiver = (text: string) =>
    parseReceiverText(text).some((item) => !/^1\d{10}$/.test(item))

const loadConfig = async () => {
    loading.value = true
    try {
        const data = await OtherSettingConfigApi.getOtherSettingConfig()
        if (data) Object.assign(form, buildDefaultOtherSettingConfig(), data)
        syncReceiverTextsFromForm()
    } finally {
        loading.value = false
    }
}

const handleSave = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return
    if (
        hasInvalidReceiver(receiverTexts.exportVerify) ||
        hasInvalidReceiver(receiverTexts.mobileCopyWarning) ||
        hasInvalidReceiver(receiverTexts.recordingDownloadWarning) ||
        hasInvalidReceiver(receiverTexts.newIpLoginWarning)
    ) {
        message.error('接收手机号格式不正确')
        return
    }
    saving.value = true
    try {
        await OtherSettingConfigApi.saveOtherSettingConfig(buildPayload())
        message.success('保存成功')
        await loadConfig()
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadOutboundRouteOptions()
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
    gap: 14px;
}
.route-select-wrap {
    width: min(360px, 100%);
}
.route-select {
    width: 100%;
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
.notify-card {
    padding: 14px 16px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    background: var(--el-fill-color-extra-light);
}
.receiver-block {
    width: min(560px, 100%);
}
.receiver-label {
    margin-bottom: 8px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
}
.action-wrap {
    margin-top: 8px;
    padding-left: 14px;
}
</style>
