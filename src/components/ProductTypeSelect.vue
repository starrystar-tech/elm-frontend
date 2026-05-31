<template>
    <el-select
        v-model="innerValue"
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
    modelValue?: number
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | undefined): void
    (e: 'change', value: ProductCategoryApi.ProductCategoryVO | undefined): void
}>()

const innerValue = ref<number | undefined>(props.modelValue)
const options = ref<ProductCategoryApi.ProductCategoryVO[]>([])

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
    options.value = list.filter((item) => Number(item.parentId) === 0)
}

const handleChange = (value: number | undefined) => {
    emit('update:modelValue', value)
    emit('change', options.value.find((item) => item.id === value))
}

onMounted(() => {
    loadOptions()
})

const placeholder = computed(() => props.placeholder || '请选择咨询项目')
</script>
