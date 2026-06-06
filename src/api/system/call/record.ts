import request from '@/config/axios'

export interface OutboundCallRecordVO {
  id: number
  recordNo: string
  userId?: number
  userNickname?: string
  callerDisplayNumber: string
  calleeMobile: string
  gatewayName: string
  backupGatewayName?: string
  jobUuid?: string
  channelUuid?: string
  callType: number
  callTypeDesc: string
  status: number
  statusDesc: string
  submitMessage?: string
  failReason?: string
  hangupCause?: string
  originateDisposition?: string
  answerTime?: string
  endTime?: string
  durationSeconds?: number
  recordingFileName?: string
  recordingFileUrl?: string
  createTime: string
}

export const getOutboundCallRecordPage = (params: PageParam) => {
  return request.get({ url: '/crm/call/outbound-record/page', params })
}
