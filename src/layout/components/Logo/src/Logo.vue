<script lang="ts" setup>
import { computed, onMounted, ref, unref, watch } from 'vue'
import { activeBrandConfig } from '@/config/brand'
import { useAppStore } from '@/store/modules/app'
import { useDesign } from '@/hooks/web/useDesign'

defineOptions({ name: 'Logo' })

const { getPrefixCls } = useDesign()

const prefixCls = getPrefixCls('logo')

const appStore = useAppStore()

const title = computed(() => appStore.getTitle)

const layout = computed(() => appStore.getLayout)

const collapse = computed(() => appStore.getCollapse)

const isClassicCollapsed = computed(() => layout.value === 'classic' && collapse.value)
const isTopHeaderLayout = computed(() => layout.value !== 'classic')

const show = ref(!isClassicCollapsed.value)

onMounted(() => {
    if (unref(collapse)) show.value = false
})

watch(
    () => collapse.value,
    (collapse: boolean) => {
        if (unref(layout) === 'topLeft' || unref(layout) === 'cutMenu') {
            show.value = true
            return
        }
        if (!collapse) {
            setTimeout(() => {
                show.value = !collapse
            }, 400)
        } else {
            show.value = !collapse
        }
    }
)

watch(
    () => layout.value,
    (layout) => {
        if (layout === 'top' || layout === 'cutMenu') {
            show.value = true
        } else {
            if (unref(collapse)) {
                show.value = false
            } else {
                show.value = true
            }
        }
    }
)
</script>

<template>
    <div>
        <router-link
            :class="[
                prefixCls,
                layout !== 'classic' ? `${prefixCls}__Top` : '',
                'flex !h-[var(--logo-height)] items-center cursor-pointer relative decoration-none overflow-hidden logo-wrap transition-all duration-200',
                {
                    'layout-border__bottom sidebar-logo': layout === 'classic',
                    'top-header-logo': layout !== 'classic',
                    'justify-center px-0': isClassicCollapsed,
                    'px-14px': !isClassicCollapsed
                }
            ]"
            to="/"
        >
            <img
                :class="[
                    'h-[34px] w-[34px] shrink-0 object-cover',
                    {
                        'rounded-10px shadow-[0_3px_12px_rgba(22,119,255,0.18)]':
                            !isTopHeaderLayout,
                        'rounded-0 shadow-none bg-transparent': isTopHeaderLayout,
                        'mr-10px': show && !isClassicCollapsed
                    }
                ]"
                :src="activeBrandConfig.logos.nav"
            />
            <div
                v-if="show"
                :class="[
                    'min-w-0 truncate text-22px font-700 tracking-[0.02em]',
                    {
                        'text-[var(--logo-title-text-color)]': layout === 'classic',
                        'text-[var(--top-header-text-color)]':
                            layout === 'topLeft' || layout === 'top' || layout === 'cutMenu'
                    }
                ]"
            >
                {{ title }}
            </div>
        </router-link>
    </div>
</template>

<style lang="scss" scoped>
.sidebar-logo {
    background: #fff;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
}

.top-header-logo {
    background: transparent;
    box-shadow: none;
}
</style>
