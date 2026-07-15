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

const ROOT_NAMES = ['中国', '全国', '全球']

const isChinaRootNode = (node: any) => ROOT_NAMES.includes(String(node?.name || '').trim())

const getProvinceCityMaxDepth = (areaTree: any[]) =>
  (areaTree || []).some((node) => isChinaRootNode(node)) ? 2 : 1

export const pruneAreaTreeToProvinceCity = (areaTree: any[]): any[] => {
  const maxDepth = getProvinceCityMaxDepth(areaTree)

  const walk = (nodes: any[], depth = 0): any[] =>
    (nodes || []).map((node) => {
      const children = Array.isArray(node?.children) ? node.children : []
      const nextChildren = depth >= maxDepth ? [] : walk(children, depth + 1)
      return {
        ...node,
        children: nextChildren,
        leaf: nextChildren.length === 0
      }
    })

  return walk(areaTree || [])
}

export const normalizeAreaIdsToProvinceCity = (selectedIds: number[], areaTree: any[]): number[] => {
  if (!selectedIds?.length) return []
  const maxDepth = getProvinceCityMaxDepth(areaTree)
  const retainedIdMap = new Map<number, number>()

  const walk = (nodes: any[], depth = 0, retainedAncestorId?: number) => {
    ;(nodes || []).forEach((node) => {
      const id = Number(node?.id)
      if (!Number.isFinite(id)) return
      const currentRetainedId = depth <= maxDepth ? id : retainedAncestorId
      if (currentRetainedId !== undefined) {
        retainedIdMap.set(id, currentRetainedId)
      }
      const children = Array.isArray(node?.children) ? node.children : []
      if (children.length) {
        walk(children, depth + 1, currentRetainedId)
      }
    })
  }

  walk(areaTree || [])

  const normalizedIds = selectedIds
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id))
    .map((id) => retainedIdMap.get(id) ?? id)

  return compactAreaIds(
    Array.from(new Set(normalizedIds)),
    pruneAreaTreeToProvinceCity(areaTree)
  )
}
