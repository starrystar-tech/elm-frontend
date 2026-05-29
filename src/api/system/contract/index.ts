import request from '@/config/axios'

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
  customerId?: string
  customerName?: string
  customerMobile?: string
  docTitle?: string
  contractType?: number
  status?: number
  productName?: string
  payFee?: number
  creatorName?: string
  createTime?: Date
}

export const getContractPage = (params: ContractPageReqVO) => {
  return request.get({ url: '/system/contract/page', params })
}

export const getContractPreviewUrl = (id: number) => {
  return request.get<string>({ url: '/system/contract/preview', params: { id } })
}

export const getContractDownloadUrl = (id: number) => {
  return request.get<string>({ url: '/system/contract/download', params: { id } })
}
