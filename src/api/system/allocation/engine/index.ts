import request from '@/config/axios'

export interface AllocationEngineRuleVO {
  id?: number
  sourceCode: string
  projectCode: string
  projectName?: string
  regionId: number
}

export interface AllocationEngineWeightLimitVO {
  id?: number
  userLevel: string
  weight: number
  allocationLimit: number
}

export interface AllocationEngineVO {
  id?: number
  engineName: string
  status: number
  timeRangeType: string
  startTime?: string
  endTime?: string
  callGroupIdList: number[]
  callGroupNames?: string
  applicableLevelList: string[]
  enableWeightLimit: boolean
  weightLimits?: AllocationEngineWeightLimitVO[]
  rules?: AllocationEngineRuleVO[]
  remark?: string
  lastInitTime?: Date
  updateTime?: Date
}

export const getAllocationEnginePage = async (params: any) => {
  return await request.get({ url: '/system/allocation-engine/page', params })
}

export const getAllocationEngine = async (id: number) => {
  return await request.get<AllocationEngineVO>({ url: '/system/allocation-engine/get', params: { id } })
}

export const createAllocationEngine = async (data: AllocationEngineVO) => {
  return await request.post({ url: '/system/allocation-engine/create', data })
}

export const updateAllocationEngine = async (data: AllocationEngineVO) => {
  return await request.put({ url: '/system/allocation-engine/update', data })
}

export const updateAllocationEngineStatus = async (data: { id: number; status: number }) => {
  return await request.put({ url: '/system/allocation-engine/update-status', data })
}
