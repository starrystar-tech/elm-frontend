<template>
    <div class="internal-call-page">
        <el-row :gutter="16">
            <el-col :xl="16" :lg="16" :md="24" :sm="24" :xs="24">
                <el-card shadow="never" class="hero-card">
                    <div class="hero-grid">
                        <div>
                            <div class="eyebrow">FreeSWITCH Test Console</div>
                            <h1 class="hero-title">内部号拨打测试</h1>
                            <p class="hero-subtitle">
                                既可以让浏览器直接作为分机注册到 FreeSWITCH，也可以继续使用后端发起
                                ESL 桥接测试。
                            </p>
                        </div>
                        <div class="status-stack">
                            <div
                                class="status-chip"
                                :class="{
                                    live: isInCall,
                                    ringing: isRingingState && !isInCall
                                }"
                            >
                                <span
                                    class="status-dot"
                                    :class="{
                                        active: browserRegistered || activeCall || incomingCall,
                                        live: isInCall,
                                        ringing: isRingingState && !isInCall
                                    }"
                                ></span>
                                <span>浏览器分机 {{ browserStatus }}</span>
                                <strong v-if="isInCall" class="status-timer">{{
                                    formattedCallDuration
                                }}</strong>
                            </div>
                            <div class="status-hint">
                                当前默认走 {{ defaultBrowserPhoneConfig.wsServer }}
                            </div>
                        </div>
                    </div>
                </el-card>

                <el-card
                    shadow="never"
                    class="mt-16px"
                    :class="{
                        'phone-card-live': isInCall,
                        'phone-card-ringing': isRingingState && !isInCall
                    }"
                >
                    <template #header>
                        <div class="card-header">
                            <span>浏览器分机</span>
                            <el-button
                                link
                                type="primary"
                                @click="reloadProfile"
                                :loading="profileLoading"
                            >
                                刷新当前分机
                            </el-button>
                        </div>
                    </template>

                    <div
                        v-if="activeCall || incomingCall"
                        class="call-banner"
                        :class="{
                            live: isInCall,
                            ringing: isRingingState && !isInCall
                        }"
                    >
                        <div class="call-banner-copy">
                            <div class="call-banner-label">{{ browserStatus }}</div>
                            <div class="call-banner-meta">
                                <span v-if="isInCall">通话时长 {{ formattedCallDuration }}</span>
                                <span v-else-if="browserStatus === '呼叫中'">正在等待对方接听</span>
                                <span v-else-if="browserStatus === '来电响铃'"
                                    >有新的来电等待接听</span
                                >
                            </div>
                        </div>
                        <el-button
                            v-if="activeCall || incomingCall"
                            type="danger"
                            class="call-banner-action"
                            @click="hangupBrowserCall"
                        >
                            {{ incomingCall && !isInCall ? '拒接/挂断' : '立即挂断' }}
                        </el-button>
                    </div>

                    <el-form :model="browserForm" label-width="100px" class="dial-form">
                        <el-row :gutter="16">
                            <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                                <el-form-item label="WSS 地址">
                                    <el-input
                                        v-model="browserForm.wsServer"
                                        :placeholder="defaultBrowserPhoneConfig.wsServer"
                                    />
                                </el-form-item>
                            </el-col>
                            <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                                <el-form-item label="SIP 域名">
                                    <el-input
                                        v-model="browserForm.domain"
                                        :placeholder="defaultBrowserPhoneConfig.domain"
                                    />
                                </el-form-item>
                            </el-col>
                            <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                                <el-form-item label="分机账号">
                                    <el-input
                                        v-model="browserForm.username"
                                        placeholder="例如 1001"
                                        clearable
                                    />
                                </el-form-item>
                            </el-col>
                            <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                                <el-form-item label="分机密码">
                                    <el-input
                                        v-model="browserForm.password"
                                        type="password"
                                        show-password
                                        placeholder="请输入该分机的 SIP 密码"
                                        clearable
                                        @keyup.enter="connectBrowserPhone"
                                    />
                                </el-form-item>
                            </el-col>
                        </el-row>

                        <div class="action-row">
                            <el-button
                                type="primary"
                                :loading="browserLoading"
                                :disabled="browserRegistered"
                                @click="connectBrowserPhone"
                            >
                                连接并注册
                            </el-button>
                            <el-button :disabled="!browserClient" @click="() => disconnectBrowserPhone()"
                                >断开分机</el-button
                            >
                        </div>
                    </el-form>

                    <el-divider content-position="left">网页拨号</el-divider>

                    <el-form :model="browserForm" label-width="100px" class="dial-form">
                        <el-row :gutter="16">
                            <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                                <el-form-item label="当前分机">
                                    <el-input v-model="browserForm.username" disabled />
                                </el-form-item>
                            </el-col>
                            <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                                <el-form-item label="目标分机">
                                    <el-input
                                        v-model="browserForm.target"
                                        placeholder="请输入目标内部号，例如 1002"
                                        clearable
                                        @keyup.enter="makeBrowserCall"
                                    />
                                </el-form-item>
                            </el-col>
                        </el-row>

                        <div class="action-row wrap">
                            <el-button
                                type="success"
                                :disabled="activeCall || browserLoading"
                                @click="makeBrowserCall"
                            >
                                拨打
                            </el-button>
                            <el-button
                                type="warning"
                                :disabled="!incomingCall"
                                @click="answerBrowserCall"
                            >
                                接听
                            </el-button>
                            <el-button
                                type="danger"
                                :disabled="!activeCall && !incomingCall"
                                @click="hangupBrowserCall"
                            >
                                挂断
                            </el-button>
                            <span class="soft-note">
                                来电或通话没有声音时，优先检查浏览器麦克风权限、
                                <code>{{ defaultSipHost }}</code>
                                证书是否有效，以及 Nginx 到 `5066` 的反代是否正常。
                            </span>
                        </div>
                    </el-form>
                </el-card>

                <el-card shadow="never" class="mt-16px">
                    <template #header>
                        <div class="card-header">
                            <span>服务器桥接测试</span>
                        </div>
                    </template>

                    <el-form
                        ref="formRef"
                        :model="formData"
                        :rules="rules"
                        label-width="100px"
                        class="dial-form"
                    >
                        <el-row :gutter="16">
                            <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                                <el-form-item label="主叫分机" prop="caller">
                                    <el-input
                                        v-model="formData.caller"
                                        placeholder="留空则读取当前登录用户 callExt / callNo"
                                        clearable
                                    />
                                </el-form-item>
                            </el-col>
                            <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                                <el-form-item label="被叫分机" prop="callee">
                                    <el-input
                                        v-model="formData.callee"
                                        placeholder="请输入目标内部号，例如 1002"
                                        clearable
                                        @keyup.enter="handleDial"
                                    />
                                </el-form-item>
                            </el-col>
                        </el-row>

                        <div class="action-row">
                            <el-button type="primary" :loading="submitting" @click="handleDial"
                                >发起拨打</el-button
                            >
                            <el-button @click="handleReset">重置</el-button>
                        </div>
                    </el-form>
                </el-card>
            </el-col>

            <el-col :xl="8" :lg="8" :md="24" :sm="24" :xs="24">
                <el-card shadow="never" class="profile-card">
                    <template #header>
                        <div class="card-header">
                            <span>当前坐席</span>
                        </div>
                    </template>
                    <div class="profile-block">
                        <div class="profile-name">{{
                            profile.nickname || userStore.getUser.nickname || '未命名用户'
                        }}</div>
                        <div class="profile-line">登录账号：{{ profile.username || '-' }}</div>
                        <div class="profile-line">优先分机：{{ profile.callExt || '-' }}</div>
                        <div class="profile-line">备用工号：{{ profile.callNo || '-' }}</div>
                        <div class="profile-line">最近登录 IP：{{ profile.loginIp || '-' }}</div>
                    </div>
                </el-card>

                <el-card shadow="never" class="mt-16px">
                    <template #header>
                        <div class="card-header">
                            <span>最近结果</span>
                            <el-button
                                link
                                type="danger"
                                @click="clearLogs"
                                :disabled="logs.length === 0"
                            >
                                清空
                            </el-button>
                        </div>
                    </template>

                    <el-empty
                        v-if="logs.length === 0"
                        description="还没有拨打记录"
                        :image-size="88"
                    />

                    <div v-else class="log-list">
                        <div v-for="item in logs" :key="item.id" class="log-item">
                            <div class="log-top">
                                <span class="log-route"
                                    >{{ item.caller }} -> {{ item.callee }}</span
                                >
                                <el-tag :type="item.type" effect="light">{{ item.label }}</el-tag>
                            </div>
                            <div class="log-meta">{{ item.time }}</div>
                            <div class="log-message">{{ item.message }}</div>
                            <div v-if="item.jobUuid" class="log-job"
                                >Job UUID: {{ item.jobUuid }}</div
                            >
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus'
import { testDialInternalCall, type CallTestDialReqVO, type CallTestDialRespVO } from '@/api/system/call'
import { activeBrandConfig } from '@/config/brand'
import { useBrowserPhone } from '@/hooks/web/useBrowserPhone'
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'CrmCallTest' })

const userStore = useUserStore()
const message = useMessage()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const defaultBrowserPhoneConfig = activeBrandConfig.browserPhone
const defaultSipHost = computed(() => {
    try {
        return new URL(defaultBrowserPhoneConfig.wsServer).hostname
    } catch {
        return defaultBrowserPhoneConfig.wsServer
    }
})

const {
    profile,
    profileLoading,
    browserLoading,
    browserRegistered,
    incomingCall,
    activeCall,
    browserStatus,
    browserClient,
    browserForm,
    logs,
    formattedCallDuration,
    isInCall,
    isRingingState,
    reloadProfile,
    connectBrowserPhone,
    disconnectBrowserPhone,
    makeBrowserCall,
    answerBrowserCall,
    hangupBrowserCall,
    clearLogs,
    appendLog,
    initBrowserPhone
} = useBrowserPhone()

const formData = reactive<CallTestDialReqVO>({
    caller: '',
    callee: ''
})

const rules = reactive<FormRules>({
    caller: [{ pattern: /^\d*$/, message: '主叫分机只能输入数字', trigger: 'blur' }],
    callee: [
        { required: true, message: '请输入被叫分机', trigger: 'blur' },
        { pattern: /^\d+$/, message: '被叫分机只能输入数字', trigger: 'blur' }
    ]
})

const handleDial = async () => {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) {
        return
    }

    submitting.value = true
    try {
        const response = await testDialInternalCall({
            caller: formData.caller?.trim(),
            callee: formData.callee.trim()
        })
        const data = response as unknown as CallTestDialRespVO
        appendLog({
            caller: data.caller,
            callee: data.callee,
            jobUuid: data.jobUuid,
            message: data.message || '拨号请求已下发',
            label: '已提交',
            type: 'success'
        })
        message.success('拨打请求已提交到 FreeSWITCH')
    } catch (error: any) {
        const errorMessage = error?.message || '拨打失败'
        appendLog({
            caller: formData.caller || profile.callExt || profile.callNo || '-',
            callee: formData.callee,
            message: errorMessage,
            label: '失败',
            type: 'danger'
        })
        message.error(errorMessage)
    } finally {
        submitting.value = false
    }
}

const handleReset = () => {
    formRef.value?.resetFields()
    formData.caller = profile.callExt || profile.callNo || ''
}

onMounted(() => {
    void initBrowserPhone()
})

watch(
    () => [profile.callExt, profile.callNo],
    ([callExt, callNo]) => {
        if (!formData.caller) {
            formData.caller = callExt || callNo || ''
        }
    },
    { immediate: true }
)
</script>

<style scoped>
.internal-call-page {
    padding: 4px 0 24px;
}

.hero-card {
    overflow: hidden;
    background:
        radial-gradient(circle at top left, rgba(15, 118, 110, 0.22), transparent 36%),
        linear-gradient(135deg, #072c31, #114b52 60%, #d2efe8 160%);
    border: none;
}

.hero-grid {
    display: flex;
    gap: 24px;
    align-items: flex-start;
    justify-content: space-between;
    color: #effcf7;
}

.status-stack {
    display: grid;
    gap: 10px;
    justify-items: end;
}

.eyebrow {
    font-size: 12px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.75;
}

.hero-title {
    margin: 12px 0 8px;
    font-size: 32px;
    line-height: 1.1;
    font-weight: 700;
}

.hero-subtitle {
    margin: 0;
    max-width: 640px;
    font-size: 14px;
    line-height: 1.8;
    color: rgba(239, 252, 247, 0.82);
}

.status-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    white-space: nowrap;
}

.status-chip.live {
    background: rgba(248, 113, 113, 0.18);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18) inset;
}

.status-chip.ringing {
    background: rgba(250, 204, 21, 0.18);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18) inset;
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #f97316;
    box-shadow: 0 0 0 6px rgba(74, 222, 128, 0.15);
}

.status-dot.active {
    background: #4ade80;
}

.status-dot.live {
    background: #fb7185;
    box-shadow: 0 0 0 6px rgba(251, 113, 133, 0.18);
}

.status-dot.ringing {
    background: #facc15;
    box-shadow: 0 0 0 6px rgba(250, 204, 21, 0.18);
}

.status-timer {
    font-variant-numeric: tabular-nums;
}

.status-hint {
    max-width: 320px;
    font-size: 12px;
    line-height: 1.6;
    color: rgba(239, 252, 247, 0.78);
    text-align: right;
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.dial-form {
    max-width: 100%;
}

.phone-card-live {
    border: 1px solid rgba(251, 113, 133, 0.28);
    box-shadow: 0 18px 40px rgba(190, 24, 93, 0.1);
}

.phone-card-ringing {
    border: 1px solid rgba(250, 204, 21, 0.32);
    box-shadow: 0 18px 40px rgba(202, 138, 4, 0.08);
}

.call-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    padding: 16px 18px;
    border-radius: 14px;
    border: 1px solid #dbeafe;
    background: linear-gradient(135deg, #eff6ff, #f8fafc);
}

.call-banner.live {
    border-color: rgba(251, 113, 133, 0.28);
    background: linear-gradient(135deg, #fff1f2, #fff7ed);
}

.call-banner.ringing {
    border-color: rgba(250, 204, 21, 0.3);
    background: linear-gradient(135deg, #fefce8, #fff7ed);
}

.call-banner-copy {
    display: grid;
    gap: 4px;
}

.call-banner-label {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
}

.call-banner-meta {
    font-size: 13px;
    color: #475569;
}

.call-banner-action {
    flex-shrink: 0;
}

.action-row {
    display: flex;
    gap: 12px;
    padding-left: 100px;
    align-items: center;
}

.action-row.wrap {
    flex-wrap: wrap;
}

.soft-note {
    font-size: 12px;
    line-height: 1.6;
    color: #64748b;
}

.profile-card,
.log-list {
    height: 100%;
}

.profile-block {
    display: grid;
    gap: 10px;
}

.profile-name {
    font-size: 22px;
    font-weight: 600;
    color: #0f172a;
}

.profile-line {
    font-size: 14px;
    color: #475569;
}

.log-list {
    display: grid;
    gap: 12px;
}

.log-item {
    padding: 14px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
}

.log-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.log-route {
    font-weight: 600;
    color: #0f172a;
}

.log-meta,
.log-job {
    margin-top: 6px;
    font-size: 12px;
    color: #64748b;
}

.log-message {
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.6;
    color: #334155;
    word-break: break-all;
}

@media (max-width: 768px) {
    .hero-grid {
        flex-direction: column;
    }

    .hero-title {
        font-size: 26px;
    }

    .action-row {
        padding-left: 0;
    }

    .call-banner {
        align-items: flex-start;
        flex-direction: column;
    }
}
</style>
