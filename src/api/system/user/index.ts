import request from '@/config/axios'

export interface UserVO {
  id: number
  username: string
  nickname: string
  memberId?: string
  userLevel?: string
  accountType?: string
  deptId: number
  deptName?: string
  postIds: number[]
  email: string
  mobile: string
  sex: number
  avatar: string
  loginIp: string
  status: number
  remark: string
  expireTime?: Date
  callNo?: string
  callExt?: string
  callPassword?: string
  callerDisplayNumber?: string
  outboundStatus?: number
  outboundRouteId?: number
  mobileCopyLimitTimes?: number
  manageCompanyIds?: number[]
  companyName?: string
  campusIds?: number[]
  campusNames?: string
  areaIds?: number[]
  areaNames?: string
  categoryIds?: number[]
  categoryNames?: string
  permissionDeptIds?: number[]
  permissionDeptNames?: string
  sessionArchiveDeptIds?: number[]
  sessionArchiveDeptNames?: string
  wechatBindInfo?: string
  wecomBindList?: UserWecomBindVO[]
  roleIds?: number[]
  loginDate: Date
  createTime: Date
}

export interface UserWecomBindVO {
  corpId: string
  staffUserId: string
  staffName?: string
}

export interface UserCallSeatStatsVO {
  total: number
  bound: number
  unbound: number
}

export interface UserBatchUpdateReqVO {
  ids: number[]
  mobileCopyLimitTimes?: number
}

// 查询用户管理列表
export const getUserPage = (params: PageParam) => {
  return request.get({ url: '/system/user/page', params })
}

export const getUserCallSeatStats = (): Promise<UserCallSeatStatsVO> => {
  return request.get({ url: '/system/user/call-seat-stats' })
}

// 查询用户详情
export const getUser = (id: number) => {
  return request.get({ url: '/system/user/get?id=' + id })
}

// 新增用户
export const createUser = (data: UserVO) => {
  return request.post({ url: '/system/user/create', data })
}

// 修改用户
export const updateUser = (data: UserVO) => {
  return request.put({ url: '/system/user/update', data })
}

export const batchUpdateUser = (data: UserBatchUpdateReqVO) => {
  return request.put({ url: '/system/user/batch-update', data })
}

export const updateUserPermission = (data: UserVO) => {
  return request.put({ url: '/system/user/update-permission', data })
}

// 删除用户
export const deleteUser = (id: number) => {
  return request.delete({ url: '/system/user/delete?id=' + id })
}

// 批量删除用户
export const deleteUserList = (ids: number[]) => {
  return request.delete({ url: '/system/user/delete-list', params: { ids: ids.join(',') } })
}

// 导出用户
export const exportUser = (params: any) => {
  return request.download({ url: '/system/user/export-excel', params })
}

// 下载用户导入模板
export const importUserTemplate = () => {
  return request.download({ url: '/system/user/get-import-template' })
}

// 用户密码重置
export const resetUserPassword = (id: number, password: string) => {
  const data = {
    id,
    password
  }
  return request.put({ url: '/system/user/update-password', data: data })
}

// 用户状态修改
export const updateUserStatus = (id: number, status: number) => {
  const data = {
    id,
    status
  }
  return request.put({ url: '/system/user/update-status', data: data })
}

// 获取用户精简信息列表
export const getSimpleUserList = (): Promise<UserVO[]> => {
  return request.get({ url: '/system/user/simple-list' })
}

// 获取已被其他用户绑定的企微账号 key 列表：corpId__staffUserId
export const getWecomBindOccupied = (excludeUserId?: number): Promise<string[]> => {
  return request.get({ url: '/system/user/wecom-bind-occupied', params: { excludeUserId } })
}
