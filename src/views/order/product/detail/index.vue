<template>
    <div v-loading="loading">
        <ContentWrap class="mb-16px">
            <div class="flex flex-wrap items-start justify-between gap-16px">
                <div class="flex gap-16px">
                    <el-image
                        :src="product.coverUrl || defaultCover"
                        fit="cover"
                        class="h-96px w-96px rounded-10px border border-[var(--el-border-color)] bg-[#f7f8fa]"
                    />
                    <div>
                        <div class="mb-8px flex items-center gap-10px">
                            <span class="text-20px font-700">{{ product.name || '-' }}</span>
                            <DictTag :type="DICT_TYPE.CRM_PRODUCT_STATUS" :value="product.status" />
                        </div>
                        <div
                            class="grid grid-cols-1 gap-y-6px text-[13px] text-[var(--el-text-color-secondary)] md:grid-cols-2 md:gap-x-24px"
                        >
                            <span
                                >商品分类：{{
                                    product.categoryPath || product.categoryName || '-'
                                }}</span
                            >
                            <span>售价：{{ priceText(product.price) }}</span>
                            <span>服务期：{{ product.servicePeriodDays || 0 }} 天</span>
                            <span>上架方式：{{ getShelfTypeLabel(product.shelfType) }}</span>
                            <span>创建人：{{ product.creator || '-' }}</span>
                            <span>创建时间：{{ product.createTime || '-' }}</span>
                        </div>
                    </div>
                </div>
                <div class="flex gap-8px">
                    <el-button @click="goBack">返回</el-button>
                    <el-button
                        v-hasPermi="['crm:product:update']"
                        type="primary"
                        @click="openForm('update', product.id)"
                        >编辑</el-button
                    >
                </div>
            </div>
        </ContentWrap>

        <ContentWrap>
            <el-row :gutter="18">
                <el-col :span="24">
                    <el-card shadow="never">
                        <template #header>
                            <span class="font-600">详细资料</span>
                        </template>
                        <el-descriptions :column="2" border>
                            <el-descriptions-item label="商品名称">{{
                                product.name || '-'
                            }}</el-descriptions-item>
                            <el-descriptions-item label="商品分类">{{
                                product.categoryPath || product.categoryName || '-'
                            }}</el-descriptions-item>
                            <el-descriptions-item label="服务期"
                                >{{ product.servicePeriodDays || 0 }} 天</el-descriptions-item
                            >
                            <el-descriptions-item label="上架状态">
                                <DictTag
                                    :type="DICT_TYPE.CRM_PRODUCT_STATUS"
                                    :value="product.status"
                                />
                            </el-descriptions-item>
                            <el-descriptions-item label="上架方式">{{
                                getShelfTypeLabel(product.shelfType)
                            }}</el-descriptions-item>
                            <el-descriptions-item label="上架渠道">
                                <DictTag
                                    :type="CRM_PRODUCT_CHANNEL_DICT"
                                    :value="product.channelCodeList || []"
                                />
                            </el-descriptions-item>
                            <el-descriptions-item label="售价">{{
                                priceText(product.price)
                            }}</el-descriptions-item>
                            <el-descriptions-item label="最低价">{{
                                priceText(product.minPrice)
                            }}</el-descriptions-item>
                            <el-descriptions-item label="优惠价">{{
                                nullablePriceText(product.preferentialPrice)
                            }}</el-descriptions-item>
                            <el-descriptions-item label="成本价">{{
                                nullablePriceText(product.costPrice)
                            }}</el-descriptions-item>
                            <el-descriptions-item label="促销开关">{{
                                product.promotionEnabled ? '开启' : '关闭'
                            }}</el-descriptions-item>
                            <el-descriptions-item label="促销价">{{
                                nullablePriceText(product.promotionPrice)
                            }}</el-descriptions-item>
                            <el-descriptions-item label="促销截止时间">{{
                                product.promotionEndTime || '-'
                            }}</el-descriptions-item>
                            <el-descriptions-item label="结算方式">{{
                                product.settlementTypeName ||
                                getSettlementTypeLabel(product.settlementType)
                            }}</el-descriptions-item>
                            <el-descriptions-item label="结算值">{{
                                formatSettlementValue(
                                    product.settlementType,
                                    product.settlementValue
                                )
                            }}</el-descriptions-item>
                            <el-descriptions-item label="定时上架时间">{{
                                product.scheduledShelfTime || '-'
                            }}</el-descriptions-item>
                            <el-descriptions-item label="实际上架时间">{{
                                product.actualShelfTime || '-'
                            }}</el-descriptions-item>
                            <el-descriptions-item label="备注" :span="2">{{
                                product.remark || '-'
                            }}</el-descriptions-item>
                        </el-descriptions>
                    </el-card>
                </el-col>
            </el-row>
        </ContentWrap>
    </div>

    <ProductForm ref="formRef" @success="handleRefresh" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fenToYuan } from '@/utils'
import { DICT_TYPE } from '@/utils/dict'
import { ContentWrap } from '@/components/ContentWrap'
import { DictTag } from '@/components/DictTag'
import * as ProductApi from '@/api/crm/product'
import ProductForm from '../ProductForm.vue'
import {
    CRM_PRODUCT_CHANNEL_DICT,
    formatSettlementValue,
    getSettlementTypeLabel,
    getShelfTypeLabel
} from '../constants'

defineOptions({ name: 'OrderProductDetail' })

const route = useRoute()
const router = useRouter()
const message = useMessage()
const loading = ref(false)
const product = ref({} as ProductApi.ProductRespVO)
const formRef = ref<InstanceType<typeof ProductForm>>()
const defaultCover =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="100%" height="100%" rx="12" fill="%23f3f4f6"/><text x="50%" y="54%" font-size="14" text-anchor="middle" fill="%239ca3af">Product</text></svg>'

const productId = computed(() => Number(route.params.id))

const priceText = (value?: number | null) =>
    value !== undefined && value !== null ? `${fenToYuan(value)} 元` : '-'
const nullablePriceText = (value?: number | null) => priceText(value)

const getProductData = async () => {
    if (!productId.value) {
        message.warning('参数错误，商品不能为空！')
        router.back()
        return
    }
    loading.value = true
    try {
        product.value = await ProductApi.getProduct(productId.value)
    } finally {
        loading.value = false
    }
}

const openForm = (type: 'create' | 'update', id?: number) => {
    formRef.value?.open(type, id)
}

const handleRefresh = async () => {
    await getProductData()
}

const goBack = () => {
    router.push('/order/product')
}

onMounted(() => {
    getProductData()
})
</script>
