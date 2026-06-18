<template>
    <div v-loading="loading">
        <DetailHeroCard :avatar="clue.avatar" :avatar-text="avatarText" :title="clue.name || '--'">
            <template #subline>
                <span>学员ID：{{ clue.customerId || '--' }}</span>
                <span>班主任：{{ headteacherText }}</span>
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
            <el-descriptions-item label="班主任">{{ headteacherText }}</el-descriptions-item>
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
import { buildAreaLabel } from '@/views/crm/clue/listShared'
import DetailHeroCard from '@/views/crm/components/DetailHeroCard.vue'

const props = defineProps<{
    clue: ClueApi.ClueVO
    loading: boolean
}>()

const avatarText = computed(() => (props.clue.name || '学').slice(0, 1))

const headteacherText = computed(() => props.clue.headteacherName || props.clue.currentOwnerName || '--')

const regionText = computed(() => buildAreaLabel(props.clue))
</script>
