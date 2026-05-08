import request from '@/config/axios'

export interface WeworkContactVO {
  id: number
  companyName: string
  corpId: string
  externalUserId: string
  customerName: string
  customerNickname: string
  avatar: string
  staffUserId: string
  staffName: string
  staffAvatar: string
  remark: string
  mobile: string
  addWay: string
  addTime: Date
  state: string
  createTime: Date
}

export interface WeworkContactPageReqVO extends PageParam {
  companyName?: string
  staffUserId?: string
  customerKeyword?: string
  mobile?: string
  addWay?: string
  hasPhone?: boolean
  beginAddTime?: string
  endAddTime?: string
}

export const getWeworkContactPage = async (params: WeworkContactPageReqVO) => {
  return await request.get({ url: '/crm/wework-contact/page', params })
}

export const syncWeworkContacts = async () => {
  return await request.post({ url: '/crm/wework-contact/sync' })
}

export const getWeworkMemberSimpleList = async () => {
  return await request.get({ url: '/crm/wework-contact/member-simple-list' })
}

export const getWeworkCompanySimpleList = async () => {
  return await request.get({ url: '/crm/wework-contact/company-simple-list' })
}
