import request from '@/config/axios'
import type { ContractVariableVO } from './variable'
import type { CampusVO } from '@/api/system/campus'

export interface ContractTemplateVO {
  id: number
  templateId: string
  templateName: string
  templateType: number
  templateTypeName?: string
  templateStatus: number
  campusIds?: number[]
  campuses?: CampusVO[]
  campusNames?: string
  contractVariableIds?: number[]
  contractVariables?: ContractVariableVO[]
  contractVariableNames?: string
  createTime?: Date
}

export interface ContractTemplatePageReqVO {
  pageNo?: number
  pageSize?: number
  templateName?: string
  campusId?: number
  templateType?: number
  templateStatus?: number
}

export interface ContractTemplateListReqVO {
  campusId?: number
  templateType?: number
  templateStatus?: number
}

export interface ContractTemplateSimpleVO {
  id: number
  templateId: string
  templateName: string
  templateType: number
  templateTypeName?: string
  templateStatus: number
}

export const getContractTemplatePage = (params: ContractTemplatePageReqVO) => {
  return request.get({ url: '/system/contract-template/page', params })
}

export const getContractTemplate = (id: number) => {
  return request.get<ContractTemplateVO>({ url: '/system/contract-template/get', params: { id } })
}

export const updateContractTemplate = (data: Partial<ContractTemplateVO>) => {
  return request.put({ url: '/system/contract-template/update', data })
}

export const getContractTemplateList = (params: ContractTemplateListReqVO) => {
  return request.get<ContractTemplateSimpleVO[]>({ url: '/system/contract-template/list', params })
}

export const syncContractTemplate = () => {
  return request.post({ url: '/system/contract-template/sync' })
}

export const getContractTemplateManageUrl = () => {
  return request.get<string>({ url: '/system/contract-template/getTemplateManageUrl' })
}

export const getContractTemplatePreviewUrl = (templateId: string) => {
  return request.get<string>({ url: '/system/contract-template/getPreviewUrl', params: { templateId } })
}
