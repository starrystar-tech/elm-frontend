<template>
  <el-select
    v-if="mode === 'select'"
    v-model="innerValue"
    clearable
    filterable
    :placeholder="placeholderText"
    @change="handleChange"
  >
    <el-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </el-select>
  <DictTag
    v-else-if="mode === 'tag' && hasValue"
    :type="DICT_TYPE.CRM_CLUE_INTENT_LEVEL"
    :value="modelValue"
  />
  <span v-else>{{ labelText }}</span>
</template>

<script setup lang="ts">
import DictTag from '@/components/DictTag/src/DictTag.vue'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'

defineOptions({ name: 'ClueIntentLevel' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    mode?: 'select' | 'tag' | 'text'
    placeholder?: string
    emptyText?: string
  }>(),
  {
    modelValue: undefined,
    mode: 'text',
    placeholder: '请选择意向度',
    emptyText: '--'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | undefined): void
}>()

const options = getIntDictOptions(DICT_TYPE.CRM_CLUE_INTENT_LEVEL)
const innerValue = ref<number | undefined>(props.modelValue)

watch(
  () => props.modelValue,
  (value) => {
    innerValue.value = value
  },
  { immediate: true }
)

const hasValue = computed(() => props.modelValue !== undefined && props.modelValue !== null)
const placeholderText = computed(() => props.placeholder || '请选择意向度')
const labelText = computed(() => {
  if (!hasValue.value) {
    return props.emptyText
  }
  return getDictLabel(DICT_TYPE.CRM_CLUE_INTENT_LEVEL, props.modelValue) || props.emptyText
})

const handleChange = (value: number | undefined) => {
  emit('update:modelValue', value)
}
</script>
