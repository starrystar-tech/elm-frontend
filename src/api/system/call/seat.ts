import request from '@/config/axios'

export interface CallSeatVO {
  id?: number
  seatExt: string
  sipPassword: string
  voicemailPassword?: string
  status: number
  remark?: string
  inUse?: boolean
  currentUserName?: string
  currentUserAccount?: string
  currentDeptName?: string
  currentCallerDisplayNumber?: string
  createTime?: string
}

export interface CallSeatPageReqVO extends PageParam {
  keyword?: string
  status?: number
}

export interface CallSeatStatsVO {
  total: number
  inUse: number
  idle: number
  disabled: number
}

export const getCallSeatPage = async (params: CallSeatPageReqVO) => {
  return await request.get({ url: '/system/call-seat/page', params })
}

export const getCallSeat = async (id: number) => {
  return await request.get<CallSeatVO>({ url: '/system/call-seat/get', params: { id } })
}

export const createCallSeat = async (data: CallSeatVO) => {
  return await request.post({ url: '/system/call-seat/create', data })
}

export const updateCallSeat = async (data: CallSeatVO) => {
  return await request.put({ url: '/system/call-seat/update', data })
}

export const deleteCallSeat = async (id: number) => {
  return await request.delete({ url: '/system/call-seat/delete', params: { id } })
}

export const getCallSeatStats = async () => {
  return await request.get<CallSeatStatsVO>({ url: '/system/call-seat/stats' })
}

export const getCallSeatSimpleList = async () => {
  return await request.get<CallSeatVO[]>({ url: '/system/call-seat/simple-list' })
}
