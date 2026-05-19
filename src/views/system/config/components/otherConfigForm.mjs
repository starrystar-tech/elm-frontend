export function buildDefaultOtherSettingConfig() {
  return {
    general: {
      mobileCopyLimitEnabled: false,
      mobileCopyLimitTimes: 20,
      mobileEncryptEnabled: true
    },
    systemNotify: {
      newWorkOrderNotifyEnabled: false,
      workOrderTimeoutWarningEnabled: false,
      workOrderTimeoutWarningValue: 1,
      workOrderTimeoutWarningUnit: 3,
      appointmentReminderValue: 1,
      appointmentReminderUnit: 2
    },
    smsNotify: {
      exportVerify: {
        enabled: false,
        sceneCode: 'EXPORT_VERIFY',
        receivers: []
      },
      mobileCopyWarning: {
        enabled: false,
        sceneCode: 'MOBILE_COPY_WARNING',
        receivers: [],
        minutes: 1,
        times: 7
      },
      recordingDownloadWarning: {
        enabled: false,
        sceneCode: 'RECORDING_DOWNLOAD_WARNING',
        receivers: [],
        minutes: 1,
        times: 5
      },
      newIpLoginWarning: {
        enabled: false,
        sceneCode: 'NEW_IP_LOGIN_WARNING',
        receivers: []
      }
    }
  }
}

export function parseReceiverText(text) {
  return Array.from(
    new Set(
      String(text || '')
        .split(/[\n,，;\s]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

export function stringifyReceivers(receivers) {
  return Array.isArray(receivers) ? receivers.filter(Boolean).join('\n') : ''
}
