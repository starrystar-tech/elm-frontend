import { computed, reactive, ref, shallowRef } from 'vue'
import { getUserProfile, type ProfileVO } from '@/api/system/user/profile'
import { syncBrowserCallRecord, type BrowserCallRecordSyncReqVO } from '@/api/system/call'

export type BrowserPhoneLogItem = {
    id: number
    caller: string
    callee: string
    time: string
    message: string
    jobUuid?: string
    label: string
    type: 'success' | 'danger'
}

const profileLoading = ref(false)
const browserLoading = ref(false)
const browserRegistered = ref(false)
const browserConnecting = ref(false)
const incomingCall = ref(false)
const activeCall = ref(false)
const browserStatus = ref('未连接')
const browserDisconnecting = ref(false)
const browserHangupPending = ref(false)
const browserCallStarting = ref(false)
const browserClient = shallowRef<any>()
const browserRecordId = ref<number>()
const currentSessionDirection = ref<'incoming' | 'outgoing' | null>(null)
const currentBrowserCaller = ref('')
const currentBrowserCallee = ref('')
const incomingToastVisible = ref(false)
const incomingToastCaller = ref('')
const incomingRingEnableRequired = ref(false)
const incomingRingBlockedReason = ref('')
const outgoingWaitingToneRequired = ref(false)
const outgoingWaitingToneBlockedReason = ref('')
const remoteAudioRef = ref<HTMLAudioElement>()
const localAudioRef = ref<HTMLAudioElement>()
const callDurationSeconds = ref(0)
const incomingRingAudio = new Audio('/bell.mp3')
const outgoingWaitingAudio = new Audio('/call-waiting.mp3')
const incomingRingUnlocked = ref(false)
const outgoingWaitingUnlocked = ref(false)
const initialized = ref(false)
const callRetryCooldownMs = 500
let lastBrowserCallFinishedAt = 0

let callDurationTimer: ReturnType<typeof setInterval> | undefined
let hangupFallbackTimer: ReturnType<typeof setTimeout> | undefined
let hangupStatusResetTimer: ReturnType<typeof setTimeout> | undefined
let callEndedStatusResetTimer: ReturnType<typeof setTimeout> | undefined
let currentCallTerminationHandled = false
let browserRegisterWaiter:
    | {
          resolve: () => void
          reject: (error: Error) => void
      }
    | undefined

const profile = reactive<Partial<ProfileVO>>({})
const browserForm = reactive({
    wsServer: 'wss://sip.bgwa.cn:7443',
    domain: '60.205.112.131',
    username: '',
    password: '',
    target: ''
})
const logs = ref<BrowserPhoneLogItem[]>([])

incomingRingAudio.loop = true
incomingRingAudio.preload = 'auto'
outgoingWaitingAudio.loop = true
outgoingWaitingAudio.preload = 'auto'

const message = useMessage()

const appendLog = (
    payload: Pick<
        BrowserPhoneLogItem,
        'caller' | 'callee' | 'message' | 'jobUuid' | 'label' | 'type'
    >
) => {
    logs.value.unshift({
        id: Date.now() + logs.value.length,
        time: new Date().toLocaleString('zh-CN', { hour12: false }),
        ...payload
    })
}

const syncCallerFromProfile = () => {
    if (!browserForm.username) {
        browserForm.username = profile.callExt || profile.callNo || ''
    }
    if (!browserForm.password) {
        browserForm.password = profile.callPassword || ''
    }
}

const applyBrowserPhoneCredentials = (payload?: {
    wsServer?: string
    domain?: string
    username?: string
    password?: string
}) => {
    if (!payload) return
    if (typeof payload.wsServer === 'string') browserForm.wsServer = payload.wsServer
    if (typeof payload.domain === 'string') browserForm.domain = payload.domain
    if (typeof payload.username === 'string') browserForm.username = payload.username
    if (typeof payload.password === 'string') browserForm.password = payload.password
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
    if (callEndedStatusResetTimer) {
        clearTimeout(callEndedStatusResetTimer)
        callEndedStatusResetTimer = undefined
    }
    if (hangupStatusResetTimer) {
        clearTimeout(hangupStatusResetTimer)
        hangupStatusResetTimer = undefined
    }
    if (status === '挂断中') {
        hangupStatusResetTimer = setTimeout(() => {
            if (browserStatus.value !== '挂断中') return
            const caller = currentBrowserCaller.value || resolveCurrentBrowserExtension()
            const callee = currentBrowserCallee.value || normalizeExtension(browserForm.target)
            traceBrowserStep('HANGUP_STATUS_STUCK', 'status remained hangup-pending for 3000ms', 'danger')
            handleBrowserCallEnded('hangup-status-stuck', caller, callee)
        }, 3000)
    }
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

const addBrowserLog = (
    messageText: string,
    label: string = '浏览器',
    type: 'success' | 'danger' = 'success'
) => {
    appendLog({
        caller: currentBrowserCaller.value || browserForm.username || '-',
        callee: currentBrowserCallee.value || browserForm.target || '-',
        message: messageText,
        label,
        type
    })
}

const traceBrowserStep = (
    step: string,
    details?: string,
    type: 'success' | 'danger' = 'success'
) => {
    const messageText = details
        ? `[${step}] ${details} | ${stringifyTraceContext()}`
        : `[${step}] ${stringifyTraceContext()}`
    addBrowserLog(messageText, '调试', type)
}

const formatBrowserError = (error: any) => {
    if (!error) return '未知错误'
    if (typeof error === 'string') return error
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

const isBrowserPeerClosedError = (error: any) => {
    const errorText = formatBrowserError(error).toLowerCase()
    return errorText.includes('peer connection closed')
}

const isBrowserWebSocketClosedError = (error: any) => {
    const errorText = formatBrowserError(error).toLowerCase()
    return errorText.includes('websocket closed')
}

const formatBrowserUserError = (error: any, fallback: string) => {
    if (isBrowserWebSocketClosedError(error)) {
        return '浏览器分机连接断开，请稍后重试或重新签入'
    }
    return formatBrowserError(error) || fallback
}

const describeBrowserError = (error: any) => {
    if (!error) return 'error=<empty>'
    if (typeof error === 'string') return `error=${error}`
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

const describeSipResponse = (response: any) => {
    const statusCode = response?.message?.statusCode
    const reasonPhrase = response?.message?.reasonPhrase
    const cseq = response?.message?.cseq
    return [
        statusCode ? `statusCode=${statusCode}` : '',
        reasonPhrase ? `reason=${reasonPhrase}` : '',
        cseq ? `cseq=${cseq.method ?? cseq}` : ''
    ]
        .filter((item) => item.length > 0)
        .join(', ')
}

const attachRegistererDiagnostics = (client: any) => {
    const registerer = client?.sessionManager?.registerer
    if (!registerer || registerer.__browserDiagnosticsAttached) return
    registerer.__browserDiagnosticsAttached = true
    registerer.stateChange.addListener((state: string) => {
        traceBrowserStep('REGISTERER_STATE', `state=${state}`)
    })
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
    if (!browserRegisterWaiter) return
    browserRegisterWaiter.reject(new Error(reason))
    browserRegisterWaiter = undefined
}

const waitForBrowserRegistration = (timeoutMs = 10000) =>
    new Promise<void>((resolve, reject) => {
        traceBrowserStep('REGISTER_WAIT_START', `timeoutMs=${timeoutMs}`)
        const timer = window.setTimeout(() => {
            if (browserRegisterWaiter?.reject === reject) browserRegisterWaiter = undefined
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

const markBrowserCallFinished = () => {
    lastBrowserCallFinishedAt = Date.now()
}

const clearHangupFallbackTimer = () => {
    if (!hangupFallbackTimer) return
    clearTimeout(hangupFallbackTimer)
    hangupFallbackTimer = undefined
}

const clearHangupStatusResetTimer = () => {
    if (!hangupStatusResetTimer) return
    clearTimeout(hangupStatusResetTimer)
    hangupStatusResetTimer = undefined
}

const clearCallEndedStatusResetTimer = () => {
    if (!callEndedStatusResetTimer) return
    clearTimeout(callEndedStatusResetTimer)
    callEndedStatusResetTimer = undefined
}

const resolveCallEndedStatus = (reason: string) => {
    if (browserHangupPending.value || reason.includes('fallback') || reason.includes('stuck')) {
        return '已挂断'
    }
    if (currentSessionDirection.value === 'incoming' && incomingCall.value) {
        return '来电已取消'
    }
    return '对方已挂断'
}

const showCallEndedStatus = (status: string) => {
    updateBrowserStatus(status)
    callEndedStatusResetTimer = setTimeout(() => {
        if (browserStatus.value !== status) return
        updateBrowserStatus(browserRegistered.value ? '已注册' : '未连接')
    }, 1800)
}

const finalizeBrowserCall = (reason: string, caller?: string, callee?: string) => {
    const endedStatus = resolveCallEndedStatus(reason)
    clearHangupFallbackTimer()
    clearHangupStatusResetTimer()
    stopOutgoingWaitingTone()
    browserCallStarting.value = false
    browserHangupPending.value = false
    incomingCall.value = false
    activeCall.value = false
    hideIncomingToast()
    stopIncomingRing()
    stopCallTimer()
    browserRecordId.value = undefined
    currentSessionDirection.value = null
    resetBrowserCallParties()
    markBrowserCallFinished()
    if (!clearTerminatedBrowserSessionReference(reason)) {
        const client = browserClient.value as any
        if (client?.session) {
            const state = getBrowserSessionState(client.session)
            client.session = undefined
            traceBrowserStep(
                'SESSION_REFERENCE_FORCE_CLEARED',
                `reason=${reason}, state=${state || '<empty>'}`
            )
        }
    }
    showCallEndedStatus(endedStatus)
    traceBrowserStep('CALL_FINALIZED', `reason=${reason}, caller=${caller || '-'}, callee=${callee || '-'}`)
}

const startCallTimer = () => {
    stopCallTimer()
    callDurationTimer = setInterval(() => {
        callDurationSeconds.value += 1
    }, 1000)
}

const parseSipIdentityUser = (identity: any) => {
    const raw = identity?.uri?.user || identity?.displayName || ''
    if (typeof raw !== 'string') return ''
    return raw.replace(/^sip:/i, '').split('@')[0]?.trim() || ''
}

const normalizeExtension = (value?: string) => {
    const normalized = (value || '').trim()
    return /^\d+$/.test(normalized) ? normalized : ''
}

const resolveCurrentBrowserExtension = () => {
    return (
        normalizeExtension(browserForm.username) ||
        normalizeExtension(profile.callExt) ||
        normalizeExtension(profile.callNo)
    )
}

const resolveRemoteBrowserExtension = (identity: any, fallback?: string) => {
    return normalizeExtension(parseSipIdentityUser(identity)) || normalizeExtension(fallback)
}

const setBrowserCallParties = (caller?: string, callee?: string) => {
    currentBrowserCaller.value = caller || resolveCurrentBrowserExtension()
    currentBrowserCallee.value = callee || normalizeExtension(browserForm.target)
}

const resetBrowserCallParties = () => {
    currentBrowserCaller.value = ''
    currentBrowserCallee.value = ''
}

const getCurrentBrowserSession = () => {
    return browserClient.value?.session
}

const getBrowserSessionState = (session?: any) => {
    if (!session?.state) return ''
    return String(session.state)
}

const clearTerminatedBrowserSessionReference = (reason: string) => {
    const client = browserClient.value as any
    const session = client?.session
    if (!client || !session) return false
    const state = getBrowserSessionState(session)
    if (state !== 'Terminated') return false
    client.session = undefined
    traceBrowserStep('SESSION_REFERENCE_CLEARED', `reason=${reason}, state=${state}`)
    return true
}

const resetCurrentCallTerminationHandled = () => {
    currentCallTerminationHandled = false
}

const markCurrentCallTerminationHandled = (reason: string) => {
    if (currentCallTerminationHandled) {
        traceBrowserStep('CALL_TERMINATION_DUPLICATED', `reason=${reason}`)
        return false
    }
    currentCallTerminationHandled = true
    return true
}

const handleBrowserCallEnded = (reason: string, caller: string, callee: string) => {
    if (!markCurrentCallTerminationHandled(reason)) {
        return
    }
    void syncBrowserRecord({
        recordId: browserRecordId.value,
        event: 'hangup',
        caller,
        callee,
        durationSeconds: callDurationSeconds.value
    })
    traceBrowserStep('CALL_HANGUP', `reason=${reason}, caller=${caller}, callee=${callee}`)
    addBrowserLog(browserHangupPending.value ? '通话已挂断' : '对方已挂断，通话已结束', '已挂断')
    finalizeBrowserCall(reason, caller, callee)
}

const attachSessionTerminationListener = (session?: any) => {
    if (!session?.stateChange || session.__browserTerminationListenerAttached) return
    session.__browserTerminationListenerAttached = true
    session.stateChange.addListener((state: string) => {
        traceBrowserStep('SESSION_STATE', `state=${state}`)
        if (String(state) !== 'Terminated') return
        const remoteUser = resolveRemoteBrowserExtension(
            session?.remoteIdentity,
            currentBrowserCaller.value || browserForm.target
        )
        const localUser = resolveCurrentBrowserExtension()
        const caller =
            currentSessionDirection.value === 'incoming'
                ? remoteUser || currentBrowserCaller.value
                : currentBrowserCaller.value || localUser
        const callee =
            currentSessionDirection.value === 'incoming'
                ? currentBrowserCallee.value || localUser
                : currentBrowserCallee.value || remoteUser
        handleBrowserCallEnded('session-terminated', caller, callee)
    })
}

const ensureBrowserSessionReadyForCall = async () => {
    const client = browserClient.value as any
    const session = client?.session
    if (!client || !session) return
    const state = getBrowserSessionState(session)
    if (state === 'Terminated') {
        clearTerminatedBrowserSessionReference('before-call')
        return
    }
    traceBrowserStep('SESSION_CONFLICT_DETECTED', `state=${state}`)
    try {
        if (state === 'Initial' && currentSessionDirection.value === 'incoming') {
            await client.decline?.()
        } else {
            await client.hangup?.()
        }
    } catch (error: any) {
        traceBrowserStep(
            'SESSION_CONFLICT_RELEASE_FAILED',
            `${state}; ${formatBrowserError(error)}`,
            'danger'
        )
    }
    await new Promise((resolve) => window.setTimeout(resolve, 300))
    if (clearTerminatedBrowserSessionReference('after-conflict-release')) {
        return
    }
    const remainingState = getBrowserSessionState(client.session)
    if (client.session && remainingState && remainingState !== 'Terminated') {
        throw new Error('当前分机存在未释放通话，请先签出后重新签入')
    }
    if (client.session && !remainingState) {
        client.session = undefined
        traceBrowserStep('SESSION_REFERENCE_CLEARED', 'reason=empty-state-after-conflict')
    }
    resetCurrentCallTerminationHandled()
}

const hideIncomingToast = () => {
    incomingToastVisible.value = false
    incomingToastCaller.value = ''
}

const showIncomingToast = (caller: string) => {
    incomingToastCaller.value = caller || '未知号码'
    incomingToastVisible.value = true
}

const stopIncomingRing = () => {
    incomingRingAudio.pause()
    incomingRingAudio.currentTime = 0
    incomingRingBlockedReason.value = ''
    incomingRingEnableRequired.value = false
}

const stopOutgoingWaitingTone = () => {
    outgoingWaitingAudio.pause()
    outgoingWaitingAudio.currentTime = 0
    outgoingWaitingToneBlockedReason.value = ''
    outgoingWaitingToneRequired.value = false
}

const buildIncomingRingDiagnostics = () => {
    return [
        `src=${incomingRingAudio.currentSrc || incomingRingAudio.src || '<empty>'}`,
        `readyState=${incomingRingAudio.readyState}`,
        `networkState=${incomingRingAudio.networkState}`,
        `muted=${incomingRingAudio.muted}`,
        `volume=${incomingRingAudio.volume}`,
        typeof document !== 'undefined' ? `visibility=${document.visibilityState}` : '',
        typeof document !== 'undefined' ? `focused=${document.hasFocus()}` : ''
    ]
        .filter(Boolean)
        .join(', ')
}

const buildOutgoingWaitingDiagnostics = () => {
    return [
        `src=${outgoingWaitingAudio.currentSrc || outgoingWaitingAudio.src || '<empty>'}`,
        `readyState=${outgoingWaitingAudio.readyState}`,
        `networkState=${outgoingWaitingAudio.networkState}`,
        `muted=${outgoingWaitingAudio.muted}`,
        `volume=${outgoingWaitingAudio.volume}`,
        typeof document !== 'undefined' ? `visibility=${document.visibilityState}` : '',
        typeof document !== 'undefined' ? `focused=${document.hasFocus()}` : ''
    ]
        .filter(Boolean)
        .join(', ')
}

const playIncomingRing = async () => {
    try {
        incomingRingAudio.pause()
        incomingRingAudio.currentTime = 0
        incomingRingAudio.muted = false
        incomingRingAudio.volume = 1
        await incomingRingAudio.play()
        incomingRingEnableRequired.value = false
        incomingRingBlockedReason.value = ''
        traceBrowserStep('RING_PLAYING', buildIncomingRingDiagnostics())
    } catch (error: any) {
        incomingRingEnableRequired.value = true
        incomingRingBlockedReason.value = error?.message || '浏览器阻止了来电铃声自动播放'
        traceBrowserStep(
            'RING_BLOCKED',
            `${incomingRingBlockedReason.value}; ${buildIncomingRingDiagnostics()}`,
            'danger'
        )
    }
}

const playOutgoingWaitingTone = async () => {
    try {
        outgoingWaitingAudio.pause()
        outgoingWaitingAudio.currentTime = 0
        outgoingWaitingAudio.muted = false
        outgoingWaitingAudio.volume = 1
        await outgoingWaitingAudio.play()
        outgoingWaitingToneRequired.value = false
        outgoingWaitingToneBlockedReason.value = ''
        traceBrowserStep('OUTGOING_WAITING_PLAYING', buildOutgoingWaitingDiagnostics())
    } catch (error: any) {
        outgoingWaitingToneRequired.value = true
        outgoingWaitingToneBlockedReason.value = error?.message || '浏览器阻止了外呼等待音自动播放'
        traceBrowserStep(
            'OUTGOING_WAITING_BLOCKED',
            `${outgoingWaitingToneBlockedReason.value}; ${buildOutgoingWaitingDiagnostics()}`,
            'danger'
        )
    }
}

const unlockIncomingRingAudio = async () => {
    if (incomingRingUnlocked.value) return
    try {
        incomingRingAudio.load()
        incomingRingAudio.muted = true
        await incomingRingAudio.play()
        incomingRingAudio.pause()
        incomingRingAudio.currentTime = 0
        incomingRingAudio.muted = false
        incomingRingUnlocked.value = true
        traceBrowserStep('RING_UNLOCKED', buildIncomingRingDiagnostics())
    } catch (error: any) {
        incomingRingAudio.muted = false
        traceBrowserStep(
            'RING_UNLOCK_FAILED',
            `${error?.message || '来电铃声预热失败'}; ${buildIncomingRingDiagnostics()}`,
            'danger'
        )
    }
}

const unlockOutgoingWaitingAudio = async () => {
    if (outgoingWaitingUnlocked.value) return
    try {
        outgoingWaitingAudio.load()
        outgoingWaitingAudio.muted = true
        await outgoingWaitingAudio.play()
        outgoingWaitingAudio.pause()
        outgoingWaitingAudio.currentTime = 0
        outgoingWaitingAudio.muted = false
        outgoingWaitingUnlocked.value = true
        traceBrowserStep('OUTGOING_WAITING_UNLOCKED', buildOutgoingWaitingDiagnostics())
    } catch (error: any) {
        outgoingWaitingAudio.muted = false
        traceBrowserStep(
            'OUTGOING_WAITING_UNLOCK_FAILED',
            `${error?.message || '外呼等待音预热失败'}; ${buildOutgoingWaitingDiagnostics()}`,
            'danger'
        )
    }
}

const bindIncomingRingUnlock = () => {
    if (typeof window === 'undefined') return
    const unlock = async () => {
        await unlockIncomingRingAudio()
        await unlockOutgoingWaitingAudio()
        if (!incomingRingUnlocked.value) return
        window.removeEventListener('pointerdown', unlock)
        window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            void unlockIncomingRingAudio()
            void unlockOutgoingWaitingAudio()
        }
    })
}

const manuallyEnableIncomingRing = async () => {
    await unlockIncomingRingAudio()
    if (!incomingCall.value) return
    await playIncomingRing()
}

const requestIncomingNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        traceBrowserStep('NOTIFICATION_UNSUPPORTED', '当前环境不支持 Notification API', 'danger')
        return 'denied'
    }
    if (Notification.permission === 'default') {
        traceBrowserStep('NOTIFICATION_REQUEST', '请求系统通知权限')
        return Notification.requestPermission()
            .then((permission) => {
                traceBrowserStep('NOTIFICATION_PERMISSION', `permission=${permission}`)
                return permission
            })
            .catch(() => {
                traceBrowserStep('NOTIFICATION_PERMISSION', 'permission=denied', 'danger')
                return 'denied' as NotificationPermission
            })
    }
    traceBrowserStep('NOTIFICATION_PERMISSION', `permission=${Notification.permission}`)
    return Notification.permission
}

const showIncomingNotification = (caller: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        traceBrowserStep('NOTIFICATION_SKIP', '当前环境没有 Notification 对象', 'danger')
        return
    }
    if (Notification.permission !== 'granted') {
        traceBrowserStep(
            'NOTIFICATION_SKIP',
            `通知权限不是 granted，而是 ${Notification.permission}`,
            'danger'
        )
        return
    }
    try {
        const notification = new Notification('来电提醒', {
            body: `${caller || '未知号码'} 正在呼叫你`,
            tag: 'global-browser-phone-incoming-call',
            requireInteraction: true
        })
        traceBrowserStep('NOTIFICATION_SHOWN', `caller=${caller || '未知号码'}`)
        notification.onclick = () => {
            window.focus()
            notification.close()
        }
    } catch (error: any) {
        traceBrowserStep('NOTIFICATION_FAILED', error?.message || '系统通知创建失败', 'danger')
    }
}

const syncBrowserRecord = async (
    payload: BrowserCallRecordSyncReqVO,
    options?: {
        timeoutMs?: number
    }
) => {
    const timeoutMs = options?.timeoutMs ?? 1500
    try {
        const result = (await Promise.race([
            syncBrowserCallRecord(payload),
            new Promise<undefined>((resolve) => {
                window.setTimeout(() => resolve(undefined), timeoutMs)
            })
        ])) as Awaited<ReturnType<typeof syncBrowserCallRecord>> | undefined
        if (!result) {
            traceBrowserStep(
                'SYNC_TIMEOUT',
                `event=${payload.event}, timeoutMs=${timeoutMs}, recordId=${payload.recordId ?? '-'}`
            )
            return
        }
        if (result?.recordId) browserRecordId.value = result.recordId
    } catch (error) {
        console.warn('[BrowserPhone] sync browser record failed', error)
    }
}

const waitForBrowserAudioRefs = async (timeoutMs = 3000) => {
    if (remoteAudioRef.value && localAudioRef.value) {
        return
    }
    const start = Date.now()
    await new Promise<void>((resolve, reject) => {
        const check = () => {
            if (remoteAudioRef.value && localAudioRef.value) {
                resolve()
                return
            }
            if (Date.now() - start >= timeoutMs) {
                reject(new Error('浏览器分机音频节点初始化超时，请刷新页面后重试'))
                return
            }
            window.setTimeout(check, 50)
        }
        check()
    })
}

const ensureBrowserPrerequisites = async () => {
    traceBrowserStep('PREREQ_START')
    if (!browserForm.username.trim()) throw new Error('请输入浏览器分机账号')
    if (!browserForm.password.trim()) throw new Error('请输入浏览器分机密码')
    await waitForBrowserAudioRefs()
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
            displayName: browserForm.username.trim(),
            logBuiltinEnabled: false,
            logConfiguration: false,
            transportOptions: {
                server: browserForm.wsServer.trim(),
                traceSip: false
            }
        },
        registererOptions: { logConfiguration: false },
        delegate: {
            onRegistered: () => markBrowserRegistered(),
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
                if (!browserDisconnecting.value && !browserConnecting.value)
                    addBrowserLog('浏览器分机已注销')
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
                const reason = error
                    ? formatBrowserUserError(error, 'WSS 连接已断开')
                    : 'WSS 连接已断开'
                failPendingBrowserRegistration(reason)
                traceBrowserStep(
                    'WS_DISCONNECTED',
                    error?.message,
                    error?.message ? 'danger' : 'success'
                )
                if (!browserDisconnecting.value && error?.message) {
                    addBrowserLog(reason, '失败', 'danger')
                }
            }
        }
    } as any)
    const sessionManager = (client as any).sessionManager
    if (sessionManager) {
        sessionManager.delegate = {
            ...sessionManager.delegate,
            onCallReceived: () => {
                const session = getCurrentBrowserSession()
                resetCurrentCallTerminationHandled()
                attachSessionTerminationListener(session)
                currentSessionDirection.value = 'incoming'
                const caller = resolveRemoteBrowserExtension(
                    session?.remoteIdentity,
                    currentBrowserCaller.value || browserForm.target
                )
                const callee = resolveCurrentBrowserExtension()
                setBrowserCallParties(caller, callee)
                browserForm.target = caller || browserForm.target
                incomingCall.value = true
                activeCall.value = true
                updateBrowserStatus('来电响铃')
                showIncomingToast(caller)
                void unlockIncomingRingAudio().finally(() => {
                    void playIncomingRing()
                })
                void requestIncomingNotificationPermission().then((permission) => {
                    if (permission === 'granted') showIncomingNotification(caller)
                })
                traceBrowserStep('CALL_RECEIVED', `caller=${caller}, callee=${callee}`)
                addBrowserLog('收到来电，请点击接听', '来电')
                void syncBrowserRecord({ event: 'start', caller, callee })
            },
            onCallAnswered: () => {
                stopOutgoingWaitingTone()
                clearHangupFallbackTimer()
                browserHangupPending.value = false
                const session = getCurrentBrowserSession()
                attachSessionTerminationListener(session)
                const remoteUser = resolveRemoteBrowserExtension(
                    session?.remoteIdentity,
                    currentBrowserCaller.value || browserForm.target
                )
                const localUser = resolveCurrentBrowserExtension()
                const caller = currentSessionDirection.value === 'incoming' ? remoteUser : localUser
                const callee = currentSessionDirection.value === 'incoming' ? localUser : remoteUser
                setBrowserCallParties(caller, callee)
                incomingCall.value = false
                activeCall.value = true
                updateBrowserStatus('通话中')
                hideIncomingToast()
                stopIncomingRing()
                startCallTimer()
                void syncBrowserRecord({
                    recordId: browserRecordId.value,
                    event: 'answered',
                    caller,
                    callee
                })
                traceBrowserStep('CALL_ANSWERED', `caller=${caller}, callee=${callee}`)
                addBrowserLog('通话已接通', '通话中')
            },
            onCallHangup: () => {
                const session = getCurrentBrowserSession()
                const remoteUser = resolveRemoteBrowserExtension(
                    session?.remoteIdentity,
                    currentBrowserCaller.value || browserForm.target
                )
                const localUser = resolveCurrentBrowserExtension()
                const caller = currentBrowserCaller.value || localUser
                const callee = currentBrowserCallee.value || remoteUser
                handleBrowserCallEnded('hangup-callback', caller, callee)
            }
        }
    }
    return client
}

const connectBrowserPhone = async () => {
    browserLoading.value = true
    browserConnecting.value = true
    try {
        browserDisconnecting.value = false
        void unlockIncomingRingAudio()
        void unlockOutgoingWaitingAudio()
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
        const registerRequest = client.register({
            requestDelegate: {
                onTrying: (response: any) =>
                    traceBrowserStep('REGISTER_TRYING', describeSipResponse(response)),
                onProgress: (response: any) =>
                    traceBrowserStep('REGISTER_PROGRESS', describeSipResponse(response)),
                onAccept: (response: any) =>
                    traceBrowserStep('REGISTER_ACCEPT', describeSipResponse(response)),
                onReject: (response: any) =>
                    traceBrowserStep('REGISTER_REJECT', describeSipResponse(response), 'danger')
            }
        })
        attachRegistererDiagnostics(client)
        await registerRequest
        traceBrowserStep('REGISTER_REQUEST_SENT')
        await registrationPromise
        // message.success('浏览器分机已连接')
    } catch (error: any) {
        const errorMessage = formatBrowserUserError(error, '浏览器分机连接失败')
        updateBrowserStatus('连接失败')
        traceBrowserStep(
            'CONNECT_FAILED',
            `${errorMessage}; ${describeBrowserError(error)}`,
            'danger'
        )
        addBrowserLog(errorMessage, '失败', 'danger')
        message.error(errorMessage)
        if (browserClient.value) await disconnectBrowserPhone(true)
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
        } catch {}
        if (wasRegistered) {
            try {
                await client.unregister?.().catch(() => undefined)
            } catch {}
        }
        try {
            await client.disconnect?.().catch(() => undefined)
        } catch {}
    }
    browserRegistered.value = false
    browserCallStarting.value = false
    browserHangupPending.value = false
    resetCurrentCallTerminationHandled()
    clearHangupFallbackTimer()
    clearCallEndedStatusResetTimer()
    incomingCall.value = false
    activeCall.value = false
    currentSessionDirection.value = null
    browserRecordId.value = undefined
    hideIncomingToast()
    stopIncomingRing()
    stopOutgoingWaitingTone()
    stopCallTimer()
    resetBrowserCallParties()
    clearTerminatedBrowserSessionReference('disconnect')
    updateBrowserStatus('未连接')
    if (!silent) addBrowserLog('浏览器分机已断开')
    traceBrowserStep('DISCONNECT_DONE', `silent=${silent}`)
}

const makeBrowserCall = async (options?: {
    dialTarget?: string
    displayTarget?: string
    outboundRouteId?: number
}) => {
    if (!browserRegistered.value || !browserClient.value) {
        traceBrowserStep('CALL_BLOCKED', '浏览器分机未注册或客户端未初始化', 'danger')
        message.error('请先注册浏览器分机')
        return
    }
    if (browserCallStarting.value) {
        traceBrowserStep('CALL_BLOCKED', '当前拨号流程仍在处理中', 'danger')
        message.warning('正在发起呼叫，请勿重复点击')
        return
    }
    const cooldownRemaining = callRetryCooldownMs - (Date.now() - lastBrowserCallFinishedAt)
    if (cooldownRemaining > 0) {
        traceBrowserStep('CALL_BLOCKED', `通话刚结束，等待 ${cooldownRemaining}ms 后重试`, 'danger')
        message.warning('通话刚结束，请稍后再拨')
        return
    }
    const target = (options?.dialTarget || browserForm.target).trim()
    const displayTarget = (options?.displayTarget || target).trim()
    if (!/^\d+$/.test(target)) {
        traceBrowserStep('CALL_BLOCKED', '目标分机格式不合法', 'danger')
        message.error('请输入合法的目标分机')
        return
    }
    try {
        browserCallStarting.value = true
        resetCurrentCallTerminationHandled()
        await ensureBrowserSessionReadyForCall()
        setBrowserCallParties(browserForm.username.trim(), displayTarget)
        currentSessionDirection.value = 'outgoing'
        activeCall.value = true
        updateBrowserStatus('呼叫中')
        void unlockOutgoingWaitingAudio().finally(() => {
            void playOutgoingWaitingTone()
        })
        traceBrowserStep('CALL_START', `target=${target}`)
        await syncBrowserRecord({
            event: 'start',
            caller: browserForm.username.trim(),
            callee: displayTarget,
            outboundRouteId: options?.outboundRouteId
        })
        const callPromise = browserClient.value.call(`sip:${target}@${browserForm.domain.trim()}`, {
            extraHeaders: browserRecordId.value
                ? [`X-CRM-Record-Id: ${browserRecordId.value}`]
                : undefined
        })
        attachSessionTerminationListener(getCurrentBrowserSession())
        await callPromise
        traceBrowserStep('CALL_SENT', `target=${target}`)
        addBrowserLog(`已向 ${target} 发起网页呼叫`)
    } catch (error: any) {
        stopOutgoingWaitingTone()
        activeCall.value = false
        updateBrowserStatus('已注册')
        const errorMessage = formatBrowserError(error) || '网页呼叫失败'
        await syncBrowserRecord({
            recordId: browserRecordId.value,
            event: 'failed',
            caller: currentBrowserCaller.value || browserForm.username.trim(),
            callee: currentBrowserCallee.value || displayTarget,
            failReason: errorMessage
        })
        browserRecordId.value = undefined
        currentSessionDirection.value = null
        resetCurrentCallTerminationHandled()
        resetBrowserCallParties()
        markBrowserCallFinished()
        clearTerminatedBrowserSessionReference('call-failed')
        traceBrowserStep('CALL_FAILED', `${errorMessage}; ${describeBrowserError(error)}`, 'danger')
        addBrowserLog(errorMessage, '失败', 'danger')
        message.error(errorMessage)
    } finally {
        browserCallStarting.value = false
    }
}

const answerBrowserCall = async () => {
    const session = getCurrentBrowserSession()
    if (!browserClient.value || !incomingCall.value || !session) {
        traceBrowserStep('ANSWER_BLOCKED', '当前没有可接听的来电', 'danger')
        return
    }
    if (currentSessionDirection.value !== 'incoming') {
        traceBrowserStep(
            'ANSWER_BLOCKED',
            `当前会话不是来电，direction=${currentSessionDirection.value}`,
            'danger'
        )
        return
    }
    if (session.state === 'Establishing' || session.state === 'Established') {
        traceBrowserStep('ANSWER_SKIPPED', `session.state=${session.state}`, 'danger')
        return
    }
    if (session.state !== 'Initial') {
        traceBrowserStep(
            'ANSWER_BLOCKED',
            `当前会话状态不允许接听，state=${session.state}`,
            'danger'
        )
        return
    }
    try {
        traceBrowserStep('ANSWER_START')
        await browserClient.value.answer()
        incomingCall.value = false
        activeCall.value = true
        updateBrowserStatus('通话中')
        hideIncomingToast()
        stopIncomingRing()
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
    const session = getCurrentBrowserSession()
    if (!browserClient.value || !session) {
        traceBrowserStep('HANGUP_BLOCKED', '浏览器分机客户端不存在', 'danger')
        return
    }
    if (browserHangupPending.value) {
        traceBrowserStep('HANGUP_SKIPPED', '挂断流程处理中，忽略重复操作')
        return
    }
    try {
        browserHangupPending.value = true
        traceBrowserStep(
            'HANGUP_START',
            `direction=${currentSessionDirection.value}, state=${session.state}`
        )
        updateBrowserStatus('挂断中')
        hideIncomingToast()
        stopIncomingRing()
        stopOutgoingWaitingTone()
        if (currentSessionDirection.value === 'incoming' && session.state === 'Initial') {
            await browserClient.value.decline()
        } else {
            await browserClient.value.hangup()
        }
        clearHangupFallbackTimer()
        hangupFallbackTimer = setTimeout(() => {
            if (!browserHangupPending.value) {
                return
            }
            const activeSession = getCurrentBrowserSession()
            const sessionState = getBrowserSessionState(activeSession)
            const caller = currentBrowserCaller.value || resolveCurrentBrowserExtension()
            const callee = currentBrowserCallee.value || normalizeExtension(browserForm.target)
            traceBrowserStep('HANGUP_FALLBACK_TRIGGERED', `state=${sessionState || '<empty>'}`)
            handleBrowserCallEnded('hangup-fallback', caller, callee)
        }, 2500)
    } catch (error: any) {
        if (isBrowserPeerClosedError(error)) {
            const caller = currentBrowserCaller.value || resolveCurrentBrowserExtension()
            const callee = currentBrowserCallee.value || normalizeExtension(browserForm.target)
            traceBrowserStep('HANGUP_PEER_CLOSED_IGNORED', describeBrowserError(error))
            handleBrowserCallEnded('hangup-peer-closed', caller, callee)
            return
        }
        browserHangupPending.value = false
        clearHangupFallbackTimer()
        const errorMessage = formatBrowserError(error) || '挂断失败'
        traceBrowserStep('HANGUP_FAILED', errorMessage, 'danger')
        addBrowserLog(errorMessage, '失败', 'danger')
        message.error(errorMessage)
    }
}

const clearLogs = () => {
    logs.value = []
}

const initBrowserPhone = async () => {
    if (initialized.value) return
    initialized.value = true
    incomingRingAudio.load()
    outgoingWaitingAudio.load()
    bindIncomingRingUnlock()
    await reloadProfile()
}

export const useBrowserPhone = () => {
    return {
        profile,
        profileLoading,
        browserLoading,
        browserRegistered,
        browserConnecting,
        incomingCall,
        activeCall,
        browserStatus,
        browserDisconnecting,
        browserHangupPending,
        browserCallStarting,
        browserClient,
        browserForm,
        logs,
        incomingToastVisible,
        incomingToastCaller,
        incomingRingEnableRequired,
        incomingRingBlockedReason,
        remoteAudioRef,
        localAudioRef,
        callDurationSeconds,
        formattedCallDuration,
        isInCall,
        isRingingState,
        reloadProfile,
        applyBrowserPhoneCredentials,
        connectBrowserPhone,
        disconnectBrowserPhone,
        makeBrowserCall,
        answerBrowserCall,
        hangupBrowserCall,
        clearLogs,
        appendLog,
        initBrowserPhone,
        manuallyEnableIncomingRing,
        stopIncomingRing,
        hideIncomingToast,
        traceBrowserStep
    }
}
