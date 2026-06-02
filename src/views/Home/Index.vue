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
                既可以让浏览器直接作为分机注册到 FreeSWITCH，也可以继续使用后端发起 ESL 桥接测试。
              </p>
            </div>
            <div class="status-stack">
              <div class="status-chip">
                <span class="status-dot" :class="{ active: browserRegistered || activeCall || incomingCall }"></span>
                <span>浏览器分机 {{ browserStatus }}</span>
              </div>
              <div class="status-hint">首次使用前，请确认浏览器已允许麦克风，并能访问 `wss://8.152.103.225:7443`。</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="mt-16px">
          <template #header>
            <div class="card-header">
              <span>浏览器分机</span>
              <el-button link type="primary" @click="reloadProfile" :loading="profileLoading">
                刷新当前分机
              </el-button>
            </div>
          </template>

          <el-form :model="browserForm" label-width="100px" class="dial-form">
            <el-row :gutter="16">
              <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                <el-form-item label="WSS 地址">
                  <el-input v-model="browserForm.wsServer" placeholder="wss://8.152.103.225:7443" />
                </el-form-item>
              </el-col>
              <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                <el-form-item label="SIP 域名">
                  <el-input v-model="browserForm.domain" placeholder="8.152.103.225" />
                </el-form-item>
              </el-col>
              <el-col :xl="12" :lg="12" :md="24" :sm="24" :xs="24">
                <el-form-item label="分机账号">
                  <el-input v-model="browserForm.username" placeholder="例如 1001" clearable />
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
              <el-button :disabled="!browserClient" @click="disconnectBrowserPhone">断开分机</el-button>
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
              <el-button type="success" :disabled="!browserRegistered || activeCall" @click="makeBrowserCall">
                拨打
              </el-button>
              <el-button type="warning" :disabled="!incomingCall" @click="answerBrowserCall">
                接听
              </el-button>
              <el-button type="danger" :disabled="!activeCall && !incomingCall" @click="hangupBrowserCall">
                挂断
              </el-button>
              <span class="soft-note">
                来电或通话没有声音时，优先检查浏览器麦克风权限、HTTPS 页面和 `7443` 端口证书。
              </span>
            </div>
          </el-form>

          <audio ref="remoteAudioRef" autoplay playsinline class="hidden-audio"></audio>
          <audio ref="localAudioRef" autoplay playsinline muted class="hidden-audio"></audio>
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
              <el-button type="primary" :loading="submitting" @click="handleDial">发起拨打</el-button>
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
            <div class="profile-name">{{ profile.nickname || userStore.getUser.nickname || '未命名用户' }}</div>
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
              <el-button link type="danger" @click="clearLogs" :disabled="logs.length === 0">
                清空
              </el-button>
            </div>
          </template>

          <el-empty v-if="logs.length === 0" description="还没有拨打记录" :image-size="88" />

          <div v-else class="log-list">
            <div v-for="item in logs" :key="item.id" class="log-item">
              <div class="log-top">
                <span class="log-route">{{ item.caller }} -> {{ item.callee }}</span>
                <el-tag :type="item.type" effect="light">{{ item.label }}</el-tag>
              </div>
              <div class="log-meta">{{ item.time }}</div>
              <div class="log-message">{{ item.message }}</div>
              <div v-if="item.jobUuid" class="log-job">Job UUID: {{ item.jobUuid }}</div>
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
const incomingCall = ref(false)
const activeCall = ref(false)
const browserStatus = ref('未连接')
const browserClient = shallowRef<any>()
const remoteAudioRef = ref<HTMLAudioElement>()
const localAudioRef = ref<HTMLAudioElement>()

const profile = reactive<Partial<ProfileVO>>({})
const browserForm = reactive({
  wsServer: 'wss://8.152.103.225:7443',
  domain: '8.152.103.225',
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

const addBrowserLog = (messageText: string, label: string = '浏览器', type: 'success' | 'danger' = 'success') => {
  addLog({
    caller: browserForm.username || '-',
    callee: browserForm.target || '-',
    message: messageText,
    label,
    type
  })
}

const ensureBrowserPrerequisites = async () => {
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
}

const createBrowserClient = async () => {
  const { SimpleUser } = await import('sip.js/lib/platform/web')
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
        addBrowserLog('收到来电，请点击接听', '来电')
      },
      onCallAnswered: () => {
        incomingCall.value = false
        activeCall.value = true
        updateBrowserStatus('通话中')
        addBrowserLog('通话已接通', '通话中')
      },
      onCallHangup: () => {
        incomingCall.value = false
        activeCall.value = false
        updateBrowserStatus(browserRegistered.value ? '已注册' : '未连接')
        addBrowserLog('通话已结束', '已挂断')
      },
      onRegistered: () => {
        browserRegistered.value = true
        updateBrowserStatus('已注册')
        addBrowserLog('浏览器分机注册成功')
      },
      onUnregistered: () => {
        browserRegistered.value = false
        incomingCall.value = false
        activeCall.value = false
        updateBrowserStatus('未注册')
        addBrowserLog('浏览器分机已注销')
      },
      onServerConnect: () => {
        updateBrowserStatus('信令已连接')
      },
      onServerDisconnect: (error?: Error) => {
        browserRegistered.value = false
        incomingCall.value = false
        activeCall.value = false
        updateBrowserStatus('连接断开')
        if (error?.message) {
          addBrowserLog(`WSS 连接断开：${error.message}`, '失败', 'danger')
        }
      }
    }
  } as any)
  return client
}

const connectBrowserPhone = async () => {
  browserLoading.value = true
  try {
    await ensureBrowserPrerequisites()
    if (browserClient.value) {
      await disconnectBrowserPhone(true)
    }
    const client = await createBrowserClient()
    browserClient.value = client
    updateBrowserStatus('连接中')
    await client.connect()
    await client.register()
    message.success('浏览器分机已连接')
  } catch (error: any) {
    const errorMessage = error?.message || '浏览器分机连接失败'
    updateBrowserStatus('连接失败')
    addBrowserLog(errorMessage, '失败', 'danger')
    message.error(errorMessage)
    if (browserClient.value) {
      await disconnectBrowserPhone(true)
    }
  } finally {
    browserLoading.value = false
  }
}

const disconnectBrowserPhone = async (silent = false) => {
  const client = browserClient.value
  browserClient.value = undefined
  if (client) {
    try {
      await client.hangup?.().catch(() => undefined)
    } catch {
      // ignore
    }
    try {
      await client.unregister?.().catch(() => undefined)
    } catch {
      // ignore
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
  updateBrowserStatus('未连接')
  if (!silent) {
    addBrowserLog('浏览器分机已断开')
  }
}

const makeBrowserCall = async () => {
  if (!browserRegistered.value || !browserClient.value) {
    message.error('请先注册浏览器分机')
    return
  }
  const target = browserForm.target.trim()
  if (!/^\d+$/.test(target)) {
    message.error('请输入合法的目标分机')
    return
  }
  try {
    activeCall.value = true
    updateBrowserStatus('呼叫中')
    await browserClient.value.call(`sip:${target}@${browserForm.domain.trim()}`)
    addBrowserLog(`已向 ${target} 发起网页呼叫`)
  } catch (error: any) {
    activeCall.value = false
    updateBrowserStatus('已注册')
    const errorMessage = error?.message || '网页呼叫失败'
    addBrowserLog(errorMessage, '失败', 'danger')
    message.error(errorMessage)
  }
}

const answerBrowserCall = async () => {
  if (!browserClient.value || !incomingCall.value) {
    return
  }
  try {
    await browserClient.value.answer()
    incomingCall.value = false
    activeCall.value = true
    updateBrowserStatus('通话中')
  } catch (error: any) {
    const errorMessage = error?.message || '接听失败'
    addBrowserLog(errorMessage, '失败', 'danger')
    message.error(errorMessage)
  }
}

const hangupBrowserCall = async () => {
  if (!browserClient.value) {
    return
  }
  try {
    await browserClient.value.hangup()
    incomingCall.value = false
    activeCall.value = false
    updateBrowserStatus(browserRegistered.value ? '已注册' : '未连接')
  } catch (error: any) {
    const errorMessage = error?.message || '挂断失败'
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
}
</style>
