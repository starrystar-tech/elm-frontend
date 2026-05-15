<template>
  <ContentWrap>
    <div class="toolbar">
      <BaseButton type="primary" :loading="syncLoading" @click="handleSyncArchive">
        同步企微会话存档
      </BaseButton>
    </div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="企微会话" name="quality" />
      <el-tab-pane label="会话审计" name="audit" />
      <el-tab-pane label="会话分析" name="analysis" />
    </el-tabs>
    <ChatQualityTab v-if="activeTab === 'quality'" />
    <ChatAuditTab v-else-if="activeTab === 'audit'" />
    <ChatAnalysisTab v-else />
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import * as WeworkChatApi from '@/api/crm/wework/chat'
import ChatQualityTab from './components/ChatQualityTab.vue'
import ChatAuditTab from './components/ChatAuditTab.vue'
import ChatAnalysisTab from './components/ChatAnalysisTab.vue'

defineOptions({ name: 'CrmWeworkChat' })

const message = useMessage()
const syncLoading = ref(false)
const activeTab = ref('quality')

const handleSyncArchive = async () => {
  syncLoading.value = true
  try {
    const resp = await WeworkChatApi.syncWeworkChatArchive()
    message.success(
      resp?.message || `同步完成：应用 ${resp?.appCount || 0}，拉取 ${resp?.pulledCount || 0}，入库 ${resp?.savedCount || 0}`
    )
  } finally {
    syncLoading.value = false
  }
}
</script>
<style scoped lang="scss">
.toolbar { margin-bottom: 16px; }
</style>
