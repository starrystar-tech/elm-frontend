import request from '@/config/axios'

export interface ClueSourceVO {
  id?: number
  name: string
  status: number
  updater?: string
  updateTime?: Date
}

export interface ClueSourcePageReqVO {
  pageNo?: number
  pageSize?: number
  name?: string
  status?: number
}

export const getClueSourcePage = (params: ClueSourcePageReqVO) => {
  return request.get({ url: '/crm/clue-source/page', params })
}

export const getClueSource = (id: number) => {
  return request.get<ClueSourceVO>({ url: '/crm/clue-source/get?id=' + id })
}

export const createClueSource = (data: ClueSourceVO) => {
  return request.post({ url: '/crm/clue-source/create', data })
}

export const updateClueSource = (data: ClueSourceVO) => {
  return request.put({ url: '/crm/clue-source/update', data })
}

export const deleteClueSource = (id: number) => {
  return request.delete({ url: '/crm/clue-source/delete?id=' + id })
}

export const getEnabledClueSourceList = () => {
  return request.get<ClueSourceVO[]>({ url: '/crm/clue-source/list-enabled' })
}
