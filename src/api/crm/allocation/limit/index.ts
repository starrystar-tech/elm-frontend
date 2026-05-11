import request from '@/config/axios'

export interface AllocationUserLimitVO {
  id?: number
  userId: number
  deptId?: number
  userName?: string
  account?: string
  userLevel?: string
  enabled: boolean
  totalCustomerCurrentCount?: number
  totalCustomerLimitUnlimited: boolean
  totalCustomerLimit?: number
  firstConsultCustomerCurrentCount?: number
  firstConsultCustomerLimitUnlimited: boolean
  firstConsultCustomerLimit?: number
  repurchaseCustomerCurrentCount?: number
  repurchaseCustomerLimitUnlimited: boolean
  repurchaseCustomerLimit?: number
  dailyFirstConsultReceivedCount?: number
  dailyFirstConsultReceiveLimitUnlimited: boolean
  dailyFirstConsultReceiveLimit?: number
  dailyRepurchaseReceivedCount?: number
  dailyRepurchaseReceiveLimitUnlimited: boolean
  dailyRepurchaseReceiveLimit?: number
  remark?: string
  createTime?: Date
}

export const getAllocationUserLimitPage = (params: any) => {
  return request.get({ url: '/system/allocation-user-limit/page', params })
}

export const getAllocationUserLimit = (userId: number) => {
  return request.get<AllocationUserLimitVO>({ url: '/system/allocation-user-limit/get', params: { userId } })
}

export const saveAllocationUserLimit = (data: AllocationUserLimitVO) => {
  return request.put({ url: '/system/allocation-user-limit/save', data })
}

export const batchUpdateAllocationUserLimit = (data: { userIds: number[]; config: AllocationUserLimitVO }) => {
  return request.put({ url: '/system/allocation-user-limit/batch-update', data })
}

export const updateAllocationUserLimitStatus = (data: { userIds: number[]; enabled: boolean }) => {
  return request.put({ url: '/system/allocation-user-limit/update-status', data })
}
