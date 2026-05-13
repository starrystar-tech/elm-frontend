<template>
  <el-select
    v-model="innerValue"
    :multiple="multiple"
    clearable
    collapse-tags
    collapse-tags-tooltip
    :placeholder="placeholder"
    @change="handleChange"
  >
    <el-option v-for="item in options" :key="item.id" :label="item.name" :value="item.id" />
  </el-select>
</template>

<script setup lang="ts">
import * as DeptApi from '@/api/system/dept'

const props = defineProps<{
  modelValue?: number | number[]
  multiple?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | number[] | undefined): void
}>()

const options = ref<DeptApi.DeptVO[]>([])
const innerValue = ref<number | number[] | undefined>(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    innerValue.value = val
  },
  { immediate: true }
)

const loadOptions = async () => {
  const deptList = await DeptApi.getSimpleDeptList()
  options.value = (deptList || []).filter((item: any) => item.deptType === 'call_group')
}

const handleChange = (val: number | number[] | undefined) => {
  emit('update:modelValue', val)
}

onMounted(() => {
  loadOptions()
})

const multiple = computed(() => props.multiple ?? false)
const placeholder = computed(() => props.placeholder || '请选择呼叫组')
</script>
