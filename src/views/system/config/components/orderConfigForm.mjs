export const ORDER_TIME_UNIT_OPTIONS = [
  { label: '分钟', value: 1 },
  { label: '小时', value: 2 }
]

export function buildDefaultOrderSettingConfig() {
  return {
    notify: {
      financeAuditPayOrderNotifyEnabled: false
    },
    permission: {
      paidOrderModifyStudentLocked: false,
      paidOrderVoidLocked: true
    },
    paymentAutoClose: {
      value: 30,
      unit: 1
    }
  }
}
