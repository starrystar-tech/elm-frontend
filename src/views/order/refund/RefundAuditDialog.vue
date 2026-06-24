<template>
    <el-drawer
        v-model="dialogVisible"
        :title="readonly ? '查看退款单' : '审核退款单'"
        size="920px"
        append-to-body
        :close-on-click-modal="false"
        class="refund-audit-drawer"
    >
        <div v-loading="loading" class="refund-audit-dialog">
            <div class="refund-audit-section">
                <div class="refund-audit-section__title">订单信息</div>
                <div class="refund-audit-section__grid">
                    <div class="refund-audit-section__item">
                        <span class="label">退款客户：</span>
                        <span>{{ refund.customerName || '-' }}</span>
                    </div>
                    <div class="refund-audit-section__item">
                        <span class="label">手机号：</span>
                        <MobileCopyInline
                            :clue-id="orderDetail?.clueId"
                            :mobile="refund.customerMobile"
                        />
                    </div>
                    <div class="refund-audit-section__item">
                        <span class="label">退款订单：</span>
                        <span>{{ refund.orderNo || '-' }}</span>
                    </div>
                    <div class="refund-audit-section__item">
                        <span class="label">商品：</span>
                        <span>{{ orderDetail?.mainProductName || '-' }}</span>
                    </div>
                    <div class="refund-audit-section__item">
                        <span class="label">实付金额：</span>
                        <span>￥{{ formatAmount(orderDetail?.paidAmount) }}</span>
                    </div>
                    <div class="refund-audit-section__item">
                        <span class="label">可退金额：</span>
                        <span>￥{{ formatAmount(refundableAmount) }}</span>
                    </div>
                </div>
            </div>

            <div class="refund-audit-section">
                <div class="refund-audit-section__title">退款信息</div>
                <div class="refund-audit-section__grid">
                    <div class="refund-audit-section__item">
                        <span class="label">退款方式：</span>
                        <span>{{ refund.refundMethod || '-' }}</span>
                    </div>
                    <div class="refund-audit-section__item">
                        <span class="label">退款类型：</span>
                        <span>{{ refundTypeLabel(refund.refundType) }}</span>
                    </div>
                    <div class="refund-audit-section__item">
                        <span class="label">退款原因：</span>
                        <span>{{ refund.refundReason || '-' }}</span>
                    </div>
                    <div class="refund-audit-section__item">
                        <span class="label">退款金额：</span>
                        <span>￥{{ formatAmount(refund.refundAmount) }}</span>
                    </div>
                    <div class="refund-audit-section__item refund-audit-section__item--full">
                        <span class="label">退款备注：</span>
                        <span>{{ refund.refundRemark || '-' }}</span>
                    </div>
                </div>
            </div>

            <div class="refund-audit-section">
                <div class="refund-audit-section__title">审核信息</div>
                <el-form
                    v-if="!readonly"
                    ref="formRef"
                    :model="formData"
                    :rules="formRules"
                    label-width="96px"
                >
                    <div class="refund-audit-form__grid">
                        <el-form-item label="审批状态" prop="refundStatus">
                            <el-radio-group v-model="formData.refundStatus">
                                <el-radio :label="20">通过</el-radio>
                                <el-radio :label="30">驳回</el-radio>
                            </el-radio-group>
                        </el-form-item>
                        <el-form-item label="审批备注" prop="auditRemark">
                            <el-input
                                v-model="formData.auditRemark"
                                maxlength="200"
                                placeholder="请输入审批备注"
                            />
                        </el-form-item>
                    </div>
                </el-form>
                <div v-else class="refund-audit-section__grid">
                    <div class="refund-audit-section__item">
                        <span class="label">审批状态：</span>
                        <span>{{ refundStatusLabel(refund.refundStatus) }}</span>
                    </div>
                    <div class="refund-audit-section__item">
                        <span class="label">审批人：</span>
                        <span>{{ refund.auditUserName || '-' }}</span>
                    </div>
                    <div class="refund-audit-section__item refund-audit-section__item--full">
                        <span class="label">审批备注：</span>
                        <span>{{ refund.auditRemark || '-' }}</span>
                    </div>
                </div>
            </div>

            <div class="refund-audit-section">
                <div class="refund-audit-section__title">工单处理</div>
                <div class="refund-audit-section__grid">
                    <div class="refund-audit-section__item">
                        <span class="label">工单类型：</span>
                        <span>订单退款</span>
                    </div>
                    <div class="refund-audit-section__item">
                        <span class="label">优先级：</span>
                        <span>{{ aftersalesPriorityText }}</span>
                    </div>
                    <div class="refund-audit-section__item">
                        <span class="label">处理人：</span>
                        <span>{{ refund.aftersalesHandlerUserName || refund.auditUserName || '-' }}</span>
                    </div>
                    <div class="refund-audit-section__item">
                        <span class="label">处理时间：</span>
                        <span>{{ aftersalesProcessTimeText }}</span>
                    </div>
                    <div class="refund-audit-section__item">
                        <span class="label">处理状态：</span>
                        <span>{{ aftersalesStatusText }}</span>
                    </div>
                    <div class="refund-audit-section__item">
                        <span class="label">处理结果：</span>
                        <span>{{ refund.aftersalesProcessResult || refund.auditRemark || '-' }}</span>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <div class="refund-audit-drawer__footer">
                <el-button @click="dialogVisible = false">
                    {{ readonly ? '关闭' : '取消' }}
                </el-button>
                <el-button
                    v-if="!readonly"
                    type="primary"
                    :loading="submitting"
                    @click="handleSubmit"
                >
                    提交
                </el-button>
            </div>
        </template>
    </el-drawer>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { nextTick } from 'vue'
import * as OrderApi from '@/api/crm/order'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import MobileCopyInline from '@/views/crm/clue/MobileCopyInline.vue'
import {
    REFUND_STATUS_OPTIONS,
    REFUND_TYPE_OPTIONS,
    formatAmount,
    getOptionLabel,
    getRefundableAmount
} from '../utils'

defineOptions({ name: 'RefundAuditDialog' })

const emit = defineEmits(['success'])
const message = useMessage()

const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const readonly = ref(false)
const formRef = ref<FormInstance>()
const refund = ref<Partial<OrderApi.OrderRefundRespVO>>({})
const orderDetail = ref<OrderApi.OrderDetailRespVO>()
const formData = reactive({
    refundStatus: 20,
    auditRemark: '同意退款'
})

const formRules = reactive<FormRules>({
    refundStatus: [{ required: true, message: '请选择审批状态', trigger: 'change' }],
    auditRemark: [{ required: true, message: '请输入审批备注', trigger: 'blur' }]
})

const refundableAmount = computed(() =>
    getRefundableAmount(orderDetail.value?.paidAmount, orderDetail.value?.refundAmount)
)

const processStatusText = computed(() => {
    if (refund.value.refundStatus === 20) return '已处理'
    if (refund.value.refundStatus === 30) return '已驳回'
    return '待处理'
})

const processTimeText = computed(() => {
    const processTime = refund.value.auditTime || refund.value.refundTime
    return processTime ? formatDate(processTime as any) : '-'
})

const aftersalesPriorityText = computed(() =>
    refund.value.aftersalesPriority === undefined
        ? '-'
        : getDictLabel(DICT_TYPE.CRM_AFTERSALES_PRIORITY, refund.value.aftersalesPriority) || '-'
)

const aftersalesStatusText = computed(() =>
    refund.value.aftersalesStatus === undefined
        ? processStatusText.value
        : getDictLabel(DICT_TYPE.CRM_AFTERSALES_STATUS, refund.value.aftersalesStatus) ||
          processStatusText.value
)

const aftersalesProcessTimeText = computed(() => {
    const processTime = refund.value.aftersalesProcessTime || refund.value.auditTime || refund.value.refundTime
    return processTime ? formatDate(processTime as any) : '-'
})

const refundTypeLabel = (value?: number) => getOptionLabel(REFUND_TYPE_OPTIONS, value)
const refundStatusLabel = (value?: number) => getOptionLabel(REFUND_STATUS_OPTIONS, value)

const resetForm = async () => {
    formData.refundStatus = 20
    formData.auditRemark = '同意退款'
    await nextTick()
    formRef.value?.clearValidate()
}

const open = async (row: OrderApi.OrderRefundRespVO, isReadonly = row.refundStatus !== 0) => {
    refund.value = row
    readonly.value = isReadonly
    dialogVisible.value = true
    loading.value = true
    try {
        orderDetail.value = await OrderApi.getOrder(row.orderId)
    } finally {
        loading.value = false
    }
    if (!readonly.value) {
        await resetForm()
    }
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
        await OrderApi.auditRefund({
            id: Number(refund.value.id),
            refundStatus: Number(formData.refundStatus),
            auditRemark: formData.auditRemark
        })
        message.success(formData.refundStatus === 20 ? '审核通过' : '已驳回')
        dialogVisible.value = false
        emit('success')
    } finally {
        submitting.value = false
    }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.refund-audit-dialog {
    padding: 16px 20px 0;
}

.refund-audit-section {
    margin-bottom: 28px;
}

.refund-audit-section__title {
    position: relative;
    padding-left: 12px;
    margin-bottom: 18px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.refund-audit-section__title::before {
    position: absolute;
    top: 2px;
    left: 0;
    width: 4px;
    height: 18px;
    content: '';
    background: var(--el-color-primary);
    border-radius: 4px;
}

.refund-audit-section__grid,
.refund-audit-form__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px 48px;
}

.refund-audit-section__item {
    font-size: 15px;
    color: var(--el-text-color-primary);
}

.refund-audit-section__item--full {
    grid-column: 1 / -1;
}

.refund-audit-section__item .label {
    color: var(--el-text-color-regular);
}

.refund-audit-drawer__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

:deep(.refund-audit-drawer .el-drawer__header) {
    margin-bottom: 0;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.refund-audit-drawer .el-drawer__body) {
    padding: 0;
}

:deep(.refund-audit-drawer .el-drawer__footer) {
    padding: 16px 24px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
}
</style>
