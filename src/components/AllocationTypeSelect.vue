<template>
    <el-select
        v-model="innerValue"
        :multiple="multiple"
        clearable
        filterable
        :placeholder="placeholder"
        style="width: 100%"
        @change="handleChange"
    >
        <el-option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
        />
    </el-select>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

defineOptions({ name: 'AllocationTypeSelect' })

const props = defineProps<{
    modelValue?: number | number[]
    multiple?: boolean
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | number[] | undefined): void
}>()

const options = computed(() => getIntDictOptions(DICT_TYPE.CRM_CLUE_ALLOCATION_TYPE))
const innerValue = ref<number | number[] | undefined>(props.modelValue)
const multiple = computed(() => props.multiple ?? false)
const placeholder = computed(() => props.placeholder || '请选择分配类型')

watch(
    () => props.modelValue,
    (val) => {
        innerValue.value = val
    },
    { immediate: true }
)

const handleChange = (val: number | number[] | undefined) => {
    emit('update:modelValue', val)
}
</script>
