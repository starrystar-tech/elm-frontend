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

/** 将 HTTP URL 转换为 HTTPS（解决混合内容问题） */
const ensureHttps = (url: string): string => {
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://')
  }
  return url
}

/** 初始化 */
onMounted(async () => {
  try {
    // 友情提示：如果访问出现 404 问题：
    // 1）boot 参考 https://doc.iocoder.cn/server-monitor/ 解决；
    // 2）cloud 参考 https://cloud.iocoder.cn/server-monitor/ 解决
    const data = await ConfigApi.getConfigKey('url.spring-boot-admin')
    if (data && data.length > 0) {
      src.value = ensureHttps(data)
    } else {
      // 默认 URL 也需要确保是 HTTPS
      src.value = ensureHttps(src.value)
    }
  } finally {
    loading.value = false
  }
})
</script>
