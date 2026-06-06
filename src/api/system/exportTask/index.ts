import request from '@/config/axios'

export const EXPORT_TASK_LAST_VIEWED_AT_KEY = 'export_task_last_viewed_at'

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

export const getExportTaskPage = async (params: ExportTaskPageReqVO) => {
  return await request.get({ url: '/system/export-task/page', params })
}

export const sendExportAuthCode = async (data: ExportAuthSendReqVO) => {
  return await request.post<ExportAuthSendRespVO>({
    url: '/system/export-task/send-auth-code',
    data
  })
}

export const markExportTaskCenterViewed = (time?: string) => {
  window.localStorage.setItem(EXPORT_TASK_LAST_VIEWED_AT_KEY, time || new Date().toISOString())
}

export const getExportTaskCenterViewedAt = () => {
  return window.localStorage.getItem(EXPORT_TASK_LAST_VIEWED_AT_KEY)
}
