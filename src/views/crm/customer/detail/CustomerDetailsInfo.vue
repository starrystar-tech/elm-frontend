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
            <el-collapse-item name="enrollInfo" class="p-10px">
                <template #title>
                    <span class="text-base font-bold">报考信息</span>
                </template>
                <el-descriptions :column="4">
                    <el-descriptions-item label="班主任">{{ headteacherText }}</el-descriptions-item>
                    <el-descriptions-item label="报名时间">{{ enrollTimeText }}</el-descriptions-item>
                    <el-descriptions-item label="报考层次">{{ applyLevelText }}</el-descriptions-item>
                    <el-descriptions-item label="报考院校">{{ applySchoolText }}</el-descriptions-item>
                    <el-descriptions-item label="报考专业">{{ applyMajorText }}</el-descriptions-item>
                    <el-descriptions-item label="报考项目">{{ applyProjectText }}</el-descriptions-item>
                    <el-descriptions-item label="分期状态">{{ installmentStatusText }}</el-descriptions-item>
                    <el-descriptions-item label="尾款渠道">{{ finalPaymentChannelText }}</el-descriptions-item>
                    <el-descriptions-item label="报名分校">{{ campusNameText }}</el-descriptions-item>
                    <el-descriptions-item label="售后状态">{{ aftersalesStatusText }}</el-descriptions-item>
                    <el-descriptions-item label="售后结果">{{ aftersalesResultText }}</el-descriptions-item>
                    <el-descriptions-item label="投诉标签">{{ complaintTagText }}</el-descriptions-item>
                    <el-descriptions-item label="户籍省份">{{ householdProvinceText }}</el-descriptions-item>
                    <el-descriptions-item label="报考省份">{{ applyProvinceText }}</el-descriptions-item>
                    <el-descriptions-item label="服务状态">{{ serviceStatusText }}</el-descriptions-item>
                    <el-descriptions-item label="开课状态">{{ courseStatusText }}</el-descriptions-item>
                    <el-descriptions-item label="组别(归属人)">{{ ownerDeptText }}</el-descriptions-item>
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
                        createTimeText
                    }}</el-descriptions-item>
                </el-descriptions>
            </el-collapse-item>
        </el-collapse>
    </ContentWrap>
</template>

<script lang="ts" setup>
import type * as AftersalesApi from '@/api/crm/aftersales'
import * as ClueApi from '@/api/crm/clue'
import type * as OrderApi from '@/api/crm/order'
import * as StudentCenterApi from '@/api/crm/studentCenter'
import { formatDate } from '@/utils/formatTime'
import {
    getAftersalesResultLabel,
    getAftersalesStatusLabel
} from '@/views/aftersales/config'
import {
    buildAreaLabel,
    buildDeptOwnerDisplayName,
    buildOwnerDisplayName
} from '@/views/crm/clue/listShared'
import MobileCopyInline from '@/views/crm/clue/MobileCopyInline.vue'

const props = defineProps<{
    clue: ClueApi.ClueVO
    studentInfo?: Partial<StudentCenterApi.StudentCenterPageRespVO>
    orderRecords?: OrderApi.OrderPageRespVO[]
    ticketRecords?: AftersalesApi.AftersalesRespVO[]
}>()

const activeNames = ref(['basicInfo', 'enrollInfo', 'systemInfo'])

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

const firstOrderRecord = computed(() => props.orderRecords?.[0])

const latestTicketRecord = computed(() => {
    const records = props.ticketRecords || []
    if (!records.length) return undefined
    return [...records].sort((a, b) => {
        const timeA = new Date(a.processTime || a.createTime || 0).getTime()
        const timeB = new Date(b.processTime || b.createTime || 0).getTime()
        return timeB - timeA
    })[0]
})

const getDisplayText = (...values: Array<string | number | null | undefined>) => {
    for (const value of values) {
        if (value === null || value === undefined) continue
        const text = String(value).trim()
        if (text) return text
    }
    return '--'
}

const applyLevelText = computed(() => getDisplayText(props.clue.applyLevel, props.studentInfo?.applyLevel))
const applySchoolText = computed(() => getDisplayText(props.clue.applySchool, props.studentInfo?.applySchool))
const applyMajorText = computed(() => getDisplayText(props.clue.applyMajor, props.studentInfo?.applyMajor))
const applyProjectText = computed(() =>
    getDisplayText(
        props.clue.applyProjectName,
        props.studentInfo?.applyProjectName,
        props.studentInfo?.projectName,
        firstOrderRecord.value?.projectName
    )
)
const installmentStatusText = computed(() =>
    StudentCenterApi.getStudentInstallmentStatusLabel(
        props.clue.installmentStatus ??
            props.studentInfo?.installmentStatus ??
            firstOrderRecord.value?.installmentStatus
    )
)
const finalPaymentChannelText = computed(() =>
    getDisplayText(
        props.clue.finalPaymentChannel,
        props.studentInfo?.finalPaymentChannel,
        firstOrderRecord.value?.finalPaymentChannel
    )
)
const ownerDeptText = computed(() =>
    buildDeptOwnerDisplayName(
        getDisplayText(
            props.clue.ownerDeptName,
            props.studentInfo?.ownerDeptName,
            props.clue.currentDepartmentName
        ),
        getDisplayText(props.studentInfo?.ownerUserName, firstOrderRecord.value?.ownerUserName, '')
    )
)
const campusNameText = computed(() =>
    getDisplayText(props.clue.campusName, props.studentInfo?.campusName, firstOrderRecord.value?.campusName)
)
const aftersalesStatusText = computed(() =>
    getAftersalesStatusLabel(
        props.clue.aftersalesStatus ??
            props.studentInfo?.aftersalesStatus ??
            latestTicketRecord.value?.status
    )
)
const aftersalesResultText = computed(() =>
    getAftersalesResultLabel(
        props.clue.aftersalesResult ??
            props.studentInfo?.aftersalesResult ??
            latestTicketRecord.value?.aftersalesResult
    )
)
const householdProvinceText = computed(() =>
    getDisplayText(props.clue.householdProvince, props.studentInfo?.householdProvince)
)
const applyProvinceText = computed(() =>
    getDisplayText(props.clue.applyProvince, props.studentInfo?.applyProvince)
)
const createTimeText = computed(() =>
    props.clue.createTime ? formatDate(new Date(props.clue.createTime)) || '--' : '--'
)
const headteacherText = computed(() =>
    getDisplayText(props.studentInfo?.headteacherUserName, props.clue.headteacherName)
)
const enrollTimeText = computed(() =>
    getDisplayText(props.studentInfo?.enrollTime, firstOrderRecord.value?.enrollTime)
)
const serviceStatusText = computed(() =>
    StudentCenterApi.getStudentServiceStatusLabel(props.studentInfo?.serviceStatus)
)
const courseStatusText = computed(() =>
    StudentCenterApi.getStudentCourseStatusLabel(props.studentInfo?.courseStatus)
)
</script>
