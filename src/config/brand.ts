import baiguAuthLogo from '@/assets/imgs/logo/baigu-auth-logo.png'
import baiguFavicon from '@/assets/imgs/logo/baigu-favicon.ico'
import baiguLoginLogo from '@/assets/imgs/logo/baigu-login-logo.png'
import baiguNavLogo from '@/assets/imgs/logo/baigu-nav-logo.png'
import gaoguAuthLogo from '@/assets/imgs/logo/gaogu-auth-logo.png'
import gaoguFavicon from '@/assets/imgs/logo/gaogu-favicon.ico'
import gaoguLoginLogo from '@/assets/imgs/logo/gaogu-login-logo.png'
import gaoguNavLogo from '@/assets/imgs/logo/gaogu-nav-logo.png'
import {
    BRAND_PROFILE_CONFIGS,
    resolveBrandKey,
    type BrandKey,
    type BrandProfile
} from './brand.shared'

export interface BrandConfig extends BrandProfile {
    favicon: string
    browserPhone: {
        wsServer: string
        domain: string
    }
    logos: {
        nav: string
        login: string
        auth: string
    }
}

export const BRAND_CONFIGS: Record<BrandKey, BrandConfig> = {
    baigu: {
        ...BRAND_PROFILE_CONFIGS.baigu,
        favicon: baiguFavicon,
        browserPhone: {
            wsServer: 'wss://sip.bgwa.cn:7443',
            domain: '60.205.112.131'
        },
        logos: {
            nav: baiguNavLogo,
            login: baiguLoginLogo,
            auth: baiguAuthLogo
        }
    },
    gaogu: {
        ...BRAND_PROFILE_CONFIGS.gaogu,
        favicon: gaoguFavicon,
        browserPhone: {
            wsServer: 'wss://sip.fx01.cn:7443',
            domain: '123.56.215.75'
        },
        logos: {
            nav: gaoguNavLogo,
            login: gaoguLoginLogo,
            auth: gaoguAuthLogo
        }
    }
}

export const ACTIVE_BRAND_KEY: BrandKey = resolveBrandKey(import.meta.env.VITE_APP_BRAND)
export const activeBrandProfile = BRAND_PROFILE_CONFIGS[ACTIVE_BRAND_KEY]
export const activeBrandConfig = BRAND_CONFIGS[ACTIVE_BRAND_KEY]

const setMetaContent = (name: string, content: string) => {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
    if (!meta) {
        meta = document.createElement('meta')
        meta.name = name
        document.head.appendChild(meta)
    }
    meta.content = content
}

export const applyActiveBrand = () => {
    document.title = activeBrandProfile.title
    setMetaContent('keywords', activeBrandProfile.keywords)
    setMetaContent('description', activeBrandProfile.description)

    let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
    if (!faviconLink) {
        faviconLink = document.createElement('link')
        faviconLink.rel = 'icon'
        document.head.appendChild(faviconLink)
    }
    faviconLink.href = activeBrandConfig.favicon
}
