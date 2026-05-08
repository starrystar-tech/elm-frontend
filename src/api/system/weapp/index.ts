import request from '@/config/axios'

export interface WeappConfigVO {
  id?: number
  companyName?: string
  appName?: string
  appLogo?: string
  corpId: string
  agentId: string
  appSecret: string
  token?: string
  encodingAesKey?: string
  contactSecret?: string
  customerSecret?: string
  enabled: boolean
  createTime?: Date
  updateTime?: Date
}

export const getWeappConfig = () => {
  return request.get<WeappConfigVO>({ url: '/system/weapp-config/get' })
}

export const getWeappConfigList = () => {
  return request.get<WeappConfigVO[]>({ url: '/system/weapp-config/list' })
}

export const createWeappConfig = (data: WeappConfigVO) => {
  return request.post({ url: '/system/weapp-config/create', data })
}

export const updateWeappConfig = (data: WeappConfigVO) => {
  return request.put({ url: '/system/weapp-config/update', data })
}

export const deleteWeappConfig = (id: number) => {
  return request.post({ url: '/system/weapp-config/delete?id=' + id })
}
