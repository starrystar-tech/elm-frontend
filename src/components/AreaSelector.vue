<template>
    <div class="area-selector">
        <div class="area-selector__value" @click="visible = true">
            <span v-if="!selectedLabels.length" class="area-selector__placeholder">{{
                placeholder
            }}</span>
            <div v-else class="area-selector__tags">
                <el-tag
                    v-for="item in selectedLabels"
                    :key="item.id"
                    size="small"
                    type="info"
                    closable
                    disable-transitions
                    @close.stop="remove(item.id)"
                >
                    {{ item.name }}
                </el-tag>
            </div>
            <el-icon class="area-selector__arrow"><ArrowDown /></el-icon>
        </div>

        <Dialog v-model="visible" title="选择区域" width="560px">
            <el-tree
                ref="treeRef"
                :data="areaList"
                :props="defaultProps"
                node-key="id"
                show-checkbox
                check-strictly
                :expand-on-click-node="false"
                :default-expanded-keys="expandedKeys"
                style="max-height: 420px; overflow: auto"
            />
            <template #footer>
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" @click="confirm">确定</el-button>
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import { defaultProps } from '@/utils/tree'
import * as AreaApi from '@/api/system/area'

defineOptions({ name: 'AreaSelector' })

const props = defineProps<{
    modelValue?: number | number[]
    multiple?: boolean
    includeAllNode?: boolean
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | number[] | undefined): void
}>()

const createAllAreaNode = () => ({
    id: -1,
    name: '全国',
    children: [],
    leaf: true
})

const visible = ref(false)
const treeRef = ref()
const areaList = ref<Tree[]>([])
const loaded = ref(false)

const multiple = computed(() => props.multiple ?? false)
const includeAllNode = computed(() => props.includeAllNode ?? true)
const placeholder = computed(() => props.placeholder || '请选择区域')

const mergeAreaData = (data: any[] = []) => {
    const list = Array.isArray(data) ? data : []
    if (!includeAllNode.value) return list
    if (list.some((item) => Number(item?.id) === -1)) return list
    return [createAllAreaNode(), ...list]
}

const buildAreaMaps = () => {
    const nameMap = new Map<number, string>()
    const parentMap = new Map<number, number>()
    const walk = (nodes: any[], parentId?: number) => {
        ;(nodes || []).forEach((node) => {
            const currentId = Number(node?.id)
            if (!Number.isFinite(currentId)) return
            nameMap.set(currentId, node?.name || String(currentId))
            if (parentId !== undefined) {
                parentMap.set(currentId, parentId)
            }
            if (Array.isArray(node?.children) && node.children.length > 0) {
                walk(node.children, currentId)
            }
        })
    }
    walk(areaList.value as any[])
    return { nameMap, parentMap }
}

const expandedKeys = computed(() => {
    if (!modelIds.value.length) {
        return []
    }
    const { parentMap } = buildAreaMaps()
    const keys = new Set<number>()
    modelIds.value.forEach((id) => {
        let currentId: number | undefined = id
        while (currentId !== undefined) {
            keys.add(currentId)
            currentId = parentMap.get(currentId)
        }
    })
    return Array.from(keys)
})

const normalizeIds = (ids: number[] = []) => {
    if (!Array.isArray(ids) || ids.length <= 1) return ids
    const normalizedIds = ids.map((item) => Number(item)).filter((item) => Number.isFinite(item))
    const selectedSet = new Set(normalizedIds)
    const { parentMap } = buildAreaMaps()
    return normalizedIds.filter((id) => {
        let parentId = parentMap.get(id)
        while (parentId !== undefined) {
            if (selectedSet.has(parentId)) {
                return false
            }
            parentId = parentMap.get(parentId)
        }
        return true
    })
}

const modelIds = computed<number[]>(() => {
    const rawIds = props.multiple
        ? Array.isArray(props.modelValue)
            ? props.modelValue
            : []
        : props.modelValue === 0 || props.modelValue
          ? [props.modelValue as number]
          : []
    return normalizeIds(rawIds as number[])
})

const selectedLabels = computed(() => {
    const { nameMap } = buildAreaMaps()
    return modelIds.value
        .filter((id) => id !== -1)
        .map((id) => ({ id, name: nameMap.get(id) || String(id) }))
})

const loadArea = async () => {
    if (loaded.value) return
    const res = await AreaApi.getAreaTree()
    areaList.value = mergeAreaData((res || []) as any[])
    loaded.value = true
}

const emitNormalizedValue = (ids: number[]) => {
    const normalized = normalizeIds(ids)
    if (multiple.value) {
        emit('update:modelValue', normalized)
        return
    }
    emit('update:modelValue', normalized[0] as number | undefined)
}

const remove = (id: number) => {
    emitNormalizedValue(modelIds.value.filter((itemId) => itemId !== id))
}

const confirm = () => {
    const ids = (treeRef.value?.getCheckedKeys() || []) as number[]
    emitNormalizedValue(ids)
    visible.value = false
}

watch(
    () => visible.value,
    async (val) => {
        if (val) {
            await loadArea()
            await nextTick()
            treeRef.value?.setCheckedKeys(modelIds.value)
            expandedKeys.value.forEach((id) => {
                treeRef.value?.store?.nodesMap?.[id]?.expand?.()
            })
        }
    }
)

watch(
    () => props.modelValue,
    async (val) => {
        const hasValue = Array.isArray(val) ? val.length > 0 : val === 0 || !!val
        if (hasValue && !loaded.value) {
            await loadArea()
        }
        if (multiple.value && Array.isArray(val)) {
            const normalized = normalizeIds(val as number[])
            if (JSON.stringify(normalized) !== JSON.stringify(val)) {
                emit('update:modelValue', normalized)
            }
        }
    },
    { immediate: true, deep: true }
)
</script>

<style scoped>
.area-selector {
    width: 100%;
}

.area-selector__value {
    height: 32px;
    padding: 0 30px 0 11px;
    border: 1px solid var(--el-border-color, #dcdfe6);
    border-radius: 4px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    position: relative;
    cursor: pointer;
    background: var(--el-bg-color, #fff);
    transition: border-color 0.2s;
    box-sizing: border-box;
}

.area-selector__value:hover {
    border-color: var(--el-border-color-hover, #c0c4cc);
}

.area-selector__value:focus-within,
.area-selector__value:active {
    border-color: var(--el-color-primary);
}

.area-selector__placeholder {
    color: var(--el-text-color-placeholder);
    font-size: 14px;
}

.area-selector__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
    min-height: 22px;
}

.area-selector__arrow {
    position: absolute;
    right: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
}
</style>
