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
                                <strong v-if="isInCall" class="status-timer">{{ formattedCallDuration }}</strong>
                            </div>
                            <div class="status-hint"
                                >当前默认走 `wss://sip.bgwa.cn`，由 Nginx 终止 TLS 后反代到
                                FreeSWITCH 的 `ws://127.0.0.1:5066`。</div
                            >
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
                                <span v-else-if="browserStatus === '来电响铃'">有新的来电等待接听</span>
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
                                        placeholder="wss://sip.bgwa.cn"
                                    />
                                </el-form-item>
                            </el-col>
                            <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                                <el-form-item label="SIP 域名">
                                    <el-input
                                        v-model="browserForm.domain"
                                        placeholder="60.205.112.131"
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
                            <el-button :disabled="!browserClient" @click="disconnectBrowserPhone"
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
                                来电或通话没有声音时，优先检查浏览器麦克风权限、`sip.bgwa.cn`
                                证书是否有效，以及 Nginx 到 `5066` 的反代是否正常。
                            </span>
                        </div>
                    </el-form>

                    <audio ref="remoteAudioRef" autoplay playsinline class="hidden-audio"></audio>
                    <audio
                        ref="localAudioRef"
                        autoplay
                        playsinline
                        muted
                        class="hidden-audio"
                    ></audio>
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
import { getUserProfile, type ProfileVO } from '@/api/system/user/profile'
import {
    testDialInternalCall,
    type CallTestDialReqVO,
    type CallTestDialRespVO
} from '@/api/system/call'
import { useUserStore } from '@/store/modules/user'

defineOptions({ name: 'Index' })

type LogItem = {
    id: number
    caller: string
    callee: string
    time: string
    message: string
    jobUuid?: string
    label: string
    type: 'success' | 'danger'
}

const userStore = useUserStore()
const message = useMessage()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const profileLoading = ref(false)
const browserLoading = ref(false)
const browserRegistered = ref(false)
const browserConnecting = ref(false)
const incomingCall = ref(false)
const activeCall = ref(false)
const browserStatus = ref('未连接')
const browserDisconnecting = ref(false)
const browserClient = shallowRef<any>()
const remoteAudioRef = ref<HTMLAudioElement>()
const localAudioRef = ref<HTMLAudioElement>()
const callDurationSeconds = ref(0)
let callDurationTimer: ReturnType<typeof setInterval> | undefined
let browserRegisterWaiter:
    | {
          resolve: () => void
          reject: (error: Error) => void
      }
    | undefined

const profile = reactive<Partial<ProfileVO>>({})
const browserForm = reactive({
    wsServer: 'wss://sip.bgwa.cn',
    domain: '60.205.112.131',
    username: '',
    password: '',
    target: ''
})
const formData = reactive<CallTestDialReqVO>({
    caller: '',
    callee: ''
})
const logs = ref<LogItem[]>([])

const rules = reactive<FormRules>({
    caller: [{ pattern: /^\d*$/, message: '主叫分机只能输入数字', trigger: 'blur' }],
    callee: [
        { required: true, message: '请输入被叫分机', trigger: 'blur' },
        { pattern: /^\d+$/, message: '被叫分机只能输入数字', trigger: 'blur' }
    ]
})

const addLog = (
    payload: Pick<LogItem, 'caller' | 'callee' | 'message' | 'jobUuid' | 'label' | 'type'>
) => {
    logs.value.unshift({
        id: Date.now() + logs.value.length,
        time: new Date().toLocaleString('zh-CN', { hour12: false }),
        ...payload
    })
}

const syncCallerFromProfile = () => {
    if (!formData.caller) {
        formData.caller = profile.callExt || profile.callNo || ''
    }
    if (!browserForm.username) {
        browserForm.username = profile.callExt || profile.callNo || ''
    }
}

const reloadProfile = async () => {
    profileLoading.value = true
    try {
        const data = await getUserProfile()
        Object.assign(profile, data)
        syncCallerFromProfile()
    } finally {
        profileLoading.value = false
    }
}

const updateBrowserStatus = (status: string) => {
    browserStatus.value = status
}

const buildBrowserTraceContext = () => ({
    wsServer: browserForm.wsServer.trim(),
    domain: browserForm.domain.trim(),
    username: browserForm.username.trim(),
    hasPassword: !!browserForm.password.trim(),
    passwordLength: browserForm.password.trim().length,
    target: browserForm.target.trim(),
    status: browserStatus.value,
    registered: browserRegistered.value,
    connecting: browserConnecting.value,
    disconnecting: browserDisconnecting.value,
    incomingCall: incomingCall.value,
    activeCall: activeCall.value,
    hasClient: !!browserClient.value
})

const stringifyTraceContext = () => JSON.stringify(buildBrowserTraceContext())

const traceBrowserStep = (
    step: string,
    details?: string,
    type: 'success' | 'danger' = 'success'
) => {
    const messageText = details
        ? `[${step}] ${details} | ${stringifyTraceContext()}`
        : `[${step}] ${stringifyTraceContext()}`
    addBrowserLog(messageText, '调试', type)
    const logger = type === 'danger' ? console.warn : console.info
    logger(`[BrowserPhone] ${step}`, buildBrowserTraceContext(), details || '')
}

const formatBrowserError = (error: any) => {
    if (!error) {
        return '未知错误'
    }
    if (typeof error === 'string') {
        return error
    }
    const parts = [
        error.message,
        error.cause?.message,
        error.reason,
        error.statusCode ? `statusCode=${error.statusCode}` : '',
        error.code ? `code=${error.code}` : '',
        error.name ? `name=${error.name}` : '',
        error.stack
    ]
        .filter((item) => typeof item === 'string' && item.trim().length > 0)
        .map((item) => item.trim())
    return parts[0] || '未知错误'
}

const describeBrowserError = (error: any) => {
    if (!error) {
        return 'error=<empty>'
    }
    if (typeof error === 'string') {
        return `error=${error}`
    }
    const parts = [
        error.name ? `name=${error.name}` : '',
        error.message ? `message=${error.message}` : '',
        error.reason ? `reason=${error.reason}` : '',
        error.statusCode ? `statusCode=${error.statusCode}` : '',
        error.code ? `code=${error.code}` : '',
        error.cause?.name ? `causeName=${error.cause.name}` : '',
        error.cause?.message ? `causeMessage=${error.cause.message}` : ''
    ].filter((item) => item.length > 0)
    return parts.join(', ') || 'error=<object without known fields>'
}

const markBrowserRegistered = () => {
    const firstRegister = !browserRegistered.value
    browserRegistered.value = true
    updateBrowserStatus('已注册')
    browserRegisterWaiter?.resolve()
    browserRegisterWaiter = undefined
    if (firstRegister) {
        addBrowserLog('浏览器分机注册成功')
    }
    traceBrowserStep('REGISTERED')
}

const failPendingBrowserRegistration = (reason: string) => {
    if (!browserRegisterWaiter) {
        return
    }
    browserRegisterWaiter.reject(new Error(reason))
    browserRegisterWaiter = undefined
}

const waitForBrowserRegistration = (timeoutMs = 10000) =>
    new Promise<void>((resolve, reject) => {
        traceBrowserStep('REGISTER_WAIT_START', `timeoutMs=${timeoutMs}`)
        const timer = window.setTimeout(() => {
            if (browserRegisterWaiter?.reject === reject) {
                browserRegisterWaiter = undefined
            }
            traceBrowserStep('REGISTER_WAIT_TIMEOUT', `timeoutMs=${timeoutMs}`, 'danger')
            reject(new Error(`SIP 注册超时（${timeoutMs}ms）`))
        }, timeoutMs)

        browserRegisterWaiter = {
            resolve: () => {
                window.clearTimeout(timer)
                resolve()
            },
            reject: (error: Error) => {
                window.clearTimeout(timer)
                reject(error)
            }
        }
    })

const isInCall = computed(() => browserStatus.value === '通话中')
const isRingingState = computed(
    () => browserStatus.value === '呼叫中' || browserStatus.value === '来电响铃'
)
const formattedCallDuration = computed(() => {
    const minutes = Math.floor(callDurationSeconds.value / 60)
    const seconds = callDurationSeconds.value % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const stopCallTimer = () => {
    if (callDurationTimer) {
        clearInterval(callDurationTimer)
        callDurationTimer = undefined
    }
    callDurationSeconds.value = 0
}

const startCallTimer = () => {
    stopCallTimer()
    callDurationTimer = setInterval(() => {
        callDurationSeconds.value += 1
    }, 1000)
}

const addBrowserLog = (
    messageText: string,
    label: string = '浏览器',
    type: 'success' | 'danger' = 'success'
) => {
    addLog({
        caller: browserForm.username || '-',
        callee: browserForm.target || '-',
        message: messageText,
        label,
        type
    })
}

const ensureBrowserPrerequisites = async () => {
    traceBrowserStep('PREREQ_START')
    if (!browserForm.username.trim()) {
        throw new Error('请输入浏览器分机账号')
    }
    if (!browserForm.password.trim()) {
        throw new Error('请输入浏览器分机密码')
    }
    if (!remoteAudioRef.value || !localAudioRef.value) {
        throw new Error('音频节点尚未准备好，请刷新页面后重试')
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    stream.getTracks().forEach((track) => track.stop())
    traceBrowserStep('PREREQ_OK')
}

const createBrowserClient = async () => {
    const { SimpleUser } = await import('sip.js/lib/platform/web')
    traceBrowserStep('CLIENT_CREATE')
    traceBrowserStep(
        'REGISTER_CONTEXT',
        `aor=sip:${browserForm.username.trim()}@${browserForm.domain.trim()}, authUser=${browserForm.username.trim()}, ws=${browserForm.wsServer.trim()}, hasPassword=${!!browserForm.password.trim()}, passwordLength=${browserForm.password.trim().length}`
    )
    const client = new SimpleUser(browserForm.wsServer, {
        aor: `sip:${browserForm.username.trim()}@${browserForm.domain.trim()}`,
        media: {
            constraints: { audio: true, video: false },
            local: { audio: localAudioRef.value },
            remote: { audio: remoteAudioRef.value }
        },
        userAgentOptions: {
            authorizationUsername: browserForm.username.trim(),
            authorizationPassword: browserForm.password.trim(),
            displayName: browserForm.username.trim()
        },
        delegate: {
            onCallReceived: () => {
                incomingCall.value = true
                activeCall.value = true
                updateBrowserStatus('来电响铃')
                traceBrowserStep('CALL_RECEIVED')
                addBrowserLog('收到来电，请点击接听', '来电')
            },
            onCallAnswered: () => {
                incomingCall.value = false
                activeCall.value = true
                updateBrowserStatus('通话中')
                startCallTimer()
                traceBrowserStep('CALL_ANSWERED')
                addBrowserLog('通话已接通', '通话中')
            },
            onCallHangup: () => {
                incomingCall.value = false
                activeCall.value = false
                stopCallTimer()
                updateBrowserStatus(browserRegistered.value ? '已注册' : '未连接')
                traceBrowserStep('CALL_HANGUP')
                addBrowserLog('通话已结束', '已挂断')
            },
            onRegistered: () => {
                markBrowserRegistered()
            },
            onUnregistered: () => {
                browserRegistered.value = false
                incomingCall.value = false
                activeCall.value = false
                stopCallTimer()
                updateBrowserStatus(browserConnecting.value ? '注册失败' : '未注册')
                const reason = browserDisconnecting.value
                    ? '客户端主动断开后收到注销事件'
                    : browserConnecting.value
                      ? 'SIP 注册后立即被服务器注销'
                      : 'SIP 已注销'
                failPendingBrowserRegistration(reason)
                traceBrowserStep(
                    'UNREGISTERED',
                    `connecting=${browserConnecting.value}, disconnecting=${browserDisconnecting.value}, reason=${reason}`
                )
                if (!browserDisconnecting.value && !browserConnecting.value) {
                    addBrowserLog('浏览器分机已注销')
                }
            },
            onServerConnect: () => {
                updateBrowserStatus('信令已连接')
                traceBrowserStep('WS_CONNECTED')
            },
            onServerDisconnect: (error?: Error) => {
                browserRegistered.value = false
                incomingCall.value = false
                activeCall.value = false
                stopCallTimer()
                updateBrowserStatus(browserDisconnecting.value ? '未连接' : '连接断开')
                const reason = error?.message || 'WSS 连接已断开'
                failPendingBrowserRegistration(reason)
                traceBrowserStep('WS_DISCONNECTED', error?.message, error?.message ? 'danger' : 'success')
                if (!browserDisconnecting.value && error?.message) {
                    addBrowserLog(`WSS 连接断开：${error.message}`, '失败', 'danger')
                }
            }
        }
    } as any)
    return client
}

const connectBrowserPhone = async () => {
    browserLoading.value = true
    browserConnecting.value = true
    try {
        browserDisconnecting.value = false
        traceBrowserStep('CONNECT_START')
        await ensureBrowserPrerequisites()
        if (browserClient.value) {
            traceBrowserStep('CONNECT_CLEANUP_PREVIOUS')
            await disconnectBrowserPhone(true)
        }
        const client = await createBrowserClient()
        browserClient.value = client
        updateBrowserStatus('连接中')
        traceBrowserStep('WS_CONNECTING')
        await client.connect()
        traceBrowserStep('REGISTER_SENDING')
        const registrationPromise = waitForBrowserRegistration()
        await client.register()
        traceBrowserStep('REGISTER_REQUEST_SENT')
        await registrationPromise
        message.success('浏览器分机已连接')
    } catch (error: any) {
        const errorMessage = formatBrowserError(error) || '浏览器分机连接失败'
        updateBrowserStatus('连接失败')
        traceBrowserStep(
            'CONNECT_FAILED',
            `${errorMessage}; ${describeBrowserError(error)}`,
            'danger'
        )
        addBrowserLog(errorMessage, '失败', 'danger')
        message.error(errorMessage)
        if (browserClient.value) {
            await disconnectBrowserPhone(true)
        }
    } finally {
        browserConnecting.value = false
        browserLoading.value = false
    }
}

const disconnectBrowserPhone = async (silent = false) => {
    const client = browserClient.value
    const wasRegistered = browserRegistered.value
    browserClient.value = undefined
    browserDisconnecting.value = true
    failPendingBrowserRegistration('浏览器分机连接已取消')
    traceBrowserStep('DISCONNECT_START', `silent=${silent}, wasRegistered=${wasRegistered}`)
    if (client) {
        try {
            await client.hangup?.().catch(() => undefined)
        } catch {
            // ignore
        }
        if (wasRegistered) {
            try {
                await client.unregister?.().catch(() => undefined)
            } catch {
                // ignore
            }
        }
        try {
            await client.disconnect?.().catch(() => undefined)
        } catch {
            // ignore
        }
    }
    browserRegistered.value = false
    incomingCall.value = false
    activeCall.value = false
    stopCallTimer()
    updateBrowserStatus('未连接')
    if (!silent) {
        addBrowserLog('浏览器分机已断开')
    }
    traceBrowserStep('DISCONNECT_DONE', `silent=${silent}`)
}

const makeBrowserCall = async () => {
    if (!browserRegistered.value || !browserClient.value) {
        traceBrowserStep('CALL_BLOCKED', '浏览器分机未注册或客户端未初始化', 'danger')
        message.error('请先注册浏览器分机')
        return
    }
    const target = browserForm.target.trim()
    if (!/^\d+$/.test(target)) {
        traceBrowserStep('CALL_BLOCKED', '目标分机格式不合法', 'danger')
        message.error('请输入合法的目标分机')
        return
    }
    try {
        activeCall.value = true
        updateBrowserStatus('呼叫中')
        traceBrowserStep('CALL_START', `target=${target}`)
        await browserClient.value.call(`sip:${target}@${browserForm.domain.trim()}`)
        traceBrowserStep('CALL_SENT', `target=${target}`)
        addBrowserLog(`已向 ${target} 发起网页呼叫`)
    } catch (error: any) {
        activeCall.value = false
        updateBrowserStatus('已注册')
        const errorMessage = formatBrowserError(error) || '网页呼叫失败'
        traceBrowserStep('CALL_FAILED', `${errorMessage}; ${describeBrowserError(error)}`, 'danger')
        addBrowserLog(errorMessage, '失败', 'danger')
        message.error(errorMessage)
    }
}

const answerBrowserCall = async () => {
    if (!browserClient.value || !incomingCall.value) {
        traceBrowserStep('ANSWER_BLOCKED', '当前没有可接听的来电', 'danger')
        return
    }
    try {
        traceBrowserStep('ANSWER_START')
        await browserClient.value.answer()
        incomingCall.value = false
        activeCall.value = true
        updateBrowserStatus('通话中')
    } catch (error: any) {
        const errorMessage = formatBrowserError(error) || '接听失败'
        traceBrowserStep(
            'ANSWER_FAILED',
            `${errorMessage}; ${describeBrowserError(error)}`,
            'danger'
        )
        addBrowserLog(errorMessage, '失败', 'danger')
        message.error(errorMessage)
    }
}

const hangupBrowserCall = async () => {
    if (!browserClient.value) {
        traceBrowserStep('HANGUP_BLOCKED', '浏览器分机客户端不存在', 'danger')
        return
    }
    try {
        traceBrowserStep('HANGUP_START')
        await browserClient.value.hangup()
        incomingCall.value = false
        activeCall.value = false
        updateBrowserStatus(browserRegistered.value ? '已注册' : '未连接')
    } catch (error: any) {
        const errorMessage = formatBrowserError(error) || '挂断失败'
        traceBrowserStep('HANGUP_FAILED', errorMessage, 'danger')
        addBrowserLog(errorMessage, '失败', 'danger')
        message.error(errorMessage)
    }
}

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
        addLog({
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
        addLog({
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

const clearLogs = () => {
    logs.value = []
}

onMounted(() => {
    reloadProfile()
})

onBeforeUnmount(() => {
    stopCallTimer()
    disconnectBrowserPhone(true)
})
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

.hidden-audio {
    display: none;
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
