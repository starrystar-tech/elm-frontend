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
                    <el-descriptions-item label="联系电话">
                        <MobileCopyInline :clue-id="clue.id" :mobile="clue.mobile" />
                    </el-descriptions-item>
                    <el-descriptions-item label="性别">{{
                        clue.genderName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="出生日期">{{
                        clue.birthday || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="年龄">{{ ageText }}</el-descriptions-item>
                    <el-descriptions-item label="证件类型">{{
                        clue.certificateType || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="证件号码">{{
                        clue.idCardNo || '--'
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
                    <el-descriptions-item label="投诉标签">{{
                        complaintTagText
                    }}</el-descriptions-item>
                    <el-descriptions-item label="咨询项目">{{
                        clue.consultProjectName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="来源">{{
                        clue.clueSourceName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="详细地址">{{ addressText }}</el-descriptions-item>
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
                    <el-descriptions-item label="班主任">{{ headteacherText }}</el-descriptions-item>
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
import { buildAreaLabel } from '@/views/crm/clue/listShared'
import MobileCopyInline from '@/views/crm/clue/MobileCopyInline.vue'

const props = defineProps<{
    clue: ClueApi.ClueVO
}>()

const activeNames = ref(['basicInfo', 'systemInfo'])

const headteacherText = computed(() => props.clue.headteacherName || props.clue.currentOwnerName || '--')

const addressText = computed(() => {
    const region = buildAreaLabel(props.clue)
    const regionText = region === '--' ? '' : region
    return [regionText, props.clue.detailAddress].filter(Boolean).join(' ') || '--'
})

const ageText = computed(() => {
    const birthday = props.clue.birthday
    if (!birthday) return '--'
    const birthDate = new Date(birthday)
    if (Number.isNaN(birthDate.getTime())) return '--'
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    const dayDiff = today.getDate() - birthDate.getDate()
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age -= 1
    }
    return age >= 0 ? `${age}岁` : '--'
})

const complaintTagText = computed(() => {
    const names = props.clue.complaintTagNames || []
    return names.length ? names.join('、') : '--'
})
</script>
