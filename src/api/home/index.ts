import request from '@/config/axios'

export interface HomeDashboardSummaryCardVO {
  code: string
  title: string
  value: number
  icon: string
  path: string
}

export interface HomeDashboardShortcutVO {
  title: string
  icon: string
  path: string
}

export interface HomeDashboardTodoItemVO {
  code: string
  title: string
  description: string
  count: number
  path: string
}

export interface HomeDashboardActivityVO {
  type: string
  title: string
  content: string
  icon: string
  path: string
  time: string
}

export interface HomeDashboardVO {
  summaryCards: HomeDashboardSummaryCardVO[]
  shortcuts: HomeDashboardShortcutVO[]
  todoItems: HomeDashboardTodoItemVO[]
  activities: HomeDashboardActivityVO[]
}

export const getHomeDashboard = async () => {
  return await request.get<HomeDashboardVO>({ url: '/crm/home/dashboard' })
}
