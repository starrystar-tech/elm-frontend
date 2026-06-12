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
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | number[] | undefined): void
    (e: 'change', value: ProductCategoryApi.ProductCategoryVO | ProductCategoryApi.ProductCategoryVO[] | undefined): void
}>()

const innerValue = ref<number | number[] | undefined>(props.modelValue)
const options = ref<ProductCategoryApi.ProductCategoryVO[]>([])
const multiple = computed(() => props.multiple ?? false)

watch(
    () => props.modelValue,
    (value) => {
        innerValue.value = value
    },
    { immediate: true }
)

const loadOptions = async () => {
    const list =
        ((await ProductCategoryApi.getProductCategorySimpleList()) ||
            []) as ProductCategoryApi.ProductCategoryVO[]
    options.value =
        props.parentId !== undefined
            ? list.filter((item) => Number(item.parentId) === Number(props.parentId))
            : list.filter((item) => Number(item.parentId) === 0)
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
        loadOptions()
    }
)

const placeholder = computed(() => props.placeholder || '请选择咨询项目')
</script>
