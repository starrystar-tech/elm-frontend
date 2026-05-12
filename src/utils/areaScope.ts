export const normalizeAreaIds = (selectedIds: number[], areaTree: any[]): number[] => {
  if (!selectedIds?.length) return []
  const idSet = new Set<number>(selectedIds.filter((v) => typeof v === 'number'))
  const parentMap = new Map<number, number | undefined>()

  const walk = (nodes: any[], parentId?: number) => {
    ;(nodes || []).forEach((node) => {
      const id = Number(node?.id)
      if (!Number.isNaN(id)) {
        parentMap.set(id, parentId)
      }
      if (node?.children?.length) {
        walk(node.children, id)
      }
    })
  }
  walk(areaTree || [])

  const hasSelectedDescendant = (id: number) => {
    for (const otherId of idSet) {
      if (otherId === id) continue
      let cur = parentMap.get(otherId)
      while (cur !== undefined && cur !== null) {
        if (cur === id) return true
        cur = parentMap.get(cur)
      }
    }
    return false
  }

  // 去除全国/上级地域，仅保留最细粒度
  return Array.from(idSet).filter((id) => !hasSelectedDescendant(id))
}
