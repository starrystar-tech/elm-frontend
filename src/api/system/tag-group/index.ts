import request from '@/config/axios'

export interface SystemTagVO {
  id?: number
  groupId?: number
  name: string
  sort: number
}

export interface SystemTagGroupVO {
  id?: number
  name: string
  sort: number
  remark?: string
  tags: SystemTagVO[]
  createTime?: Date
}

export const getTagGroupList = () => {
  return request.get<SystemTagGroupVO[]>({ url: '/system/tag-group/list' })
}

export const getTagGroup = (id: number) => {
  return request.get<SystemTagGroupVO>({ url: '/system/tag-group/get?id=' + id })
}

export const createTagGroup = (data: SystemTagGroupVO) => {
  return request.post({ url: '/system/tag-group/create', data })
}

export const updateTagGroup = (data: SystemTagGroupVO) => {
  return request.put({ url: '/system/tag-group/update', data })
}

export const deleteTagGroup = (id: number) => {
  return request.delete({ url: '/system/tag-group/delete?id=' + id })
}
