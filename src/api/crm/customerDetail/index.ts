import request from '@/config/axios'

export interface CustomerWeworkRelationItem {
    relationId: number
    clueId?: number
    staffUserId: string
    staffName: string
    staffAvatar?: string
    remark?: string
    mobile?: string
    addWay?: string
    addTime?: string
    state?: string
    stateName?: string
}

export interface CustomerWeworkContactItem {
    externalUserId: string
    customerName?: string
    customerNickname?: string
    avatar?: string
    customerType?: number
    customerTypeName?: string
    gender?: number
    genderName?: string
    corpName?: string
    relations: CustomerWeworkRelationItem[]
}

export interface CustomerWeworkInfoRespVO {
    contacts: CustomerWeworkContactItem[]
}

export const getCustomerWeworkInfo = async (id: number) => {
    return await request.get<CustomerWeworkInfoRespVO>({ url: '/crm/customer-detail/wework-info', params: { id } })
}
