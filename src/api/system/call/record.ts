import request from '@/config/axios'

export interface OutboundCallRecordVO {
  id: number
  recordNo: string
  userId?: number
  userNickname?: string
  outboundRouteId?: number
  outboundRouteName?: string
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
  recordingSyncStatus?: string
  recordingSyncStatusDesc?: string
  recordingSyncMessage?: string
  recordingSyncTime?: string
  createTime: string
}

export interface OutboundCallRecordPageReqVO extends PageParam {
  userId?: number
  calleeMobile?: string
  outboundRouteId?: number
  status?: number
  callType?: number
  createTime?: string[]
}

export interface CallMonitorPageReqVO extends PageParam {
  deptId?: number
  userId?: number
  beginCreateTime?: string
  endCreateTime?: string
  authCode?: string
  exportPlainMobile?: boolean
}

export interface CallMonitorVO {
  userId?: number
  userName: string
  departmentName: string
  outgoingCalls: number
  outgoingCustomers: number
  outgoingDurationSeconds: number
  averageOutgoingDurationSeconds: number
  answeredCalls: number
  answeredCustomers: number
  answeredDurationSeconds: number
  averageAnsweredDurationSeconds: number
}

export const getOutboundCallRecordPage = (params: OutboundCallRecordPageReqVO) => {
  return request.get({ url: '/crm/call/outbound-record/page', params })
}

export const getCallMonitorPage = (params: CallMonitorPageReqVO) => {
  return request.get({ url: '/crm/call/monitor/page', params })
}

export const getCallMonitorList = (params: Omit<CallMonitorPageReqVO, 'pageNo' | 'pageSize'>) => {
  return request.get({ url: '/crm/call/monitor/list', params })
}

export const createCallMonitorExportTask = (data: CallMonitorPageReqVO) => {
  return request.post<number>({ url: '/crm/call/monitor/export-task', data })
}
