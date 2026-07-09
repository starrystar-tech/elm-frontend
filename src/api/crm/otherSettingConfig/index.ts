import request from '@/config/axios'

export interface ReceiverSettingVO {
  enabled: boolean
  sceneCode: string
  receivers: string[]
}

export interface ThresholdReceiverSettingVO extends ReceiverSettingVO {
  minutes: number
  times: number
}

export interface OtherSettingConfigVO {
  id?: number
  outboundRouteId?: number
  general: {
    mobileCopyLimitEnabled: boolean
    mobileCopyLimitTimes: number
    mobileEncryptEnabled: boolean
  }
  systemNotify: {
    newWorkOrderNotifyEnabled: boolean
    workOrderTimeoutWarningEnabled: boolean
    workOrderTimeoutWarningValue: number
    workOrderTimeoutWarningUnit: number
    appointmentReminderValue: number
    appointmentReminderUnit: number
  }
  smsNotify: {
    exportVerify: ReceiverSettingVO
    mobileCopyWarning: ThresholdReceiverSettingVO
    recordingDownloadWarning: ThresholdReceiverSettingVO
    newIpLoginWarning: ReceiverSettingVO
  }
}

export interface ExportVerifyConfigVO {
  needSendAuthCode: boolean
  mobile: string[]
}

export const getOtherSettingConfig = async () => {
  return await request.get<OtherSettingConfigVO>({ url: '/crm/other-setting-config/get' })
}

export const getOutboundDefaultRouteId = async () => {
  return await request.get<number>({ url: '/crm/other-setting-config/outbound-default-route' })
}

export const saveOtherSettingConfig = async (data: OtherSettingConfigVO) => {
  return await request.put<boolean>({ url: '/crm/other-setting-config/save', data })
}

export const getExportVerifyConfig = async () => {
  return await request.get<ExportVerifyConfigVO>({
    url: '/crm/other-setting-config/export-verify-config'
  })
}
