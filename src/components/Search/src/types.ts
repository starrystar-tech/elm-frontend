import { FormSchema } from '@/types/form'

export type SearchProps = {
  schema?: FormSchema[]
  isCol?: boolean
  labelWidth?: string | number
  layout?: 'inline' | 'bottom'
  buttonPosition?: 'left' | 'center' | 'right'
  showSearch?: boolean
  showReset?: boolean
  showExpand?: boolean
  expand?: boolean
  expandField?: string
  inline?: boolean
  removeNoValueItem?: boolean
  model?: Recordable
  searchLoading?: boolean
  resetLoading?: boolean
}
