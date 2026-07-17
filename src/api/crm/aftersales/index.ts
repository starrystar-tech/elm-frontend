import request from '@/config/axios'

export interface AftersalesPageReqVO extends PageParam {
  mobile?: string
  customer?: string
  ticketNo?: string
  clueId?: number
  customerId?: string
  orderId?: number
  orderNo?: string
  complaintTagIds?: number[]
  noComplaintTag?: boolean
  priority?: number
  status?: number
  source?: number
  campusId?: number
  beginEnrollTime?: string
  endEnrollTime?: string
  installmentStatus?: number
  confirmStatus?: number
  aftersalesResult?: number
  handlerUserId?: number
  deptId?: number
  beginCreateTime?: string
  endCreateTime?: string
  beginReceiveTime?: string
  endReceiveTime?: string
  beginProcessTime?: string
  endProcessTime?: string
}

export interface AftersalesExportReqVO extends AftersalesPageReqVO {
  authCode?: string
  exportPlainMobile?: boolean
}

export interface AftersalesProcessLogRespVO {
  handlerUserName?: string
  processTime?: string
  aftersalesResult?: number
  aftersalesResultDesc?: string
  remark?: string
  refundAmount?: number
  retainAmount?: number
}

export interface AftersalesHistoryTicketRespVO {
  id: number
  ticketNo?: string
  orderId?: number
  orderNo?: string
  priority?: number
  status?: number
  statusDesc?: string
  source?: number
  sourceDesc?: string
  handlerUserName?: string
  processTime?: string
  aftersalesResult?: number
  aftersalesResultDesc?: string
  reason?: string
  createTime?: string
}

export interface AftersalesRespVO {
  id: number
  ticketNo: string
  clueId: number
  customerId?: string
  customerName?: string
  customerMobile?: string
  priority?: number
  status?: number
  source?: number
  sourceDesc?: string
  refundAmount?: number
  retainAmount?: number
  refundMethod?: string
  orderId?: number
  orderNo?: string
  campusId?: number
  campusName?: string
  enrollTime?: string
  headteacherUserName?: string
  courseStatus?: number
  installmentStatus?: number
  finalPaymentChannel?: string
  confirmStatus?: number
  confirmResult?: string
  handlerUserId?: number
  handlerUserName?: string
  receiveTime?: string
  processTime?: string
  processResult?: string
  aftersalesResult?: number
  aftersalesResultDesc?: string
  reason?: string
  remark?: string
  attachmentUrl?: string
  complaintTags?: string[]
  creatorName?: string
  creatorDeptName?: string
  processLogs?: AftersalesProcessLogRespVO[]
  historyTickets?: AftersalesHistoryTicketRespVO[]
  createTime?: string
}

export interface AftersalesCreateReqVO {
  orderIds: number[]
  priority: number
  source: number
  reason: string
  remark?: string
  attachmentUrl?: string
}

export interface AftersalesImportRespVO {
  successOrderNos: string[]
  failureOrderNos: Record<string, string>
}

export interface AftersalesAssignReqVO {
  ids: number[]
  handlerUserId: number
}

export interface AftersalesProcessReqVO {
  id: number
  aftersalesResult?: number
  processResult?: string
  refundAmount?: number
  retainAmount?: number
}

export interface AftersalesStatsRespVO {
  userId: number
  userName: string
  deptName: string
  totalCount: number
  finishedCount: number
  pendingCount: number
  processingCount: number
}

export const getMyAftersalesPage = async (params: AftersalesPageReqVO) => {
  return await request.get({ url: '/crm/aftersales/my-page', params })
}

export const getTodayAftersalesPage = async (params: AftersalesPageReqVO) => {
  return await request.get({ url: '/crm/aftersales/today-page', params })
}

export const getPoolAftersalesPage = async (params: AftersalesPageReqVO) => {
  return await request.get({ url: '/crm/aftersales/pool-page', params })
}

export const getAftersalesPage = async (params: AftersalesPageReqVO) => {
  return await request.get({ url: '/crm/aftersales/page', params })
}

export const createAftersalesExportTask = async (data: AftersalesExportReqVO) => {
  return await request.post<number>({ url: '/crm/aftersales/export-task', data })
}

export const getAftersales = async (id: number) => {
  return await request.get<AftersalesRespVO>({ url: '/crm/aftersales/get', params: { id } })
}

export const createAftersales = async (data: AftersalesCreateReqVO) => {
  return await request.post<number[]>({ url: '/crm/aftersales/create', data })
}

export const importAftersales = async (data: FormData) => {
  return await request.upload<AftersalesImportRespVO>({ url: '/crm/aftersales/import', data })
}

export const downloadAftersalesImportTemplate = async () => {
  return await request.download<Blob>({ url: '/crm/aftersales/import-template' })
}

export const claimAftersales = async (id: number) => {
  return await request.put<boolean>({ url: '/crm/aftersales/claim', params: { id } })
}

export const batchClaimAftersales = async (ids: number[]) => {
  await Promise.all(ids.map((id) => claimAftersales(id)))
  return true
}

export const assignAftersales = async (data: AftersalesAssignReqVO) => {
  return await request.put<boolean>({ url: '/crm/aftersales/assign', data })
}

export const processAftersales = async (data: AftersalesProcessReqVO) => {
  return await request.put<boolean>({ url: '/crm/aftersales/process', data })
}

export const repurchaseAftersales = async (id: number) => {
  return await request.post<number>({ url: '/crm/aftersales/repurchase', params: { id } })
}

export const getAftersalesStatsPage = async (params: AftersalesPageReqVO) => {
  return await request.get({ url: '/crm/aftersales/stats-page', params })
}
