<template>
  <ContentWrap>
    <ChatAuditTab />
  </ContentWrap>
</template>

<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import ChatAuditTab from '../chat/components/ChatAuditTab.vue'

defineOptions({ name: 'CrmWeworkChatAudit' })
</script>
