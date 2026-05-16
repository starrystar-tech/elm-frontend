<template>
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="920px">
        <el-form
            ref="formRef"
            v-loading="formLoading"
            :model="formData"
            :rules="formRules"
            label-width="110px"
        >
            <el-card shadow="never" class="mb-16px">
                <template #header>
                    <span class="font-600">基础信息</span>
                </template>
                <el-row :gutter="18">
                    <el-col :span="12">
                        <el-form-item label="商品名称" prop="name">
                            <el-input v-model="formData.name" placeholder="请输入商品名称" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="商品分类" prop="categoryId">
                            <el-tree-select
                                v-model="formData.categoryId"
                                :data="categoryOptions"
                                :props="defaultProps"
                                check-strictly
                                node-key="id"
                                filterable
                                clearable
                                class="w-full"
                                placeholder="请选择商品分类"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="商品封面" prop="coverUrl">
                            <UploadImg
                                v-model="formData.coverUrl"
                                :width="'120px'"
                                :height="'120px'"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="服务期" prop="servicePeriodDays">
                            <el-input-number
                                v-model="formData.servicePeriodDays"
                                :min="0"
                                :step="30"
                                class="w-full"
                            >
                                <template #suffix>天</template>
                            </el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="售价" prop="priceYuan">
                            <el-input-number
                                v-model="formData.priceYuan"
                                :min="0.01"
                                :precision="2"
                                class="w-full"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="最低价" prop="minPriceYuan">
                            <el-input-number
                                v-model="formData.minPriceYuan"
                                :min="0"
                                :precision="2"
                                class="w-full"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="优惠价" prop="preferentialPriceYuan">
                            <el-input-number
                                v-model="formData.preferentialPriceYuan"
                                :min="0"
                                :precision="2"
                                class="w-full"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="成本价" prop="costPriceYuan">
                            <el-input-number
                                v-model="formData.costPriceYuan"
                                :min="0"
                                :precision="2"
                                class="w-full"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="备注" prop="remark">
                            <el-input
                                v-model="formData.remark"
                                type="textarea"
                                :rows="3"
                                placeholder="请输入备注"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-card>

            <el-card shadow="never" class="mb-16px">
                <template #header>
                    <span class="font-600">促销信息</span>
                </template>
                <el-row :gutter="18">
                    <el-col :span="12">
                        <el-form-item label="启用促销" prop="promotionEnabled">
                            <el-switch v-model="formData.promotionEnabled" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" v-if="formData.promotionEnabled">
                        <el-form-item label="促销价" prop="promotionPriceYuan">
                            <el-input-number
                                v-model="formData.promotionPriceYuan"
                                :min="0"
                                :precision="2"
                                class="w-full"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" v-if="formData.promotionEnabled">
                        <el-form-item label="促销截止时间" prop="promotionEndTime">
                            <el-date-picker
                                v-model="formData.promotionEndTime"
                                type="datetime"
                                value-format="YYYY-MM-DD HH:mm:ss"
                                class="w-full"
                                placeholder="请选择促销截止时间"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-card>

            <el-card shadow="never" class="mb-16px">
                <template #header>
                    <span class="font-600">结算与上架</span>
                </template>
                <el-row :gutter="18">
                    <el-col :span="12">
                        <el-form-item label="结算方式" prop="settlementType">
                            <el-radio-group v-model="formData.settlementType">
                                <el-radio
                                    v-for="item in PRODUCT_SETTLEMENT_TYPE_OPTIONS"
                                    :key="item.value"
                                    :value="item.value"
                                >
                                    {{ item.label }}
                                </el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="settlementValueLabel" prop="settlementValueInput">
                            <el-input-number
                                v-model="formData.settlementValueInput"
                                :min="0.01"
                                :precision="formData.settlementType === 2 ? 2 : 2"
                                class="w-full"
                            >
                                <template #suffix>{{
                                    formData.settlementType === 2 ? '%' : '元'
                                }}</template>
                            </el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24">
                        <el-form-item label="上架渠道" prop="channelCodes">
                            <el-checkbox-group v-model="formData.channelCodes">
                                <el-checkbox
                                    v-for="item in channelOptions"
                                    :key="item.value"
                                    :value="item.value"
                                >
                                    {{ item.label }}
                                </el-checkbox>
                            </el-checkbox-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="上架方式" prop="shelfType">
                            <el-radio-group v-model="formData.shelfType">
                                <el-radio
                                    v-for="item in PRODUCT_SHELF_TYPE_OPTIONS"
                                    :key="item.value"
                                    :value="item.value"
                                >
                                    {{ item.label }}
                                </el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" v-if="formData.shelfType === 3">
                        <el-form-item label="定时上架时间" prop="scheduledShelfTime">
                            <el-date-picker
                                v-model="formData.scheduledShelfTime"
                                type="datetime"
                                value-format="YYYY-MM-DD HH:mm:ss"
                                class="w-full"
                                placeholder="请选择定时上架时间"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-card>
        </el-form>
        <template #footer>
            <el-button type="primary" :loading="formLoading" @click="submitForm">确 定</el-button>
            <el-button @click="dialogVisible = false">取 消</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import type { FormRules } from 'element-plus'
import { defaultProps, handleTree } from '@/utils/tree'
import { fenToYuan, yuanToFen } from '@/utils'
import * as ProductApi from '@/api/crm/product'
import * as ProductCategoryApi from '@/api/crm/product/category'
import {
    getProductChannelOptions,
    PRODUCT_SETTLEMENT_TYPE_OPTIONS,
    PRODUCT_SHELF_TYPE_OPTIONS
} from './constants'

defineOptions({ name: 'OrderProductForm' })

type ProductFormData = {
    id?: number
    name: string
    categoryId?: number
    coverUrl: string
    servicePeriodDays: number
    priceYuan?: number
    minPriceYuan?: number
    preferentialPriceYuan?: number
    costPriceYuan?: number
    promotionEnabled: boolean
    promotionPriceYuan?: number
    promotionEndTime?: string
    settlementType: number
    settlementValueInput?: number
    channelCodes: string[]
    shelfType: number
    scheduledShelfTime?: string
    remark: string
}

const { t } = useI18n()
const message = useMessage()
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref<'create' | 'update'>('create')
const formRef = ref()
const categoryOptions = ref<any[]>([])
const channelOptions = computed(() => getProductChannelOptions())

const createDefaultFormData = (): ProductFormData => ({
    name: '',
    categoryId: undefined,
    coverUrl: '',
    servicePeriodDays: 365,
    priceYuan: undefined,
    minPriceYuan: undefined,
    preferentialPriceYuan: undefined,
    costPriceYuan: undefined,
    promotionEnabled: false,
    promotionPriceYuan: undefined,
    promotionEndTime: undefined,
    settlementType: 1,
    settlementValueInput: undefined,
    channelCodes: [],
    shelfType: 1,
    scheduledShelfTime: undefined,
    remark: ''
})

const formData = ref<ProductFormData>(createDefaultFormData())

const settlementValueLabel = computed(() =>
    formData.value.settlementType === 2 ? '结算比例' : '结算金额'
)

const formRules = reactive<FormRules>({
    name: [{ required: true, message: '商品名称不能为空', trigger: 'blur' }],
    categoryId: [{ required: true, message: '商品分类不能为空', trigger: 'change' }],
    servicePeriodDays: [{ required: true, message: '服务期不能为空', trigger: 'change' }],
    priceYuan: [{ required: true, message: '售价不能为空', trigger: 'change' }],
    minPriceYuan: [{ required: true, message: '最低价不能为空', trigger: 'change' }],
    settlementType: [{ required: true, message: '结算方式不能为空', trigger: 'change' }],
    settlementValueInput: [{ required: true, message: '结算值不能为空', trigger: 'change' }],
    channelCodes: [{ required: true, message: '上架渠道不能为空', trigger: 'change' }],
    shelfType: [{ required: true, message: '上架方式不能为空', trigger: 'change' }],
    promotionPriceYuan: [
        {
            validator: (_rule, value, callback) => {
                if (!formData.value.promotionEnabled) return callback()
                if (value === undefined || value === null || value === '')
                    return callback(new Error('促销价不能为空'))
                callback()
            },
            trigger: 'change'
        }
    ],
    promotionEndTime: [
        {
            validator: (_rule, value, callback) => {
                if (!formData.value.promotionEnabled) return callback()
                if (!value) return callback(new Error('促销截止时间不能为空'))
                callback()
            },
            trigger: 'change'
        }
    ],
    scheduledShelfTime: [
        {
            validator: (_rule, value, callback) => {
                if (formData.value.shelfType !== 3) return callback()
                if (!value) return callback(new Error('定时上架时间不能为空'))
                callback()
            },
            trigger: 'change'
        }
    ]
})

const loadCategories = async () => {
    const resp = await ProductCategoryApi.getProductCategoryList({})
    const rawList = resp?.list || resp || []
    categoryOptions.value =
        Array.isArray(rawList) && rawList.some((item: any) => item.children)
            ? rawList
            : handleTree(rawList, 'id', 'parentId')
}

const mapRespToFormData = (data: ProductApi.ProductRespVO): ProductFormData => ({
    id: data.id,
    name: data.name || '',
    categoryId: data.categoryId,
    coverUrl: data.coverUrl || '',
    servicePeriodDays: data.servicePeriodDays || 0,
    priceYuan: data.price !== undefined ? Number(fenToYuan(data.price)) : undefined,
    minPriceYuan: data.minPrice !== undefined ? Number(fenToYuan(data.minPrice)) : undefined,
    preferentialPriceYuan:
        data.preferentialPrice !== undefined && data.preferentialPrice !== null
            ? Number(fenToYuan(data.preferentialPrice))
            : undefined,
    costPriceYuan:
        data.costPrice !== undefined && data.costPrice !== null
            ? Number(fenToYuan(data.costPrice))
            : undefined,
    promotionEnabled: !!data.promotionEnabled,
    promotionPriceYuan:
        data.promotionPrice !== undefined && data.promotionPrice !== null
            ? Number(fenToYuan(data.promotionPrice))
            : undefined,
    promotionEndTime: data.promotionEndTime || undefined,
    settlementType: data.settlementType || 1,
    settlementValueInput:
        data.settlementValue !== undefined && data.settlementValue !== null
            ? data.settlementType === 2
                ? Number((data.settlementValue / 100).toFixed(2))
                : Number(fenToYuan(data.settlementValue))
            : undefined,
    channelCodes: data.channelCodeList || [],
    shelfType: data.shelfType || 1,
    scheduledShelfTime: data.scheduledShelfTime || undefined,
    remark: data.remark || ''
})

const resetForm = () => {
    formData.value = createDefaultFormData()
    formRef.value?.resetFields()
}

const open = async (type: 'create' | 'update', id?: number) => {
    dialogVisible.value = true
    dialogTitle.value = t('action.' + type)
    formType.value = type
    resetForm()
    await loadCategories()
    if (type === 'update' && id) {
        formLoading.value = true
        try {
            const data = await ProductApi.getProduct(id)
            formData.value = mapRespToFormData(data)
        } finally {
            formLoading.value = false
        }
    }
}

defineExpose({ open })

const emit = defineEmits(['success'])

const submitForm = async () => {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    if ((formData.value.minPriceYuan || 0) > (formData.value.priceYuan || 0)) {
        message.warning('最低价不能大于售价')
        return
    }
    if (
        formData.value.promotionEnabled &&
        (formData.value.promotionPriceYuan || 0) > (formData.value.priceYuan || 0)
    ) {
        message.warning('促销价不能大于售价')
        return
    }
    const payload: ProductApi.ProductSaveReqVO = {
        id: formData.value.id,
        name: formData.value.name,
        categoryId: Number(formData.value.categoryId),
        coverUrl: formData.value.coverUrl || undefined,
        servicePeriodDays: Number(formData.value.servicePeriodDays || 0),
        price: yuanToFen(formData.value.priceYuan || 0),
        minPrice: yuanToFen(formData.value.minPriceYuan || 0),
        preferentialPrice:
            formData.value.preferentialPriceYuan !== undefined &&
            formData.value.preferentialPriceYuan !== null
                ? yuanToFen(formData.value.preferentialPriceYuan)
                : null,
        costPrice:
            formData.value.costPriceYuan !== undefined && formData.value.costPriceYuan !== null
                ? yuanToFen(formData.value.costPriceYuan)
                : null,
        promotionEnabled: formData.value.promotionEnabled,
        promotionPrice:
            formData.value.promotionEnabled &&
            formData.value.promotionPriceYuan !== undefined &&
            formData.value.promotionPriceYuan !== null
                ? yuanToFen(formData.value.promotionPriceYuan)
                : null,
        promotionEndTime: formData.value.promotionEnabled
            ? formData.value.promotionEndTime || null
            : null,
        settlementType: formData.value.settlementType,
        settlementValue:
            formData.value.settlementType === 2
                ? yuanToFen(formData.value.settlementValueInput || 0)
                : yuanToFen(formData.value.settlementValueInput || 0),
        channelCodes: formData.value.channelCodes,
        shelfType: formData.value.shelfType,
        scheduledShelfTime:
            formData.value.shelfType === 3 ? formData.value.scheduledShelfTime || null : null,
        remark: formData.value.remark || undefined
    }

    formLoading.value = true
    try {
        if (formType.value === 'create') {
            await ProductApi.createProduct(payload)
            message.success(t('common.createSuccess'))
        } else {
            await ProductApi.updateProduct(payload)
            message.success(t('common.updateSuccess'))
        }
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}
</script>
