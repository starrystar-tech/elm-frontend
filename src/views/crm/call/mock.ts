export type CallType = '呼出' | '接听'

export type CallStatus = '已接通' | '无人接听' | '停机' | '关机' | '无法接通' | '挂断'

export interface CallRecordMockItem {
  id: number
  date: string
  customerId: string
  customerName: string
  mobile: string
  userName: string
  departmentName: string
  callType: CallType
  status: CallStatus
  durationSeconds: number
}

export interface CallMonitorRow {
  userName: string
  departmentName: string
  outgoingCalls: number
  outgoingCustomers: number
  outgoingDurationSeconds: number
  averageOutgoingDurationSeconds: number
  answeredCalls: number
  answeredCustomers: number
  answeredDurationSeconds: number
  averageAnsweredDurationSeconds: number
}

export const CALL_STATUS_COLORS: Record<CallStatus, string> = {
  已接通: '#52c41a',
  无人接听: '#1890ff',
  停机: '#722ed1',
  关机: '#fa8c16',
  无法接通: '#eb2f96',
  挂断: '#f5222d'
}

export const callRecordMocks: CallRecordMockItem[] = [
  { id: 1, date: '2026-05-01 09:12:00', customerId: 'C10001', customerName: '张敏', mobile: '13800138001', userName: '李小斌', departmentName: '研发部门', callType: '呼出', status: '已接通', durationSeconds: 312 },
  { id: 2, date: '2026-05-01 10:24:00', customerId: 'C10002', customerName: '王琳', mobile: '13800138002', userName: '李小斌', departmentName: '研发部门', callType: '呼出', status: '无人接听', durationSeconds: 0 },
  { id: 3, date: '2026-05-01 14:42:00', customerId: 'C10003', customerName: '陈晨', mobile: '13800138003', userName: '何宇', departmentName: '销售一部', callType: '接听', status: '已接通', durationSeconds: 425 },
  { id: 4, date: '2026-05-02 09:48:00', customerId: 'C10004', customerName: '刘洁', mobile: '13800138004', userName: '何宇', departmentName: '销售一部', callType: '呼出', status: '关机', durationSeconds: 0 },
  { id: 5, date: '2026-05-02 11:05:00', customerId: 'C10005', customerName: '赵晴', mobile: '13800138005', userName: '张悦', departmentName: '销售二部', callType: '呼出', status: '已接通', durationSeconds: 268 },
  { id: 6, date: '2026-05-02 16:18:00', customerId: 'C10006', customerName: '周杨', mobile: '13800138006', userName: '张悦', departmentName: '销售二部', callType: '接听', status: '挂断', durationSeconds: 21 },
  { id: 7, date: '2026-05-03 10:15:00', customerId: 'C10007', customerName: '吴倩', mobile: '13800138007', userName: '林峰', departmentName: '客服部', callType: '呼出', status: '停机', durationSeconds: 0 },
  { id: 8, date: '2026-05-03 13:36:00', customerId: 'C10008', customerName: '高宁', mobile: '13800138008', userName: '林峰', departmentName: '客服部', callType: '接听', status: '已接通', durationSeconds: 506 },
  { id: 9, date: '2026-05-03 17:10:00', customerId: 'C10009', customerName: '孙菲', mobile: '13800138009', userName: '李小斌', departmentName: '研发部门', callType: '呼出', status: '无法接通', durationSeconds: 0 },
  { id: 10, date: '2026-05-04 09:05:00', customerId: 'C10010', customerName: '冯雪', mobile: '13800138010', userName: '何宇', departmentName: '销售一部', callType: '呼出', status: '已接通', durationSeconds: 389 },
  { id: 11, date: '2026-05-04 11:55:00', customerId: 'C10011', customerName: '韩璐', mobile: '13800138011', userName: '何宇', departmentName: '销售一部', callType: '接听', status: '已接通', durationSeconds: 442 },
  { id: 12, date: '2026-05-04 15:22:00', customerId: 'C10012', customerName: '谢婷', mobile: '13800138012', userName: '张悦', departmentName: '销售二部', callType: '呼出', status: '无人接听', durationSeconds: 0 },
  { id: 13, date: '2026-05-05 08:59:00', customerId: 'C10013', customerName: '邓莹', mobile: '13800138013', userName: '张悦', departmentName: '销售二部', callType: '呼出', status: '已接通', durationSeconds: 277 },
  { id: 14, date: '2026-05-05 10:08:00', customerId: 'C10014', customerName: '龚涛', mobile: '13800138014', userName: '林峰', departmentName: '客服部', callType: '接听', status: '关机', durationSeconds: 0 },
  { id: 15, date: '2026-05-05 14:27:00', customerId: 'C10015', customerName: '程静', mobile: '13800138015', userName: '李小斌', departmentName: '研发部门', callType: '呼出', status: '已接通', durationSeconds: 358 },
  { id: 16, date: '2026-05-06 09:33:00', customerId: 'C10016', customerName: '苏航', mobile: '13800138016', userName: '李小斌', departmentName: '研发部门', callType: '接听', status: '已接通', durationSeconds: 614 },
  { id: 17, date: '2026-05-06 13:16:00', customerId: 'C10017', customerName: '蒋萌', mobile: '13800138017', userName: '何宇', departmentName: '销售一部', callType: '呼出', status: '挂断', durationSeconds: 36 },
  { id: 18, date: '2026-05-06 16:52:00', customerId: 'C10018', customerName: '许然', mobile: '13800138018', userName: '林峰', departmentName: '客服部', callType: '呼出', status: '已接通', durationSeconds: 245 }
]

export const callDeptUserOptions = Array.from(
  new Set(
    callRecordMocks.flatMap((item) => [
      item.userName,
      item.departmentName
    ])
  )
).map((value) => ({ label: value, value }))

export const formatDurationClock = (durationSeconds?: number) => {
  const totalSeconds = Math.max(0, Math.floor(durationSeconds || 0))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const formatDurationText = (durationSeconds?: number) => {
  const totalSeconds = Math.max(0, Math.floor(durationSeconds || 0))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}分${String(seconds).padStart(2, '0')}秒`
}

export const toDateOnly = (value: string) => value.slice(0, 10)

export const aggregateCallMonitorRows = (list: CallRecordMockItem[]): CallMonitorRow[] => {
  const groups = new Map<string, CallMonitorRow & { outgoingMobiles: Set<string>; answeredMobiles: Set<string> }>()

  list.forEach((item) => {
    const key = `${item.departmentName}__${item.userName}`
    if (!groups.has(key)) {
      groups.set(key, {
        userName: item.userName,
        departmentName: item.departmentName,
        outgoingCalls: 0,
        outgoingCustomers: 0,
        outgoingDurationSeconds: 0,
        averageOutgoingDurationSeconds: 0,
        answeredCalls: 0,
        answeredCustomers: 0,
        answeredDurationSeconds: 0,
        averageAnsweredDurationSeconds: 0,
        outgoingMobiles: new Set<string>(),
        answeredMobiles: new Set<string>()
      })
    }

    const row = groups.get(key)!
    if (item.callType === '呼出') {
      row.outgoingCalls += 1
      row.outgoingDurationSeconds += item.durationSeconds
      row.outgoingMobiles.add(item.mobile)
    } else {
      row.answeredCalls += 1
      row.answeredDurationSeconds += item.durationSeconds
      row.answeredMobiles.add(item.mobile)
    }
  })

  return Array.from(groups.values())
    .map((item) => ({
      userName: item.userName,
      departmentName: item.departmentName,
      outgoingCalls: item.outgoingCalls,
      outgoingCustomers: item.outgoingMobiles.size,
      outgoingDurationSeconds: item.outgoingDurationSeconds,
      averageOutgoingDurationSeconds: item.outgoingCalls
        ? Math.round(item.outgoingDurationSeconds / item.outgoingCalls)
        : 0,
      answeredCalls: item.answeredCalls,
      answeredCustomers: item.answeredMobiles.size,
      answeredDurationSeconds: item.answeredDurationSeconds,
      averageAnsweredDurationSeconds: item.answeredCalls
        ? Math.round(item.answeredDurationSeconds / item.answeredCalls)
        : 0
    }))
    .sort((a, b) => b.outgoingCalls + b.answeredCalls - (a.outgoingCalls + a.answeredCalls))
}
