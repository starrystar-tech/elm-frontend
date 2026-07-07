import request from '@/config/axios'

export interface ClueFlowRuleConditionOptionVO {
  id: number
  name: string
}

export type ClueFlowDateValue = string | number[]

export interface ClueFlowRuleConditionVO {
  campusIds?: number[]
  projectIds?: number[]
  signStartDate?: ClueFlowDateValue
  signEndDate?: ClueFlowDateValue
  campuses?: ClueFlowRuleConditionOptionVO[]
  projects?: ClueFlowRuleConditionOptionVO[]
}

export interface ClueFlowRuleVO {
  ruleCode: string
  ruleGroup?: string
  ruleName?: string
  enabled: boolean
  days: number
  targetCode?: string
  sort?: number
  remark?: string
  condition?: ClueFlowRuleConditionVO | null
}

export interface ClueFlowConfigVO {
  id?: number
  rules: ClueFlowRuleVO[]
  autoReturnVisitCallDurationSeconds?: number
  createTime?: Date
  updateTime?: Date
}

export interface ClueFlowRuleConditionSaveReqVO {
  campusIds?: number[]
  projectIds?: number[]
  signStartDate?: string
  signEndDate?: string
}

export interface ClueFlowRuleSaveReqVO {
  ruleCode: string
  enabled: boolean
  days?: number
  condition?: ClueFlowRuleConditionSaveReqVO
}

export interface ClueFlowConfigSaveReqVO {
  autoReturnVisitCallDurationSeconds?: number
  rules: ClueFlowRuleSaveReqVO[]
}

export const getClueFlowConfig = () => {
  return request.get<ClueFlowConfigVO>({ url: '/system/clue-flow-config/get' })
}

export const updateClueFlowConfig = (data: ClueFlowConfigSaveReqVO) => {
  return request.put<boolean>({ url: '/system/clue-flow-config/update', data })
}
