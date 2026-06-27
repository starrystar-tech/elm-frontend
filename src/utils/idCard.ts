const ID_CARD_PATTERN = /^\d{17}[\dXx]$/
const ID_CARD_WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const ID_CARD_CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

export const normalizeIdCardNo = (value?: string | null) => String(value || '').trim().toUpperCase()

const isValidBirthDate = (value: string) => {
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6))
  const day = Number(value.slice(6, 8))
  if (!year || !month || !day) {
    return false
  }
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export const isValidChineseIdCard = (value?: string | null) => {
  const idCardNo = normalizeIdCardNo(value)
  if (!ID_CARD_PATTERN.test(idCardNo)) {
    return false
  }
  if (!isValidBirthDate(idCardNo.slice(6, 14))) {
    return false
  }
  const sum = ID_CARD_WEIGHTS.reduce((total, weight, index) => {
    return total + Number(idCardNo[index]) * weight
  }, 0)
  const checkCode = ID_CARD_CHECK_CODES[sum % 11]
  return checkCode === idCardNo[17]
}
