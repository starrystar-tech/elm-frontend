import request from '@/config/axios'

export interface OrderSettingConfigVO {
  id?: number
  notify: {
    financeAuditPayOrderNotifyEnabled: boolean
  }
  permission: {
    paidOrderModifyStudentLocked: boolean
    paidOrderVoidLocked: boolean
  }
  paymentAutoClose: {
    value: number
    unit: number
  }
}

export const getOrderSettingConfig = async () => {
  return await request.get<OrderSettingConfigVO>({ url: '/crm/order-setting-config/get' })
}

export const saveOrderSettingConfig = async (data: OrderSettingConfigVO) => {
  return await request.put<boolean>({ url: '/crm/order-setting-config/save', data })
}
