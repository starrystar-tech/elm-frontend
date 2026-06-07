import request from '@/config/axios'

export interface CallTestDialReqVO {
  caller?: string
  callee: string
}

export interface CallOutboundDialReqVO {
  mobile: string
}

export interface CallOutboundHangupReqVO {
  recordId: number
}

export interface CallTestDialRespVO {
  caller: string
  callee: string
  jobUuid?: string
  recordId?: number
  message?: string
}

export interface BrowserCallRecordSyncReqVO {
  recordId?: number
  event: 'start' | 'answered' | 'hangup' | 'failed'
  caller?: string
  callee?: string
  durationSeconds?: number
  failReason?: string
}

export interface BrowserCallRecordSyncRespVO {
  recordId: number
}

export const testDialInternalCall = (data: CallTestDialReqVO) => {
  return request.post<CallTestDialRespVO>({ url: '/system/call/test-dial', data })
}

export const dialOutboundCall = (data: CallOutboundDialReqVO) => {
  return request.post<CallTestDialRespVO>({ url: '/crm/call/outbound-dial', data })
}

export const hangupOutboundCall = (data: CallOutboundHangupReqVO) => {
  return request.post<boolean>({ url: '/crm/call/outbound-hangup', data })
}

export const syncBrowserCallRecord = (data: BrowserCallRecordSyncReqVO) => {
  return request.post<BrowserCallRecordSyncRespVO>({ url: '/system/call/browser-record/sync', data })
}
