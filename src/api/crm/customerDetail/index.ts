import request from '@/config/axios'
import type { OutboundCallRecordVO } from '@/api/system/call/record'
import type { SmsLogVO, SmsLogPageReqVO } from '@/api/system/sms/smsLog'

export interface CustomerTagItem {
    id: number
    name: string
}

export interface CustomerBasicInfoRespVO {
    clueId: number
    customerId?: string
    name?: string
    mobile?: string
    mobile2?: string
    ownerId?: number
    ownerName?: string
    departmentId?: number
    departmentName?: string
    intentLevel?: number
    intentLevelName?: string
    status?: number
    statusName?: string
    wechat?: string
    wechat2?: string
    wechatRemark?: string
    qq?: string
    gender?: number
    genderName?: string
    education?: number
    educationName?: string
    areaId?: number
    provinceName?: string
    cityName?: string
    districtName?: string
    consultProjectId?: number
    consultProjectName?: string
    clueSourceId?: number
    clueSourceName?: string
    customerType?: string
    tags?: CustomerTagItem[]
    createTime?: string
}

export interface CustomerAppointmentRespVO {
    id: number
    appointmentType?: number
    appointmentTypeName?: string
    appointmentTime?: string
    campusId?: number
    campusName?: string
    projectId?: number
    projectName?: string
    productCategoryId?: number
    productCategoryName?: string
    productId?: number
    productName?: string
    appointmentPrice?: number
    consultContent?: string
    creator?: string
    creatorName?: string
    createTime?: string
}

export interface CustomerConsultRecordCreateReqVO {
    clueId: number
    consultResult?: number
    consultType?: number
    campusId?: number
    projectId?: number
    productCategoryId?: number
    productId?: number
    appointmentPrice?: number
    appointmentTime?: string
    nextFollowTime?: string
    needRemind?: boolean
    invalidType?: number
    invalidReason?: string
    notConnectedReason?: number
    consultContent?: string
}

export interface CustomerWeworkRelationItem {
    relationId: number
    clueId?: number
    staffUserId: string
    staffName: string
    staffAvatar?: string
    remark?: string
    mobile?: string
    addWay?: string
    addTime?: string
    state?: string
    stateName?: string
}

export interface CustomerWeworkContactItem {
    externalUserId: string
    customerName?: string
    customerNickname?: string
    avatar?: string
    customerType?: number
    customerTypeName?: string
    gender?: number
    genderName?: string
    corpName?: string
    relations: CustomerWeworkRelationItem[]
}

export interface CustomerWeworkInfoRespVO {
    contacts: CustomerWeworkContactItem[]
}

export interface CustomerTrackRespVO {
    id: number
    type?: number
    typeName?: string
    content?: string
    contentLines?: string[]
    operator?: string
    createTime?: string
}

export interface CustomerDetailPageReqVO extends PageParam {
    id: number
}

export const getCustomerWeworkInfo = async (id: number) => {
    return await request.get<CustomerWeworkInfoRespVO>({ url: '/crm/customer-detail/wework-info', params: { id } })
}

export const getCustomerBasicInfo = async (id: number) => {
    return await request.get<CustomerBasicInfoRespVO>({ url: '/crm/customer-detail/basic-info', params: { id } })
}

export const getCustomerTracks = async (params: CustomerDetailPageReqVO) => {
    return await request.get<PageResult<CustomerTrackRespVO>>({ url: '/crm/customer-detail/tracks', params })
}

export const getCustomerAppointments = async (params: CustomerDetailPageReqVO) => {
    return await request.get<PageResult<CustomerAppointmentRespVO>>({ url: '/crm/customer-detail/appointments', params })
}

export const getCustomerOutboundCallRecords = async (params: CustomerDetailPageReqVO) => {
    return await request.get<PageResult<OutboundCallRecordVO>>({
        url: '/crm/customer-detail/outbound-call-records',
        params
    })
}

export const getCustomerSmsLogs = async (params: SmsLogPageReqVO) => {
    return await request.get<PageResult<SmsLogVO>>({
        url: '/crm/customer-detail/sms-logs',
        params
    })
}

export const createCustomerConsultRecord = async (data: CustomerConsultRecordCreateReqVO) => {
    return await request.post<number>({ url: '/crm/customer-detail/consult-record/create', data })
}

export const createCustomerAppointment = async (data: CustomerConsultRecordCreateReqVO) => {
    return await request.post<number>({ url: '/crm/customer-detail/appointment/create', data })
}
