import request from '@/config/axios'

export interface WeworkContactVO {
  id: number
  corpId: string
  corpName: string
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
  clueId?: number
  reusedExistingClue?: boolean
  syncStatus?: number
  syncFailReason?: string
}

export interface WeworkMemberSimpleVO {
  corpId: string
  corpName: string
  userId: string
  name: string
  avatar?: string
}

export interface WeworkCorpSimpleVO {
  id: number
  corpId: string
  companyName: string
  label: string
}

export interface WeworkContactPageReqVO extends PageParam {
  companyName?: string
  staffUserId?: string
  customerKeyword?: string
  mobile?: string
  addWay?: string
  hasPhone?: boolean
  syncStatus?: number
  beginAddTime?: string
  endAddTime?: string
}

export const getWeworkContactPage = async (params: WeworkContactPageReqVO) => {
  return await request.get({ url: '/crm/wework-contact/page', params })
}

export const syncWeworkContacts = async () => {
  return await request.post({ url: '/crm/wework-contact/sync' })
}

export const getWeworkMemberSimpleList = async (corpId?: string) => {
  return await request.get<WeworkMemberSimpleVO[]>({ url: '/crm/wework-contact/member-simple-list', params: { corpId } })
}

export const getWeworkCompanySimpleList = async () => {
  return await request.get<WeworkCorpSimpleVO[]>({ url: '/crm/wework-contact/company-simple-list' })
}

export const copyWeworkContactMobile = async (id: number) => {
  return await request.post({ url: '/crm/wework-contact/copy-mobile', params: { id } })
}

export const updateWeworkRemarkMobile = async (data: { id: number; mobile: string }) => {
  return await request.put({ url: '/crm/wework-contact/update-remark-mobile', data })
}
