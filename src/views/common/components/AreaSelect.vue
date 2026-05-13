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

const props = defineProps<{
  modelValue?: number | number[]
  data?: any[]
  multiple?: boolean
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
    innerData.value = val || []
  },
  { immediate: true, deep: true }
)

const loadAreaTree = async () => {
  if (innerData.value.length) return
  innerData.value = (await AreaApi.getAreaTree()) || []
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
const checkStrictly = computed(() => props.checkStrictly ?? true)
const checkOnClickNode = computed(() => props.checkOnClickNode ?? true)
const expandOnClickNode = computed(() => props.expandOnClickNode ?? false)
const placeholder = computed(() => props.placeholder || '请选择地区')
</script>
