import request from '@/config/axios'

export interface AllocationWeightConfigVO {
  id?: number
  levelCode: string
  levelName?: string
  weight: number
  remark?: string
  createTime?: Date
  updateTime?: Date
  updater?: string
}

export const getAllocationWeightConfigPage = async (params: any) => {
  return await request.get({ url: '/crm/allocation-weight-config/page', params })
}

export const getAllocationWeightConfig = async (id: number) => {
  return await request.get<AllocationWeightConfigVO>({ url: '/crm/allocation-weight-config/get', params: { id } })
}

export const createAllocationWeightConfig = async (data: AllocationWeightConfigVO) => {
  return await request.post({ url: '/crm/allocation-weight-config/create', data })
}

export const updateAllocationWeightConfig = async (data: AllocationWeightConfigVO) => {
  return await request.put({ url: '/crm/allocation-weight-config/update', data })
}

export const deleteAllocationWeightConfig = async (id: number) => {
  return await request.delete({ url: '/crm/allocation-weight-config/delete', params: { id } })
}

