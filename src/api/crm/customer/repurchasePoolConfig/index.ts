import request from '@/config/axios'

export interface CustomerRepurchasePoolConfigVO {
  enabled: boolean
  priorityNewDataAllocation: boolean
  timeRangeType: string
  startTime?: string
  endTime?: string
  productScopeType: string
  productIdList: number[]
  dealTimeRangeType: string
  dealStartDate?: string
  dealEndDate?: string
  signCountMin?: number
  signCountMax?: number
  signTimeRangeType: string
  signStartDate?: string
  signEndDate?: string
  paymentAmountType: string
  paymentPercentMin?: number
  paymentPercentMax?: number
  paymentAmountMin?: number
  paymentAmountMax?: number
  submitAfterDays?: number
}

export const getCustomerRepurchasePoolConfig = async () => {
  return await request.get<CustomerRepurchasePoolConfigVO>({ url: '/crm/customer-repurchase-pool-config/get' })
}

export const saveCustomerRepurchasePoolConfig = async (data: CustomerRepurchasePoolConfigVO) => {
  return await request.put({ url: '/crm/customer-repurchase-pool-config/save', data })
}

