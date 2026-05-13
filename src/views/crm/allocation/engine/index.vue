<template>
    <ContentWrap>
        <el-tabs v-model="activeTab" class="list-tabs-compact" @tab-change="handleTabChange">
            <el-tab-pane label="分配引擎" name="engine" />
            <el-tab-pane label="复购公海" name="repurchase" />
        </el-tabs>
        <el-card shadow="never" class="config-card">
            <router-view />
        </el-card>
    </ContentWrap>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'

defineOptions({ name: 'CrmAllocationEngine' })

type TabType = 'engine' | 'repurchase'

const route = useRoute()
const router = useRouter()
const activeTab = ref<TabType>('engine')
const validTabs: TabType[] = ['engine', 'repurchase']

const normalizeTab = (tab?: unknown): TabType => {
    const raw = String(tab || '')
    const value = raw === 'list' ? 'engine' : raw
    return validTabs.includes(value) ? value : 'engine'
}

const handleTabChange = (name: string | number) => {
    const tab = normalizeTab(name)
    const target =
        tab === 'engine' ? '/crm/allocation/engine/list' : '/crm/allocation/engine/repurchase'
    if (route.path !== target) {
        router.push(target)
    }
}

watch(
    () => route.path,
    (path) => {
        const tab = path.split('/').filter(Boolean).pop()
        activeTab.value = normalizeTab(tab)
    },
    { immediate: true }
)
</script>

<style scoped>
.config-card {
    border-radius: 10px;
    padding-bottom: 15px;
}
</style>
