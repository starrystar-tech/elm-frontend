import request from '@/config/axios'

export interface NotifyMessageVO {
  id: number
  category: string
  categoryName: string
  bizType?: string
  bizId?: number
  clueId?: number
  customerName?: string
  customerMobile?: string
  displayContent: string
  readStatus: number
  readTime?: Date | string | null
  triggerTime?: Date | string | null
  createTime?: Date | string | null
  // 兼容旧页面的字段声明，避免其它引用报错
  userId?: number
  userType?: number
  templateId?: number
  templateCode?: string
  templateNickname?: string
  templateContent?: string
  templateType?: number
  templateParams?: string
}

export interface ReminderCategorySummaryVO {
  category: string
  categoryName: string
  unreadCount: number
}

export interface ReminderPanelSummaryVO {
  totalUnreadCount: number
  categories: ReminderCategorySummaryVO[]
}

export interface ReminderMessagePageParams extends PageParam {
  category?: string
  readStatus?: number
}

// 查询提醒消息列表
export const getNotifyMessagePage = async (params: ReminderMessagePageParams) => {
  return await request.get({ url: '/system/reminder-message/page', params })
}

// 获得我的提醒消息分页
export const getMyNotifyMessagePage = async (params: ReminderMessagePageParams) => {
  return await request.get({ url: '/system/reminder-message/page', params })
}

// 获得提醒面板汇总
export const getReminderMessagePanelSummary = async () => {
  return await request.get<ReminderPanelSummaryVO>({ url: '/system/reminder-message/panel-summary' })
}

// 批量/单条标记已读
export const updateNotifyMessageRead = async (ids: number | number[]) => {
  const idList = Array.isArray(ids) ? ids : [ids]
  await Promise.all(
    idList.map((id) =>
      request.post({
        url: '/system/reminder-message/read',
        data: { id }
      })
    )
  )
  return true
}

// 标记全部提醒已读
export const updateAllNotifyMessageRead = async (category?: string) => {
  return await request.post({
    url: '/system/reminder-message/read-all',
    data: category ? { category } : {}
  })
}

// 获取当前用户的最新未读提醒列表
export const getUnreadNotifyMessageList = async (category?: string, pageSize = 10) => {
  const data = await getMyNotifyMessagePage({
    pageNo: 1,
    pageSize,
    category,
    readStatus: 0
  })
  return data?.list || []
}

// 获得当前用户的未读提醒数量
export const getUnreadNotifyMessageCount = async () => {
  const data = await getReminderMessagePanelSummary()
  return data?.totalUnreadCount || 0
}
