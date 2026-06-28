import request from '@/config/axios'

export interface AftersalesPageReqVO extends PageParam {
  mobile?: string
  customer?: string
  ticketNo?: string
  clueId?: number
  customerId?: string
  orderId?: number
  orderNo?: string
  complaintTagId?: number
  ticketType?: number
  priority?: number
  status?: number
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

export interface AftersalesRespVO {
  id: number
  ticketNo: string
  clueId: number
  customerId: string
  customerName: string
  customerMobile: string
  ticketType: number
  priority: number
  status: number
  refundAmount: number
  refundMethod?: string
  orderId: number
  orderNo: string
  handlerUserId?: number
  handlerUserName?: string
  receiveTime?: string
  processTime?: string
  processResult?: string
  reason?: string
  remark?: string
  createTime: string
}

export interface AftersalesCreateReqVO {
  clueId: number
  orderId?: number
  refundMethod: string
  ticketType: number
  priority: number
  refundAmount?: number
  reason: string
  remark?: string
  handlerUserId?: number
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
  status: number
  processResult: string
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
  return await request.post<number>({ url: '/crm/aftersales/create', data })
}

export const importAftersales = async (data: FormData) => {
  return await request.upload<AftersalesImportRespVO>({ url: '/crm/aftersales/import', data })
}

export const downloadAftersalesImportTemplate = async () => {
  return await request.download({ url: '/crm/aftersales/import-template' })
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

export const getAftersalesStatsPage = async (params: AftersalesPageReqVO) => {
  return await request.get({ url: '/crm/aftersales/stats-page', params })
}
