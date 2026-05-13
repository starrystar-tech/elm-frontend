<template>
  <el-select
    v-model="innerValue"
    clearable
    filterable
    :placeholder="placeholder"
    @change="handleChange"
  >
    <el-option v-for="item in options" :key="item.id" :label="item.name" :value="item.code" />
  </el-select>
</template>

<script setup lang="ts">
import * as ProductCategoryApi from '@/api/crm/product/category'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | undefined): void
}>()

const options = ref<ProductCategoryApi.ProductCategoryVO[]>([])
const innerValue = ref<string | undefined>(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    innerValue.value = val
  },
  { immediate: true }
)

const loadOptions = async () => {
  const list = (await ProductCategoryApi.getProductCategorySimpleList()) || []
  options.value = (list as ProductCategoryApi.ProductCategoryVO[]).filter(
    (item) => Number(item.parentId) === 0
  )
}

const handleChange = (val: string | undefined) => {
  emit('update:modelValue', val)
}

onMounted(() => {
  loadOptions()
})

const placeholder = computed(() => props.placeholder || '请选择项目')
</script>

