<template>
    <div class="detail-hero">
        <div class="detail-hero__main">
            <el-avatar
                v-if="avatar"
                :size="52"
                :src="avatar"
                class="detail-hero__avatar-image"
            />
            <div v-else class="detail-hero__avatar">{{ avatarText }}</div>
            <div class="detail-hero__meta">
                <div class="detail-hero__name-row">
                    <h3>{{ title || '--' }}</h3>
                    <slot name="titleExtra"></slot>
                </div>
                <div v-if="$slots.contact" class="detail-hero__contact">
                    <slot name="contact"></slot>
                </div>
                <div v-if="$slots.subline" class="detail-hero__subline">
                    <slot name="subline"></slot>
                </div>
            </div>
        </div>
        <div v-if="$slots.actions" class="detail-hero__actions">
            <slot name="actions"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    title?: string
    avatar?: string
    avatarText?: string
}>()
</script>

<style scoped lang="scss">
.detail-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 18px;
    color: #fff;
    border-radius: 12px;
    background: linear-gradient(
        135deg,
        var(--el-color-primary-light-3) 0%,
        var(--el-color-primary-light-7) 100%
    );
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.24);
}

.detail-hero__main {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
}

.detail-hero__avatar,
.detail-hero__avatar-image {
    flex-shrink: 0;
}

.detail-hero__avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.35);
    background: rgba(255, 255, 255, 0.24);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 700;
}

.detail-hero__avatar-image {
    border: 3px solid rgba(255, 255, 255, 0.35);
}

.detail-hero__meta {
    min-width: 0;
}

.detail-hero__meta h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
}

.detail-hero__name-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.detail-hero__contact,
.detail-hero__subline {
    margin-top: 6px;
    font-size: 13px;
    opacity: 0.96;
}

.detail-hero__subline {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.detail-hero__actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    flex-shrink: 0;
    flex-wrap: wrap;
}

@media (max-width: 768px) {
    .detail-hero {
        align-items: flex-start;
        flex-direction: column;
    }

    .detail-hero__actions {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>
