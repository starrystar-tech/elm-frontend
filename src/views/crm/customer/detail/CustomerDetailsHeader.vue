<template>
    <div v-loading="loading">
        <DetailHeroCard :avatar="clue.avatar" :avatar-text="avatarText" :title="clue.name || '--'">
            <template #subline>
                <span>学员ID：{{ clue.customerId || '--' }}</span>
                <span>班主任：{{ clue.currentOwnerName || '--' }}</span>
                <span>地域：{{ regionText }}</span>
                <span>报名状态：{{ clue.customerId ? '已报名' : '未报名' }}</span>
            </template>
            <template #actions>
                <slot></slot>
            </template>
        </DetailHeroCard>
    </div>
    <ContentWrap class="mt-10px">
        <el-descriptions :column="5" direction="vertical" class="p-10px pb-0px">
            <el-descriptions-item label="班主任">{{
                clue.currentOwnerName || '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="地域">{{ regionText }}</el-descriptions-item>
            <el-descriptions-item label="报名状态">{{
                clue.customerId ? '已报名' : '未报名'
            }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{
                formatDate(clue.createTime) || '--'
            }}</el-descriptions-item>
        </el-descriptions>
    </ContentWrap>
</template>

<script lang="ts" setup>
import * as ClueApi from '@/api/crm/clue'
import { formatDate } from '@/utils/formatTime'
import MobileCopyInline from '@/views/crm/clue/MobileCopyInline.vue'
import DetailHeroCard from '@/views/crm/components/DetailHeroCard.vue'

const props = defineProps<{
    clue: ClueApi.ClueVO
    loading: boolean
}>()

const avatarText = computed(() => (props.clue.name || '学').slice(0, 1))

const regionText = computed(() => {
    const names = [props.clue.province, props.clue.city, props.clue.district].filter(Boolean)
    if (names.length) {
        return names.join(' / ')
    }
    return props.clue.areaName || '--'
})
</script>
