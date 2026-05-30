<template>
    <el-tree-select
        v-model="selectCategoryId"
        :data="categoryList"
        :props="defaultProps"
        :multiple="multiple"
        :show-checkbox="multiple"
        class="w-1/1"
        node-key="id"
        clearable
        filterable
        check-strictly
        default-expand-all
        placeholder="请选择商品分类"
    />
</template>

<script setup lang="ts">
import * as ProductCategoryApi from '@/api/crm/product/category'
import { propTypes } from '@/utils/propTypes'
import { defaultProps, listToTree } from '@/utils/tree'
import { oneOfType } from 'vue-types'

defineOptions({ name: 'ProductCategorySelect' })

const props = defineProps({
    modelValue: oneOfType<number | number[]>([Number, Array<Number>]),
    multiple: propTypes.bool.def(false),
    parentId: propTypes.number.def(undefined)
})

const emit = defineEmits(['update:modelValue'])

const selectCategoryId = computed({
    get: () => props.modelValue,
    set: (val: number | number[]) => emit('update:modelValue', val)
})

const categoryList = ref<ProductCategoryApi.ProductCategoryVO[]>([])

const loadCategoryList = async () => {
    const data = ((await ProductCategoryApi.getProductCategorySimpleList()) || []) as ProductCategoryApi.ProductCategoryVO[]
    const list = props.parentId !== undefined
        ? data.filter((item) => Number(item.parentId) === Number(props.parentId))
        : data
    categoryList.value = listToTree(list, { id: 'id', pid: 'parentId', children: 'children' })
}

onMounted(() => {
    loadCategoryList()
})

watch(
    () => props.parentId,
    () => {
        loadCategoryList()
    }
)
</script>
