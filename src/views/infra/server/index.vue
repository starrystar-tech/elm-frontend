<template>
  <ContentWrap :bodyStyle="{ padding: '0px' }" class="!mb-0">
    <IFrame v-if="!loading" v-loading="loading" :src="src" />
  </ContentWrap>
</template>
<script lang="ts" setup>
import * as ConfigApi from '@/api/infra/config'

defineOptions({ name: 'InfraAdminServer' })

const loading = ref(true) // 是否加载中
const src = ref(import.meta.env.VITE_BASE_URL + '/admin/applications')

/**
 * 统一修正 Spring Boot Admin 地址：
 * 1. 将 http 强制改成 https
 * 2. 保留配置里的原始主机名，避免把可访问的监控地址错误改写到当前站点
 */
const normalizeAdminServerUrl = (url?: string): string => {
  const fallbackUrl = `${window.location.origin}/admin/applications`
  const rawUrl = String(url || '').trim()
  if (!rawUrl) {
    return fallbackUrl
  }

  try {
    const nextUrl = new URL(rawUrl, window.location.origin)
    nextUrl.protocol = 'https:'
    return nextUrl.toString()
  } catch {
    return rawUrl.replace('http://', 'https://')
  }
}

/** 初始化 */
onMounted(async () => {
  try {
    // 友情提示：如果访问出现 404 问题：
    // 1）boot 参考 https://doc.iocoder.cn/server-monitor/ 解决；
    // 2）cloud 参考 https://cloud.iocoder.cn/server-monitor/ 解决
    const data = await ConfigApi.getConfigKey('url.spring-boot-admin')
    src.value = normalizeAdminServerUrl(data || src.value)
  } finally {
    loading.value = false
  }
})
</script>
