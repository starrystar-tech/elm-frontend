<template>
    <el-tree-select
        v-model="model"
        class="area-select"
        :data="innerData"
        :props="defaultProps"
        popper-class="area-select-popper"
        node-key="id"
        value-key="id"
        :check-strictly="checkStrictly"
        :show-checked-strategy="showCheckedStrategy"
        :check-on-click-node="checkOnClickNode"
        :expand-on-click-node="expandOnClickNode"
        :multiple="multiple"
        :show-checkbox="multiple"
        clearable
        :placeholder="placeholder"
        @node-click="handleNodeClick"
    />
</template>

<script setup lang="ts">
import { defaultProps } from '@/utils/tree'
import * as AreaApi from '@/api/system/area'
import { compactAreaIds } from '@/utils/areaScope'

const createAllAreaNode = () => ({
    id: -1,
    name: '全国',
    children: [],
    leaf: true
})

const props = defineProps<{
    modelValue?: number | number[]
    data?: any[]
    multiple?: boolean
    includeAllNode?: boolean
    checkStrictly?: boolean
    showCheckedStrategy?: 'child' | 'parent'
    checkOnClickNode?: boolean
    expandOnClickNode?: boolean
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | number[] | undefined): void
}>()

const multiple = computed(() => props.multiple ?? false)
const includeAllNode = computed(() => props.includeAllNode ?? true)
const checkStrictly = computed(() => props.checkStrictly ?? true)
const showCheckedStrategy = computed(() => {
    if (props.showCheckedStrategy) return props.showCheckedStrategy
    return multiple.value ? 'child' : undefined
})
const checkOnClickNode = computed(() => props.checkOnClickNode ?? true)
const expandOnClickNode = computed(() => props.expandOnClickNode ?? false)
const placeholder = computed(() => props.placeholder || '请选择地区')

const innerData = ref<any[]>(props.data || [])
const retainedIdMap = ref<Map<number, number>>(new Map())

const pruneAreaTree = (nodes: any[] = [], level = 1): any[] =>
    (Array.isArray(nodes) ? nodes : []).map((node) => {
        const children = Array.isArray(node?.children) ? node.children : []
        return {
            ...node,
            children: level >= 2 ? [] : pruneAreaTree(children, level + 1),
            leaf: level >= 2 || children.length === 0
        }
    })

const resolveRootNodes = (nodes: any[] = []) => {
    const list = Array.isArray(nodes) ? nodes : []
    const rootNode = list.find((item) =>
        ['中国', '全国', '全球'].includes(String(item?.name || '').trim())
    )
    if (Array.isArray(rootNode?.children) && rootNode.children.length) {
        return rootNode.children
    }
    return list
}

const buildRetainedIdMap = (nodes: any[] = []) => {
    const map = new Map<number, number>()
    const walk = (list: any[], level = 1, retainedAncestorId?: number) => {
        ;(Array.isArray(list) ? list : []).forEach((node) => {
            const id = Number(node?.id)
            if (!Number.isFinite(id)) return
            const retainedId = level <= 2 ? id : retainedAncestorId
            if (Number.isFinite(retainedId)) {
                map.set(id, Number(retainedId))
            }
            const children = Array.isArray(node?.children) ? node.children : []
            if (children.length) {
                walk(children, level + 1, retainedId)
            }
        })
    }
    walk(nodes)
    return map
}

const normalizeAreaValue = (value?: number | number[]) => {
    if (multiple.value) {
        if (!Array.isArray(value)) {
            return []
        }
        const mappedValues = value
            .map((item) => retainedIdMap.value.get(Number(item)) ?? Number(item))
            .filter((item) => Number.isFinite(item))
        return compactAreaIds(Array.from(new Set(mappedValues)), innerData.value || [])
    }
    if (value === undefined || value === null || value === '') {
        return undefined
    }
    const mappedValue = retainedIdMap.value.get(Number(value)) ?? Number(value)
    return Number.isFinite(mappedValue) ? mappedValue : undefined
}

const model = computed({
    get: () => normalizeAreaValue(props.modelValue),
    set: (value: number | number[] | undefined) => {
        emit('update:modelValue', normalizeAreaValue(value) as number | number[] | undefined)
    }
})

const normalizedModelValue = computed(() => {
    return normalizeAreaValue(props.modelValue)
})

const hasOnlyAllNode = (list: any[] = []) =>
    Array.isArray(list) && list.length === 1 && Number(list[0]?.id) === -1

const mergeAreaData = (data: any[] = []) => {
    const list = resolveRootNodes(data)
    const prunedList = pruneAreaTree(list)
    if (!includeAllNode.value) return prunedList
    if (prunedList.some((item) => Number(item?.id) === -1)) return prunedList
    return [createAllAreaNode(), ...prunedList]
}

watch(
    () => props.data,
    (val) => {
        retainedIdMap.value = buildRetainedIdMap(val || [])
        innerData.value = mergeAreaData(val || [])
    },
    { immediate: true, deep: true }
)

watch(
    normalizedModelValue,
    (value) => {
        if (multiple.value) {
            if (!Array.isArray(value) || !Array.isArray(props.modelValue)) {
                return
            }
            if (JSON.stringify(value) === JSON.stringify(props.modelValue)) {
                return
            }
            emit('update:modelValue', value)
            return
        }
        if (value === props.modelValue) {
            return
        }
        emit('update:modelValue', value)
    },
    { deep: true }
)

const loadAreaTree = async () => {
    if (innerData.value.length && !hasOnlyAllNode(innerData.value)) return
    const areaTree = (await AreaApi.getAreaTree()) || []
    retainedIdMap.value = buildRetainedIdMap(areaTree)
    innerData.value = mergeAreaData(areaTree)
}

const handleNodeClick = (data: any) => {
    if (multiple.value) return
    const id = Number(data?.id)
    if (Number.isNaN(id)) return
    emit('update:modelValue', id)
}

onMounted(() => {
    loadAreaTree()
})
</script>

<style scoped>
.area-select {
    width: 100%;
}

:global(.area-select-popper .el-scrollbar) {
    max-height: min(320px, 40vh);
}

:global(.area-select-popper .el-tree) {
    max-height: min(320px, 40vh);
}
</style>
