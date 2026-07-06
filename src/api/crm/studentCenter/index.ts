import request from '@/config/axios'

export interface StudentCenterPageReqVO extends PageParam {
    customer?: string
    mobile?: string
    areaId?: number
    headteacherUserId?: number
    applyLevel?: string
    applySchool?: string
    applyMajor?: string
    beginEnrollTime?: string
    endEnrollTime?: string
    applyProjectId?: number
    installmentStatus?: number
    finalPaymentChannel?: string
    ownerDeptId?: number
    campusId?: number
    aftersalesStatus?: number
    aftersalesResult?: number
    householdProvince?: string
    applyProvince?: string
    serviceStatus?: number
    courseStatus?: number
    studentRemark?: string
}

export interface StudentCenterPageRespVO {
    orderId: number
    orderNo?: string
    clueId: number
    customerId?: string
    customerName?: string
    customerMobile?: string
    customerMobile2?: string
    gender?: number
    wechat?: string
    areaId?: number
    province?: string
    city?: string
    district?: string
    headteacherUserId?: number
    headteacherUserName?: string
    orderStatus?: number
    contractStatus?: number
    applyLevel?: string
    applySchool?: string
    applyMajor?: string
    enrollTime?: string
    expireTime?: string
    applyProjectId?: number
    applyProjectName?: string
    installmentStatus?: number
    finalPaymentChannel?: string
    ownerDeptId?: number
    ownerDeptName?: string
    ownerUserName?: string
    campusId?: number
    campusName?: string
    payableAmount?: number
    paidAmount?: number
    refundAmount?: number
    aftersalesStatus?: number | null
    aftersalesResult?: number | null
    householdProvince?: string
    applyProvince?: string
    serviceStatus?: number
    courseStatus?: number
    studentRemark?: string
    projectName?: string
    mainProductCategoryPath?: string
    mainProductName?: string
    creator?: string
    creatorName?: string
    createTime?: string
}

export interface StudentCenterUpdateReqVO {
    id: number
    householdProvince?: string
    applyProvince?: string
    serviceStatus?: number
    courseStatus?: number
    studentRemark?: string
}

export interface StudentCenterBatchUpdateHeadteacherReqVO {
    orderIds: number[]
    headteacherUserId: number
}

export interface StudentCourseStatsReqVO {
    beginEnrollTime: string
    endEnrollTime: string
    headteacherUserId?: number
}

export interface StudentCourseStatsRespVO {
    headteacherUserId?: number
    headteacherUserName?: string
    studentCount?: number
    startedCourseStudentCount?: number
    notStartedCourseStudentCount?: number
}

export interface StudentProjectYearlyStatsReqVO {
    beginEnrollTime: string
    endEnrollTime: string
    headteacherUserId?: number
    applyProjectId?: number
}

export interface StudentProjectYearlyStatsRespVO {
    headteacherUserId?: number
    headteacherUserName?: string
    applyProjectId?: number
    projectName?: string
    studentCount?: number
}

export const STUDENT_SERVICE_STATUS_OPTIONS = [
    { label: '服务中', value: 1 },
    { label: '服务变更', value: 2 }
]

export const STUDENT_COURSE_STATUS_OPTIONS = [
    { label: '未开', value: 1 },
    { label: '已开课', value: 2 }
]

export const STUDENT_INSTALLMENT_STATUS_OPTIONS = [
    { label: '分期', value: 1 },
    { label: '全款', value: 2 }
]

export const getStudentServiceStatusLabel = (value?: number) =>
    STUDENT_SERVICE_STATUS_OPTIONS.find((item) => item.value === Number(value))?.label || '--'

export const getStudentCourseStatusLabel = (value?: number) =>
    STUDENT_COURSE_STATUS_OPTIONS.find((item) => item.value === Number(value))?.label || '--'

export const getStudentInstallmentStatusLabel = (value?: number) =>
    STUDENT_INSTALLMENT_STATUS_OPTIONS.find((item) => item.value === Number(value))?.label || '--'

export const getMyStudentPage = (params: StudentCenterPageReqVO) => {
    return request.get<PageResult<StudentCenterPageRespVO>>({
        url: '/crm/student-center/my-page',
        params
    })
}

export const getStudentPage = (params: StudentCenterPageReqVO) => {
    return request.get<PageResult<StudentCenterPageRespVO>>({
        url: '/crm/student-center/page',
        params
    })
}

export const myRepurchase = (id: number) => {
    return request.post<number>({ url: '/crm/student-center/my-repurchase', params: { id } })
}

export const updateStudent = (data: StudentCenterUpdateReqVO) => {
    return request.put<boolean>({ url: '/crm/student-center/update', data })
}

export const batchUpdateHeadteacher = (data: StudentCenterBatchUpdateHeadteacherReqVO) => {
    return request.put<boolean>({ url: '/crm/student-center/batch-update-headteacher', data })
}

export const getStudentCourseStats = (params: StudentCourseStatsReqVO) => {
    return request.get<StudentCourseStatsRespVO[]>({
        url: '/crm/student-center/stats/student-course',
        params
    })
}

export const getApplyProjectYearlyStats = (params: StudentProjectYearlyStatsReqVO) => {
    return request.get<StudentProjectYearlyStatsRespVO[]>({
        url: '/crm/student-center/stats/apply-project-yearly',
        params
    })
}
