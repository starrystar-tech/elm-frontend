<template>
    <ContentWrap>
        <OutboundRouteManager />
    </ContentWrap>
</template>

<script setup lang="ts">
import { ContentWrap } from '@/components/ContentWrap'
import OutboundRouteManager from './components/OutboundRouteManager.vue'

defineOptions({ name: 'CrmCallRouter' })
</script>
