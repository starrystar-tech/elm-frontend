<template>
  <div class="browser-phone">
    <ElPopover
      :width="340"
      placement="bottom"
      trigger="click"
      popper-class="browser-phone-popper"
      @show="handlePopoverShow"
    >
      <template #reference>
        <button type="button" class="browser-phone__trigger">
          <span class="browser-phone__dot" :class="`is-${statusType}`"></span>
          <Icon icon="ep:phone-filled" :size="16" />
          <span class="browser-phone__label">{{ statusText }}</span>
        </button>
      </template>

      <div class="browser-phone-panel">
        <div class="browser-phone-panel__title">浏览器分机</div>
        <ElForm label-position="top" size="small">
          <ElFormItem label="WSS 地址">
            <ElInput v-model="config.wsServer" placeholder="wss://sip.bgwa.cn:7443" />
          </ElFormItem>
          <ElFormItem label="SIP 域名">
            <ElInput v-model="config.domain" placeholder="60.205.112.131" />
          </ElFormItem>
          <ElFormItem label="分机账号">
            <ElInput v-model="config.username" placeholder="默认读取当前用户 callExt / callNo" />
          </ElFormItem>
          <ElFormItem label="分机密码">
            <ElInput
              v-model="config.password"
              type="password"
              show-password
              placeholder="请输入该分机的 SIP 密码"
            />
          </ElFormItem>
          <ElCheckbox v-model="config.autoConnect" @change="saveConfig">自动连接</ElCheckbox>
        </ElForm>

        <div class="browser-phone-panel__actions">
          <ElButton plain @click="saveConfig">保存</ElButton>
          <ElButton
            v-if="registered"
            type="danger"
            plain
            :loading="connecting"
            @click="handleDisconnect"
          >
            断开
          </ElButton>
          <ElButton v-else type="primary" :loading="connecting" @click="handleConnect">
            连接
          </ElButton>
        </div>

        <div v-if="lastError" class="browser-phone-panel__error">{{ lastError }}</div>
      </div>
    </ElPopover>

    <transition name="incoming-call-slide">
      <div v-if="incomingCall" class="incoming-call-toast">
        <div class="incoming-call-toast__head">
          <span class="incoming-call-toast__badge">来电提醒</span>
          <span class="incoming-call-toast__status">{{ statusText }}</span>
        </div>
        <div class="incoming-call-toast__caller">{{ incomingCaller || '未知号码' }}</div>
        <div class="incoming-call-toast__meta">
          呼叫分机 {{ incomingCallee || config.username || '-' }}
        </div>
        <div class="incoming-call-toast__actions">
          <ElButton type="success" @click="handleAnswer">接听</ElButton>
          <ElButton type="danger" plain @click="handleReject">拒绝</ElButton>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ElButton, ElCheckbox, ElForm, ElFormItem, ElInput, ElPopover } from 'element-plus'
import { useBrowserCallAssistant } from '@/hooks/web/useBrowserCallAssistant'

defineOptions({ name: 'ToolHeaderBrowserPhone' })

const message = useMessage()
const {
  config,
  connecting,
  registered,
  incomingCall,
  incomingCaller,
  incomingCallee,
  statusText,
  statusType,
  lastError,
  saveConfig,
  connect,
  disconnect,
  answer,
  reject,
  bootstrap
} = useBrowserCallAssistant()

const handlePopoverShow = () => {
  saveConfig()
}

const handleConnect = async () => {
  try {
    await connect()
    message.success('浏览器分机已连接')
  } catch (error: any) {
    message.error(error?.message || '浏览器分机连接失败')
  }
}

const handleDisconnect = async () => {
  await disconnect()
  message.success('浏览器分机已断开')
}

const handleAnswer = async () => {
  try {
    await answer()
    message.success('已接听来电')
  } catch (error: any) {
    message.error(error?.message || '接听失败')
  }
}

const handleReject = async () => {
  try {
    await reject()
    message.success('已拒绝来电')
  } catch (error: any) {
    message.error(error?.message || '拒绝失败')
  }
}

onMounted(() => {
  bootstrap()
})
</script>

<style lang="scss" scoped>
.browser-phone {
  position: relative;

  &__trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 34px;
    padding: 0 12px;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.92);
    color: var(--top-header-text-color);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: rgba(14, 116, 144, 0.3);
      transform: translateY(-1px);
    }
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #94a3b8;

    &.is-offline {
      background: #94a3b8;
    }

    &.is-connecting {
      background: #f59e0b;
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.16);
    }

    &.is-online {
      background: #10b981;
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.16);
    }

    &.is-ringing {
      background: #ef4444;
      box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.18);
      animation: browser-phone-pulse 1.1s infinite;
    }

    &.is-live {
      background: #0ea5e9;
      box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.16);
    }
  }

  &__label {
    font-size: 12px;
    font-weight: 600;
  }
}

.browser-phone-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__title {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  &__error {
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-color-danger);
  }
}

.incoming-call-toast {
  position: fixed;
  top: calc(var(--top-tool-height) + 18px);
  right: 18px;
  z-index: 2600;
  width: 320px;
  padding: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.94)),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.14), transparent 42%);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(14px);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(239, 68, 68, 0.12);
    color: #dc2626;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  &__status {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__caller {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #0f172a;
  }

  &__meta {
    margin-top: 6px;
    font-size: 13px;
    color: #475569;
  }

  &__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 16px;
  }
}

.incoming-call-slide-enter-active,
.incoming-call-slide-leave-active {
  transition: all 0.22s ease;
}

.incoming-call-slide-enter-from,
.incoming-call-slide-leave-to {
  opacity: 0;
  transform: translate3d(0, -10px, 0) scale(0.98);
}

@keyframes browser-phone-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.18);
  }
  100% {
    transform: scale(1);
  }
}
</style>
