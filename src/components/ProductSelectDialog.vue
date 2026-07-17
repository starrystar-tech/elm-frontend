<template>
    <el-dialog
        v-model="dialogVisible"
        title="选择商品"
        width="820px"
        append-to-body
        @opened="loadOptions"
    >
        <div class="product-picker">
            <div class="product-picker__filters">
                <ProductTypeSelect
                    v-model="filterForm.consultProjectId"
                    placeholder="选择咨询项目"
                    missing-label="该项目已下架，请选择其他项目"
                    @update:model-value="handleProjectChange"
                />
                <ProductTypeSelect
                    v-model="filterForm.productCategoryId"
                    :parent-id="filterForm.consultProjectId"
                    placeholder="选择商品分类"
                    class="product-picker__field"
                    clearable
                    :disabled="!filterForm.consultProjectId"
                    @change="handleCategoryChange"
                />
                <el-input
                    v-model="filterForm.keyword"
                    placeholder="请输入商品名称/编号"
                    class="product-picker__field"
                    clearable
                    @clear="handleKeywordChange"
                    @keyup.enter="handleKeywordChange"
                />
            </div>

            <el-table
                ref="tableRef"
                :data="pickerDisplayProducts"
                max-height="320"
                border
                row-key="id"
                highlight-current-row
                v-loading="loading"
                @selection-change="handleSelectionChange"
                @current-change="handleCurrentChange"
                @row-click="handleRowClick"
            >
                <el-table-column
                    v-if="multiple"
                    type="selection"
                    width="54"
                    reserve-selection
                />
                <el-table-column v-else label="" width="54" align="center">
                    <template #default="{ row }">
                        <el-radio
                            :value="row.id"
                            v-model="selectedProductId"
                            @change="handleSingleSelection(row)"
                            @click.stop
                        >
                            &nbsp;
                        </el-radio>
                    </template>
                </el-table-column>
                <el-table-column prop="name" label="商品" min-width="160" />
                <el-table-column label="商品分类" min-width="150">
                    <template #default="{ row }">
                        {{ row.categoryName || categoryNameMap[row.categoryId] || '--' }}
                    </template>
                </el-table-column>
                <el-table-column label="商品编号" min-width="140">
                    <template #default="{ row }">
                        {{ row.productNo || row.id || '--' }}
                    </template>
                </el-table-column>
                <el-table-column label="商品价格" min-width="120">
                    <template #default="{ row }">
                        {{ formatAmount(row.price) }}
                    </template>
                </el-table-column>
                <el-table-column label="最低价" min-width="120">
                    <template #default="{ row }">
                        {{ formatAmount(row.minPrice) }}
                    </template>
                </el-table-column>
            </el-table>
            <div class="product-picker__pagination">
                <el-pagination
                    v-model:current-page="pageNo"
                    v-model:page-size="pageSize"
                    layout="total, prev, pager, next"
                    :total="total"
                    :pager-count="5"
                />
            </div>
        </div>

        <template #footer>
            <el-button type="primary" :disabled="!selectedProducts.length" @click="handleConfirm">
                确定
            </el-button>
            <el-button @click="dialogVisible = false">取消</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import * as ProductCategoryApi from '@/api/crm/product/category'
import * as ProductApi from '@/api/crm/product'
import type { ProductVO } from '@/api/crm/product'
import type { ProductCategoryVO } from '@/api/crm/product/category'
import ProductTypeSelect from '@/components/ProductTypeSelect.vue'
import { fenToYuan } from '@/utils'

defineOptions({ name: 'ProductSelectDialog' })

const props = defineProps<{
    modelValue: boolean
    consultProjectId?: number
    multiple?: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'select', value: ProductVO[]): void
}>()

type FilterForm = {
    consultProjectId?: number
    productCategoryId?: number
    keyword: string
}

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value)
})

const loading = ref(false)
const optionsLoaded = ref(false)
const categoryOptions = ref<ProductCategoryVO[]>([])
const productOptions = ref<ProductVO[]>([])
const tableRef = ref()
const categoryNameMap = ref<Record<number, string>>({})
const total = ref(0)
const pageNo = ref(1)
const pageSize = ref(20)
const selectedProductMap = ref<Record<number, ProductVO>>({})
const selectedProductId = ref<number>()
const filterForm = ref<FilterForm>({
    consultProjectId: props.consultProjectId,
    productCategoryId: undefined,
    keyword: ''
})
const multiple = computed(() => props.multiple ?? true)

watch(
    () => props.consultProjectId,
    (value) => {
        filterForm.value.consultProjectId = value
        filterForm.value.productCategoryId = undefined
        filterForm.value.keyword = ''
        pageNo.value = 1
    }
)

watch(dialogVisible, (visible) => {
    if (!visible) return
    filterForm.value.consultProjectId = props.consultProjectId
    filterForm.value.productCategoryId = undefined
    filterForm.value.keyword = ''
    pageNo.value = 1
    selectedProductMap.value = {}
    selectedProductId.value = undefined
})

const loadCategoryOptions = async () => {
    if (optionsLoaded.value) return
    const categories = await ProductCategoryApi.getProductCategorySimpleList()
    const categoryList = (categories || []) as ProductCategoryVO[]
    categoryOptions.value = categoryList.filter((item) => Number(item.parentId) > 0)
    categoryNameMap.value = categoryList.reduce((acc: Record<number, string>, item) => {
        if (item.id) acc[item.id] = item.name
        return acc
    }, {})
    optionsLoaded.value = true
}

const loadProductOptions = async () => {
    loading.value = true
    try {
        const productPage = await ProductApi.getProductPage({
            pageNo: pageNo.value,
            pageSize: pageSize.value,
            name: filterForm.value.keyword || undefined,
            categoryId: filterForm.value.productCategoryId,
            status: 1
        })
        const products = ((productPage as any)?.list || []) as ProductVO[]
        productOptions.value = products
        total.value = Number((productPage as any)?.total || 0)
        await nextTick()
        syncTableSelection()
    } finally {
        loading.value = false
    }
}

const loadOptions = async () => {
    await loadCategoryOptions()
    await loadProductOptions()
}

const pickerCategoryOptions = computed(() =>
    categoryOptions.value.filter(
        (item) => Number(item.parentId) === Number(filterForm.value.consultProjectId || 0)
    )
)

const pickerProductOptions = computed(() => {
    let result = [...productOptions.value]

    if (filterForm.value.consultProjectId) {
        const categoryIds = pickerCategoryOptions.value.map((item) => Number(item.id))
        result = result.filter((item) => categoryIds.includes(Number(item.categoryId)))
    }

    if (filterForm.value.productCategoryId) {
        result = result.filter(
            (item) => Number(item.categoryId) === Number(filterForm.value.productCategoryId)
        )
    }

    const keyword = filterForm.value.keyword.trim().toLowerCase()
    if (keyword) {
        result = result.filter((item) => {
            const name = String(item.name || '').toLowerCase()
            const productNo = String(item.productNo || item.id || '').toLowerCase()
            return name.includes(keyword) || productNo.includes(keyword)
        })
    }

    return result
})

const pickerDisplayProducts = computed(() => pickerProductOptions.value)
const selectedProducts = computed(() => Object.values(selectedProductMap.value))

const syncTableSelection = () => {
    const table = tableRef.value
    if (!table) return
    if (multiple.value) {
        table.clearSelection()
        pickerDisplayProducts.value.forEach((item) => {
            if (selectedProductMap.value[item.id]) {
                table.toggleRowSelection(item, true)
            }
        })
        return
    }
    const current = pickerDisplayProducts.value.find((item) => item.id === selectedProductId.value)
    table.setCurrentRow(current || null)
}

const handleProjectChange = (value?: number) => {
    const shouldReloadDirectly = pageNo.value === 1
    filterForm.value.consultProjectId = value
    filterForm.value.productCategoryId = undefined
    filterForm.value.keyword = ''
    pageNo.value = 1
    if (dialogVisible.value && shouldReloadDirectly) {
        loadProductOptions()
    }
}

const handleCategoryChange = (value?: ProductCategoryApi.ProductCategoryVO) => {
    const shouldReloadDirectly = pageNo.value === 1
    filterForm.value.productCategoryId = value?.id
    pageNo.value = 1
    if (dialogVisible.value && shouldReloadDirectly) {
        loadProductOptions()
    }
}

const handleKeywordChange = () => {
    if (pageNo.value !== 1) {
        pageNo.value = 1
        return
    }
    if (dialogVisible.value) {
        loadProductOptions()
    }
}

const handleSelectionChange = (rows: ProductVO[]) => {
    if (!multiple.value) {
        return
    }
    const currentIds = new Set(pickerDisplayProducts.value.map((item) => item.id))
    currentIds.forEach((id) => {
        delete selectedProductMap.value[id]
    })
    rows.forEach((item) => {
        selectedProductMap.value[item.id] = item
    })
}

const handleSingleSelection = (row?: ProductVO) => {
    if (!row?.id) return
    selectedProductId.value = Number(row.id)
    selectedProductMap.value = {
        [row.id]: row
    }
    tableRef.value?.setCurrentRow(row)
}

const handleCurrentChange = (row?: ProductVO) => {
    if (multiple.value || !row) return
    handleSingleSelection(row)
}

const handleRowClick = (row: ProductVO) => {
    if (multiple.value) return
    handleSingleSelection(row)
}

const handleConfirm = () => {
    emit('select', selectedProducts.value)
    dialogVisible.value = false
}

const formatAmount = (value?: number | null) =>
    value !== undefined && value !== null ? fenToYuan(value) : '--'

watch([pageNo, pageSize], ([currentPage, currentSize], [previousPage, previousSize]) => {
    if (!dialogVisible.value) return
    if (currentPage === previousPage && currentSize === previousSize) return
    loadProductOptions()
})
</script>

<style scoped lang="scss">
.product-picker {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.product-picker__filters {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.product-picker__field {
    width: 100%;
}

.product-picker__pagination {
    display: flex;
    justify-content: flex-end;
}

@media (max-width: 768px) {
    .product-picker__filters {
        grid-template-columns: 1fr;
    }

    .product-picker__pagination {
        justify-content: center;
    }
}
</style>
