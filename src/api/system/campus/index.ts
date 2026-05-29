import request from '@/config/axios'

export interface CampusVO {
  id?: number
  name: string
  isDefault: boolean
  hasTeacher: boolean
  contractSignCompanyId?: number
  contractSignCompany?: {
    id: number
    companyFullName: string
    companyShortName: string
    openCorpId?: string
  }
  remark?: string
  status: number
  createTime?: Date
}

export interface CampusPageReqVO {
  pageNo?: number
  pageSize?: number
  name?: string
  hasTeacher?: boolean
  status?: number
}

export const getCampusPage = (params: CampusPageReqVO) => {
  return request.get({ url: '/system/campus/page', params })
}

export const getCampus = (id: number) => {
  return request.get<CampusVO>({ url: '/system/campus/get?id=' + id })
}

export const createCampus = (data: CampusVO) => {
  return request.post({ url: '/system/campus/create', data })
}

export const updateCampus = (data: CampusVO) => {
  return request.put({ url: '/system/campus/update', data })
}

export const updateCampusStatus = (data: { id: number; status: number }) => {
  return request.put({ url: '/system/campus/update-status', data })
}

export const getSimpleCampusList = () => {
  return request.get<CampusVO[]>({ url: '/system/campus/simple-list' })
}
