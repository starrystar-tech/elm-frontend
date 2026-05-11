import request from '@/config/axios'

export interface ProductCategoryVO {
  id?: number
  name: string
  parentId: number
  code: string
  sort: number
  status: number
  description?: string
  createTime?: Date
  children?: ProductCategoryVO[]
}

export const getProductCategory = async (id: number) => {
  return await request.get({ url: `/system/product-category/get?id=` + id })
}

export const createProductCategory = async (data: ProductCategoryVO) => {
  return await request.post({ url: `/system/product-category/create`, data })
}

export const updateProductCategory = async (data: ProductCategoryVO) => {
  return await request.put({ url: `/system/product-category/update`, data })
}

export const deleteProductCategory = async (id: number) => {
  return await request.delete({ url: `/system/product-category/delete?id=` + id })
}

export const getProductCategoryList = async (params: any) => {
  return await request.get({ url: `/system/product-category/list`, params })
}

export const getProductCategorySimpleList = async () => {
  return await request.get({ url: `/system/product-category/simple-list` })
}

export const updateProductCategoryStatus = async (data: { id: number; status: number }) => {
  return await request.put({ url: `/system/product-category/update-status`, data })
}

export const moveProductCategory = async (data: { id: number; targetParentId: number }) => {
  return await request.put({ url: `/system/product-category/move`, data })
}

export const sortProductCategory = async (data: { id: number; direction: 'UP' | 'DOWN' }) => {
  return await request.put({ url: `/system/product-category/sort`, data })
}
