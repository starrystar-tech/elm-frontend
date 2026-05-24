import request from '@/config/axios'
import { TransferReqVO } from '@/api/crm/permission'

export interface ClueVO {
    id?: number
    customerId?: string
    name?: string
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
    tagNames?: string[]
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
    feedbackStatus?: number
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
    silentCount?: number
    lastSilentTime?: string
}

export interface CluePageReqVO extends PageParam {
    customer?: string
    mobile?: string
    wechat?: string
    qq?: string
    areaId?: number
    status?: number
    tagId?: number
    consultProjectId?: number
    clueSourceId?: number
    intentLevel?: number
    currentOwnerId?: number
    beginAllocationTime?: string
    endAllocationTime?: string
    allocationType?: number
    assignMode?: number
    feedbackStatus?: number
    minOrderCount?: number
    maxOrderCount?: number
    creator?: string
    beginCreateTime?: string
    endCreateTime?: string
}

export interface ClueSilentPageReqVO extends CluePageReqVO {
    minSilentCount?: number
    maxSilentCount?: number
    beginSilentTime?: string
    endSilentTime?: string
}

export interface ClueCreateReqVO {
    mobile: string
    mobile2?: string
    wechat?: string
    wechat2?: string
    wechatRemark?: string
    qq?: string
    nation?: string
    email?: string
    age?: number
    idCardNo?: string
    name?: string
    gender?: number
    birthday?: string
    education?: number
    areaId: number
    consultProjectId?: number
    clueSourceId?: number
    tagIds?: number[]
    remark?: string
}

export interface ClueUpdateBasicInfoReqVO {
    id: number
    name: string
    mobile: string
    mobile2?: string
    wechat?: string
    wechat2?: string
    wechatRemark?: string
    qq?: string
    gender?: number
    birthday?: string
    education?: number
    areaId: number
    consultProjectId: number
    tagIds?: number[]
    remark?: string
}

export interface ClueBatchAppendTagsReqVO {
    clueIds: number[]
    tagIds: number[]
}

export interface ClueBatchUpdateAssignModeReqVO {
    clueIds: number[]
    assignMode: number
}

export interface ClueBatchSilentReqVO {
    clueIds: number[]
    silentReason: string
    silentDays: number
    remark?: string
}

export interface ClueMergeReqVO {
    keepClueId: number
    mergedClueId: number
    remark?: string
}

export interface ClueUpdateIntentLevelReqVO {
    id: number
    intentLevel: number
}

export interface ClueCopyMobileRespVO {
    mobile: string
    usedCount: number
    remainingCount: number
}

export interface ClueBatchAssignReqVO {
    clueIds: number[]
    ownerId: number
    departmentId: number
}

export interface ClueBatchBackToPublicSeaReqVO {
    clueIds: number[]
}

export interface ClueImportTaskVO {
    id: number
    fileName?: string
    fileUrl?: string
    status?: number
    totalCount?: number
    successCount?: number
    failCount?: number
    startedAt?: string
    finishedAt?: string
    creator?: string
    createTime?: string
}

export interface ClueImportTaskPageReqVO extends PageParam {
    fileName?: string
    status?: number
    creator?: string
    beginCreateTime?: string
    endCreateTime?: string
}

export const getCluePage = async (params: CluePageReqVO) => {
    return await request.get({ url: '/crm/clue/page', params })
}

export const getClue = async (id: number) => {
    return await request.get<ClueVO>({ url: '/crm/clue/get', params: { id } })
}

export const createClue = async (data: ClueCreateReqVO) => {
    return await request.post({ url: '/crm/clue/create', data })
}

export const updateClueBasicInfo = async (data: ClueUpdateBasicInfoReqVO) => {
    return await request.put({ url: '/crm/clue/update-basic-info', data })
}

export const updateClue = async (data: ClueUpdateBasicInfoReqVO) => {
    return await updateClueBasicInfo(data)
}

export const deleteClue = async (id: number) => {
    return await request.delete({ url: '/crm/clue/delete?id=' + id })
}

export const exportClue = async (params: CluePageReqVO) => {
    return await request.download({ url: '/crm/clue/export-excel', params })
}

export const transferClue = async (data: TransferReqVO) => {
    return await request.put({ url: '/crm/clue/transfer', data })
}

export const transformClue = async (id: number) => {
    return await request.put({ url: '/crm/clue/transform', params: { id } })
}

export const batchAppendClueTags = async (data: ClueBatchAppendTagsReqVO) => {
    return await request.put({ url: '/crm/clue/batch-append-tags', data })
}

export const batchUpdateClueAssignMode = async (data: ClueBatchUpdateAssignModeReqVO) => {
    return await request.put({ url: '/crm/clue/batch-update-assign-mode', data })
}

export const batchSilentClue = async (data: ClueBatchSilentReqVO) => {
    return await request.put({ url: '/crm/clue/batch-silent', data })
}

export const mergeClue = async (data: ClueMergeReqVO) => {
    return await request.put({ url: '/crm/clue/merge', data })
}

export const updateClueIntentLevel = async (data: ClueUpdateIntentLevelReqVO) => {
    return await request.put({ url: '/crm/clue/update-intent-level', data })
}

export const copyClueMobile = async (id: number) => {
    return await request.post<ClueCopyMobileRespVO>({ url: '/crm/clue/copy-mobile', data: { id } })
}

export const importClues = async (data: FormData) => {
    return await request.upload({ url: '/crm/clue/import', data })
}

export const getClueImportTaskPage = async (params: ClueImportTaskPageReqVO) => {
    return await request.get({ url: '/crm/clue/import-task/page', params })
}

export const getSilentCluePage = async (params: ClueSilentPageReqVO) => {
    return await request.get({ url: '/crm/clue/silent-page', params })
}

export const batchAssignSilentClue = async (data: ClueBatchAssignReqVO) => {
    return await request.put({ url: '/crm/clue/batch-assign', data })
}

export const batchBackToPublicSea = async (data: ClueBatchBackToPublicSeaReqVO) => {
    return await request.put({ url: '/crm/clue/batch-back-to-public-sea', data })
}
