import { getStrDictOptions, type StringDictDataType } from '@/utils/dict'

export const CRM_PRODUCT_CHANNEL_DICT = 'crm_product_channel'

export const PRODUCT_SETTLEMENT_TYPE_OPTIONS = [
    { label: '固定金额结算', value: 1 },
    { label: '按比例结算', value: 2 }
]

export const PRODUCT_SHELF_TYPE_OPTIONS = [
    { label: '立即上架', value: 1 },
    { label: '暂不上架', value: 2 },
    { label: '定时上架', value: 3 }
]

export const getProductChannelOptions = (): StringDictDataType[] => {
    return getStrDictOptions(CRM_PRODUCT_CHANNEL_DICT)
}

export const formatSettlementValue = (settlementType?: number, settlementValue?: number | null) => {
    if (settlementValue === undefined || settlementValue === null) return '-'
    if (settlementType === 2) {
        return `${(settlementValue / 100).toFixed(2)}%`
    }
    return `${(settlementValue / 100).toFixed(2)} 元`
}

export const getShelfTypeLabel = (value?: number) => {
    return PRODUCT_SHELF_TYPE_OPTIONS.find((item) => item.value === value)?.label || '-'
}

export const getSettlementTypeLabel = (value?: number) => {
    return PRODUCT_SETTLEMENT_TYPE_OPTIONS.find((item) => item.value === value)?.label || '-'
}
