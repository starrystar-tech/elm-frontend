import { isUrl } from '@/utils/is'
import { useRenderMenuTitle } from './useRenderMenuTitle'
import { pathResolve } from '@/utils/routerHelper'
import { useI18n } from '@/hooks/web/useI18n'
import { Icon } from '@/components/Icon'
import { hasOneShowingChild } from '../helper'

// 扁平化多层菜单到第二层
const flattenMenuItems = (
  children: AppRouteRecordRaw[] = [],
  parentPath: string
): Array<{ item: AppRouteRecordRaw; path: string; group?: string }> => {
  const result: Array<{
    item: AppRouteRecordRaw
    path: string
    group?: string
  }> = []

  children
    .filter((v) => !v.meta?.hidden)
    .forEach((v) => {
      const fullPath = isUrl(v.path) ? v.path : pathResolve(parentPath, v.path)

      // 如果当前项有子菜单，递归扁平化
      if (v.children && v.children.length > 0) {
        const groupTitle = v.meta?.title || ''
        v.children
          .filter((child) => !child.meta?.hidden)
          .forEach((child) => {
            const childPath = isUrl(child.path) ? child.path : pathResolve(fullPath, child.path)

            // 如果子项还有子菜单，继续扁平化
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
        // 没有子菜单，直接添加
        result.push({
          item: v,
          path: fullPath
        })
      }
    })

  return result
}

export const useRenderMenuItem = () => {
  const { renderMenuTitle } = useRenderMenuTitle()
  const { t } = useI18n()

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

    // 第一层：如果第一层有菜单项（没有子菜单），需要收集起来以两列显示
    if (level === 0) {
      const firstLevelItems: Array<{ item: AppRouteRecordRaw; path: string }> = []
      const firstLevelSubmenus: Array<{
        item: AppRouteRecordRaw
        path: string
      }> = []

      filteredRouters.forEach((v) => {
        const meta = v.meta ?? {}
        const fullPath = isUrl(v.path) ? v.path : pathResolve(parentPath, v.path)

        // 使用之前的过滤逻辑
        const { oneShowingChild, onlyOneChild } = hasOneShowingChild(v.children, v)

        if (
          oneShowingChild &&
          (!onlyOneChild?.children || onlyOneChild?.noShowingChildren) &&
          !meta?.alwaysShow
        ) {
          // 只有一个子菜单项，直接显示子菜单项，不设置上级目录
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
          // 有多个子菜单项或设置了 alwaysShow，作为可折叠目录
          firstLevelSubmenus.push({ item: v, path: fullPath })
        } else {
          // 没有子菜单，直接显示
          firstLevelItems.push({ item: v, path: fullPath })
        }
      })

      const result: any[] = []

      // 先渲染第一层的菜单项（单行显示，不是两列）
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

      // 再渲染第一层的子菜单（可折叠）
      firstLevelSubmenus.forEach(({ item, path }) => {
        const meta = item.meta ?? {}
        const isActive = activePath === path || activePath.startsWith(path + '/')
        const isOpened = openedMenus.has(path)

        // 扁平化所有子菜单到第二层
        const flatItems = flattenMenuItems(item.children, path)

        // 按分组组织菜单项
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

        // 渲染第二层菜单项（不可折叠，直接显示）
        const renderSecondLevelItems = () => {
          const items: any[] = []
          let hasRenderedItems = false

          // 判断是否是目录（有子菜单的项）
          const isDirectory = (item: AppRouteRecordRaw) => {
            return item.children && item.children.length > 0
          }

          // 先渲染未分组的项（两列显示）
          const menuItems: Array<{ item: AppRouteRecordRaw; path: string }> = []
          const directories: Array<{
            item: AppRouteRecordRaw
            path: string
            title: string
          }> = []

          ungroupedItems.forEach(({ item, path }) => {
            if (isDirectory(item)) {
              directories.push({ item, path, title: item.meta?.title || '' })
            } else {
              menuItems.push({ item, path })
            }
          })

          // 渲染菜单项（两列显示）
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

          // 渲染目录（分割线显示，其子菜单以两列显示）
          directories.forEach(({ item, path, title }) => {
            if (hasRenderedItems) {
              items.push(
                <div key={`divider-${path}`} class="v-menu-divider">
                  <span class="v-menu-divider-text">{t(title as string)}</span>
                </div>
              )
            }

            // 渲染目录的子菜单（两列显示）
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

          // 渲染分组的项（带分割线）
          groupedItems.forEach((groupItems, groupTitle) => {
            // 只要有分组项，就显示分隔线（包括第一个分组）
            if (groupItems.length > 0) {
              items.push(
                <div key={`divider-${groupTitle}`} class="v-menu-divider">
                  <span class="v-menu-divider-text">{t(groupTitle as string)}</span>
                </div>
              )
            }

            // 将分组内的菜单项按两列显示
            const groupMenuItems: Array<{
              item: AppRouteRecordRaw
              path: string
            }> = []
            const groupDirectories: Array<{
              item: AppRouteRecordRaw
              path: string
              title: string
            }> = []

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

            // 渲染分组内的菜单项（两列显示）
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

            // 渲染分组内的目录（分割线显示，其子菜单以两列显示）
            groupDirectories.forEach(({ item, path, title }) => {
              items.push(
                <div key={`divider-${path}`} class="v-menu-divider">
                  <span class="v-menu-divider-text">{t(title as string)}</span>
                </div>
              )

              // 渲染目录的子菜单（两列显示）
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

        result.push(
          <div
            key={path}
            class={['v-menu-submenu', { 'is-opened': isOpened, 'is-active': isActive }]}
          >
            <div class="v-menu-submenu-title" onClick={() => onToggleMenu(path)}>
              {renderMenuTitle(meta)}
              <Icon
                icon="ep:arrow-down"
                class={['v-menu-submenu-icon', { 'is-opened': isOpened }]}
              />
            </div>
            {isOpened && <div class="v-menu-submenu-content">{renderSecondLevelItems()}</div>}
          </div>
        )
      })

      return result
    } else {
      // 非第一层，使用原来的逻辑
      return filteredRouters.map((v) => {
        const meta = v.meta ?? {}
        const fullPath = isUrl(v.path) ? v.path : pathResolve(parentPath, v.path)
        const isActive = activePath === fullPath || activePath.startsWith(fullPath + '/')

        // 没有子菜单或者是叶子节点，使用普通菜单项
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
  }

  return {
    renderMenuItem
  }
}
