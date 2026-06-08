<template>
    <ContentWrap>
        <el-collapse v-model="activeNames">
            <el-collapse-item name="basicInfo">
                <template #title>
                    <span class="text-base font-bold">基本信息</span>
                </template>
                <el-descriptions :column="4">
                    <el-descriptions-item label="姓名">{{
                        clue.name || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="联系电话">
                        <MobileCopyInline :clue-id="clue.id" :mobile="clue.mobile" />
                    </el-descriptions-item>
                    <el-descriptions-item label="备用电话">
                        <MobileCopyInline :mobile="clue.mobile2" direct-copy />
                    </el-descriptions-item>
                    <el-descriptions-item label="性别">{{
                        clue.genderName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="出生日期">{{
                        clue.birthday || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="学历">{{
                        clue.educationName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="微信">{{
                        clue.wechat || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="微信2">{{
                        clue.wechat2 || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="微信备注名">{{
                        clue.wechatRemark || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="QQ">{{ clue.qq || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="证件类型">{{
                        clue.certificateType || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="证件号码">{{
                        clue.idCardNo || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="咨询项目">{{
                        clue.consultProjectName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="客户来源">{{
                        clue.clueSourceName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="意向度">{{
                        clue.intentLevelName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="地区" :span="2">{{
                        addressText
                    }}</el-descriptions-item>
                    <el-descriptions-item label="备注" :span="4">{{
                        clue.remark || '--'
                    }}</el-descriptions-item>
                </el-descriptions>
            </el-collapse-item>

            <el-collapse-item name="systemInfo">
                <template #title>
                    <span class="text-base font-bold">系统信息</span>
                </template>
                <el-descriptions :column="4">
                    <el-descriptions-item label="归属人">{{
                        clue.currentOwnerName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="所属部门">{{
                        clue.currentDepartmentName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{
                        formatDate(clue.createTime) || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="静默原因">{{
                        clue.silentReason || '--'
                    }}</el-descriptions-item>
                </el-descriptions>
            </el-collapse-item>
        </el-collapse>
    </ContentWrap>
</template>

<script setup lang="ts">
import * as ClueApi from '@/api/crm/clue'
import { formatDate } from '@/utils/formatTime'
import MobileCopyInline from '@/views/crm/clue/MobileCopyInline.vue'

const props = defineProps<{
    clue: ClueApi.ClueVO
}>()

const activeNames = ref(['basicInfo', 'systemInfo'])

const addressText = computed(() => {
    const names = [props.clue.province, props.clue.city, props.clue.district].filter(Boolean)
    return names.length ? names.join(' / ') : props.clue.areaName || '--'
})
</script>
