import request from '@/config/axios'

export interface ClueFlowRuleVO {
  ruleCode: string
  ruleGroup?: string
  ruleName?: string
  enabled: boolean
  days: number
  targetCode?: string
  sort?: number
  remark?: string
}

export interface ClueFlowConfigVO {
  id?: number
  rules: ClueFlowRuleVO[]
  autoReturnVisitCallDurationSeconds?: number
  createTime?: Date
  updateTime?: Date
}

export interface ClueFlowConfigSaveReqVO {
  autoReturnVisitCallDurationSeconds?: number
  rules: Array<Pick<ClueFlowRuleVO, 'ruleCode' | 'enabled' | 'days'>>
}

export const getClueFlowConfig = () => {
  return request.get<ClueFlowConfigVO>({ url: '/system/clue-flow-config/get' })
}

export const updateClueFlowConfig = (data: ClueFlowConfigSaveReqVO) => {
  return request.put<boolean>({ url: '/system/clue-flow-config/update', data })
}
