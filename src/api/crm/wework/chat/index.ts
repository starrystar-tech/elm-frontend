import request from '@/config/axios'

export interface WeworkChatArchiveVO {
  id: number
  weappConfigId: number
  corpId: string
  seq: number
  msgId: string
  fromUser: string
  toList: string
  roomId: string
  action: string
  msgTime: number
  msgType: string
  rawData: string
  createTime: number
}

export interface WeworkChatArchivePageReqVO extends PageParam {
  corpId?: string
  fromUser?: string
  roomId?: string
  msgType?: string
  keyword?: string
  beginMsgTime?: number
  endMsgTime?: number
}

export interface WeworkChatArchiveSyncRespVO {
  appCount: number
  pulledCount: number
  savedCount: number
  message: string
}

export interface WeworkChatAnalysisRespVO {
  totalCount: number
  groupChatCount: number
  singleChatCount: number
  textMsgCount: number
  msgTypeStats: { type: string; count: number }[]
}

export interface WeworkChatQualityReqVO {
  corpId?: string
  fromUser?: string
  msgId?: string
  sessionType?: string
  keyword?: string
  msgType?: string
  beginMsgTime?: number
  endMsgTime?: number
}

export interface WeworkChatQualityRespVO {
  corpList: { corpId: string; corpName: string }[]
  memberList: {
    userId: string
    name: string
    avatar?: string
    sessionCount: number
    groupSessionCount: number
    singleSessionCount: number
  }[]
  sessionList: {
    msgId: string
    title: string
    subtitle: string
    preview: string
    sessionType: string
    msgTime: number
    msgType: string
    avatar?: string
  }[]
  messageList: {
    msgId: string
    sender: string
    receiver: string
    direction: string
    content: string
    msgType: string
    msgTime: number
    avatar?: string
  }[]
}

export interface WeworkChatAuditReqVO extends PageParam {
  corpId?: string
  auditMode?: string
  keyword?: string
  fromUser?: string
  department?: string
  senderType?: string
  beginMsgTime?: number
  endMsgTime?: number
}

export interface WeworkChatAuditRespVO {
  corpId: string
  auditMode: string
  user: string
  department: string
  wework: string
  archiveStatus: string
  friendCount: number
  singleChatCount: number
  groupChatCount: number
  lastActiveTime: number
  senderType: string
  sender: string
  receiver: string
  chatTime: number
  content: string
  msgId: string
}

export interface WeworkChatAnalysisDetailReqVO {
  corpId?: string
  analysisMode?: string
  keyword?: string
  senderType?: string
  customerKeyword?: string
  beginMsgTime?: number
  endMsgTime?: number
}

export interface WeworkChatAnalysisDetailRespVO {
  corpList: { corpId: string; corpName: string }[]
  trendList: { label: string; count: number }[]
  ruleCountList: { ruleName: string; count: number }[]
  rows: {
    user: string
    sender: string
    senderType: string
    receiver: string
    rule: string
    content: string
    msgTime: number
    msgId: string
  }[]
}

export const syncWeworkChatArchive = async () => {
  return await request.post<WeworkChatArchiveSyncRespVO>({ url: '/crm/wework-chat/sync-archive' })
}

export const getWeworkChatArchivePage = async (params: WeworkChatArchivePageReqVO) => {
  return await request.get({ url: '/crm/wework-chat/page', params })
}

export const getWeworkChatAnalysis = async () => {
  return await request.get<WeworkChatAnalysisRespVO>({ url: '/crm/wework-chat/analysis' })
}

export const getWeworkChatQualityView = async (params: WeworkChatQualityReqVO) => {
  return await request.get<WeworkChatQualityRespVO>({ url: '/crm/wework-chat/quality-view', params })
}

export const getWeworkChatAuditPage = async (params: WeworkChatAuditReqVO) => {
  return await request.get<PageResult<WeworkChatAuditRespVO>>({ url: '/crm/wework-chat/audit/page', params })
}

export const getWeworkChatAnalysisDetail = async (params: WeworkChatAnalysisDetailReqVO) => {
  return await request.get<WeworkChatAnalysisDetailRespVO>({ url: '/crm/wework-chat/analysis/detail', params })
}
