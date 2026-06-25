<template>
    <div v-loading="loading">
        <DetailHeroCard :avatar="clue.avatar" :avatar-text="avatarText" :title="clue.name || '--'">
            <template #subline>
                <span>学员ID：{{ clue.customerId || '--' }}</span>
                <span>归属人：{{ currentOwnerText }}</span>
                <span>班主任：{{ headteacherText }}</span>
                <span>地域：{{ regionText }}</span>
                <span>报名状态：{{ clue.customerId ? '已报名' : '未报名' }}</span>
            </template>
            <template #actions>
                <slot></slot>
            </template>
        </DetailHeroCard>
    </div>
</template>

<script lang="ts" setup>
import * as ClueApi from '@/api/crm/clue'
import { buildAreaLabel } from '@/views/crm/clue/listShared'
import DetailHeroCard from '@/views/crm/components/DetailHeroCard.vue'

const props = defineProps<{
    clue: ClueApi.ClueVO
    loading: boolean
}>()

const avatarText = computed(() => (props.clue.name || '学').slice(0, 1))

const currentOwnerText = computed(() => props.clue.currentOwnerName || '--')

const headteacherText = computed(() => props.clue.headteacherName || '--')

const regionText = computed(() => buildAreaLabel(props.clue))
</script>
