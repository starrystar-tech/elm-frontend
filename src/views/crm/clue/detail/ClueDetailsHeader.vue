<template>
    <div v-loading="loading">
        <div class="flex items-start justify-between gap-16px">
            <div>
                <div class="text-20px font-bold text-[#303133]">{{ clue.name || '--' }}</div>
                <div class="mt-8px text-13px text-[#606266]"
                    >名片编号：{{ clue.customerId || clue.id || '--' }}</div
                >
            </div>
            <div>
                <slot></slot>
            </div>
        </div>
    </div>

    <ContentWrap class="mt-10px">
        <el-descriptions :column="5" direction="vertical">
            <el-descriptions-item label="联系电话">
                <MobileCopyInline :clue-id="clue.id" :mobile="clue.mobile" />
            </el-descriptions-item>
            <el-descriptions-item label="归属人">{{
                clue.currentOwnerName || '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="所属部门">{{
                clue.currentDepartmentName || '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="地区">{{ regionText }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{
                formatDate(clue.createTime) || '--'
            }}</el-descriptions-item>
        </el-descriptions>
    </ContentWrap>
</template>

<script setup lang="ts">
import * as ClueApi from '@/api/crm/clue'
import { formatDate } from '@/utils/formatTime'
import MobileCopyInline from '@/views/crm/clue/MobileCopyInline.vue'
import { buildAreaLabel } from '@/views/crm/clue/listShared'

const props = defineProps<{
    clue: ClueApi.ClueVO
    loading: boolean
}>()

const regionText = computed(() => {
    return buildAreaLabel(props.clue)
})
</script>
