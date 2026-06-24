<template>
    <div class="clue-name-cell">
        <el-avatar :size="32" :src="avatar" class="clue-name-cell__avatar">
            {{ avatarText }}
        </el-avatar>
        <el-link
            class="clue-name-cell__link"
            :title="displayName"
            :underline="false"
            type="primary"
            @click="$emit('click')"
        >
            {{ displayName }}
        </el-link>
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ClueNameCell' })

const props = defineProps<{
    name?: string
    avatar?: string
}>()

defineEmits<{
    click: []
}>()

const displayName = computed(() => props.name || '-')
const avatarText = computed(() => (props.name || '线').slice(0, 1))
</script>

<style scoped lang="scss">
.clue-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
}

.clue-name-cell__avatar {
    flex: 0 0 auto;
}

.clue-name-cell__link {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;

    :deep(.el-link__inner) {
        display: block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}
</style>
