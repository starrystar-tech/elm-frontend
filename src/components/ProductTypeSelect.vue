<template>
    <el-select
        v-model="innerValue"
        :multiple="multiple"
        filterable
        clearable
        :placeholder="placeholder"
        style="width: 100%"
        @change="handleChange"
    >
        <el-option v-for="item in options" :key="item.id" :label="item.name" :value="item.id" />
    </el-select>
</template>

<script setup lang="ts">
import * as ProductCategoryApi from '@/api/crm/product/category'

defineOptions({ name: 'ProductTypeSelect' })

const props = defineProps<{
    modelValue?: number | number[]
    multiple?: boolean
    parentId?: number
    placeholder?: string
    missingLabel?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | number[] | undefined): void
    (e: 'change', value: ProductCategoryApi.ProductCategoryVO | ProductCategoryApi.ProductCategoryVO[] | undefined): void
}>()

const innerValue = ref<number | number[] | undefined>(props.modelValue)
const allOptions = ref<ProductCategoryApi.ProductCategoryVO[]>([])
const options = ref<ProductCategoryApi.ProductCategoryVO[]>([])
const multiple = computed(() => props.multiple ?? false)

const appendMissingOptions = (list: ProductCategoryApi.ProductCategoryVO[]) => {
    const result = [...list]
    const values = Array.isArray(innerValue.value)
        ? innerValue.value
        : innerValue.value !== undefined
          ? [innerValue.value]
          : []

    values.forEach((value) => {
        const numericValue = Number(value)
        if (!numericValue || result.some((item) => Number(item.id) === numericValue)) {
            return
        }
        result.push({
            id: numericValue,
            name: props.missingLabel || '所选商品已下架',
            parentId: Number(props.parentId ?? 0),
            code: '',
            sort: 0,
            status: 0
        })
    })

    return result
}

const rebuildOptions = () => {
    const filteredOptions =
        props.parentId !== undefined
            ? allOptions.value.filter((item) => Number(item.parentId) === Number(props.parentId))
            : allOptions.value.filter((item) => Number(item.parentId) === 0)
    options.value = appendMissingOptions(filteredOptions)
}

watch(
    () => props.modelValue,
    (value) => {
        innerValue.value = value
        rebuildOptions()
    },
    { immediate: true }
)

const loadOptions = async () => {
    allOptions.value =
        ((await ProductCategoryApi.getProductCategorySimpleList()) ||
            []) as ProductCategoryApi.ProductCategoryVO[]
    rebuildOptions()
}

const handleChange = (value: number | number[] | undefined) => {
    emit('update:modelValue', value)
    if (Array.isArray(value)) {
        emit(
            'change',
            options.value.filter((item) => value.includes(Number(item.id)))
        )
        return
    }
    emit('change', options.value.find((item) => item.id === value))
}

onMounted(() => {
    loadOptions()
})

watch(
    () => props.parentId,
    () => {
        rebuildOptions()
    }
)

const placeholder = computed(() => props.placeholder || '请选择咨询项目')
</script>
