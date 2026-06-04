import request from '@/config/axios'

export interface ComplaintTagVO {
  id?: number
  name: string
  sort: number
  createTime?: Date | string
}

export interface ComplaintTagSimpleVO {
  id: number
  name: string
}

export interface ComplaintTagPageReqVO {
  pageNo?: number
  pageSize?: number
  name?: string
}

export const getComplaintTagPage = async (params: ComplaintTagPageReqVO) => {
  return await request.get({ url: '/system/complaint-tag/page', params })
}

export const getComplaintTag = async (id: number) => {
  return await request.get<ComplaintTagVO>({ url: '/system/complaint-tag/get', params: { id } })
}

export const createComplaintTag = async (data: ComplaintTagVO) => {
  return await request.post({ url: '/system/complaint-tag/create', data })
}

export const updateComplaintTag = async (data: ComplaintTagVO) => {
  return await request.put({ url: '/system/complaint-tag/update', data })
}

export const deleteComplaintTag = async (id: number) => {
  return await request.delete({ url: '/system/complaint-tag/delete', params: { id } })
}

export const getComplaintTagSimpleList = async () => {
  return await request.get<ComplaintTagSimpleVO[]>({ url: '/system/complaint-tag/simple-list' })
}
