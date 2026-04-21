import type { RouteMeta } from 'vue-router'
import { Icon } from '@/components/Icon'
import { useI18n } from '@/hooks/web/useI18n'

export const useRenderMenuTitle = () => {
  const renderMenuTitle = (meta: RouteMeta, showIcon = true) => {
    const { t } = useI18n()
    const { title = 'Please set title', icon } = meta

    if (!showIcon) {
      return (
        <span class="v-menu__title overflow-hidden overflow-ellipsis whitespace-nowrap">
          {t(title as string)}
        </span>
      )
    }

    return (
      <>
        <span class="v-menu__icon-wrap">
          {icon ? <Icon icon={meta.icon}></Icon> : null}
        </span>
        <span class="v-menu__title overflow-hidden overflow-ellipsis whitespace-nowrap">
          {t(title as string)}
        </span>
      </>
    )
  }

  return {
    renderMenuTitle
  }
}
