<script lang="tsx">
import { PropType, ref, watch } from 'vue'
import { ElScrollbar } from 'element-plus'
import { useAppStore } from '@/store/modules/app'
import { usePermissionStore } from '@/store/modules/permission'
import { useRenderMenuItem } from './components/useRenderMenuItem'
import { isUrl } from '@/utils/is'
import { useDesign } from '@/hooks/web/useDesign'
import { pathResolve } from '@/utils/routerHelper'
import { hasOneShowingChild } from './helper'
import { LayoutType } from '@/types/layout'

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('menu')

export default defineComponent({
  // eslint-disable-next-line vue/no-reserved-component-names
  name: 'Menu',
  props: {
    menuSelect: {
      type: Function as PropType<(index: string) => void>,
      default: undefined
    }
  },
  setup(props) {
    const appStore = useAppStore()

    const layout = computed(() => appStore.getLayout)

    const { push, currentRoute } = useRouter()

    const permissionStore = usePermissionStore()

    const menuMode = computed((): 'vertical' | 'horizontal' => {
      // 竖
      const vertical: LayoutType[] = ['classic', 'topLeft', 'cutMenu']

      if (vertical.includes(unref(layout))) {
        return 'vertical'
      } else {
        return 'horizontal'
      }
    })

    const routers = computed(() =>
      unref(layout) === 'cutMenu' ? permissionStore.getMenuTabRouters : permissionStore.getRouters
    )

    const collapse = computed(() => appStore.getCollapse)

    const activeMenu = computed(() => {
      const { meta, path } = unref(currentRoute)
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return meta.activeMenu as string
      }
      return path
    })

    // 管理展开的菜单
    const openedMenus = ref<Set<string>>(new Set())

    // 收集所有可折叠子菜单的 path，用于默认全部展开
    const getDefaultOpenedPaths = (routers: AppRouteRecordRaw[], parentPath = '/'): Set<string> => {
      const set = new Set<string>()
      const filtered = (routers || []).filter((v) => !v.meta?.hidden)
      filtered.forEach((v) => {
        const meta = v.meta ?? {}
        const fullPath = isUrl(v.path) ? v.path : pathResolve(parentPath, v.path)
        const { oneShowingChild, onlyOneChild } = hasOneShowingChild(v.children, v)
        const isExpandableSubmenu =
          v.children &&
          v.children.length > 0 &&
          !(
            oneShowingChild &&
            (!onlyOneChild?.children || onlyOneChild?.noShowingChildren) &&
            !meta?.alwaysShow
          )
        if (isExpandableSubmenu) {
          set.add(fullPath)
        }
      })
      return set
    }

    // 默认全部展开：路由就绪时将所有可折叠子菜单加入 openedMenus
    watch(
      () => unref(routers),
      (newRouters) => {
        if (newRouters?.length) {
          const paths = getDefaultOpenedPaths(newRouters)
          paths.forEach((p) => openedMenus.value.add(p))
        }
      },
      { immediate: true }
    )

    // 初始化时，展开当前路由所在的菜单
    watch(
      () => activeMenu.value,
      (path) => {
        if (path) {
          const pathParts = path.split('/').filter(Boolean)
          let currentPath = ''
          pathParts.forEach((part) => {
            currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`
            openedMenus.value.add(currentPath)
          })
        }
      },
      { immediate: true }
    )

    const menuSelect = (index: string) => {
      if (props.menuSelect) {
        props.menuSelect(index)
      }
      // 自定义事件
      if (isUrl(index)) {
        window.open(index)
      } else {
        push(index)
      }
    }

    const toggleMenu = (path: string) => {
      if (openedMenus.value.has(path)) {
        openedMenus.value.delete(path)
      } else {
        openedMenus.value.add(path)
      }
    }

    const renderMenuWrap = () => {
      if (unref(layout) === 'top') {
        return renderMenu()
      } else {
        return <ElScrollbar>{renderMenu()}</ElScrollbar>
      }
    }

    const renderMenu = () => {
      const { renderMenuItem } = useRenderMenuItem()
      return (
        <div class="v-menu-list">
          {renderMenuItem(
            unref(routers),
            '/',
            0,
            openedMenus.value,
            activeMenu.value,
            menuSelect,
            toggleMenu
          )}
        </div>
      )
    }

    return () => (
      <div
        id={prefixCls}
        class={[
          `${prefixCls} ${prefixCls}__${unref(menuMode)}`,
          'h-[100%] overflow-hidden flex-col flex-shrink-0 bg-[var(--left-menu-bg-color)]',
          {
            'w-[var(--left-menu-min-width)]': unref(collapse) && unref(layout) !== 'cutMenu',
            'w-[var(--left-menu-max-width)]': !unref(collapse) && unref(layout) !== 'cutMenu'
          }
        ]}
      >
        {renderMenuWrap()}
      </div>
    )
  }
})
</script>

<style lang="scss" scoped>
$prefix-cls: #{$namespace}-menu;

.#{$prefix-cls} {
  position: relative;
  transition: width var(--transition-time-02);
  background: var(--left-menu-bg-color);
  border-right: 1px solid #efefef;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.01);

  .v-menu-list {
    width: 100%;
    padding: 8px 0 16px;
  }

  // 一级菜单项（可折叠）
  .v-menu-submenu {
    width: 100%;
    border-bottom: 1px solid #f3f3f3;

    .v-menu-submenu-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 50px;
      color: #666;
      font-size: 14px;
      line-height: 20px;
      cursor: pointer;
      transition: all var(--transition-time-02);
      position: relative;
      width: 100%;
      margin-bottom: 0;
      padding: 14px 18px;
      font-weight: 500;
      gap: 10px;

      &:hover {
        color: #444 !important;
        background-color: #fafafa !important;
      }

      .v-menu-submenu-icon {
        transition: transform var(--transition-time-02);
        font-size: 12px;
        margin-left: auto;
        flex-shrink: 0;
        color: #8f8f8f;

        &.is-opened {
          transform: rotate(180deg);
        }
      }

      :deep(.app-iconify) {
        width: 15px;
        min-width: 15px;
        font-size: 15px;
        color: #666;
      }
    }

    &.is-active {
      .v-menu-submenu-title {
        color: #4a4a4a !important;
      }
    }

    &.is-opened {
      .v-menu-submenu-title {
        .v-menu-submenu-icon {
          transform: rotate(180deg);
        }
      }
    }

    .v-menu-submenu-content {
      background-color: #fff;
      padding: 0 0 10px;
    }
  }

  // 一级菜单项（不可折叠，单行显示）
  .v-menu-item-first-level {
    width: 100%;
    min-height: 50px;
    color: #666;
    font-size: 14px;
    line-height: 20px;
    cursor: pointer;
    transition: all var(--transition-time-02);
    position: relative;
    display: flex;
    align-items: center;
    margin-bottom: 0;
    padding: 14px 18px;
    gap: 10px;
    font-weight: 500;
    border-bottom: 1px solid #f3f3f3;

    &:hover {
      color: #444 !important;
      background-color: #fafafa !important;
    }

    &.is-active {
      color: var(--el-color-primary) !important;
      background-color: #f7fbff !important;

      &:hover {
        background-color: #f7fbff !important;
      }
    }

    :deep(.app-iconify) {
      width: 15px;
      min-width: 15px;
      font-size: 15px;
      color: #666;
    }
  }

  // 二级菜单项（不可折叠，两列显示）
  .v-menu-item:not(.v-menu-item-first-level) {
    min-height: 32px;
    color: #555;
    font-size: 13px;
    line-height: 18px;
    cursor: pointer;
    transition: all var(--transition-time-02);
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    padding: 7px 10px;
    border-radius: 4px;

    &:hover {
      color: #333 !important;
      background-color: #f7f7f7 !important;
    }

    &.is-active {
      color: var(--el-color-primary) !important;
      background-color: #e8efff !important;
      font-weight: 500;

      &:hover {
        background-color: #e8efff !important;
      }
    }
  }

  // 子菜单按两列排布，一行两个
  .v-menu-row {
    display: flex;
    flex-direction: row;
    width: 100%;
    gap: 10px;
    margin-bottom: 4px;
    padding: 0 14px;

    .v-menu-item {
      flex: 1;
      min-width: 0;
      justify-content: flex-start;
    }

    .v-menu-item-placeholder {
      flex: 1;
    }
  }

  // 分割线
  .v-menu-divider {
    margin: 4px 14px;
    height: auto;
    background-color: transparent;
    position: relative;
    display: flex;
    align-items: center;

    .v-menu-divider-text {
      position: static;
      transform: none;
      padding: 4px 0 2px;
      background-color: transparent;
      font-size: 12px;
      color: #8c8c8c;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
  }
}

// 水平菜单
.#{$prefix-cls}__horizontal {
  height: calc(var(--top-tool-height)) !important;

  .v-menu-list {
    display: flex;
    height: calc(var(--top-tool-height));
    align-items: center;
  }
}
</style>
