import request from '@/config/axios'
import { TransferReqVO } from '@/api/crm/permission'

export interface ClueVO {
    id: number
    customerId?: string
    name: string
    mobile?: string
    mobile2?: string
    telephone?: string
    wechat?: string
    wechat2?: string
    wechatRemark?: string
    qq?: string
    nation?: string
    email?: string
    age?: number
    idCardNo?: string
    gender?: number
    genderName?: string
    birthday?: string
    education?: number
    educationName?: string
    areaId?: number
    areaName?: string
    province?: string
    city?: string
    district?: string
    detailAddress?: string
    consultProjectId?: number
    consultProjectName?: string
    clueSourceId?: number
    clueSourceName?: string
    source?: number
    tagIds?: number[]
    assignMode?: number
    assignModeName?: string
    autoAssignFailReason?: string
    status?: number
    statusName?: string
    intentLevel?: number
    intentLevelName?: string
    currentOwnerId?: number
    currentOwnerName?: string
    currentDepartmentId?: number
    currentDepartmentName?: string
    ownerUserId?: number
    ownerUserName?: string
    ownerUserDept?: string
    contactLastTime?: string
    contactLastContent?: string
    contactNextTime?: string
    followUpStatus?: boolean
    transformStatus?: boolean
    remark?: string
    creator?: string
    creatorName?: string
    createTime?: string
    updateTime?: string
    silentReason?: string
}

export const getCluePage = async (params: any) => {
    return await request.get({ url: `/crm/clue/page`, params })
}

export const getClue = async (id: number) => {
    return await request.get({ url: `/crm/clue/get?id=` + id })
}

export const createClue = async (data: ClueVO) => {
    return await request.post({ url: `/crm/clue/create`, data })
}

export const updateClue = async (data: ClueVO) => {
    return await request.put({ url: `/crm/clue/update`, data })
}

export const deleteClue = async (id: number) => {
    return await request.delete({ url: `/crm/clue/delete?id=` + id })
}

export const exportClue = async (params: any) => {
    return await request.download({ url: `/crm/clue/export-excel`, params })
}

export const transferClue = async (data: TransferReqVO) => {
    return await request.put({ url: '/crm/clue/transfer', data })
}

export const transformClue = async (id: number) => {
    return await request.put({ url: '/crm/clue/transform', params: { id } })
}

export const getFollowClueCount = async () => {
    return await request.get({ url: '/crm/clue/follow-count' })
}
