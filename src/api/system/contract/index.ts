import request from '@/config/axios'
import type { ContractVariableVO } from './variable'
export type { ContractVariableVO } from './variable'

export interface ContractPageReqVO {
  pageNo?: number
  pageSize?: number
  mobile?: string
  customer?: string
  status?: number
  contractType?: number
  beginCreateTime?: string
  endCreateTime?: string
  contractNo?: string
  orderNo?: string
}

export interface ContractPageRespVO {
  id: number
  contractNo: string
  orderNo?: string
  clueId?: number
  customerId?: string
  customerName?: string
  customerMobile?: string
  docTitle?: string
  contractType?: number
  status?: number
  statusDesc?: string
  productName?: string
  payFee?: number
  creatorName?: string
  createTime?: Date
}

export interface ContractAbolishReqVO {
  contractId: string
  reason?: string
}

export interface ContractOrderProductReqVO {
  orderNo: string
  productId: number
}

export interface ContractOrderProductRespVO {
  id: number
  templateRecordId?: number
  contractNo?: string
  signTime?: string
  contractType?: number
  contractTypeName?: string
  status?: number
  statusName?: string
  revokeReason?: string
}

export interface ContractCreateSignTaskReqVO {
  orderItemId: number
  contractTemplateId: number
  parameterJson: string
}

export interface ContractCreateSignTaskRespVO {
  id: number
  contractId: string
  signUrl: string
}

export const getContractPage = (params: ContractPageReqVO) => {
  return request.get({ url: '/system/contract/page', params })
}

export const createContractSignTask = (data: ContractCreateSignTaskReqVO) => {
  return request.post<ContractCreateSignTaskRespVO>({ url: '/system/contract/create-sign-task', data })
}

export const getContractListByOrderProduct = (params: ContractOrderProductReqVO) => {
  return request.get<ContractOrderProductRespVO[]>({ url: '/system/contract/list-by-order-product', params })
}

export const getContractListByClue = (clueId: number, orderNo?: string) => {
  return request.get<ContractPageRespVO[]>({ url: '/system/contract/list-by-clue', params: { clueId, orderNo } })
}

export const getContractPreviewUrl = (id: number) => {
  return request.get<string>({ url: '/system/contract/preview', params: { id } })
}

export const getContractSignUrl = (id: number) => {
  return request.get<string>({ url: '/system/contract/sign-url', params: { id } })
}

export const getContractDownloadUrl = (id: number) => {
  return request.get<string>({ url: '/system/contract/download', params: { id } })
}

export const abolishContract = (data: ContractAbolishReqVO) => {
  return request.put<boolean>({ url: '/system/contract/abolish', data })
}

export const cancelContractSign = (id: number) => {
  return request.get<boolean>({ url: '/system/contract/cancel-sign', params: { id } })
}

export const getContractTemplateVariables = (id: number) => {
  return request.get<ContractVariableVO[]>({ url: '/system/contract-template/variables', params: { id } })
}
