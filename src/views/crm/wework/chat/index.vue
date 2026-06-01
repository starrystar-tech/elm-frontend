<template>
    <div class="mb-8px">
        <BaseButton :loading="syncLoading" @click="handleSyncArchive">
            同步企微会话存档
        </BaseButton>
    </div>
    <ContentWrap style="border-top: 1px solid #e5e5e5" body-style="padding: 0px">
        <ChatQualityTab v-if="activeTab === 'quality'" class="chat-page-body" />
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
            resp?.message ||
                `同步完成：应用 ${resp?.appCount || 0}，拉取 ${resp?.pulledCount || 0}，入库 ${resp?.savedCount || 0}`
        )
    } finally {
        syncLoading.value = false
    }
}
</script>
<style scoped lang="scss">
:deep(.chat-page-body) {
    height: calc(
        100vh - var(--top-tool-height) - var(--tags-view-height) - var(--app-content-padding) - var(
                --app-footer-height
            )
    );
    min-height: 720px;
}
</style>
