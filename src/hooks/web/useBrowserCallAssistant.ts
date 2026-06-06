import { computed, reactive, ref, shallowRef } from 'vue'
import { getUserProfile } from '@/api/system/user/profile'
import { getAccessToken } from '@/utils/auth'
import { useCache } from '@/hooks/web/useCache'
import bellAudioUrl from '@/assets/mp3/bell.mp3'

type BrowserPhoneConfig = {
  wsServer: string
  domain: string
  username: string
  password: string
  autoConnect: boolean
}

const BROWSER_PHONE_CONFIG_KEY = 'browserPhoneAssistantConfig'

const { wsCache } = useCache()

const config = reactive<BrowserPhoneConfig>({
  wsServer: 'wss://sip.bgwa.cn:7443',
  domain: '60.205.112.131',
  username: '',
  password: '',
  autoConnect: true
})

const initialized = ref(false)
const bootstrapping = ref(false)
const connecting = ref(false)
const disconnecting = ref(false)
const registered = ref(false)
const incomingCall = ref(false)
const activeCall = ref(false)
const statusText = ref('未连接')
const incomingCaller = ref('')
const incomingCallee = ref('')
const lastError = ref('')
const browserClient = shallowRef<any>()

let registerWaiter:
  | {
      resolve: () => void
      reject: (error: Error) => void
    }
  | undefined

const remoteAudio = new Audio()
remoteAudio.autoplay = true

const localAudio = new Audio()
localAudio.autoplay = true
localAudio.muted = true

const ringAudio = new Audio(bellAudioUrl)
ringAudio.loop = true
ringAudio.preload = 'auto'

const canConnect = computed(() => !!config.username.trim() && !!config.password.trim())
const statusType = computed(() => {
  if (incomingCall.value) {
    return 'ringing'
  }
  if (activeCall.value) {
    return 'live'
  }
  if (registered.value) {
    return 'online'
  }
  if (connecting.value) {
    return 'connecting'
  }
  return 'offline'
})

const loadConfig = () => {
  const cached = wsCache.get(BROWSER_PHONE_CONFIG_KEY) as Partial<BrowserPhoneConfig> | undefined
  if (!cached) {
    return
  }
  config.wsServer = cached.wsServer || config.wsServer
  config.domain = cached.domain || config.domain
  config.username = cached.username || config.username
  config.password = cached.password || config.password
  config.autoConnect = cached.autoConnect ?? config.autoConnect
}

const saveConfig = () => {
  wsCache.set(BROWSER_PHONE_CONFIG_KEY, { ...config })
}

const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return
  }
  if (Notification.permission === 'default') {
    await Notification.requestPermission().catch(() => undefined)
  }
}

const showNativeNotification = () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return
  }
  if (Notification.permission !== 'granted') {
    return
  }
  const caller = incomingCaller.value || '未知号码'
  const notification = new Notification('来电提醒', {
    body: `${caller} 正在呼叫你`,
    tag: 'browser-phone-incoming-call',
    requireInteraction: true
  })
  notification.onclick = () => {
    window.focus()
    notification.close()
  }
}

const stopRing = () => {
  ringAudio.pause()
  ringAudio.currentTime = 0
}

const playRing = async () => {
  try {
    await ringAudio.play()
  } catch {
    // Browsers may block autoplay until the user interacts with the page.
  }
}

const failPendingRegistration = (reason: string) => {
  if (!registerWaiter) {
    return
  }
  registerWaiter.reject(new Error(reason))
  registerWaiter = undefined
}

const waitForRegistration = (timeoutMs = 10000) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      if (registerWaiter?.reject === reject) {
        registerWaiter = undefined
      }
      reject(new Error(`SIP 注册超时（${timeoutMs}ms）`))
    }, timeoutMs)
    registerWaiter = {
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

const parseSipIdentityUser = (identity: any) => {
  const raw = identity?.uri?.user || identity?.displayName || ''
  if (typeof raw !== 'string') {
    return ''
  }
  return raw.replace(/^sip:/i, '').split('@')[0]?.trim() || ''
}

const resetCallState = () => {
  incomingCall.value = false
  activeCall.value = false
  incomingCaller.value = ''
  incomingCallee.value = ''
  stopRing()
}

const ensureMicrophonePermission = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  stream.getTracks().forEach((track) => track.stop())
}

const createBrowserClient = async () => {
  const { SimpleUser } = await import('sip.js/lib/platform/web')
  const client = new SimpleUser(config.wsServer.trim(), {
    aor: `sip:${config.username.trim()}@${config.domain.trim()}`,
    media: {
      constraints: { audio: true, video: false },
      local: { audio: localAudio },
      remote: { audio: remoteAudio }
    },
    userAgentOptions: {
      authorizationUsername: config.username.trim(),
      authorizationPassword: config.password.trim(),
      displayName: config.username.trim(),
      logBuiltinEnabled: true,
      logConfiguration: false,
      logLevel: 'error',
      transportOptions: {
        server: config.wsServer.trim(),
        traceSip: false
      }
    },
    delegate: {
      onRegistered: () => {
        registered.value = true
        statusText.value = '已注册'
        registerWaiter?.resolve()
        registerWaiter = undefined
      },
      onUnregistered: () => {
        registered.value = false
        resetCallState()
        statusText.value = connecting.value ? '注册失败' : '未注册'
        failPendingRegistration('SIP 已注销')
      },
      onServerConnect: () => {
        statusText.value = '信令已连接'
      },
      onServerDisconnect: (error?: Error) => {
        registered.value = false
        resetCallState()
        statusText.value = disconnecting.value ? '未连接' : '连接断开'
        if (error?.message) {
          lastError.value = error.message
        }
        failPendingRegistration(error?.message || 'WSS 连接已断开')
      }
    }
  } as any)
  const sessionManager = (client as any).sessionManager
  if (sessionManager) {
    sessionManager.delegate = {
      ...sessionManager.delegate,
      onCallReceived: (session: any) => {
        incomingCaller.value = parseSipIdentityUser(session?.remoteIdentity)
        incomingCallee.value =
          parseSipIdentityUser(session?.localIdentity) || config.username.trim()
        incomingCall.value = true
        activeCall.value = true
        statusText.value = '来电响铃'
        void requestNotificationPermission()
        void playRing()
        showNativeNotification()
      },
      onCallAnswered: (session: any) => {
        incomingCaller.value =
          parseSipIdentityUser(session?.remoteIdentity) || incomingCaller.value
        incomingCallee.value =
          parseSipIdentityUser(session?.localIdentity) || incomingCallee.value || config.username.trim()
        incomingCall.value = false
        activeCall.value = true
        statusText.value = '通话中'
        stopRing()
      },
      onCallHangup: () => {
        resetCallState()
        statusText.value = registered.value ? '已注册' : '未连接'
      }
    }
  }
  return client
}

const connect = async () => {
  saveConfig()
  if (!canConnect.value) {
    throw new Error('请先填写浏览器分机账号和密码')
  }
  connecting.value = true
  lastError.value = ''
  try {
    await ensureMicrophonePermission()
    if (browserClient.value) {
      await disconnect(true)
    }
    browserClient.value = await createBrowserClient()
    statusText.value = '连接中'
    await browserClient.value.connect()
    const registrationPromise = waitForRegistration()
    await browserClient.value.register()
    await registrationPromise
  } catch (error: any) {
    lastError.value = error?.message || '浏览器分机连接失败'
    statusText.value = '连接失败'
    if (browserClient.value) {
      await disconnect(true)
    }
    throw error
  } finally {
    connecting.value = false
  }
}

const disconnect = async (silent = false) => {
  const client = browserClient.value
  browserClient.value = undefined
  disconnecting.value = true
  failPendingRegistration('浏览器分机连接已取消')
  try {
    if (client) {
      await client.hangup?.().catch(() => undefined)
      await client.unregister?.().catch(() => undefined)
      await client.disconnect?.().catch(() => undefined)
    }
  } finally {
    disconnecting.value = false
    registered.value = false
    resetCallState()
    statusText.value = '未连接'
    if (!silent) {
      lastError.value = ''
    }
  }
}

const answer = async () => {
  if (!browserClient.value || !incomingCall.value) {
    return
  }
  await browserClient.value.answer()
  incomingCall.value = false
  activeCall.value = true
  statusText.value = '通话中'
  stopRing()
}

const reject = async () => {
  if (!browserClient.value) {
    return
  }
  await browserClient.value.hangup()
  resetCallState()
  statusText.value = registered.value ? '已注册' : '未连接'
}

const bootstrap = async () => {
  if (initialized.value || bootstrapping.value) {
    return
  }
  bootstrapping.value = true
  try {
    loadConfig()
    if (getAccessToken()) {
      try {
        const profile = await getUserProfile()
        if (!config.username.trim()) {
          config.username = profile.callExt || profile.callNo || ''
        }
      } catch {
        // Ignore profile read failures and let the user configure manually.
      }
    }
    saveConfig()
    if (config.autoConnect && canConnect.value) {
      try {
        await connect()
      } catch {
        // Keep the assistant idle and let the user reconnect manually.
      }
    }
    initialized.value = true
  } finally {
    bootstrapping.value = false
  }
}

export const useBrowserCallAssistant = () => ({
  config,
  initialized,
  bootstrapping,
  connecting,
  registered,
  incomingCall,
  activeCall,
  statusText,
  statusType,
  incomingCaller,
  incomingCallee,
  lastError,
  canConnect,
  saveConfig,
  connect,
  disconnect,
  answer,
  reject,
  bootstrap
})
