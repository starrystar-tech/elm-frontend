import { getOtherSettingConfig } from '@/api/crm/otherSettingConfig'
import { getOutboundRouteSimpleList } from '@/api/system/call/router'
import { useBrowserPhone } from '@/hooks/web/useBrowserPhone'
import { checkPermi } from '@/utils/permission'

export const useOutboundDial = () => {
    const message = useMessage()
    const dialing = ref(false)
    const canQueryOtherSettingConfig = checkPermi(['crm:other-setting-config:query'])
    const {
        profile,
        browserRegistered,
        browserForm,
        reloadProfile,
        makeBrowserCall
    } = useBrowserPhone()

    const outboundSignedIn = computed(() => profile.outboundStatus === 1 && browserRegistered.value)

    const dialOutboundMobile = async (mobile?: string) => {
        if (dialing.value) return
        await reloadProfile()
        if (!outboundSignedIn.value) {
            message.warning('当前未签入，请先签入浏览器分机')
            return
        }

        const targetMobile = String(mobile || '').trim()
        if (!/^\d{3,20}$/.test(targetMobile)) {
            message.warning('请输入正确的号码')
            return
        }

        dialing.value = true
        try {
            const routeList = await getOutboundRouteSimpleList()
            const userRouteId = Number(profile.outboundRouteId || 0) || undefined
            const config =
                userRouteId || !canQueryOtherSettingConfig
                    ? undefined
                    : await getOtherSettingConfig()
            const targetRouteId = userRouteId || config?.outboundRouteId
            if (!targetRouteId) {
                message.warning('当前未选择外呼线路，请联系管理员配置线路')
                return
            }

            const currentRoute = routeList.find((item) => item.id === targetRouteId)
            const routePrefix = String(currentRoute?.numberPrefix || '').trim()
            if (!currentRoute?.id || !routePrefix) {
                message.warning('当前外呼线路不存在，请重新选择')
                return
            }
            if (currentRoute.status === 1) {
                message.warning('当前外呼线路已禁用，请重新选择')
                return
            }

            browserForm.target = targetMobile
            await makeBrowserCall({
                dialTarget: `${routePrefix}${targetMobile}`,
                displayTarget: targetMobile,
                outboundRouteId: currentRoute.id
            })
        } catch (error: any) {
            message.error(error?.message || '发起外呼失败')
        } finally {
            dialing.value = false
        }
    }

    return {
        dialing,
        outboundSignedIn,
        dialOutboundMobile
    }
}
