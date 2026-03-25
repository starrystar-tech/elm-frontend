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

  .v-menu-list {
    width: 100%;
    padding: 10px;
  }

  // 一级菜单项（可折叠）
  .v-menu-submenu {
    width: 100%;
    margin-bottom: 24px;
    .v-menu-submenu-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 22px;
      color: rgba(0, 0, 0, 0.87);
      font-size: 14px;
      line-height: 22px;
      cursor: pointer;
      transition: all var(--transition-time-02);
      position: relative;
      width: 100%;
      margin-bottom: 12px;
      font-weight: bolder;
      &:hover {
        color: var(--el-color-primary) !important;
        background-color: transparent !important;
      }

      .v-menu-submenu-icon {
        transition: transform var(--transition-time-02);
        font-size: 12px;
        margin-left: auto;
        flex-shrink: 0;

        &.is-opened {
          transform: rotate(180deg);
        }
      }
    }

    &.is-active {
      .v-menu-submenu-title {
        color: var(--el-color-primary) !important;
        background-color: transparent !important;
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
      background-color: var(--left-menu-bg-light-color);
      padding: 4px 0;
    }
    .v-menu-submenu-content > .v-menu-row:last-child {
      margin-bottom: 0;
    }
    .v-menu-submenu-content > .v-menu-divider:first-child {
      margin-top: 4px;
    }
  }

  // 一级菜单项（不可折叠，单行显示）
  .v-menu-item-first-level {
    width: 100%;
    height: 22px;
    color: rgba(0, 0, 0, 0.87);
    font-size: 14px;
    line-height: 22px;
    cursor: pointer;
    transition: all var(--transition-time-02);
    position: relative;
    display: flex;
    align-items: center;
    margin-bottom: 24px;
    font-weight: bolder;

    &:hover {
      color: var(--el-color-primary) !important;
      background-color: transparent !important;
    }

    &.is-active {
      color: var(--el-color-primary) !important;
      background-color: transparent !important;

      &:hover {
        background-color: transparent !important;
      }
    }
  }

  // 二级菜单项（不可折叠，两列显示）
  .v-menu-item:not(.v-menu-item-first-level) {
    height: 20px;
    color: #606266;
    font-size: 14px;
    line-height: 20px;
    cursor: pointer;
    transition: all var(--transition-time-02);
    position: relative;
    display: flex;
    align-items: center;

    &:hover {
      color: var(--el-color-primary) !important;
      background-color: transparent !important;
    }

    &.is-active {
      color: var(--el-color-primary) !important;
      background-color: transparent !important;

      &:hover {
        background-color: transparent !important;
      }
    }
  }

  // 两列布局
  .v-menu-row {
    display: flex;
    width: 100%;
    gap: 8px;
    margin-bottom: 12px;

    .v-menu-item {
      flex: 1;
      min-width: 0;
    }

    .v-menu-item-placeholder {
      flex: 1;
    }
  }

  // 分割线
  .v-menu-divider {
    margin: 22px 0;
    height: 1px;
    background-color: var(--left-menu-divider-color);
    position: relative;
    display: flex;
    align-items: center;

    .v-menu-divider-text {
      position: absolute;
      left: 50%;
      transform: translate(-50%);
      padding: 0 8px;
      background-color: var(--left-menu-bg-light-color);
      font-size: 13px;
      color: #909399;
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
