<template>
    <div v-loading="loading">
        <ContentWrap class="mb-16px">
            <div class="flex flex-wrap items-start justify-between gap-16px">
                <div>
                    <div class="mb-8px flex items-center gap-12px">
                        <span class="text-20px font-700">{{ detail.orderNo || '-' }}</span>
                        <el-tag>{{ orderStatusLabel(detail.orderStatus) }}</el-tag>
                    </div>
                    <div
                        class="grid grid-cols-1 gap-y-6px text-[13px] text-[var(--el-text-color-secondary)] md:grid-cols-2 md:gap-x-24px"
                    >
                        <span>客户：{{ detail.customerName || '-' }}</span>
                        <span>客户ID：{{ detail.customerId || '-' }}</span>
                        <span>手机号：{{ detail.customerMobile || '-' }}</span>
                        <span>报名时间：{{ detail.enrollTime || '-' }}</span>
                        <span>项目：{{ detail.projectName || '-' }}</span>
                        <span>报名分校：{{ detail.campusName || '-' }}</span>
                    </div>
                </div>
                <div class="flex flex-wrap gap-8px">
                    <el-button @click="goBack">返回</el-button>
                    <el-button type="primary" plain @click="handlePay">支付</el-button>
                    <el-button type="warning" plain @click="handleRefund">退款</el-button>
                    <el-button type="danger" plain @click="handleVoid">作废</el-button>
                    <el-button type="success" plain @click="handleRepurchase">订单复购</el-button>
                </div>
            </div>
        </ContentWrap>

        <ContentWrap class="mb-16px">
            <el-descriptions :column="3" border>
                <el-descriptions-item label="应付金额">{{ formatAmount(detail.payableAmount) }}</el-descriptions-item>
                <el-descriptions-item label="已付金额">{{ formatAmount(detail.paidAmount) }}</el-descriptions-item>
                <el-descriptions-item label="已退费金额">{{ formatAmount(detail.refundAmount) }}</el-descriptions-item>
                <el-descriptions-item label="合同签署">{{ contractStatusLabel(detail.contractStatus) }}</el-descriptions-item>
                <el-descriptions-item label="订单归属">{{ detail.ownerUserName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="名片归属">{{ detail.cardOwnerUserName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="机构">{{ detail.organizationName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="微信号">{{ detail.wechat || '-' }}</el-descriptions-item>
                <el-descriptions-item label="到期时间">{{ detail.expireTime || '-' }}</el-descriptions-item>
                <el-descriptions-item label="备注" :span="3">{{ detail.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
        </ContentWrap>

        <ContentWrap>
            <el-tabs v-model="activeTab">
                <el-tab-pane label="学员信息" name="student">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="姓名">{{ detail.customerName || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="客户ID">{{ detail.customerId || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="手机号">{{ detail.customerMobile || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="微信号">{{ detail.wechat || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="报名分校">{{ detail.campusName || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="项目">{{ detail.projectName || '-' }}</el-descriptions-item>
                    </el-descriptions>
                </el-tab-pane>
                <el-tab-pane label="商品信息" name="goods">
                    <el-table :data="detail.items || []" border>
                        <el-table-column prop="productCategoryPath" label="商品分类" min-width="160" />
                        <el-table-column prop="productCode" label="商品编码" min-width="120" />
                        <el-table-column prop="productName" label="商品名称" min-width="180" />
                        <el-table-column prop="productPrice" label="商品价格" min-width="100">
                            <template #default="{ row }">{{ formatAmount(row.productPrice) }}</template>
                        </el-table-column>
                        <el-table-column prop="payableAmount" label="应付金额" min-width="100">
                            <template #default="{ row }">{{ formatAmount(row.payableAmount) }}</template>
                        </el-table-column>
                        <el-table-column prop="expireTime" label="到期时间" min-width="120" />
                        <el-table-column prop="contractStatus" label="合同签署" min-width="100">
                            <template #default="{ row }">{{ contractStatusLabel(row.contractStatus) }}</template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>
                <el-tab-pane label="支付记录" name="pays">
                    <el-table :data="detail.payRecords || []" border>
                        <el-table-column prop="payMethod" label="支付方式" min-width="120" />
                        <el-table-column prop="payAmount" label="支付金额" min-width="100">
                            <template #default="{ row }">{{ formatAmount(row.payAmount) }}</template>
                        </el-table-column>
                        <el-table-column prop="payStatus" label="支付状态" min-width="100">
                            <template #default="{ row }">{{ payStatusLabel(row.payStatus) }}</template>
                        </el-table-column>
                        <el-table-column prop="payNo" label="支付流水号" min-width="200" />
                        <el-table-column prop="payTime" label="支付时间" min-width="180" />
                        <el-table-column prop="confirmStatus" label="财务确认" min-width="100">
                            <template #default="{ row }">{{ payConfirmStatusLabel(row.confirmStatus) }}</template>
                        </el-table-column>
                        <el-table-column prop="confirmResult" label="确认结果" min-width="140" />
                    </el-table>
                </el-tab-pane>
                <el-tab-pane label="退款记录" name="refunds">
                    <el-table :data="detail.refunds || []" border>
                        <el-table-column prop="refundNo" label="退款单号" min-width="180" />
                        <el-table-column prop="refundMethod" label="退款方式" min-width="110" />
                        <el-table-column prop="refundType" label="退款类型" min-width="100">
                            <template #default="{ row }">{{ refundTypeLabel(row.refundType) }}</template>
                        </el-table-column>
                        <el-table-column prop="refundAmount" label="退款金额" min-width="100">
                            <template #default="{ row }">{{ formatAmount(row.refundAmount) }}</template>
                        </el-table-column>
                        <el-table-column prop="refundStatus" label="退款状态" min-width="100">
                            <template #default="{ row }">{{ refundStatusLabel(row.refundStatus) }}</template>
                        </el-table-column>
                        <el-table-column prop="refundReason" label="退款原因" min-width="160" />
                        <el-table-column prop="refundRemark" label="退款备注" min-width="160" />
                    </el-table>
                </el-tab-pane>
            </el-tabs>
        </ContentWrap>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import * as OrderApi from '@/api/crm/order'
import {
    CONTRACT_STATUS_OPTIONS,
    ORDER_STATUS_OPTIONS,
    PAY_CONFIRM_STATUS_OPTIONS,
    PAY_STATUS_OPTIONS,
    REFUND_STATUS_OPTIONS,
    REFUND_TYPE_OPTIONS,
    formatAmount,
    getOptionLabel,
    getRefundableAmount,
    getRemainingAmount
} from '../utils'

defineOptions({ name: 'OrderDetail' })

const route = useRoute()
const router = useRouter()
const message = useMessage()
const loading = ref(false)
const detail = ref<OrderApi.OrderDetailRespVO>({ items: [], payRecords: [], refunds: [] } as any)
const activeTab = ref((route.query.tab as string) || 'student')

const orderId = computed(() => Number(route.params.id))

const orderStatusLabel = (value?: number) => getOptionLabel(ORDER_STATUS_OPTIONS, value)
const contractStatusLabel = (value?: number) => getOptionLabel(CONTRACT_STATUS_OPTIONS, value)
const payStatusLabel = (value?: number) => getOptionLabel(PAY_STATUS_OPTIONS, value)
const payConfirmStatusLabel = (value?: number) => getOptionLabel(PAY_CONFIRM_STATUS_OPTIONS, value)
const refundStatusLabel = (value?: number) => getOptionLabel(REFUND_STATUS_OPTIONS, value)
const refundTypeLabel = (value?: number) => getOptionLabel(REFUND_TYPE_OPTIONS, value)

const loadDetail = async () => {
    if (!orderId.value) {
        message.warning('订单参数不正确')
        router.back()
        return
    }
    loading.value = true
    try {
        detail.value = await OrderApi.getOrder(orderId.value)
    } finally {
        loading.value = false
    }
}

const handlePay = async () => {
    const remain = getRemainingAmount(detail.value.payableAmount, detail.value.paidAmount)
    if (!remain) {
        message.warning('当前订单没有可支付金额')
        return
    }
    const amountResult = await ElMessageBox.prompt('请输入支付金额（元）', '订单支付', {
        inputValue: String(remain),
        inputPattern: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
        inputErrorMessage: '请输入正确金额'
    })
    await OrderApi.payOrder({
        orderId: detail.value.id,
        payAmount: Number(amountResult.value),
        payMethod: '微信支付'
    })
    message.success('支付记录已生成，待财务确认')
    await loadDetail()
}

const handleRefund = async () => {
    const refundable = getRefundableAmount(detail.value.paidAmount, detail.value.refundAmount)
    if (!refundable) {
        message.warning('当前订单没有可退款金额')
        return
    }
    const amountResult = await ElMessageBox.prompt('请输入退款金额（元）', '申请退款', {
        inputValue: String(refundable),
        inputPattern: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
        inputErrorMessage: '请输入正确金额'
    })
    const reasonResult = await ElMessageBox.prompt('请输入退款原因', '申请退款', {
        inputValue: '学员申请退费'
    })
    await OrderApi.createRefund({
        orderId: detail.value.id,
        refundMethod: '原路返回',
        refundType: 2,
        refundAmount: Number(amountResult.value),
        refundReason: reasonResult.value,
        refundRemark: ''
    })
    message.success('退款单已创建')
    await loadDetail()
}

const handleVoid = async () => {
    await ElMessageBox.confirm('确认作废当前订单吗？', '提示', { type: 'warning' })
    await OrderApi.voidOrder(detail.value.id)
    message.success('作废成功')
    await loadDetail()
}

const handleRepurchase = async () => {
    await ElMessageBox.confirm('确认基于当前订单创建复购订单吗？', '提示', { type: 'warning' })
    await OrderApi.repurchaseOrder(detail.value.id)
    message.success('复购订单已生成')
    await loadDetail()
}

const goBack = () => {
    router.back()
}

onMounted(() => {
    loadDetail()
})
</script>
