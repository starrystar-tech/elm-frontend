import request from '@/config/axios'

// 媒体用户测试 VO
export interface UserVO {
  id: number // 唯一标识
  name: string // 姓名
}

// 媒体用户分数 VO
export interface ScoreVO {
  id: number // 唯一标识
  userId: number // 媒体用户id
  score: number // 分值 
  name: string // 姓名
}

// 媒体用户测试 API
export const UserApi = {
  // 查询媒体用户测试分页
  getUserPage: async (params: any) => {
    return await request.get({ url: `/media/user/page`, params })
  },

  // 查询媒体用户测试详情
  getUser: async (id: number) => {
    return await request.get({ url: `/media/user/get?id=` + id })
  },

  // 新增媒体用户测试
  createUser: async (data: UserVO) => {
    return await request.post({ url: `/media/user/create`, data })
  },

  // 修改媒体用户测试
  updateUser: async (data: UserVO) => {
    return await request.put({ url: `/media/user/update`, data })
  },

  // 删除媒体用户测试
  deleteUser: async (id: number) => {
    return await request.delete({ url: `/media/user/delete?id=` + id })
  },

  // 导出媒体用户测试 Excel
  exportUser: async (params) => {
    return await request.download({ url: `/media/user/export-excel`, params })
  },

// ==================== 子表（媒体用户分数） ====================

  // 获得媒体用户分数列表
  getScoreListByUserId: async (userId) => {
    return await request.get({ url: `/media/user/score/list-by-user-id?userId=` + userId })
  }
}
