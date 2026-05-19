import { Icon } from '@/components/Icon'
import { useI18n } from '@/hooks/web/useI18n'
import { isUrl } from '@/utils/is'
import { pathResolve } from '@/utils/routerHelper'
import { useRenderMenuTitle } from './useRenderMenuTitle'
import { hasOneShowingChild } from '../helper'

type MenuRouteNode = {
  item: AppRouteRecordRaw
  path: string
  group?: string
}

const flattenMenuItems = (children: AppRouteRecordRaw[] = [], parentPath: string): MenuRouteNode[] => {
  const result: MenuRouteNode[] = []

  children
    .filter((v) => !v.meta?.hidden)
    .forEach((v) => {
      const fullPath = isUrl(v.path) ? v.path : pathResolve(parentPath, v.path)

      if (v.children && v.children.length > 0) {
        const groupTitle = v.meta?.title || ''
        v.children
          .filter((child) => !child.meta?.hidden)
          .forEach((child) => {
            const childPath = isUrl(child.path) ? child.path : pathResolve(fullPath, child.path)

            if (child.children && child.children.length > 0) {
              child.children
                .filter((grandChild) => !grandChild.meta?.hidden)
                .forEach((grandChild) => {
                  const grandChildPath = isUrl(grandChild.path)
                    ? grandChild.path
                    : pathResolve(childPath, grandChild.path)
                  result.push({
                    item: grandChild,
                    path: grandChildPath,
                    group: groupTitle
                  })
                })
            } else {
              result.push({
                item: child,
                path: childPath,
                group: groupTitle
              })
            }
          })
      } else {
        result.push({
          item: v,
          path: fullPath
        })
      }
    })

  return result
}

const isDirectory = (item: AppRouteRecordRaw) => {
  return !!(item.children && item.children.length > 0)
}

const buildFirstLevelNodes = (routers: AppRouteRecordRaw[], parentPath: string) => {
  const firstLevelItems: Array<{ item: AppRouteRecordRaw; path: string }> = []
  const firstLevelSubmenus: Array<{ item: AppRouteRecordRaw; path: string }> = []

  routers.forEach((v) => {
    const meta = v.meta ?? {}
    const fullPath = isUrl(v.path) ? v.path : pathResolve(parentPath, v.path)
    const { oneShowingChild, onlyOneChild } = hasOneShowingChild(v.children, v)

    if (
      oneShowingChild &&
      (!onlyOneChild?.children || onlyOneChild?.noShowingChildren) &&
      !meta?.alwaysShow
    ) {
      if (onlyOneChild) {
        const childPath = onlyOneChild.path
          ? isUrl(onlyOneChild.path)
            ? onlyOneChild.path
            : pathResolve(fullPath, onlyOneChild.path)
          : fullPath
        firstLevelItems.push({ item: onlyOneChild, path: childPath })
      } else {
        firstLevelItems.push({ item: v, path: fullPath })
      }
    } else if (v.children && v.children.length > 0) {
      firstLevelSubmenus.push({ item: v, path: fullPath })
    } else {
      firstLevelItems.push({ item: v, path: fullPath })
    }
  })

  return {
    firstLevelItems,
    firstLevelSubmenus
  }
}

const buildFlatMenuGroups = (item: AppRouteRecordRaw, path: string) => {
  const flatItems = flattenMenuItems(item.children, path)
  const groupedItems = new Map<string, Array<{ item: AppRouteRecordRaw; path: string }>>()
  const ungroupedItems: Array<{ item: AppRouteRecordRaw; path: string }> = []

  flatItems.forEach(({ item, path, group }) => {
    if (group) {
      if (!groupedItems.has(group)) {
        groupedItems.set(group, [])
      }
      groupedItems.get(group)!.push({ item, path })
    } else {
      ungroupedItems.push({ item, path })
    }
  })

  return {
    groupedItems,
    ungroupedItems
  }
}

export const useRenderMenuItem = () => {
  const { renderMenuTitle } = useRenderMenuTitle()
  const { t } = useI18n()

  const renderExpandedSecondLevelItems = (
    item: AppRouteRecordRaw,
    path: string,
    activePath: string,
    onMenuClick: (path: string) => void
  ) => {
    const { groupedItems, ungroupedItems } = buildFlatMenuGroups(item, path)
    const items: any[] = []
    let hasRenderedItems = false

    const menuItems: Array<{ item: AppRouteRecordRaw; path: string }> = []
    const directories: Array<{ item: AppRouteRecordRaw; path: string; title: string }> = []

    ungroupedItems.forEach(({ item, path }) => {
      if (isDirectory(item)) {
        directories.push({ item, path, title: item.meta?.title || '' })
      } else {
        menuItems.push({ item, path })
      }
    })

    for (let i = 0; i < menuItems.length; i += 2) {
      const pair = menuItems.slice(i, i + 2)
      items.push(
        <div key={`menu-row-${i}`} class="v-menu-row">
          {pair.map(({ item, path }) => {
            const itemIsActive = activePath === path || activePath.startsWith(path + '/')
            return (
              <div
                key={path}
                class={['v-menu-item', { 'is-active': itemIsActive }]}
                onClick={() => onMenuClick(path)}
              >
                {renderMenuTitle(item.meta ?? {}, false)}
              </div>
            )
          })}
          {pair.length === 1 && <div class="v-menu-item-placeholder"></div>}
        </div>
      )
      hasRenderedItems = true
    }

    directories.forEach(({ item, path, title }) => {
      if (hasRenderedItems) {
        items.push(
          <div key={`divider-${path}`} class="v-menu-divider">
            <span class="v-menu-divider-text">{t(title as string)}</span>
          </div>
        )
      }

      if (item.children && item.children.length > 0) {
        const dirChildren = flattenMenuItems(item.children, path)
        const dirMenuItems = dirChildren
          .filter(({ item: childItem }) => !isDirectory(childItem))
          .map(({ item: childItem, path: childPath }) => ({
            item: childItem,
            path: childPath
          }))

        for (let i = 0; i < dirMenuItems.length; i += 2) {
          const pair = dirMenuItems.slice(i, i + 2)
          items.push(
            <div key={`dir-menu-row-${path}-${i}`} class="v-menu-row">
              {pair.map(({ item: childItem, path: childPath }) => {
                const itemIsActive =
                  activePath === childPath || activePath.startsWith(childPath + '/')
                return (
                  <div
                    key={childPath}
                    class={['v-menu-item', { 'is-active': itemIsActive }]}
                    onClick={() => onMenuClick(childPath)}
                  >
                    {renderMenuTitle(childItem.meta ?? {}, false)}
                  </div>
                )
              })}
              {pair.length === 1 && <div class="v-menu-item-placeholder"></div>}
            </div>
          )
        }
      }

      hasRenderedItems = true
    })

    groupedItems.forEach((groupItems, groupTitle) => {
      if (groupItems.length > 0) {
        items.push(
          <div key={`divider-${groupTitle}`} class="v-menu-divider">
            <span class="v-menu-divider-text">{t(groupTitle as string)}</span>
          </div>
        )
      }

      const groupMenuItems: Array<{ item: AppRouteRecordRaw; path: string }> = []
      const groupDirectories: Array<{ item: AppRouteRecordRaw; path: string; title: string }> = []

      groupItems.forEach(({ item, path }) => {
        if (isDirectory(item)) {
          groupDirectories.push({
            item,
            path,
            title: item.meta?.title || ''
          })
        } else {
          groupMenuItems.push({ item, path })
        }
      })

      for (let i = 0; i < groupMenuItems.length; i += 2) {
        const pair = groupMenuItems.slice(i, i + 2)
        items.push(
          <div key={`group-menu-row-${groupTitle}-${i}`} class="v-menu-row">
            {pair.map(({ item, path }) => {
              const itemIsActive = activePath === path || activePath.startsWith(path + '/')
              return (
                <div
                  key={path}
                  class={['v-menu-item', { 'is-active': itemIsActive }]}
                  onClick={() => onMenuClick(path)}
                >
                  {renderMenuTitle(item.meta ?? {}, false)}
                </div>
              )
            })}
            {pair.length === 1 && <div class="v-menu-item-placeholder"></div>}
          </div>
        )
        hasRenderedItems = true
      }

      groupDirectories.forEach(({ item, path, title }) => {
        items.push(
          <div key={`divider-${path}`} class="v-menu-divider">
            <span class="v-menu-divider-text">{t(title as string)}</span>
          </div>
        )

        if (item.children && item.children.length > 0) {
          const dirChildren = flattenMenuItems(item.children, path)
          const dirMenuItems = dirChildren
            .filter(({ item: childItem }) => !isDirectory(childItem))
            .map(({ item: childItem, path: childPath }) => ({
              item: childItem,
              path: childPath
            }))

          for (let i = 0; i < dirMenuItems.length; i += 2) {
            const pair = dirMenuItems.slice(i, i + 2)
            items.push(
              <div key={`group-dir-menu-row-${path}-${i}`} class="v-menu-row">
                {pair.map(({ item: childItem, path: childPath }) => {
                  const itemIsActive =
                    activePath === childPath || activePath.startsWith(childPath + '/')
                  return (
                    <div
                      key={childPath}
                      class={['v-menu-item', { 'is-active': itemIsActive }]}
                      onClick={() => onMenuClick(childPath)}
                    >
                      {renderMenuTitle(childItem.meta ?? {}, false)}
                    </div>
                  )
                })}
                {pair.length === 1 && <div class="v-menu-item-placeholder"></div>}
              </div>
            )
          }
        }

        hasRenderedItems = true
      })
    })

    return items
  }

  const renderMenuItem = (
    routers: AppRouteRecordRaw[],
    parentPath = '/',
    level = 0,
    openedMenus: Set<string>,
    activePath: string,
    onMenuClick: (path: string) => void,
    onToggleMenu: (path: string) => void
  ) => {
    const filteredRouters = routers.filter((v) => !v.meta?.hidden)

    if (level === 0) {
      const { firstLevelItems, firstLevelSubmenus } = buildFirstLevelNodes(filteredRouters, parentPath)
      const result: any[] = []

      firstLevelItems.forEach(({ item, path }) => {
        const itemIsActive = activePath === path || activePath.startsWith(path + '/')
        result.push(
          <div
            key={path}
            class={['v-menu-item', 'v-menu-item-first-level', { 'is-active': itemIsActive }]}
            onClick={() => onMenuClick(path)}
          >
            {renderMenuTitle(item.meta ?? {})}
          </div>
        )
      })

      firstLevelSubmenus.forEach(({ item, path }) => {
        const meta = item.meta ?? {}
        const isActive = activePath === path || activePath.startsWith(path + '/')
        const isOpened = openedMenus.has(path)

        result.push(
          <div key={path} class={['v-menu-submenu', { 'is-opened': isOpened, 'is-active': isActive }]}>
            <div class="v-menu-submenu-title" onClick={() => onToggleMenu(path)}>
              {renderMenuTitle(meta)}
              <Icon
                icon="ep:arrow-down"
                class={['v-menu-submenu-icon', { 'is-opened': isOpened }]}
              />
            </div>
            {isOpened && (
              <div class="v-menu-submenu-content">
                {renderExpandedSecondLevelItems(item, path, activePath, onMenuClick)}
              </div>
            )}
          </div>
        )
      })

      return result
    }

    return filteredRouters.map((v) => {
      const meta = v.meta ?? {}
      const fullPath = isUrl(v.path) ? v.path : pathResolve(parentPath, v.path)
      const isActive = activePath === fullPath || activePath.startsWith(fullPath + '/')

      if (!v.children || v.children.length === 0) {
        return (
          <div
            key={fullPath}
            class={['v-menu-item', { 'is-active': isActive }]}
            onClick={() => onMenuClick(fullPath)}
          >
            {renderMenuTitle(meta)}
          </div>
        )
      }
    })
  }

  return {
    renderMenuItem
  }
}
