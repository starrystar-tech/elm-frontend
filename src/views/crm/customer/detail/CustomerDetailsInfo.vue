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
                        birthdayText
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
                    <el-descriptions-item label="归属人">{{ currentOwnerText }}</el-descriptions-item>
                    <el-descriptions-item label="班主任">{{
                        clue.headteacherName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="所属部门">{{
                        clue.currentDepartmentName || '--'
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
import { buildAreaLabel, buildOwnerDisplayName } from '@/views/crm/clue/listShared'
import MobileCopyInline from '@/views/crm/clue/MobileCopyInline.vue'

const props = defineProps<{
    clue: ClueApi.ClueVO
}>()

const activeNames = ref(['basicInfo', 'systemInfo'])

const currentOwnerText = computed(() =>
    buildOwnerDisplayName(props.clue.currentOwnerName, props.clue.currentOwnerId)
)

const addressText = computed(() => {
    const region = buildAreaLabel(props.clue)
    const regionText = region === '--' ? '' : region
    return [regionText, props.clue.detailAddress].filter(Boolean).join(' ') || '--'
})

const parseBirthday = (birthday: unknown) => {
    if (!birthday) return null
    if (Array.isArray(birthday)) {
        const [year, month, day] = birthday
        const parsedYear = Number(year)
        const parsedMonth = Number(month)
        const parsedDay = Number(day)
        if (!parsedYear || !parsedMonth || !parsedDay) return null
        const birthDate = new Date(parsedYear, parsedMonth - 1, parsedDay)
        return Number.isNaN(birthDate.getTime()) ? null : birthDate
    }
    const text = String(birthday).trim()
    if (!text) return null
    const normalizedText = text.replace(/[\[\]]/g, '').replace(/,\s*/g, '/').replace(/-/g, '/')
    const birthDate = new Date(normalizedText)
    return Number.isNaN(birthDate.getTime()) ? null : birthDate
}

const birthdayText = computed(() => {
    const birthday = props.clue.birthday
    if (!birthday) return '--'
    if (Array.isArray(birthday)) {
        return birthday.join('/')
    }
    const text = String(birthday).trim()
    if (text.startsWith('[') && text.endsWith(']')) {
        return text.replace(/[\[\]\s]/g, '').replace(/,/g, '/')
    }
    return text
})

const ageText = computed(() => {
    const birthDate = parseBirthday(props.clue.birthday)
    if (!birthDate) return '--'
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
