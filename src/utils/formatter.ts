import { floatToFixed2 } from '@/utils'

/**
 * 格式化金额【分转元】
 * @param value 金额（分）
 * @returns 格式化后的金额字符串（元）
 */
export const fenToYuan = (value?: number | string): string => {
  return floatToFixed2(value)
}

/**
 * 格式化金额【厘转元】
 * @param value 金额（厘）
 * @returns 格式化后的金额字符串（元）
 */
export const liToYuan = (value?: number | string): string => {
  if (typeof value === 'undefined') return '0.00'
  const parsedNumber = typeof value === 'string' ? parseFloat(value) : value
  if (!Number.isFinite(parsedNumber)) return '0.00'
  return (parsedNumber / 100.0).toFixed(2)
}

/**
 * 格式化金额【分转元】用于表格列
 * @ts-ignore
 */
export const fenToYuanFormat = (_, __, cellValue: any, ___) => {
  return `￥${fenToYuan(cellValue)}`
}

/**
 * 格式化金额【厘转元】用于表格列
 * @ts-ignore
 */
export const liToYuanFormat = (_, __, cellValue: any, ___) => {
  return `￥${liToYuan(cellValue)}`
}
