import request from '@/config/axios'

export interface ContractSignCompanySimpleVO {
  id: number
  companyFullName: string
  companyShortName: string
  openCorpId?: string
}

export interface ContractSignCompanyVO extends ContractSignCompanySimpleVO {
  unifiedSocialCreditCode: string
  legalRepresentative?: string
  registeredAddress?: string
  contactPhone?: string
  createTime?: Date
}

export interface ContractSignCompanyPageReqVO {
  pageNo?: number
  pageSize?: number
  companyName?: string
  unifiedSocialCreditCode?: string
  contactPhone?: string
}

export const getContractSignCompanyPage = (params: ContractSignCompanyPageReqVO) => {
  return request.get({ url: '/system/contract-sign-company/page', params })
}

export const getContractSignCompany = (id: number) => {
  return request.get<ContractSignCompanyVO>({ url: '/system/contract-sign-company/get', params: { id } })
}

export const createContractSignCompany = (data: Partial<ContractSignCompanyVO>) => {
  return request.post({ url: '/system/contract-sign-company/create', data })
}

export const updateContractSignCompany = (data: Partial<ContractSignCompanyVO>) => {
  return request.put({ url: '/system/contract-sign-company/update', data })
}

export const deleteContractSignCompany = (id: number) => {
  return request.delete({ url: '/system/contract-sign-company/delete', params: { id } })
}

export const getSimpleContractSignCompanyList = () => {
  return request.get<ContractSignCompanySimpleVO[]>({ url: '/system/contract-sign-company/simple-list' })
}
