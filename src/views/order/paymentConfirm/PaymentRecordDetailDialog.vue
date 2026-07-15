<template>
    <Dialog v-model="dialogVisible" title="支付记录详情" width="980px" append-to-body>
        <div v-loading="loading" class="payment-record-detail">
            <div class="payment-record-detail__summary">
                <div class="payment-record-detail__summary-card">
                    <span class="payment-record-detail__summary-label">应付金额</span>
                    <strong class="payment-record-detail__summary-value">
                        {{ formatDisplayAmount(detail.payableAmount) }}
                    </strong>
                </div>
                <div class="payment-record-detail__summary-card">
                    <span class="payment-record-detail__summary-label">已付金额</span>
                    <strong class="payment-record-detail__summary-value">
                        {{ formatDisplayAmount(detail.paidAmount) }}
                    </strong>
                </div>
            </div>

            <el-descriptions :column="2" border class="payment-record-detail__meta">
                <el-descriptions-item label="订单编号">
                    {{ detail.orderNo || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="客户姓名">
                    {{ detail.customerName || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="分期状态">
                    {{ installmentStatusText }}
                </el-descriptions-item>
                <el-descriptions-item label="尾款渠道">
                    {{ detail.finalPaymentChannel || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="订单备注" :span="2">
                    {{ detail.remark || '-' }}
                </el-descriptions-item>
            </el-descriptions>

            <div class="payment-record-detail__section">
                <div class="payment-record-detail__section-title">支付记录</div>
                <div v-if="detail.payRecords?.length" class="payment-record-detail__list">
                    <div
                        v-for="(record, index) in detail.payRecords"
                        :key="record.id || index"
                        class="payment-record-detail__card"
                    >
                        <div class="payment-record-detail__card-title">第 {{ index + 1 }} 条</div>
                        <el-descriptions :column="2" border>
                            <el-descriptions-item label="支付渠道">
                                {{ record.payMethod || '-' }}
                            </el-descriptions-item>
                            <el-descriptions-item label="支付金额">
                                {{ formatDisplayAmount(record.payAmount) }}
                            </el-descriptions-item>
                            <el-descriptions-item label="支付状态">
                                {{ payStatusText(record.payStatus) }}
                            </el-descriptions-item>
                            <el-descriptions-item label="财务确认">
                                {{ payConfirmStatusText(record.confirmStatus) }}
                            </el-descriptions-item>
                            <el-descriptions-item label="支付时间">
                                {{ formatDateTimeText(record.payTime) }}
                            </el-descriptions-item>
                            <el-descriptions-item label="支付流水号">
                                {{ record.payNo || '-' }}
                            </el-descriptions-item>
                            <el-descriptions-item label="支付备注" :span="2">
                                {{ record.remark || '-' }}
                            </el-descriptions-item>
                            <el-descriptions-item label="确认结果" :span="2">
                                {{ record.confirmResult || '-' }}
                            </el-descriptions-item>
                            <el-descriptions-item label="确认备注" :span="2">
                                {{ record.confirmRemark || '-' }}
                            </el-descriptions-item>
                            <el-descriptions-item label="支付截图" :span="2">
                                <div class="payment-record-detail__proof">
                                    <el-image
                                        v-if="record.payProofUrl"
                                        :src="record.payProofUrl"
                                        :preview-src-list="[record.payProofUrl]"
                                        preview-teleported
                                        fit="cover"
                                        style="width: 88px; height: 88px; border-radius: 8px"
                                    />
                                    <span v-else>-</span>
                                </div>
                            </el-descriptions-item>
                        </el-descriptions>
                    </div>
                </div>
                <el-empty v-else description="暂无支付记录" />
            </div>
        </div>
        <template #footer>
            <el-button @click="dialogVisible = false">关闭</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as OrderApi from '@/api/crm/order'
import {
    formatAmount,
    getOptionLabel,
    INSTALLMENT_STATUS_OPTIONS,
    PAY_CONFIRM_STATUS_OPTIONS,
    PAY_STATUS_OPTIONS
} from '../utils'

defineOptions({ name: 'PaymentRecordDetailDialog' })

const dialogVisible = ref(false)
const loading = ref(false)
const detail = ref<OrderApi.OrderDetailRespVO>({ items: [], payRecords: [], refunds: [] } as any)

const installmentStatusText = computed(() =>
    getOptionLabel(INSTALLMENT_STATUS_OPTIONS, detail.value.installmentStatus)
)

const formatDisplayAmount = (value?: number | null) => {
    const amount = formatAmount(value)
    return amount === '-' ? '-' : `¥${amount}`
}

const formatDateTimeText = (value?: string) => dateFormatter(null, null, value as any) || '-'

const payStatusText = (value?: number) => getOptionLabel(PAY_STATUS_OPTIONS, value)

const payConfirmStatusText = (value?: number) => getOptionLabel(PAY_CONFIRM_STATUS_OPTIONS, value)

const open = async (orderId: number) => {
    dialogVisible.value = true
    loading.value = true
    detail.value = { items: [], payRecords: [], refunds: [] } as any
    try {
        detail.value = await OrderApi.getOrder(orderId)
    } finally {
        loading.value = false
    }
}

defineExpose({ open })
</script>

<style scoped>
.payment-record-detail {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.payment-record-detail__summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.payment-record-detail__summary-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px 24px;
    background: #fff7f7;
    border: 1px solid #ffe0e0;
    border-radius: 10px;
}

.payment-record-detail__summary-label {
    font-size: 14px;
    color: #606266;
}

.payment-record-detail__summary-value {
    font-size: 24px;
    line-height: 1.2;
    color: #ff5b57;
}

.payment-record-detail__meta {
    width: 100%;
}

.payment-record-detail__section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.payment-record-detail__section-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.payment-record-detail__list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 520px;
    overflow: auto;
    padding-right: 4px;
}

.payment-record-detail__card {
    padding: 16px;
    border: 1px solid #ebeef5;
    border-radius: 10px;
    background: #fff;
}

.payment-record-detail__card-title {
    margin-bottom: 12px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.payment-record-detail__proof {
    display: flex;
    align-items: center;
    min-height: 88px;
}
</style>
