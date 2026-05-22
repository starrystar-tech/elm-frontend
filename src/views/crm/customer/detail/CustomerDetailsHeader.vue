<template>
    <div v-loading="loading">
        <div class="flex items-start justify-between gap-16px">
            <div>
                <div class="text-20px font-bold text-[#303133]">{{ clue.name || '--' }}</div>
                <div class="mt-8px text-13px text-[#606266]">
                    学员ID：{{ clue.customerId || '--' }}
                </div>
            </div>
            <div>
                <slot />
            </div>
        </div>
    </div>
    <ContentWrap class="mt-10px">
        <el-descriptions :column="5" direction="vertical">
            <el-descriptions-item label="手机号">{{ clue.mobile || '--' }}</el-descriptions-item>
            <el-descriptions-item label="班主任">{{
                clue.currentOwnerName || clue.ownerUserName || '--'
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

const props = defineProps<{
    clue: ClueApi.ClueVO
    loading: boolean
}>()

const regionText = computed(() => {
    const names = [props.clue.province, props.clue.city, props.clue.district].filter(Boolean)
    if (names.length) {
        return names.join(' / ')
    }
    return props.clue.areaName || '--'
})
</script>
