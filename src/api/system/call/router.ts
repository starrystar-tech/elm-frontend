import request from '@/config/axios'

export interface OutboundRouteVO {
  id?: number
  name: string
  numberPrefix: string
  status: number
  createTime?: string
}

export interface OutboundRoutePageReqVO extends PageParam {
  keyword?: string
}

export const getOutboundRoutePage = async (params: OutboundRoutePageReqVO) => {
  return await request.get({ url: '/system/outbound-route/page', params })
}

export const getOutboundRoute = async (id: number) => {
  return await request.get<OutboundRouteVO>({ url: '/system/outbound-route/get', params: { id } })
}

export const createOutboundRoute = async (data: OutboundRouteVO) => {
  return await request.post({ url: '/system/outbound-route/create', data })
}

export const updateOutboundRoute = async (data: OutboundRouteVO) => {
  return await request.put({ url: '/system/outbound-route/update', data })
}

export const deleteOutboundRoute = async (id: number) => {
  return await request.delete({ url: '/system/outbound-route/delete', params: { id } })
}

export const getOutboundRouteSimpleList = async () => {
  return await request.get<OutboundRouteVO[]>({ url: '/system/outbound-route/simple-list' })
}
