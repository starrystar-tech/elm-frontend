<template>
    <el-tree-select
        v-model="model"
        class="area-select"
        :data="innerData"
        :props="defaultProps"
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
    return multiple.value ? 'parent' : undefined
})
const checkOnClickNode = computed(() => props.checkOnClickNode ?? true)
const expandOnClickNode = computed(() => props.expandOnClickNode ?? false)
const placeholder = computed(() => props.placeholder || '请选择地区')

const innerData = ref<any[]>(props.data || [])
const model = computed({
    get: () => props.modelValue,
    set: (value: number | number[] | undefined) => {
        if (multiple.value && Array.isArray(value)) {
            emit('update:modelValue', compactAreaIds(value, innerData.value || []))
            return
        }
        emit('update:modelValue', value)
    }
})

const hasOnlyAllNode = (list: any[] = []) =>
    Array.isArray(list) && list.length === 1 && Number(list[0]?.id) === -1

const mergeAreaData = (data: any[] = []) => {
    const list = Array.isArray(data) ? data : []
    if (!includeAllNode.value) return list
    if (list.some((item) => Number(item?.id) === -1)) return list
    return [createAllAreaNode(), ...list]
}

watch(
    () => props.data,
    (val) => {
        innerData.value = mergeAreaData(val || [])
    },
    { immediate: true, deep: true }
)

const loadAreaTree = async () => {
    if (innerData.value.length && !hasOnlyAllNode(innerData.value)) return
    innerData.value = mergeAreaData((await AreaApi.getAreaTree()) || [])
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
</style>
