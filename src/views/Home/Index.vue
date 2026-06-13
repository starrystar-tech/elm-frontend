<template>
    <div v-loading="loading" class="dashboard-page">
        <section class="dashboard-summary">
            <SummaryCard
                v-for="item in dashboard.summaryCards"
                :key="item.code"
                :item="item"
                @navigate="goTo"
            />
        </section>

        <section class="dashboard-main">
            <div class="dashboard-column">
                <el-card shadow="never" class="dashboard-card">
                    <template #header>
                        <div class="dashboard-card__header">
                            <span>快捷入口</span>
                            <span class="dashboard-card__meta">常用业务直达</span>
                        </div>
                    </template>
                    <ShortcutGrid :items="dashboard.shortcuts" @navigate="goTo" />
                </el-card>

                <el-card shadow="never" class="dashboard-card">
                    <template #header>
                        <div class="dashboard-card__header">
                            <span>最近动态</span>
                            <span class="dashboard-card__meta">跨线索 / 订单 / 工单</span>
                        </div>
                    </template>
                    <ActivityTimeline :items="dashboard.activities" @navigate="goTo" />
                </el-card>
            </div>

            <div class="dashboard-side">
                <el-card shadow="never" class="dashboard-card dashboard-card--warm">
                    <template #header>
                        <div class="dashboard-card__header">
                            <span>待办事项</span>
                            <span class="dashboard-card__meta">建议优先处理</span>
                        </div>
                    </template>
                    <TodoPanel :items="dashboard.todoItems" @navigate="goTo" />
                </el-card>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { getHomeDashboard, type HomeDashboardVO } from '@/api/home'
import { useUserStore } from '@/store/modules/user'
import SummaryCard from './components/SummaryCard.vue'
import ShortcutGrid from './components/ShortcutGrid.vue'
import TodoPanel from './components/TodoPanel.vue'
import ActivityTimeline from './components/ActivityTimeline.vue'

defineOptions({ name: 'HomeIndex' })

const userStore = useUserStore()
const { push } = useRouter()

const loading = ref(false)
const dashboard = ref<HomeDashboardVO>({
    summaryCards: [],
    shortcuts: [],
    todoItems: [],
    activities: []
})

const displayName = computed(
    () => userStore.getUser.nickname || userStore.getUser.username || '同学'
)

const todayFocusText = computed(() => {
    const todo = dashboard.value.todoItems[0]
    if (!todo) {
        return '首页数据加载完成后会在这里给出优先建议。'
    }
    return `${todo.title}：${todo.description}`
})

const getDashboard = async () => {
    loading.value = true
    try {
        dashboard.value = await getHomeDashboard()
    } finally {
        loading.value = false
    }
}

const goTo = (path?: string) => {
    if (!path) return
    push(path)
}

onMounted(() => {
    getDashboard()
})
</script>

<style scoped>
.dashboard-page {
    padding: 6px 0 24px;
}

.dashboard-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 18px;
}

.dashboard-main {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.9fr);
    gap: 18px;
}

.dashboard-column,
.dashboard-side {
    display: grid;
    gap: 18px;
    min-width: 0;
}

.dashboard-card {
    border: 1px solid #e2e8f0;
    border-radius: 24px;
}

:deep(.dashboard-card .el-card__header) {
    padding-bottom: 0;
    border-bottom: 0;
}

:deep(.dashboard-card .el-card__body) {
    padding-top: 18px;
}

.dashboard-card--warm {
    background:
        radial-gradient(circle at top right, rgba(187, 247, 208, 0.26), transparent 28%),
        linear-gradient(180deg, #ffffff, #f8fafc);
}

.dashboard-card__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
}

.dashboard-card__header span:first-child {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
}

.dashboard-card__meta {
    font-size: 12px;
    color: #94a3b8;
}

@media (max-width: 1200px) {
    .dashboard-summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .dashboard-main {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .dashboard-hero {
        grid-template-columns: 1fr;
    }

    .dashboard-hero__copy,
    .dashboard-hero__aside {
        padding: 22px;
        border-radius: 22px;
    }

    .dashboard-hero__title {
        font-size: 28px;
    }

    .dashboard-summary {
        grid-template-columns: 1fr;
    }
}
</style>
