import request from '@/config/axios'

export interface DeptVO {
  id: number
  name: string
  parentId: number
  status: number
  sort: number
  leaderUserId: number
  phone: string
  email: string
  createTime: Date
  campusIds?: number[]
  areaIds?: number[]
  categoryIds?: number[]
  campuses?: { id: number; name: string }[]
  areas?: { id: number; name: string; displayName?: string }[]
  categories?: { id: number; name: string; level?: number }[]
}

export type DeptDetailVO = DeptVO

// 查询部门（精简)列表
export const getSimpleDeptList = (): Promise<DeptVO[]> => {
  return request.get({ url: '/system/dept/simple-list' })
}

// 查询部门列表
export const getDeptList = (params: any) => {
  return request.get({ url: '/system/dept/list', params })
}

// 查询部门分页
export const getDeptPage = async (params: PageParam) => {
  return await request.get({ url: '/system/dept/list', params })
}

// 查询部门详情
export const getDept = (id: number) => {
  return request.get<DeptDetailVO>({ url: '/system/dept/get?id=' + id })
}

export const updateDeptCampusScope = (data: { deptId: number; campusIds: number[] }) => {
  return request.put({ url: '/system/dept/update-campus-scope', data })
}

export const updateDeptAreaScope = (data: { deptId: number; areaIds: number[] }) => {
  return request.put({ url: '/system/dept/update-area-scope', data })
}

export const updateDeptCategoryScope = (data: { deptId: number; categoryIds: number[] }) => {
  return request.put({ url: '/system/dept/update-category-scope', data })
}

// 新增部门
export const createDept = (data: DeptVO) => {
  return request.post({ url: '/system/dept/create', data })
}

// 修改部门
export const updateDept = (data: DeptVO) => {
  return request.put({ url: '/system/dept/update', data })
}

// 删除部门
export const deleteDept = async (id: number) => {
  return await request.delete({ url: '/system/dept/delete?id=' + id })
}

// 批量删除部门
export const deleteDeptList = async (ids: number[]) => {
  return await request.delete({ url: '/system/dept/delete-list', params: { ids: ids.join(',') } })
}
