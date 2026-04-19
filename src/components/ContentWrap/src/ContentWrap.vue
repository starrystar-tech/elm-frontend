<script lang="ts" setup>
import { propTypes } from '@/utils/propTypes'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'ContentWrap' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('content-wrap')

defineProps({
  title: propTypes.string.def(''),
  message: propTypes.string.def(''),
  bodyStyle: propTypes.object.def({ padding: '10px' })
})
</script>

<template>
  <ElCard
    :body-style="bodyStyle"
    :class="[prefixCls, title ? 'mb-18px crm-panel-card' : 'mb-18px crm-panel-shell']"
    shadow="never"
  >
    <template v-if="title" #header>
      <div class="flex items-center">
        <span class="text-16px font-700">{{ title }}</span>
        <ElTooltip v-if="message" effect="dark" placement="right">
          <template #content>
            <div class="max-w-200px">{{ message }}</div>
          </template>
          <Icon :size="14" class="ml-5px" icon="ep:question-filled" />
        </ElTooltip>
        <div class="flex flex-grow pl-20px">
          <slot name="header"></slot>
        </div>
      </div>
    </template>
    <div class="content-wrap-stack">
      <slot></slot>
    </div>
  </ElCard>
</template>

<style scoped lang="scss">
.crm-panel-card {
  border: 1px solid #e9eef5;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);

  :deep(.el-card__header) {
    padding: 16px 18px;
    border-bottom: 1px solid #eef2f7;
  }

  :deep(.el-card__body) {
    border-radius: 0 0 10px 10px;
  }
}
</style>

<style lang="scss">
.crm-panel-shell {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;

  > .el-card__body {
    padding: 0 !important;
    background: transparent !important;
  }

  .content-wrap-stack {
    display: flex;
    flex-direction: column;
  }

  .content-wrap-stack > .search-block-gap {
    margin-bottom: 14px;
  }

  .content-wrap-stack > :not(.search-block-gap) {
    background: #fff;
    border-left: 1px solid #e9eef5;
    border-right: 1px solid #e9eef5;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }

  .content-wrap-stack > :not(.search-block-gap):first-child,
  .content-wrap-stack > .search-block-gap + :not(.search-block-gap) {
    border-top: 1px solid #e9eef5;
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.03);
  }

  .content-wrap-stack > :not(.search-block-gap):last-child {
    border-bottom: 1px solid #e9eef5;
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  }

  .content-wrap-stack > div.mb-10px:not(.search-block-gap),
  .content-wrap-stack > div.mb8:not(.search-block-gap),
  .content-wrap-stack > div.mb-15px:not(.search-block-gap) {
    margin-bottom: 0 !important;
    padding: 12px 16px 0;
  }

  .content-wrap-stack > div:not(.search-block-gap) + div:not(.search-block-gap),
  .content-wrap-stack > section:not(.search-block-gap) + section:not(.search-block-gap),
  .content-wrap-stack > div:not(.search-block-gap) + section:not(.search-block-gap),
  .content-wrap-stack > section:not(.search-block-gap) + div:not(.search-block-gap) {
    border-top: none;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    box-shadow: none;
  }

  .content-wrap-stack > div.mb-10px:not(.search-block-gap) + :not(.search-block-gap),
  .content-wrap-stack > div.mb8:not(.search-block-gap) + :not(.search-block-gap),
  .content-wrap-stack > div.mb-15px:not(.search-block-gap) + :not(.search-block-gap) {
    padding-top: 0;
  }
}
</style>
