import type { Ref } from 'vue'
import type { FormSchema } from '@/types/form'
import type { DeptVO } from '@/api/system/dept'
import * as AreaApi from '@/api/system/area'
import * as UserApi from '@/api/system/user'
import * as DeptApi from '@/api/system/dept'
import * as ClueSourceApi from '@/api/system/clueSource'
import * as TagGroupApi from '@/api/system/tag-group'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

export interface LabelValueOption {
  label: string
  value: number | string
}

export interface AreaOption extends LabelValueOption {
  value: number
}

export interface UserOption extends LabelValueOption {
  value: number
  deptId?: number
}

export const INTENT_LEVEL_OPTIONS: LabelValueOption[] = [
  ...getIntDictOptions(DICT_TYPE.CRM_CLUE_INTENT_LEVEL)
]

export const FEEDBACK_STATUS_OPTIONS: LabelValueOption[] = [
  ...getIntDictOptions(DICT_TYPE.CRM_CLUE_FEEDBACK_STATUS)
]

export const ALLOCATION_TYPE_OPTIONS: LabelValueOption[] = [
  { label: '自动分配', value: 1 },
  { label: '手动分配', value: 2 },
  { label: '自己创建', value: 3 },
  { label: '公海领取', value: 4 },
  { label: '主管调配', value: 5 },
  { label: '无效再分配', value: 6 },
  { label: '批量分配', value: 7 },
  { label: '复购系统分配', value: 8 }
]

export const PUBLIC_SEA_TABS = [
  { label: '首咨公海', value: 1, countField: 'firstConsultCount' },
  { label: '复购公海', value: 2, countField: 'repurchaseCount' }
] as const

export const CUSTOMER_TABS = [
  { label: '首资', value: 'FIRST', countField: 'firstCount' },
  { label: '公海', value: 'SEA', countField: 'seaCount' },
  { label: '复购客户', value: 'REPURCHASE', countField: 'repurchaseCount' },
  { label: '待回访', value: 'WAIT_RETURN', countField: 'waitReturnCount' },
  { label: '已回访', value: 'RETURNED', countField: 'returnedCount' }
] as const

export const flattenAreas = (nodes: any[] = [], parents: string[] = []): AreaOption[] => {
  return nodes.flatMap((node) => {
    const path = [...parents, node.name]
    const current = node.id ? [{ label: path.join(' / '), value: Number(node.id) }] : []
    return current.concat(flattenAreas(node.children || [], path))
  })
}

export const updateSchemaOptions = (schema: FormSchema[], field: string, options: LabelValueOption[]) => {
  const target = schema.find((item) => item.field === field)
  if (target?.componentProps) {
    target.componentProps.options = options
  }
}

export const buildAreaLabel = (row: {
  province?: string
  city?: string
  district?: string
  areaName?: string
}) => {
  const regions = [row.province, row.city, row.district].filter(Boolean)
  return regions.length ? regions.join(' / ') : row.areaName || '--'
}

interface LoadClueListOptionsArgs {
  schema: FormSchema[]
  areaOptions: Ref<AreaOption[]>
  userOptions: Ref<UserOption[]>
  clueSourceOptions: Ref<LabelValueOption[]>
  tagOptions?: Ref<LabelValueOption[]>
  deptOptions?: Ref<DeptVO[]>
  ownerFields?: string[]
}

export const loadClueListOptions = async ({
  schema,
  areaOptions,
  userOptions,
  projectOptions,
  clueSourceOptions,
  tagOptions,
  deptOptions,
  ownerFields = ['currentOwnerId', 'ownerId']
}: LoadClueListOptionsArgs) => {
  const [areas, users, depts, sources, tagGroups] = await Promise.all([
    AreaApi.getAreaTree(),
    UserApi.getSimpleUserList(),
    deptOptions ? DeptApi.getSimpleDeptList() : Promise.resolve([]),
    ClueSourceApi.getEnabledClueSourceList(),
    tagOptions ? TagGroupApi.getTagGroupList() : Promise.resolve([])
  ])

  areaOptions.value = flattenAreas(areas || [])
  userOptions.value = (users || []).map((item) => ({
    label: item.nickname || item.username,
    value: item.id,
    deptId: item.deptId
  }))
  clueSourceOptions.value = (sources || []).map((item) => ({
    label: item.name,
    value: Number(item.id)
  }))

  if (deptOptions) {
    deptOptions.value = depts || []
  }

  if (tagOptions) {
    tagOptions.value = (tagGroups || []).flatMap((group) =>
      (group.tags || []).map((tag) => ({
        label: `${group.name} / ${tag.name}`,
        value: Number(tag.id)
      }))
    )
  }

  updateSchemaOptions(schema, 'areaId', areaOptions.value)
  updateSchemaOptions(schema, 'clueSourceId', clueSourceOptions.value)
  updateSchemaOptions(schema, 'tagId', tagOptions?.value || [])
  ownerFields.forEach((field) => updateSchemaOptions(schema, field, userOptions.value))
}
