<template>
    <ContentWrap>
        <el-tabs v-model="activeTab" class="list-tabs-compact" @tab-change="handleTabChange">
            <el-tab-pane label="线索流转" name="clue" />
            <el-tab-pane label="订单设置" name="order" />
            <el-tab-pane label="学员设置" name="student" />
            <el-tab-pane label="标签设置" name="tag" />
            <el-tab-pane label="共享公海设置" name="poolshare" />
            <el-tab-pane label="其它设置" name="other" />
        </el-tabs>

        <el-card shadow="never" class="config-card">
            <router-view />
        </el-card>
    </ContentWrap>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'

defineOptions({ name: 'SystemConfig' })

type TabType = 'clue' | 'order' | 'student' | 'tag' | 'poolshare' | 'other'

const route = useRoute()
const router = useRouter()
const activeTab = ref<TabType>('clue')
const validTabs: TabType[] = ['clue', 'order', 'student', 'tag', 'poolshare', 'other']

const normalizeTab = (tab?: unknown): TabType => {
  const value = String(tab || '') as TabType
  return validTabs.includes(value) ? value : 'clue'
}

const handleTabChange = (name: string | number) => {
  const tab = normalizeTab(name)
  if (route.path !== `/system/config/${tab}`) {
    router.push(`/system/config/${tab}`)
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
}
</style>
