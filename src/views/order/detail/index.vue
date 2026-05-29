<template>
    <div v-loading="loading">
        <ContentWrap class="mb-16px">
            <div class="flex flex-wrap items-start justify-between gap-16px">
                <div class="order-detail-summary">
                    <div class="order-detail-summary__item">
                        <span class="label">订单编号：</span>
                        <span>{{ detail.orderNo || '-' }}</span>
                    </div>
                    <div class="order-detail-summary__item">
                        <span class="label">报名时间：</span>
                        <span>{{ detail.enrollTime || '-' }}</span>
                    </div>
                    <div class="order-detail-summary__item">
                        <span class="label">订单状态：</span>
                        <span>{{ orderStatusLabel(detail.orderStatus) }}</span>
                    </div>
                    <div class="order-detail-summary__item">
                        <span class="label">应付金额：</span>
                        <span>￥{{ formatAmount(detail.payableAmount) }}</span>
                    </div>
                    <div class="order-detail-summary__item">
                        <span class="label">已付金额：</span>
                        <span>￥{{ formatAmount(detail.paidAmount) }}</span>
                    </div>
                    <div class="order-detail-summary__item">
                        <span class="label">已退费金额：</span>
                        <span>￥{{ formatAmount(detail.refundAmount) }}</span>
                    </div>
                    <div class="order-detail-summary__item">
                        <span class="label">订单归属：</span>
                        <span>{{ orderOwnerText }}</span>
                    </div>
                    <div class="order-detail-summary__item">
                        <span class="label">备注：</span>
                        <span>{{ detail.remark || '-' }}</span>
                    </div>
                </div>
                <div class="flex flex-wrap gap-8px">
                    <el-button @click="goBack">返回</el-button>
                    <el-button type="success" plain @click="handleContractSign()">签署合同</el-button>
                    <el-button type="primary" plain @click="handlePay">支付</el-button>
                    <el-button type="warning" plain @click="handleRefund">退款</el-button>
                    <el-button type="danger" plain @click="handleVoid">作废</el-button>
                    <el-button type="success" plain @click="handleRepurchase">订单复购</el-button>
                </div>
            </div>
        </ContentWrap>

        <ContentWrap>
            <el-tabs v-model="activeTab">
                <el-tab-pane label="学员信息" name="student">
                    <div class="order-detail-student">
                        <div class="order-detail-student__grid">
                            <div class="order-detail-student__item">
                                <span class="label">姓名</span>
                                <span>{{ detail.customerName || '-' }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">性别</span>
                                <span>{{ genderText }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">手机号</span>
                                <span>{{ detail.customerMobile || '-' }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">手机号2</span>
                                <span>{{ detail.customerMobile2 || '-' }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">地区</span>
                                <span>{{ areaText }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">微信</span>
                                <span>{{ detail.wechat || '-' }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">微信2</span>
                                <span>{{ detail.wechat2 || '-' }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">QQ</span>
                                <span>{{ detail.qq || '-' }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">出生日期</span>
                                <span>{{ detail.birthday || '-' }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">证件类型</span>
                                <span>{{ detail.certificateType || '-' }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">证件号码</span>
                                <span>{{ detail.idCardNo || '-' }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">最高学历</span>
                                <span>{{ educationText }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">职业</span>
                                <span>{{ detail.occupation || '-' }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">紧急联系号码</span>
                                <span>{{ detail.emergencyMobile || '-' }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">紧急联系人</span>
                                <span>{{ detail.emergencyContact || '-' }}</span>
                            </div>
                            <div class="order-detail-student__item">
                                <span class="label">客户ID</span>
                                <span>{{ detail.customerId || '-' }}</span>
                            </div>
                        </div>
                    </div>
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
                        <el-table-column label="操作" min-width="120" fixed="right">
                            <template #default="{ row }">
                                <el-button
                                    link
                                    type="success"
                                    @click="handleContractSign(row.productId)"
                                >
                                    签署合同
                                </el-button>
                            </template>
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

        <RefundDialog ref="refundRef" @success="loadDetail" />
        <OrderContractSignDialog ref="contractSignRef" @success="loadDetail" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import * as OrderApi from '@/api/crm/order'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import OrderContractSignDialog from './OrderContractSignDialog.vue'
import RefundDialog from '../refund/RefundDialog.vue'
import {
    ORDER_STATUS_OPTIONS,
    PAY_CONFIRM_STATUS_OPTIONS,
    PAY_STATUS_OPTIONS,
    REFUND_STATUS_OPTIONS,
    REFUND_TYPE_OPTIONS,
    formatAmount,
    getOptionLabel,
    getRemainingAmount
} from '../utils'

defineOptions({ name: 'OrderDetail' })

const route = useRoute()
const router = useRouter()
const message = useMessage()
const loading = ref(false)
const refundRef = ref<InstanceType<typeof RefundDialog>>()
const contractSignRef = ref<InstanceType<typeof OrderContractSignDialog>>()
const detail = ref<OrderApi.OrderDetailRespVO>({ items: [], payRecords: [], refunds: [] } as any)
const activeTab = ref((route.query.tab as string) || 'student')

const orderId = computed(() => Number(route.params.id))

const orderStatusLabel = (value?: number) => getOptionLabel(ORDER_STATUS_OPTIONS, value)
const payStatusLabel = (value?: number) => getOptionLabel(PAY_STATUS_OPTIONS, value)
const payConfirmStatusLabel = (value?: number) => getOptionLabel(PAY_CONFIRM_STATUS_OPTIONS, value)
const refundStatusLabel = (value?: number) => getOptionLabel(REFUND_STATUS_OPTIONS, value)
const refundTypeLabel = (value?: number) => getOptionLabel(REFUND_TYPE_OPTIONS, value)
const genderText = computed(() => {
    if (detail.value.gender === 1) return '男'
    if (detail.value.gender === 2) return '女'
    return '-'
})
const areaText = computed(() => {
    const value = [detail.value.province, detail.value.city, detail.value.district]
        .filter(Boolean)
        .join(' / ')
    return value || '-'
})
const educationText = computed(() =>
    detail.value.education === undefined
        ? '-'
        : getDictLabel(DICT_TYPE.CRM_CLUE_EDUCATION, detail.value.education) ||
          String(detail.value.education)
)
const orderOwnerText = computed(() => {
    const owner = detail.value.ownerUserName || '-'
    const campus = detail.value.campusName ? `（${detail.value.campusName}）` : ''
    return `${owner}${campus}`
})

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
    refundRef.value?.open(detail.value)
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

const handleContractSign = (productId?: number) => {
    contractSignRef.value?.open(detail.value, productId)
}

const goBack = () => {
    router.back()
}

onMounted(() => {
    loadDetail()
})
</script>

<style scoped lang="scss">
.order-detail-summary {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px 32px;
}

.order-detail-summary__item {
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.order-detail-summary__item .label,
.order-detail-student__item .label {
  margin-right: 4px;
  color: var(--el-text-color-regular);
}

.order-detail-student__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 48px;
}

.order-detail-student__item {
  font-size: 15px;
  color: var(--el-text-color-primary);
}
</style>
