import request from '@/config/axios'

export interface ContractVariableVO {
  id?: number
  variableName: string
  createTime?: Date
}

export interface ContractVariablePageReqVO {
  pageNo?: number
  pageSize?: number
  variableName?: string
}

export const getContractVariablePage = (params: ContractVariablePageReqVO) => {
  return request.get({ url: '/system/contract-variable/page', params })
}

export const getContractVariable = (id: number) => {
  return request.get<ContractVariableVO>({ url: '/system/contract-variable/get', params: { id } })
}

export const createContractVariable = (data: ContractVariableVO) => {
  return request.post({ url: '/system/contract-variable/create', data })
}

export const updateContractVariable = (data: ContractVariableVO) => {
  return request.put({ url: '/system/contract-variable/update', data })
}

export const deleteContractVariable = (id: number) => {
  return request.delete({ url: '/system/contract-variable/delete', params: { id } })
}

export const getContractVariableList = () => {
  return request.get<ContractVariableVO[]>({ url: '/system/contract-variable/list' })
}
