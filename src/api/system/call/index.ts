import request from '@/config/axios'

export interface CallTestDialReqVO {
  caller?: string
  callee: string
}

export interface CallTestDialRespVO {
  caller: string
  callee: string
  jobUuid?: string
  message?: string
}

export const testDialInternalCall = (data: CallTestDialReqVO) => {
  return request.post<CallTestDialRespVO>({ url: '/system/call/test-dial', data })
}
