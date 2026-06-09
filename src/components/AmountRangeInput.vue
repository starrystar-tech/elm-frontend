<template>
    <div class="amount-range-input">
        <el-input
            :model-value="innerValue[0]"
            :placeholder="startPlaceholder"
            :clearable="clearable"
            @update:model-value="updateValue(0, $event)"
        />
        <span class="amount-range-input__separator">-</span>
        <el-input
            :model-value="innerValue[1]"
            :placeholder="endPlaceholder"
            :clearable="clearable"
            @update:model-value="updateValue(1, $event)"
        />
    </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'AmountRangeInput' })

const props = withDefaults(
    defineProps<{
        modelValue?: Array<string | number | undefined> | undefined
        clearable?: boolean
        startPlaceholder?: string
        endPlaceholder?: string
    }>(),
    {
        modelValue: () => [undefined, undefined],
        clearable: true,
        startPlaceholder: '最小金额',
        endPlaceholder: '最大金额'
    }
)

const emit = defineEmits<{
    'update:modelValue': [value: Array<string | number | undefined>]
}>()

const innerValue = computed(() => {
    const value = Array.isArray(props.modelValue) ? props.modelValue : []
    return [value[0] ?? undefined, value[1] ?? undefined]
})

const updateValue = (index: 0 | 1, value: string | number | undefined) => {
    const nextValue: Array<string | number | undefined> = [...innerValue.value]
    nextValue[index] = value === '' ? undefined : value
    emit('update:modelValue', nextValue)
}
</script>

<style scoped lang="scss">
.amount-range-input {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 10px;
    align-items: center;
    width: 100%;
}

.amount-range-input__separator {
    color: var(--el-text-color-secondary);
    font-size: 13px;
}
</style>
