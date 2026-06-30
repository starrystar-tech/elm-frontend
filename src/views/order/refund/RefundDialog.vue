<template>
    <Dialog v-model="dialogVisible" title="新增退款" width="920px">
        <div class="refund-dialog">
            <div class="refund-section">
                <div class="refund-section__title">订单信息</div>
                <div class="refund-section__grid">
                    <div class="refund-section__item">
                        <span class="label">退款客户：</span>
                        <span>{{ order.customerName || '-' }}</span>
                    </div>
                    <div class="refund-section__item">
                        <span class="label">手机号：</span>
                        <span>{{ order.customerMobile || '-' }}</span>
                    </div>
                    <div class="refund-section__item">
                        <span class="label">退款订单：</span>
                        <span>{{ order.orderNo || '-' }}</span>
                    </div>
                    <div class="refund-section__item">
                        <span class="label">商品：</span>
                        <span>{{ order.mainProductName || '-' }}</span>
                    </div>
                    <div class="refund-section__item">
                        <span class="label">实付金额：</span>
                        <span>￥{{ formatAmount(order.paidAmount) }}</span>
                    </div>
                    <div class="refund-section__item">
                        <span class="label">可退金额：</span>
                        <span>￥{{ formatAmount(refundableAmount) }}</span>
                    </div>
                </div>
            </div>

            <div class="refund-section">
                <div class="refund-section__title">退款信息</div>
                <el-form
                    ref="formRef"
                    :model="formData"
                    :rules="formRules"
                    label-width="96px"
                    class="refund-form"
                >
                    <div class="refund-form__grid">
                        <el-form-item label="退款方式" prop="refundMethod">
                            <el-radio-group v-model="formData.refundMethod">
                                <el-radio label="原路返回">原路返回</el-radio>
                            </el-radio-group>
                        </el-form-item>
                        <el-form-item label="退款类型" prop="refundType">
                            <div class="refund-type-wrap">
                                <el-radio-group v-model="formData.refundType">
                                    <el-radio :label="1">退学</el-radio>
                                    <el-radio :label="2">退费</el-radio>
                                </el-radio-group>
                                <Icon
                                    icon="ep:warning-filled"
                                    class="refund-type-wrap__icon"
                                    title="退学会同步更新学员状态"
                                />
                            </div>
                        </el-form-item>
                        <el-form-item label="退款金额" prop="refundAmount">
                            <el-input-number
                                v-model="formData.refundAmount"
                                :min="0"
                                :max="refundableAmountYuan"
                                :precision="2"
                                :step="1"
                                controls-position="right"
                                style="width: 100%"
                            />
                        </el-form-item>
                        <el-form-item label="退款原因" prop="refundReason">
                            <el-select
                                v-model="formData.refundReason"
                                placeholder="请选择退款原因"
                                clearable
                                style="width: 100%"
                            >
                                <el-option
                                    v-for="item in refundReasonOptions"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value"
                                />
                            </el-select>
                        </el-form-item>
                    </div>
                    <el-form-item label="退款备注" prop="refundRemark">
                        <el-input
                            v-model="formData.refundRemark"
                            maxlength="200"
                            show-word-limit
                            placeholder="请输入退款备注"
                        />
                    </el-form-item>
                </el-form>
            </div>
        </div>
        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { nextTick } from 'vue'
import * as OrderApi from '@/api/crm/order'
import { formatAmount, getRefundableAmount } from '../utils'

defineOptions({ name: 'OrderRefundDialog' })

const emit = defineEmits(['success'])
const message = useMessage()

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const order = ref<Partial<OrderApi.OrderDetailRespVO & OrderApi.OrderPageRespVO>>({})
const formData = reactive({
    refundMethod: '原路返回',
    refundType: 2,
    refundReason: '',
    refundAmount: 0,
    refundRemark: ''
})

const refundReasonOptions = [
    { label: '学员申请退费', value: '学员申请退费' },
    { label: '学员申请退学', value: '学员申请退学' },
    { label: '协商退款', value: '协商退款' },
    { label: '课程调整', value: '课程调整' }
]

const refundableAmount = computed(() =>
    getRefundableAmount(Number(order.value.paidAmount || 0), Number(order.value.refundAmount || 0))
)
const refundableAmountYuan = computed(() => Number((refundableAmount.value / 100).toFixed(2)))

const formRules = reactive<FormRules>({
    refundMethod: [{ required: true, message: '请选择退款方式', trigger: 'change' }],
    refundType: [{ required: true, message: '请选择退款类型', trigger: 'change' }],
    refundReason: [{ required: true, message: '请选择退款原因', trigger: 'change' }],
    refundAmount: [
        { required: true, message: '请输入退款金额', trigger: 'blur' },
        {
            validator: (_rule, value, callback) => {
                if (value === undefined || value === null || Number(value) <= 0) {
                    callback(new Error('退款金额必须大于 0'))
                    return
                }
                if (Number(value) > refundableAmountYuan.value) {
                    callback(new Error('退款金额不能大于可退金额'))
                    return
                }
                callback()
            },
            trigger: 'blur'
        }
    ]
})

const resetForm = async () => {
    formData.refundMethod = '原路返回'
    formData.refundType = 2
    formData.refundReason = ''
    formData.refundAmount = refundableAmountYuan.value
    formData.refundRemark = ''
    await nextTick()
    formRef.value?.clearValidate()
}

const open = async (payload: OrderApi.OrderPageRespVO | OrderApi.OrderDetailRespVO) => {
    let detail = payload as OrderApi.OrderDetailRespVO
    if (!detail.items) {
        detail = await OrderApi.getOrder(Number(payload.id))
    }
    order.value = detail
    dialogVisible.value = true
    await resetForm()
}

const handleSubmit = async () => {
    if (!formRef.value) return
    try {
        await formRef.value.validate()
    } catch {
        return
    }
    submitting.value = true
    try {
        await OrderApi.createRefund({
            orderId: Number(order.value.id),
            refundMethod: formData.refundMethod,
            refundType: Number(formData.refundType),
            refundAmount: Math.round(Number(formData.refundAmount) * 100),
            refundReason: formData.refundReason,
            refundRemark: formData.refundRemark || undefined
        })
        message.success('退款单已创建')
        dialogVisible.value = false
        emit('success')
    } finally {
        submitting.value = false
    }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.refund-dialog {
    padding: 8px 4px 0;
}

.refund-section {
    margin-bottom: 20px;
}

.refund-section__title {
    position: relative;
    padding-left: 12px;
    margin-bottom: 18px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.refund-section__title::before {
    position: absolute;
    top: 2px;
    left: 0;
    width: 4px;
    height: 18px;
    content: '';
    background: var(--el-color-primary);
    border-radius: 4px;
}

.refund-section__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px 48px;
}

.refund-section__item {
    font-size: 15px;
    color: var(--el-text-color-primary);
}

.refund-section__item .label {
    color: var(--el-text-color-regular);
}

.refund-form__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 24px;
}

.refund-type-wrap {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.refund-type-wrap__icon {
    color: #f59e0b;
    font-size: 16px;
}
</style>
