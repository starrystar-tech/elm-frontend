<template>
  <el-select v-model="innerValue" clearable :placeholder="placeholder" @change="handleChange">
    <el-option v-for="item in options" :key="item.id" :label="item.name" :value="item.name" />
  </el-select>
</template>

<script setup lang="ts">
import * as ClueSourceApi from '@/api/system/clueSource'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | undefined): void
}>()

const options = ref<ClueSourceApi.ClueSourceVO[]>([])
const innerValue = ref<string | undefined>(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    innerValue.value = val
  },
  { immediate: true }
)

const loadOptions = async () => {
  options.value = (await ClueSourceApi.getEnabledClueSourceList()) || []
}

const handleChange = (val: string | undefined) => {
  emit('update:modelValue', val)
}

onMounted(() => {
  loadOptions()
})

const placeholder = computed(() => props.placeholder || '请选择来源')
</script>
