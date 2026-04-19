import Table from './src/Table.vue'
import { ElTable } from 'element-plus'
import { TableColumn, TableSetProps, TableProps, Pagination, TableSlotDefault } from './src/types'
import TableSelectForm from './src/TableSelectForm.vue'

export type { TableColumn, TableSetProps, TableProps, Pagination, TableSlotDefault }

export interface TableExpose {
  setProps: (props: Recordable) => void
  setColumn: (columnProps: TableSetProps[]) => void
  addColumn: (column: TableColumn, index?: number) => void
  delColumn: (field: string) => void
  elTableRef: ComponentRef<typeof ElTable>
  clearSelection: () => void
  getSelectionRows: () => Recordable[]
  toggleRowSelection: (row: Recordable, selected?: boolean) => void
  toggleAllSelection: () => void
  toggleRowExpansion: (row: Recordable, expanded?: boolean) => void
  setCurrentRow: (row?: Recordable) => void
  clearSort: () => void
  sort: (prop: string, order: 'ascending' | 'descending') => void
  doLayout: () => void
}

export { Table, TableSelectForm }
