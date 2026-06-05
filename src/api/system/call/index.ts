import request from '@/config/axios'

export interface CallTestDialReqVO {
  caller?: string
  callee: string
}

export interface CallOutboundDialReqVO {
  mobile: string
}

export interface CallTestDialRespVO {
  caller: string
  callee: string
  jobUuid?: string
  recordId?: number
  message?: string
}

export const testDialInternalCall = (data: CallTestDialReqVO) => {
  return request.post<CallTestDialRespVO>({ url: '/system/call/test-dial', data })
}

export const dialOutboundCall = (data: CallOutboundDialReqVO) => {
  return request.post<CallTestDialRespVO>({ url: '/crm/call/outbound-dial', data })
}
