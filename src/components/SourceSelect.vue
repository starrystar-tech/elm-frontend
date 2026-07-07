<template>
  <el-select
    v-model="innerValue"
    clearable
    :multiple="multiple"
    :placeholder="placeholder"
    @change="handleChange"
  >
    <el-option v-if="multiple" :key="-1" label="全部" :value="-1" />
    <template v-if="useId">
      <el-option v-for="item in options" :key="item.id" :label="item.name" :value="item.id as number" />
    </template>
    <template v-else>
      <el-option v-for="item in options" :key="item.id" :label="item.name" :value="item.name as string" />
    </template>
  </el-select>
</template>

<script setup lang="ts">
import * as ClueSourceApi from '@/api/system/clueSource'

const props = defineProps<{
  modelValue?: string | number | string[] | number[]
  placeholder?: string
  multiple?: boolean
  useId?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | string[] | number[] | undefined): void
}>()

const multiple = computed(() => props.multiple ?? false)
const useId = computed(() => props.useId ?? false)
const placeholder = computed(() => props.placeholder || '请选择来源')

const options = ref<ClueSourceApi.ClueSourceVO[]>([])
const innerValue = ref<any>(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    innerValue.value = val
  },
  { immediate: true, deep: true }
)

const loadOptions = async () => {
  options.value = (await ClueSourceApi.getEnabledClueSourceList()) || []
}

const handleChange = (val: any) => {
  emit('update:modelValue', val)
}

onMounted(() => {
  loadOptions()
})
</script>
