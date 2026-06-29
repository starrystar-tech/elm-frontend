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

export const compactAreaIds = (selectedIds: number[], areaTree: any[]): number[] => {
  if (!selectedIds?.length) return []
  const idSet = new Set<number>(selectedIds.filter((v) => typeof v === 'number'))
  if (idSet.has(-1)) {
    return [-1]
  }

  const walkNode = (node: any): { ids: number[]; covered: boolean } => {
    const id = Number(node?.id)
    if (Number.isNaN(id)) {
      return { ids: [], covered: false }
    }

    const children = Array.isArray(node?.children) ? node.children : []
    if (!children.length) {
      return {
        ids: idSet.has(id) ? [id] : [],
        covered: idSet.has(id)
      }
    }

    if (idSet.has(id)) {
      return { ids: [id], covered: true }
    }

    const childStates = children.map((child) => walkNode(child))
    const visibleChildIds = childStates.flatMap((item) => item.ids).filter((childId) => childId !== -1)
    const coveredChildren = childStates.filter((item) => item.ids.length > 0)
    const allChildrenCovered = childStates.length > 0 && childStates.every((item) => item.covered)

    if (allChildrenCovered && coveredChildren.length > 0) {
      return { ids: [id], covered: true }
    }

    return {
      ids: visibleChildIds,
      covered: false
    }
  }

  return Array.from(new Set((areaTree || []).flatMap((node) => walkNode(node).ids)))
}
