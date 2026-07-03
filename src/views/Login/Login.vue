<template>
  <div :class="prefixCls" class="relative h-screen w-full flex flex-col">
    <!-- 顶部标题 -->
    <div class="z-10 flex items-center justify-between px-6 py-3 bg-gradient-to-r from-white via-white to-gray-50 shadow-sm">
      <div v-if="activeBrandConfig.loginSubtitle" class="flex items-center gap-3">
        <img
          :src="activeBrandConfig.logos.nav"
          :alt="appStore.getTitle || activeBrandConfig.title"
          class="h-10 w-10 shrink-0"
        />
        <div class="flex flex-col justify-center leading-none">
          <span class="text-[22px] font-semibold text-[#111827]">{{ activeBrandConfig.title }}</span>
          <span class="mt-1 text-[11px] font-semibold tracking-[0.08em] text-[#111827]">
            {{ activeBrandConfig.loginSubtitle }}
          </span>
        </div>
      </div>
      <img
        v-else
        :src="activeBrandConfig.logos.login"
        :alt="appStore.getTitle || activeBrandConfig.title"
        class="w-32"
      />
      <div class="flex items-center space-x-6">
        <a href="https://docs.bgwa.cn/" target="_blank" class="text-gray-600 hover:text-blue-500 transition-colors"
          >文档中心</a
        >
        <a href="https://www.bgwa.cn/" target="_blank" class="text-gray-600 hover:text-blue-500 transition-colors"
          >官网</a
        >
      </div>
    </div>
    <!-- 背景 -->
    <div class="absolute inset-0 flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15)_0%,_transparent_50%)]"></div>
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(99,102,241,0.1)_0%,_transparent_50%)]"></div>
      <div class="absolute inset-0 opacity-5" style="background-image: linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px); background-size: 40px 40px;"></div>
    </div>

    <!-- 主题和语言选择 -->
    <div class="absolute top-8 right-8 flex items-center space-x-4 z-10">
      <!-- <ThemeSwitch /> -->
      <!-- <LocaleDropdown /> -->
    </div>

    <!-- 登录卡片 -->
    <div class="relative z-10 flex-1 flex items-center justify-center p-0">
      <div class="w-full max-w-sm p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50">
        <!-- 系统标题 -->
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-gray-800">欢迎回来</h2>
        </div>

        <!-- 登录表单 -->
        <div class="space-y-6">
          <LoginForm class="w-full" />
        </div>

        <!-- 企业微信登录 -->
        <!-- <div class="mt-8">
          <div class="flex items-center justify-center mb-6">
            <div class="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
            <span class="px-4 text-gray-500 dark:text-gray-400">其他登录方式</span>
            <div class="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
          </div>
          <div class="flex flex-col space-y-4">
            <XButton
              :title="'企业微信登录'"
              class="w-full"
              @click="setLoginState(LoginStateEnum.QR_CODE)"
            />
          </div>
        </div> -->

        <!-- 底部协议 -->
        <div class="mt-8 text-center text-xs text-gray-500">
          登录即表示同意
          <a href="#" class="text-blue-500 hover:text-blue-600 hover:underline">《注册协议》</a>
          <a href="#" class="text-blue-500 hover:text-blue-600 hover:underline ml-2">《个人信息处理规则》</a>
        </div>
      </div>
    </div>

    <!-- 版权栏 -->
    <div class="relative z-10 py-4">
      <div class="text-center text-xs text-gray-500">
        <div
          v-for="(line, index) in activeBrandConfig.copyrightLines"
          :key="line"
          :class="{ 'mb-1': index === 0 }"
        >
          {{ line }}
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { underlineToHump } from '@/utils'
import { activeBrandConfig } from '@/config/brand'

import { useDesign } from '@/hooks/web/useDesign'
import { useAppStore } from '@/store/modules/app'
import { ThemeSwitch } from '@/layout/components/ThemeSwitch'
import { LocaleDropdown } from '@/layout/components/LocaleDropdown'

import {
  LoginForm,
  MobileForm,
  QrCodeForm,
  RegisterForm,
  SSOLoginVue,
  ForgetPasswordForm
} from './components'
import { LoginStateEnum, useLoginState } from './components/useLogin'
import Form from '@/components/Form/src/Form.vue'

defineOptions({ name: 'Login' })

const form = reactive({
  username: ''
})

const { t } = useI18n()
const appStore = useAppStore()
const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('login')
const { setLoginState } = useLoginState()
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-login;

.#{$prefix-cls} {
  overflow: hidden;
}
</style>

<style lang="scss">
.dark .login-form {
  .el-divider__text {
    background-color: var(--login-bg-color);
  }

  .el-card {
    background-color: var(--login-bg-color);
  }
}
</style>
