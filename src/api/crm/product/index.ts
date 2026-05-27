import request from '@/config/axios'

export interface ProductPageReqVO {
    pageNo?: number
    pageSize?: number
    name?: string
    categoryId?: number
    status?: number
}

export interface ProductSaveReqVO {
    id?: number
    name: string
    categoryId: number
    coverUrl?: string
    servicePeriodDays: number
    price: number
    minPrice: number
    preferentialPrice?: number | null
    costPrice?: number | null
    promotionEnabled: boolean
    promotionPrice?: number | null
    promotionEndTime?: string | null
    settlementType: number
    settlementValue: number
    channelCodes: string[]
    shelfType: number
    scheduledShelfTime?: string | null
    remark?: string
}

export interface ProductRespVO {
    id: number
    name: string
    categoryId: number
    categoryName?: string
    categoryPath?: string
    coverUrl?: string
    servicePeriodDays: number
    price: number
    minPrice: number
    preferentialPrice?: number | null
    costPrice?: number | null
    promotionEnabled: boolean
    promotionPrice?: number | null
    promotionEndTime?: string | null
    settlementType: number
    settlementTypeName?: string
    settlementValue: number
    channelCodeList?: string[]
    status: number
    statusName?: string
    shelfType: number
    scheduledShelfTime?: string | null
    actualShelfTime?: string | null
    remark?: string
    creator?: string
    createTime?: string
    productNo?: string
    unit?: number
    description?: string
    ownerUserId?: number
    ownerUserName?: string
    updateTime?: string
    creatorName?: string
}

export interface ProductVO extends ProductRespVO {}

export const getProductPage = async (params: ProductPageReqVO) => {
    return await request.get({ url: `/crm/product/page`, params })
}

export const getProduct = async (id: number) => {
    return await request.get({ url: `/crm/product/get`, params: { id } })
}

export const createProduct = async (data: ProductSaveReqVO) => {
    return await request.post({ url: `/crm/product/create`, data })
}

export const updateProduct = async (data: ProductSaveReqVO) => {
    return await request.put({ url: `/crm/product/update`, data })
}

export const updateProductStatus = async (data: { id: number; status: number }) => {
    return await request.put({ url: `/crm/product/update-status`, data })
}

export const getProductSimpleList = async () => {
    return await request.get({ url: `/crm/product/simple-list` })
}

export const deleteProduct = async (id: number) => {
    return await request.delete({ url: `/crm/product/delete?id=` + id })
}

export const exportProduct = async (params) => {
    return await request.download({ url: `/crm/product/export-excel`, params })
}
