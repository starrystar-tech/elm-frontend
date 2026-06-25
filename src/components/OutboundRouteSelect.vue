<template>
  <el-select
    v-model="innerValue"
    clearable
    filterable
    :placeholder="placeholder"
    @change="handleChange"
  >
    <el-option
      v-for="item in options"
      :key="item.id"
      :label="formatLabel(item)"
      :value="item.id"
    />
  </el-select>
</template>

<script setup lang="ts">
import * as OutboundRouteApi from '@/api/system/call/router'

const props = defineProps<{
  modelValue?: number
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void
  (e: 'change', value: number | undefined, route?: OutboundRouteApi.OutboundRouteVO): void
}>()

const options = ref<OutboundRouteApi.OutboundRouteVO[]>([])
const innerValue = ref<number | undefined>(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    innerValue.value = val
  },
  { immediate: true }
)

const loadOptions = async () => {
  options.value = (await OutboundRouteApi.getOutboundRouteSimpleList()) || []
}

const formatLabel = (item: OutboundRouteApi.OutboundRouteVO) =>
  item.numberPrefix ? `${item.name}（${item.numberPrefix}）` : item.name

const handleChange = (val: number | undefined) => {
  const route = options.value.find((item) => item.id === val)
  emit('update:modelValue', val)
  emit('change', val, route)
}

onMounted(() => {
  loadOptions()
})

const placeholder = computed(() => props.placeholder || '请选择线路')
</script>
