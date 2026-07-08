import request from '@/config/axios'

export interface CrmCluePoolShareRuleRespVO {
    id: number
    ownerDeptId: number
    ownerDeptName: string
    status: number
    seaType: number
    sharedDeptIds: number[]
    sharedDeptNames: string[]
    clueSourceIds: number[]
    clueSourceNames: string[]
    consultProjectIds: number[]
    consultProjectNames: string[]
    areaIds: number[]
    areaNames: string[]
    updater: string
    updaterName: string
    updateTime: string
    createTime: string
}

export interface CrmCluePoolShareRulePageReqVO {
    pageNo?: number
    pageSize?: number
    ownerDeptId?: number
    sharedDeptId?: number
    seaType?: number
    consultProjectId?: number
    clueSourceId?: number
    areaId?: number
}

export interface CrmCluePoolShareRuleCreateReqVO {
    ownerDeptIds: number[]
    status: number
    seaTypes: number[]
    sharedDeptIds: number[]
    clueSourceIds?: number[]
    consultProjectIds?: number[]
    areaIds?: number[]
}

export interface CrmCluePoolShareRuleUpdateReqVO {
    id: number
    ownerDeptId?: number
    ownerDeptIds: number[]
    seaType?: number
    seaTypes: number[]
    sharedDeptIds: number[]
    status?: number
    clueSourceIds?: number[]
    consultProjectIds?: number[]
    areaIds?: number[]
}

export interface CrmCluePoolShareRuleUpdateStatusReqVO {
    id: number
    status: number
}

export const getCluePoolShareRulePage = async (params: CrmCluePoolShareRulePageReqVO) => {
    return await request.get({ url: '/crm/clue-pool-share-rule/page', params })
}

export const createCluePoolShareRule = async (data: CrmCluePoolShareRuleCreateReqVO) => {
    return await request.post({ url: '/crm/clue-pool-share-rule/create', data })
}

export const updateCluePoolShareRule = async (data: CrmCluePoolShareRuleUpdateReqVO) => {
    return await request.put({ url: '/crm/clue-pool-share-rule/update', data })
}

export const deleteCluePoolShareRule = async (id: number) => {
    return await request.delete({ url: '/crm/clue-pool-share-rule/delete', params: { id } })
}

export const updateCluePoolShareRuleStatus = async (data: CrmCluePoolShareRuleUpdateStatusReqVO) => {
    return await request.put({ url: '/crm/clue-pool-share-rule/update-status', data })
}

export const getCluePoolShareRule = async (id: number) => {
    return await request.get({ url: '/crm/clue-pool-share-rule/get', params: { id } })
}
