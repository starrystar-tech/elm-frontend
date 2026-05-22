import request from '@/config/axios'

export const HEADTEACHER_SCOPE_TYPE = {
    ALL: 'ALL',
    DEPT: 'DEPT',
    AREA: 'AREA'
} as const

export type HeadteacherScopeType =
    (typeof HEADTEACHER_SCOPE_TYPE)[keyof typeof HEADTEACHER_SCOPE_TYPE]

export interface HeadteacherAllocationPageReqVO extends PageParam {
    projectId?: number
    headteacherUserId?: number
    scopeType?: HeadteacherScopeType
}

export interface HeadteacherAllocationSaveReqVO {
    id?: number
    projectId?: number
    headteacherUserId?: number
    scopeType: HeadteacherScopeType
    scopeValueIds: number[]
}

export interface HeadteacherAllocationRespVO {
    id: number
    projectId: number
    projectName?: string
    headteacherUserId: number
    headteacherName?: string
    scopeType: HeadteacherScopeType
    scopeTypeName?: string
    scopeValueIds: number[]
    scopeValueNames?: string[]
    scopeValueDisplay?: string
    updater?: string
    updaterName?: string
    updateTime?: string
    createTime?: string
}

export interface HeadteacherUserSimpleVO {
    id: number
    nickname: string
    username: string
    deptId?: number
    deptName?: string
}

export const getHeadteacherAllocationPage = (params: HeadteacherAllocationPageReqVO) => {
    return request.get({ url: '/crm/headteacher/page', params })
}

export const getHeadteacherAllocation = (id: number) => {
    return request.get<HeadteacherAllocationRespVO>({ url: '/crm/headteacher/get', params: { id } })
}

export const getHeadteacherSimpleList = () => {
    return request.get<HeadteacherUserSimpleVO[]>({ url: '/crm/headteacher/simple-list' })
}

export const createHeadteacherAllocation = (data: HeadteacherAllocationSaveReqVO) => {
    return request.post({ url: '/crm/headteacher/create', data })
}

export const updateHeadteacherAllocation = (data: HeadteacherAllocationSaveReqVO) => {
    return request.put({ url: '/crm/headteacher/update', data })
}

export const deleteHeadteacherAllocation = (id: number) => {
    return request.delete({ url: '/crm/headteacher/delete', params: { id } })
}
