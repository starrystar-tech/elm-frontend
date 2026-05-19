import { ElMenuItem, ElSubMenu } from 'element-plus'
import { isUrl } from '@/utils/is'
import { pathResolve } from '@/utils/routerHelper'
import { useDesign } from '@/hooks/web/useDesign'
import { useRenderMenuTitle } from './useRenderMenuTitle'
import { hasOneShowingChild } from '../helper'

const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('submenu')

export const useRenderCollapseMenuItem = () => {
  const { renderMenuTitle } = useRenderMenuTitle()

  const renderMenuItem = (routers: AppRouteRecordRaw[], parentPath = '/', level = 0) => {
    return routers
      .filter((v) => !v.meta?.hidden)
      .map((v) => {
        const meta = v.meta ?? {}
        const fullPath = isUrl(v.path) ? v.path : pathResolve(parentPath, v.path)
        const { oneShowingChild, onlyOneChild } = hasOneShowingChild(v.children, v)

        if (
          oneShowingChild &&
          (!onlyOneChild?.children || onlyOneChild?.noShowingChildren) &&
          !meta?.alwaysShow
        ) {
          return (
            <ElMenuItem
              index={onlyOneChild ? pathResolve(fullPath, onlyOneChild.path) : fullPath}
            >
              {{
                default: () =>
                  renderMenuTitle(onlyOneChild ? onlyOneChild.meta ?? meta : meta, level === 0)
              }}
            </ElMenuItem>
          )
        }

        return (
          <ElSubMenu
            index={fullPath}
            teleported
            popperClass={`${prefixCls}-popper--vertical`}
          >
            {{
              title: () => renderMenuTitle(meta, level === 0),
              default: () => renderMenuItem(v.children || [], fullPath, level + 1)
            }}
          </ElSubMenu>
        )
      })
  }

  return {
    renderMenuItem
  }
}
