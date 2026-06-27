<template>
    <ElDialog
        v-if="isModal"
        v-model="showSearch"
        :show-close="false"
        title="客户搜索"
        width="560px"
    >
        <el-input
            v-model="keyword"
            clearable
            placeholder="请输入姓名、手机号或客户编号"
            @keyup.enter="submitSearch"
        >
            <template #suffix>
                <Icon
                    class="cursor-pointer text-[var(--el-text-color-secondary)]"
                    icon="ep:search"
                    @click="submitSearch"
                />
            </template>
        </el-input>
    </ElDialog>
    <div v-else class="router-search">
        <el-input
            v-model="keyword"
            clearable
            placeholder="输入姓名、手机、编号搜索客户"
            @keyup.enter="submitSearch"
        >
            <template #suffix>
                <Icon
                    class="cursor-pointer text-[var(--el-text-color-secondary)]"
                    :color="color"
                    icon="ep:search"
                    @click="submitSearch"
                />
            </template>
        </el-input>
    </div>
</template>

<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
defineProps({
    isModal: {
        type: Boolean,
        default: true
    },
    color: propTypes.string.def('')
})

const router = useRouter()
const showSearch = ref(false)
const keyword = ref('')

function hiddenSearch() {
    showSearch.value = false
}

function submitSearch() {
    const value = keyword.value.trim()
    if (!value) return
    router.push({
        path: '/crm/clue/search',
        query: { keyword: value }
    })
    hiddenSearch()
}

onMounted(() => {
    window.addEventListener('keydown', listenKey)
})

onUnmounted(() => {
    window.removeEventListener('keydown', listenKey)
})

function listenKey(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        showSearch.value = !showSearch.value
    }
}

defineExpose({
    openSearch: () => {
        showSearch.value = true
    }
})
</script>

<style scoped lang="scss">
.router-search {
    display: flex;
    align-items: center;
    width: 250px;
    height: 36px;
    margin-right: 8px;
}

.router-search :deep(.el-input__wrapper) {
    height: 36px;
    min-height: 36px;
    padding: 0 12px;
    border-radius: 999px;
    box-shadow: none;
    background: rgba(255, 255, 255, 0.92);
}

.router-search :deep(.el-input__inner) {
    height: 36px;
    line-height: 36px;
    font-size: 13px;
}

.router-search :deep(.el-input__suffix-inner) {
    cursor: pointer;
}
</style>
