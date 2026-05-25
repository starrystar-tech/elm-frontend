<template>
    <ContentWrap>
        <el-collapse v-model="activeNames">
            <el-collapse-item name="basicInfo" class="p-10px">
                <template #title>
                    <span class="text-base font-bold">基本信息</span>
                </template>
                <el-descriptions :column="4">
                    <el-descriptions-item label="学员姓名">{{
                        clue.name || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="联系电话">{{
                        clue.mobile || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="性别">{{
                        clue.genderName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="出生日期">{{
                        clue.birthday || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="年龄">{{
                        clue.age ? `${clue.age}岁` : '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="微信">{{
                        clue.wechat || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="微信备注名">{{
                        clue.wechatRemark || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="QQ">{{ clue.qq || '--' }}</el-descriptions-item>
                    <el-descriptions-item label="学历">{{
                        clue.educationName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="咨询项目">{{
                        clue.consultProjectName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="来源">{{
                        clue.clueSourceName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="详细地址">{{ addressText }}</el-descriptions-item>
                    <el-descriptions-item label="邮箱">{{
                        clue.email || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="意向度">{{
                        clue.intentLevelName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="备注" :span="2">{{
                        clue.remark || '--'
                    }}</el-descriptions-item>
                </el-descriptions>
            </el-collapse-item>
            <el-collapse-item name="systemInfo" class="p-10px">
                <template #title>
                    <span class="text-base font-bold">系统信息</span>
                </template>
                <el-descriptions :column="4">
                    <el-descriptions-item label="班主任">{{
                        clue.currentOwnerName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="所属部门">{{
                        clue.currentDepartmentName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="报名状态">{{
                        clue.customerId ? '已报名' : '未报名'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{
                        formatDate(clue.createTime) || '--'
                    }}</el-descriptions-item>
                </el-descriptions>
            </el-collapse-item>
        </el-collapse>
    </ContentWrap>
</template>

<script lang="ts" setup>
import * as ClueApi from '@/api/crm/clue'
import { formatDate } from '@/utils/formatTime'

const props = defineProps<{
    clue: ClueApi.ClueVO
}>()

const activeNames = ref(['basicInfo', 'systemInfo'])

const addressText = computed(() => {
    const names = [props.clue.province, props.clue.city, props.clue.district].filter(Boolean)
    const region = names.join(' / ')
    return [region, props.clue.detailAddress].filter(Boolean).join(' ') || '--'
})
</script>
