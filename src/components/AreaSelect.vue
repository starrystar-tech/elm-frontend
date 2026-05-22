<template>
    <el-tree-select
        v-model="innerValue"
        :data="innerData"
        :props="defaultProps"
        node-key="id"
        value-key="id"
        :check-strictly="checkStrictly"
        :check-on-click-node="checkOnClickNode"
        :expand-on-click-node="expandOnClickNode"
        :multiple="multiple"
        :show-checkbox="multiple"
        clearable
        :placeholder="placeholder"
        @node-click="handleNodeClick"
        @change="handleChange"
    />
</template>

<script setup lang="ts">
import { defaultProps } from '@/utils/tree'
import * as AreaApi from '@/api/system/area'

const ALL_AREA_NODE = {
    id: 0,
    name: '全国',
    children: []
}

const props = defineProps<{
    modelValue?: number | number[]
    data?: any[]
    multiple?: boolean
    includeAllNode?: boolean
    checkStrictly?: boolean
    checkOnClickNode?: boolean
    expandOnClickNode?: boolean
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | number[] | undefined): void
}>()

const innerValue = ref<number | number[] | undefined>(props.modelValue)
const innerData = ref<any[]>(props.data || [])

const mergeAreaData = (data: any[] = []) => {
    const list = Array.isArray(data) ? data : []
    if (!includeAllNode.value) return list
    if (list.some((item) => Number(item?.id) === 0)) return list
    return [ALL_AREA_NODE, ...list]
}

watch(
    () => props.modelValue,
    (val) => {
        innerValue.value = val
    },
    { immediate: true }
)

watch(
    () => props.data,
    (val) => {
        innerData.value = mergeAreaData(val || [])
    },
    { immediate: true, deep: true }
)

const loadAreaTree = async () => {
    if (innerData.value.length) return
    innerData.value = mergeAreaData((await AreaApi.getAreaTree()) || [])
}

const handleChange = (val: number | number[] | undefined) => {
    emit('update:modelValue', val)
}

const handleNodeClick = (data: any) => {
    if (multiple.value) return
    const id = Number(data?.id)
    if (Number.isNaN(id)) return
    innerValue.value = id
    emit('update:modelValue', id)
}

onMounted(() => {
    loadAreaTree()
})

const multiple = computed(() => props.multiple ?? false)
const includeAllNode = computed(() => props.includeAllNode ?? true)
const checkStrictly = computed(() => props.checkStrictly ?? true)
const checkOnClickNode = computed(() => props.checkOnClickNode ?? true)
const expandOnClickNode = computed(() => props.expandOnClickNode ?? false)
const placeholder = computed(() => props.placeholder || '请选择地区')
</script>
