import request from '@/config/axios'

export interface OtherSettingConfigVO {
  id?: number
  exportNeedSuperAdminVerify: boolean
  exportVerifySuperAdminMobile: string
  mobileCopyLimitEnabled: boolean
  mobileCopyLimitTimes: number
  mobileEncryptEnabled: boolean
  workOrderTimeoutWarningEnabled: boolean
  workOrderTimeoutWarningDays: number
}

export const getOtherSettingConfig = async () => {
  return await request.get<OtherSettingConfigVO>({ url: '/crm/other-setting-config/get' })
}

export const saveOtherSettingConfig = async (data: OtherSettingConfigVO) => {
  return await request.put<boolean>({ url: '/crm/other-setting-config/save', data })
}
