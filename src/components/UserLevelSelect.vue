<template>
  <el-select
    v-model="innerValue"
    :multiple="multiple"
    clearable
    filterable
    collapse-tags
    collapse-tags-tooltip
    :placeholder="placeholder"
    @change="handleChange"
  >
    <el-option
      v-for="dict in levelOptions"
      :key="dict.value"
      :label="dict.label"
      :value="dict.value"
    />
  </el-select>
</template>

<script setup lang="ts">
import { getStrDictOptions } from '@/utils/dict'

const props = defineProps<{
  modelValue?: string | string[]
  multiple?: boolean
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | string[] | undefined): void
}>()

const innerValue = ref<string | string[] | undefined>(props.modelValue)
const levelOptions = getStrDictOptions('system_user_level')

watch(
  () => props.modelValue,
  (val) => {
    innerValue.value = val
  },
  { immediate: true }
)

const handleChange = (val: string | string[] | undefined) => {
  emit('update:modelValue', val)
}

const multiple = computed(() => props.multiple ?? false)
const placeholder = computed(() => props.placeholder || '请选择用户等级')
</script>
