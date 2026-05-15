<template>
  <ContentWrap>
    <ChatAnalysisTab />
  </ContentWrap>
</template>

<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import ChatAnalysisTab from '../chat/components/ChatAnalysisTab.vue'

defineOptions({ name: 'CrmWeworkChatAnalysis' })
</script>
