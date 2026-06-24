<template>
    <div class="clue-name-cell">
        <el-avatar :size="32" :src="avatar" class="clue-name-cell__avatar">
            {{ avatarText }}
        </el-avatar>
        <div class="clue-name-cell__content">
            <el-tooltip :content="displayName" placement="top" :show-after="300">
                <el-link
                    class="clue-name-cell__link"
                    :underline="false"
                    type="primary"
                    @click="$emit('click')"
                >
                    {{ displayName }}
                </el-link>
            </el-tooltip>
            <el-tooltip v-if="suffix" :content="suffixText" placement="top" :show-after="300">
                <span class="clue-name-cell__suffix" :style="{ color: suffixColor }">
                    {{ suffixText }}
                </span>
            </el-tooltip>
        </div>
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ClueNameCell' })

const props = defineProps<{
    name?: string
    avatar?: string
    suffix?: string
    suffixColor?: string
}>()

defineEmits<{
    click: []
}>()

const displayName = computed(() => props.name || '-')
const suffixText = computed(() => (props.suffix ? `@${props.suffix}` : ''))
const avatarText = computed(() => (props.name || '线').slice(0, 1))
</script>

<style scoped lang="scss">
.clue-name-cell {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    min-width: 0;
}

.clue-name-cell__avatar {
    flex: 0 0 auto;
}

.clue-name-cell__content {
    flex: 0 1 auto;
    min-width: 0;
    max-width: calc(100% - 36px);
    display: inline-flex;
    align-items: center;
    gap: 1px;
}

.clue-name-cell__link {
    flex: 0 1 auto;
    width: fit-content;
    min-width: 0;
    max-width: 88px;
    overflow: hidden;

    :deep(.el-link__inner) {
        display: block;
        min-width: 0;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.clue-name-cell__suffix {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
