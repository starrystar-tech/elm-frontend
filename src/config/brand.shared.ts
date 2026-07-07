export type BrandKey = 'baigu' | 'gaogu'
export const DEFAULT_BRAND_KEY: BrandKey = 'baigu'
export const BRAND_KEYS = ['baigu', 'gaogu'] as const

export interface BrandProfile {
    key: BrandKey
    title: string
    tenantName: string
    loginSubtitle?: string
    keywords: string
    description: string
    copyrightLines: string[]
}

export const BRAND_PROFILE_CONFIGS: Record<BrandKey, BrandProfile> = {
    baigu: {
        key: 'baigu',
        title: '百谷科技',
        tenantName: '百谷科技',
        keywords: '百谷科技 外呼系统 一站式企业信息化管理系统 CRM SCRM',
        description: '百谷科技 一站式企业信息化管理系统',
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
        keywords: '高谷教育 外呼系统 一站式企业信息化管理系统 CRM SCRM',
        description: '高谷教育 一站式企业信息化管理系统',
        copyrightLines: [
            'Copyright © 2025-2026 fx01.cn. All Rights Reserved',
            '武汉高谷教育科技有限责任公司版权所有 鄂ICP备2026033584号'
        ]
    }
}

const normalizeBrandKey = (value?: string | null) => String(value || '').trim().toLowerCase()

export const isBrandKey = (value?: string | null): value is BrandKey =>
    (BRAND_KEYS as readonly string[]).includes(normalizeBrandKey(value))

export const resolveBrandKey = (value?: string | null): BrandKey => {
    const normalizedBrandKey = normalizeBrandKey(value)
    return isBrandKey(normalizedBrandKey) ? normalizedBrandKey : DEFAULT_BRAND_KEY
}
