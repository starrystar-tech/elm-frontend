import request from '@/config/axios'

export interface SecurityWarningLogVO {
  id: number
  warningType: number
  warningTypeName: string
  warningContent: string
  warningTime: Date | string
  userId: number
  username: string
  nickname: string
  deptName: string
}

export interface SecurityWarningLogPageReqVO extends PageParam {
  userId?: number
  warningType?: number
  warningTime?: string[]
}

export const getSecurityWarningLogPage = (params: SecurityWarningLogPageReqVO) => {
  return request.get({ url: '/system/security-warning-log/page', params })
}
