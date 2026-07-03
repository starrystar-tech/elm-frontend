import baiguAuthLogo from '@/assets/imgs/logo/baigu-auth-logo.png'
import baiguFavicon from '@/assets/imgs/logo/baigu-favicon.ico'
import baiguLoginLogo from '@/assets/imgs/logo/baigu-login-logo.png'
import baiguNavLogo from '@/assets/imgs/logo/baigu-nav-logo.png'
import gaoguAuthLogo from '@/assets/imgs/logo/gaogu-auth-logo.png'
import gaoguFavicon from '@/assets/imgs/logo/gaogu-favicon.ico'
import gaoguLoginLogo from '@/assets/imgs/logo/gaogu-login-logo.png'
import gaoguNavLogo from '@/assets/imgs/logo/gaogu-nav-logo.png'

export type BrandKey = 'baigu' | 'gaogu'

export interface BrandConfig {
    key: BrandKey
    title: string
    tenantName: string
    loginSubtitle?: string
    favicon: string
    logos: {
        nav: string
        login: string
        auth: string
    }
    copyrightLines: string[]
}

export const BRAND_CONFIGS: Record<BrandKey, BrandConfig> = {
    baigu: {
        key: 'baigu',
        title: '百谷科技',
        tenantName: '百谷科技',
        favicon: baiguFavicon,
        logos: {
            nav: baiguNavLogo,
            login: baiguLoginLogo,
            auth: baiguAuthLogo
        },
        copyrightLines: [
            'Copyright © 2025-2026 www.bgwa.cn. All Rights Reserved',
            '武汉百谷科技有限公司版权所有 鄂ICP备2022019819号-1'
        ]
    },
    gaogu: {
        key: 'gaogu',
        title: '高谷教育',
        tenantName: '高谷教育',
        loginSubtitle: 'GAOGU PARTNER',
        favicon: gaoguFavicon,
        logos: {
            nav: gaoguNavLogo,
            login: gaoguLoginLogo,
            auth: gaoguAuthLogo
        },
        copyrightLines: [
            'Copyright © 2025-2026 fx01.cn. All Rights Reserved',
            '武汉高谷教育科技有限责任公司版权所有 鄂ICP备2022019819号-1'
        ]
    }
}

// 切换品牌时，在这里改成 'baigu' 或 'gaogu'
export const ACTIVE_BRAND_KEY: BrandKey = 'gaogu'

export const activeBrandConfig = BRAND_CONFIGS[ACTIVE_BRAND_KEY]

export const applyActiveBrand = () => {
    document.title = activeBrandConfig.title

    let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
    if (!faviconLink) {
        faviconLink = document.createElement('link')
        faviconLink.rel = 'icon'
        document.head.appendChild(faviconLink)
    }
    faviconLink.href = activeBrandConfig.favicon
}
