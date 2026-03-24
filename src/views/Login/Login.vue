<template>
  <div :class="prefixCls" class="relative h-screen w-full flex flex-col">
    <!-- 顶部标题 -->
    <div class="bg-white z-10">
      <img src="@/assets/imgs/logo2.png" alt="logo" class="w-32 ml-5 mt-2" />
    </div>

    <!-- 背景 -->
    <div class="absolute inset-0 flex-1">
      <img src="@/assets/imgs/bg.png" alt="背景" class="w-full h-full object-cover" />
    </div>

    <!-- 主题和语言选择 -->
    <div class="absolute top-8 right-8 flex items-center space-x-4 z-10">
      <!-- <ThemeSwitch /> -->
      <!-- <LocaleDropdown /> -->
    </div>

    <!-- 登录卡片 -->
    <div class="relative z-10 flex-1 flex items-center justify-center p-0">
      <div class="w-full max-w-sm p-8 bg-white rounded-lg shadow-md">
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
        <div class="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          登录即表示同意
          <a href="#" class="text-blue-500 hover:underline">《注册协议》</a>
          <a href="#" class="text-blue-500 hover:underline ml-2">《个人信息处理规则》</a>
        </div>
      </div>
    </div>

    <!-- 版权栏 -->
    <div class="relative z-10 py-4">
      <div class="text-center text-xs text-[#9598a6]">
        <div> Copyright © 2025-2026 www.bgwa.com. All Rights Reserved </div>
        <div>武汉百谷科技有限公司版权所有 鄂ICP备2022019819号-1</div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { underlineToHump } from '@/utils'

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

defineOptions({ name: 'Login' })

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
