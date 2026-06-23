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
    avatar?: string
    idCardNo?: string
    certificateType?: string
    occupation?: string
    emergencyMobile?: string
    emergencyContact?: string
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
    complaintTagIds?: number[]
    complaintTagNames?: string[]
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
    headteacherUserId?: number
    headteacherName?: string
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
    orderCount?: number
    creator?: string
    creatorName?: string
    creatorUserName?: string
    createUserName?: string
    createByName?: string
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
    complaintTagId?: number
    consultProjectId?: number
    clueSourceId?: number
    intentLevel?: number
    currentOwnerId?: number
    headteacherUserId?: number
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

export interface ClueAllocationPageReqVO extends CluePageReqVO {}

export interface ClueCreateReqVO {
    mobile: string
    mobile2?: string
    wechat?: string
    wechat2?: string
    wechatRemark?: string
    qq?: string
    avatar?: string
    idCardNo?: string
    certificateType?: string
    occupation?: string
    emergencyMobile?: string
    emergencyContact?: string
    name?: string
    gender?: number
    birthday?: string
    education?: number
    intentLevel?: number
    areaId: number
    consultProjectId?: number
    clueSourceId?: number
    tagIds?: number[]
    complaintTagIds?: number[]
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
    idCardNo?: string
    certificateType?: string
    occupation?: string
    emergencyMobile?: string
    emergencyContact?: string
    gender?: number
    birthday?: string
    education?: number
    intentLevel?: number
    areaId: number
    consultProjectId: number
    clueSourceId?: number
    tagIds?: number[]
    complaintTagIds?: number[]
    remark?: string
}

export interface ClueBatchAppendTagsReqVO {
    clueIds: number[]
    tagIds: number[]
}

export interface ClueBatchAppendComplaintTagsReqVO {
    clueIds: number[]
    complaintTagIds: number[]
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
    mergedData?: ClueMergeDataReqVO
}

export interface ClueMergeDataReqVO {
    customerId?: string
    name?: string
    mobile?: string
    mobile2?: string
    wechat?: string
    wechat2?: string
    wechatRemark?: string
    qq?: string
    gender?: number
    education?: number
    areaId?: number
    consultProjectId?: number
    tagIds?: number[]
}

export interface ClueMergeSearchRespVO {
    id: number
    customerId?: string
    name?: string
    mobile?: string
    mobile2?: string
    wechat?: string
    qq?: string
    status?: number
    statusName?: string
    currentOwnerName?: string
    createTime?: string
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

export interface PublicSeaPageReqVO extends CluePageReqVO {
    seaType: number
    minEnterPublicSeaCount?: number
    maxEnterPublicSeaCount?: number
    beginEnterPublicSeaTime?: string
    endEnterPublicSeaTime?: string
}

export interface PublicSeaPageRespVO extends ClueVO {
    feedbackStatus?: number
    feedbackStatusName?: string
    enterPublicSeaTime?: string
    enterPublicSeaReason?: string
    enterPublicSeaCount?: number
    lastClaimOwnerId?: number
    lastClaimOwnerName?: string
    lastClaimTime?: string
    claimCount?: number
    lastFeedbackTime?: string
    nextFollowUpTime?: string
    lastSignUpProductId?: number
    lastSignUpProductName?: string
    lastSignUpTime?: string
    orderCount?: number
}

export interface PublicSeaCountRespVO {
    firstConsultCount?: number
    repurchaseCount?: number
}

export interface PublicSeaClaimSummaryRespVO {
    unlimited?: boolean
    dailyLimit?: number
    claimedCount?: number
    remainingCount?: number
}

export interface PublicSeaClaimReqVO {
    seaType: number
    clueIds: number[]
}

export interface PublicSeaAssignReqVO extends PublicSeaClaimReqVO {
    ownerId: number
    departmentId: number
}

export interface MyCluePageReqVO extends PageParam {
    tabType: string
    customer?: string
    mobile?: string
    wechat?: string
    qq?: string
    areaId?: number
    tagId?: number
    complaintTagId?: number
    consultProjectId?: number
    clueSourceId?: number
    intentLevel?: number
    minCallCount?: number
    maxCallCount?: number
    beginLastFeedbackTime?: string
    endLastFeedbackTime?: string
    minOrderCount?: number
    maxOrderCount?: number
    creator?: string
    beginCreateTime?: string
    endCreateTime?: string
}

export interface MyCluePageRespVO extends ClueVO {
    claimSource?: number
    claimSourceName?: string
    feedbackStatus?: number
    feedbackStatusName?: string
    lastFeedbackTime?: string
    allocationTime?: string
    allocationType?: number
    allocationTypeName?: string
    orderCount?: number
    todayCallCount?: number
    todayConnectedCount?: number
    todayCallDurationSeconds?: number
    firstConsultTime?: string
    lastConsultTime?: string
    expireTime?: string
    nextFollowUpTime?: string
    lastSignUpProductId?: number
    lastSignUpProductName?: string
    lastSignUpTime?: string
    returnVisitFlag?: number
    returnVisitFlagName?: string
}

export interface MyClueCountRespVO {
    firstCount?: number
    seaCount?: number
    repurchaseCount?: number
    waitReturnCount?: number
    returnedCount?: number
}

export interface MyClueReleaseReqVO {
    clueIds: number[]
    reason?: string
}

export interface ClueManagementPageReqVO extends MyCluePageReqVO {
    ownerId?: number
    beginAllocationTime?: string
    endAllocationTime?: string
    allocationType?: number
}

export interface ClueManagementPageRespVO extends MyCluePageRespVO {}

export interface ClueManagementCountRespVO extends MyClueCountRespVO {}

export interface ClueManagementReleaseReqVO extends MyClueReleaseReqVO {}

export interface ClueExportTaskReqVO extends CluePageReqVO {
    authCode?: string
    exportPlainMobile?: boolean
}

export interface ClueSilentExportTaskReqVO extends ClueSilentPageReqVO {
    authCode?: string
    exportPlainMobile?: boolean
}

export interface ClueManagementExportTaskReqVO extends ClueManagementPageReqVO {
    authCode?: string
    exportPlainMobile?: boolean
}

export interface ClueBatchBackToPublicSeaReqVO {
    clueIds: number[]
}

export interface ClueBatchUpdateHeadteacherReqVO {
    clueIds: number[]
    headteacherUserId: number
}

export interface ClueBatchSendSmsReqVO {
    clueIds: number[]
    templateId: number
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
    creatorName?: string
    createTime?: string
}

export interface ClueImportTaskPageReqVO extends PageParam {
    fileName?: string
    status?: number
    creator?: string
    beginCreateTime?: string
    endCreateTime?: string
}

export interface ClueImportTaskAllocLogPageReqVO extends PageParam {
    taskId: number
    result?: number
    status?: string
    importResult?: 'SUCCESS' | 'FAIL'
    importStatus?: string
    engineName?: string
    phone?: string
    customerName?: string
}

export interface ClueImportTaskAllocLogVO {
    id: number
    importTaskId?: number
    clueId?: number
    engineId?: number
    ownerId?: number
    ownerName?: string
    ownerDepartmentId?: number
    ownerDepartmentName?: string
    result?: number
    status?: string
    failReason?: string
    importResult?: 'SUCCESS' | 'FAIL'
    importStatus?: string
    importFailReason?: string
    allocationOwner?: string
    customerName?: string
    phone?: string
    phone2?: string
    wechat?: string
    wechat2?: string
    qq?: string
    intention?: string
    project?: string
    source?: string
    city?: string
    district?: string
    gender?: string
    education?: string
    remark?: string
    engine?: string
    createTime?: string
}

export interface ClueImportTaskItemPageReqVO extends PageParam {
    taskId: number
    result?: string
    phone?: string
    customerName?: string
}

export interface ClueImportTaskItemVO {
    id: number
    taskId?: number
    clueId?: number
    rawData?: string
    result?: string
    status?: string
    failReason?: string
    customerName?: string
    phone?: string
    phone2?: string
    wechat?: string
    wechat2?: string
    qq?: string
    intention?: string
    project?: string
    source?: string
    city?: string
    district?: string
    gender?: string
    education?: string
    remark?: string
    createTime?: string
}

export interface ClueComplaintTagImportRespVO {
    successCustomerIds?: string[]
    failureCustomerIds?: Record<string, string>
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

export const batchUpdateHeadteacher = async (data: ClueBatchUpdateHeadteacherReqVO) => {
    return await request.put({ url: '/crm/clue/batch-update-headteacher', data })
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

export const batchAppendComplaintTags = async (data: ClueBatchAppendComplaintTagsReqVO) => {
    return await request.put({ url: '/crm/clue/batch-append-complaint-tags', data })
}

export const batchUpdateClueAssignMode = async (data: ClueBatchUpdateAssignModeReqVO) => {
    return await request.put({ url: '/crm/clue/batch-update-assign-mode', data })
}

export const batchSilentClue = async (data: ClueBatchSilentReqVO) => {
    return await request.put({ url: '/crm/clue/batch-silent', data })
}

export const batchSendSms = async (data: ClueBatchSendSmsReqVO) => {
    return await request.post({ url: '/crm/clue/batch-send-sms', data })
}

export const mergeClue = async (data: ClueMergeReqVO) => {
    return await request.put({ url: '/crm/clue/merge', data })
}

export const getMergeSearchClue = async (keyword: string) => {
    return await request.get<ClueMergeSearchRespVO>({ url: '/crm/clue/merge-search', params: { keyword } })
}

export const updateClueIntentLevel = async (data: ClueUpdateIntentLevelReqVO) => {
    return await request.put({ url: '/crm/clue/update-intent-level', data })
}

export const copyClueMobile = async (clueId: number, mobileField: string = 'mobile') => {
    return await request.post<ClueCopyMobileRespVO>({
        url: '/crm/clue/copy-mobile',
        data: { clueId, mobileField }
    })
}

export const importClues = async (data: FormData) => {
    return await request.upload({ url: '/crm/clue/import', data })
}

export const importComplaintTags = async (data: FormData) => {
    return await request.upload<ClueComplaintTagImportRespVO>({
        url: '/crm/clue/import-complaint-tags',
        data
    })
}

export const getClueImportTaskPage = async (params: ClueImportTaskPageReqVO) => {
    return await request.get({ url: '/crm/clue/import-task/page', params })
}

export const getClueImportTaskAllocLogPage = async (params: ClueImportTaskAllocLogPageReqVO) => {
    return await request.get({ url: '/crm/clue/import-task/alloc-log-page', params })
}

export const getClueImportTaskFailItemPage = async (params: ClueImportTaskItemPageReqVO) => {
    return await request.get({ url: '/crm/clue/import-task/fail-item-page', params })
}

export const getSilentCluePage = async (params: ClueSilentPageReqVO) => {
    return await request.get({ url: '/crm/clue/silent-page', params })
}

export const getAllocationCluePage = async (params: ClueAllocationPageReqVO) => {
    return await request.get({ url: '/crm/clue/allocation-page', params })
}

export const batchAssignSilentClue = async (data: ClueBatchAssignReqVO) => {
    return await request.put({ url: '/crm/clue/batch-assign', data })
}

export const batchBackToPublicSea = async (data: ClueBatchBackToPublicSeaReqVO) => {
    return await request.put({ url: '/crm/clue/batch-back-to-public-sea', data })
}

export const allocationBatchAssign = async (data: ClueBatchAssignReqVO) => {
    return await request.put({ url: '/crm/clue/allocation-batch-assign', data })
}

export const allocationBatchSilent = async (data: ClueBatchSilentReqVO) => {
    return await request.put({ url: '/crm/clue/allocation-batch-silent', data })
}

export const allocationMerge = async (data: ClueMergeReqVO) => {
    return await request.put({ url: '/crm/clue/allocation-merge', data })
}

export const getPublicSeaPage = async (params: PublicSeaPageReqVO) => {
    return await request.get({ url: '/crm/clue/public-sea/page', params })
}

export const getPublicSeaCounts = async () => {
    return await request.get<PublicSeaCountRespVO>({ url: '/crm/clue/public-sea/counts' })
}

export const getPublicSeaClaimSummary = async (seaType: number) => {
    return await request.get<PublicSeaClaimSummaryRespVO>({
        url: '/crm/clue/public-sea/claim-summary',
        params: { seaType }
    })
}

export const claimPublicSea = async (data: PublicSeaClaimReqVO) => {
    return await request.put({ url: '/crm/clue/public-sea/claim', data })
}

export const assignPublicSea = async (data: PublicSeaAssignReqVO) => {
    return await request.put({ url: '/crm/clue/public-sea/assign', data })
}

export const getMyClueCounts = async () => {
    return await request.get<MyClueCountRespVO>({ url: '/crm/my-clue/counts' })
}

export const getMyCluePage = async (params: MyCluePageReqVO) => {
    return await request.get({ url: '/crm/my-clue/page', params })
}

export const releaseMyClue = async (data: MyClueReleaseReqVO) => {
    return await request.put({ url: '/crm/my-clue/release', data })
}

export const getClueManagementCounts = async () => {
    return await request.get<ClueManagementCountRespVO>({ url: '/crm/clue-management/counts' })
}

export const getClueManagementPage = async (params: ClueManagementPageReqVO) => {
    return await request.get({ url: '/crm/clue-management/page', params })
}

export const assignClueManagement = async (data: ClueBatchAssignReqVO) => {
    return await request.put({ url: '/crm/clue-management/assign', data })
}

export const releaseClueManagement = async (data: ClueManagementReleaseReqVO) => {
    return await request.put({ url: '/crm/clue-management/release', data })
}

export const createClueExportTask = async (data: ClueExportTaskReqVO) => {
    return await request.post<number>({ url: '/crm/clue/export-task', data })
}

export const createSilentClueExportTask = async (data: ClueSilentExportTaskReqVO) => {
    return await request.post<number>({ url: '/crm/clue/silent-export-task', data })
}

export const createClueManagementExportTask = async (data: ClueManagementExportTaskReqVO) => {
    return await request.post<number>({ url: '/crm/clue-management/export-task', data })
}
