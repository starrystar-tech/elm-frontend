import request from '@/config/axios'

// 媒体用户分数 VO
export interface ScoreVO {
  id: number // 唯一标识
  userId: number // 媒体用户id
  score: number // 分值 
  name: string
}

// 媒体用户分数 API
export const ScoreApi = {
  // 查询媒体用户分数分页
  getScorePage: async (params: any) => {
    return await request.get({ url: `/media/score/page`, params })
  },

  // 查询媒体用户分数详情
  getScore: async (id: number) => {
    return await request.get({ url: `/media/score/get?id=` + id })
  },

  // 新增媒体用户分数
  createScore: async (data: ScoreVO) => {
    return await request.post({ url: `/media/score/create`, data })
  },

  // 修改媒体用户分数
  updateScore: async (data: ScoreVO) => {
    return await request.put({ url: `/media/score/update`, data })
  },

  // 删除媒体用户分数
  deleteScore: async (id: number) => {
    return await request.delete({ url: `/media/score/delete?id=` + id })
  },

  // 导出媒体用户分数 Excel
  exportScore: async (params) => {
    return await request.download({ url: `/media/score/export-excel`, params })
  }
}
