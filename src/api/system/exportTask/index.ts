import request from '@/config/axios'

export interface ExportTaskPageReqVO extends PageParam {
  bizType?: string
  taskName?: string
  status?: number
}

export interface ExportTaskVO {
  id: number
  bizType?: string
  taskName?: string
  status?: number
  statusDesc?: string
  fileName?: string
  fileUrl?: string
  fileSize?: number
  totalCount?: number
  failReason?: string
  startedAt?: string
  finishedAt?: string
  createTime?: string
}

export interface ExportAuthSendReqVO {
  bizType: string
}

export interface ExportAuthSendRespVO {
  needSendAuthCode: boolean
  mobile: string[]
  expireMinutes?: number
}

export interface ExportTaskReminderSummaryVO {
  unreadCount: number
}

export const getExportTaskPage = async (params: ExportTaskPageReqVO) => {
  return await request.get({ url: '/system/export-task/page', params })
}

export const sendExportAuthCode = async (data: ExportAuthSendReqVO) => {
  return await request.post<ExportAuthSendRespVO>({
    url: '/system/export-task/send-auth-code',
    data
  })
}

export const getExportTaskReminderSummary = async () => {
  return await request.get<ExportTaskReminderSummaryVO>({ url: '/system/export-task/reminder-summary' })
}

export const markExportTaskCenterViewed = async () => {
  return await request.post<boolean>({ url: '/system/export-task/mark-viewed' })
}
