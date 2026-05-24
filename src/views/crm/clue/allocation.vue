<template>
    <ContentWrap>
        <div class="allocation-guide">
            <div>
                <div class="guide-title">名片分配入口已收敛到名片查询</div>
                <div class="guide-desc"
                    >当前线索分配、批量静默、打标签、导入等操作，统一在名片查询页和静默线索页处理。</div
                >
            </div>
            <div class="guide-actions">
                <el-button type="primary" @click="goCardQuery">前往名片查询</el-button>
                <el-button @click="goSilentPage">前往静默线索</el-button>
                <el-button @click="goImportTask">查看导入任务</el-button>
            </div>
        </div>
    </ContentWrap>
</template>

<script setup lang="ts">
defineOptions({ name: 'CrmClueAllocation' })

const { push } = useRouter()

const goCardQuery = () => push({ name: 'CrmClue' })
const goSilentPage = () => push({ name: 'CrmClueSilent' })
const goImportTask = () => push({ name: 'CrmClueImportTask' })
</script>

<style scoped>
.allocation-guide {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    min-height: 120px;
}

.guide-title {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
}

.guide-desc {
    margin-top: 10px;
    color: var(--el-text-color-secondary);
    line-height: 1.7;
}

.guide-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}
</style>
