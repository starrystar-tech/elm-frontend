// 引入unocss css
import '@/plugins/unocss'

// 导入全局的svg图标
import '@/plugins/svgIcon'

// 初始化多语言
import { setupI18n } from '@/plugins/vueI18n'

// 引入状态管理
import { setupStore } from '@/store'

// 全局组件
import { setupGlobCom } from '@/components'

// 引入 element-plus
import { setupElementPlus } from '@/plugins/elementPlus'

// 引入 form-create
import { setupFormCreate } from '@/plugins/formCreate'

// 引入全局样式
import '@/styles/index.scss'

// 引入动画
import '@/plugins/animate.css'

// 路由
import router, { setupRouter } from '@/router'

// 指令
import { setupAuth, setupMountedFocus } from '@/directives'

import { createApp } from 'vue'

import App from './App.vue'

import './permission'

import '@/plugins/tongji' // 百度统计
import Logger from '@/utils/Logger'

import VueDOMPurifyHTML from 'vue-dompurify-html' // 解决v-html 的安全隐患

// 强制设置CSS变量，确保左导航为白色，顶导航为蓝色
import { setCssVar } from '@/utils'
setCssVar('--left-menu-bg-color', '#ffffff')
setCssVar('--left-menu-bg-light-color', '#f6f6f6')
setCssVar('--left-menu-text-color', '#303133')
setCssVar('--logo-title-text-color', '#303133')
setCssVar('--top-header-bg-color', 'var(--el-color-primary)')
setCssVar('--top-header-text-color', '#ffffff')
setCssVar('--top-header-hover-color', 'rgba(255, 255, 255, 0.1)')

// 创建实例
const setupAll = async () => {
  const app = createApp(App)

  await setupI18n(app)

  setupStore(app)

  setupGlobCom(app)

  setupElementPlus(app)

  setupFormCreate(app)

  setupRouter(app)

  // directives 指令
  setupAuth(app)
  setupMountedFocus(app)

  await router.isReady()

  app.use(VueDOMPurifyHTML)

  app.mount('#app')
}

setupAll()

// Logger.prettyPrimary(`欢迎使用`, import.meta.env.VITE_APP_TITLE)
