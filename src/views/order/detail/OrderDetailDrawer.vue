<template>
    <el-drawer
        v-model="drawerVisible"
        direction="rtl"
        size="1200px"
        append-to-body
        title="订单详情"
        :close-on-click-modal="false"
        class="order-detail-drawer"
    >
        <div class="order-detail-drawer__shell">
            <div class="order-detail-drawer__body">
                <div v-loading="loading">
                    <DetailHeroCard
                        :avatar-text="orderAvatarText"
                        :title="detail.customerName || detail.orderNo || '--'"
                        class="mb-16px"
                    >
                        <template #subline>
                            <span>订单编号：{{ detail.orderNo || '-' }}</span>
                            <span>客户编号：{{ detail.customerId || '-' }}</span>
                            <span>订单状态：{{ orderStatusLabel(detail.orderStatus) }}</span>
                            <span>订单归属：{{ orderOwnerText }}</span>
                        </template>
                        <template #actions>
                            <el-button
                                v-if="canSignContractOrder"
                                plain
                                :disabled="!canSignContract"
                                @click="handleContractSign()"
                                >签署合同</el-button
                            >
                            <el-button plain @click="handlePay">支付</el-button>
                            <el-button v-if="canRefundOrder" plain @click="handleRefund">退款</el-button>
                            <el-button v-if="canVoidOrder" plain @click="handleVoid">作废</el-button>
                            <el-button v-if="canRepurchaseOrder" plain @click="handleRepurchase"
                                >复购激活</el-button
                            >
                        </template>
                    </DetailHeroCard>
                    <ContentWrap class="mb-16px">
                        <div class="flex flex-wrap items-start justify-between gap-16px p-16px">
                            <div class="order-detail-summary">
                                <div class="order-detail-summary__title">订单基本信息</div>
                                <el-descriptions :column="4" border>
                                    <el-descriptions-item label="订单编号">{{
                                        detail.orderNo || '-'
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="报名时间">{{
                                        formatDateTimeText(detail.createTime) || '-'
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="订单状态">{{
                                        orderStatusLabel(detail.orderStatus)
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="订单归属">{{
                                        orderOwnerText
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="分期状态">{{
                                        installmentStatusText
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="尾款渠道">{{
                                        detail.finalPaymentChannel || '-'
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="应付金额">{{
                                        `￥${formatAmount(detail.payableAmount)}`
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="已付金额">{{
                                        `￥${formatAmount(detail.paidAmount)}`
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="已退费金额">{{
                                        `￥${formatAmount(detail.refundAmount)}`
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="商品编号">{{
                                        firstProduct.productCode || detail.mainProductCode || '-'
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="商品名称">{{
                                        firstProduct.productName || detail.mainProductName || '-'
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="商品分类">{{
                                        firstProduct.productCategoryPath ||
                                        detail.mainProductCategoryPath ||
                                        '-'
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="商品价格">{{
                                        formatCurrencyText(firstProduct.productPrice)
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="商品应付金额">{{
                                        formatCurrencyText(firstProduct.payableAmount)
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="商品到期时间">{{
                                        formatExpireTimeText(
                                            firstProduct.expireTime,
                                            detail.expireTime
                                        )
                                    }}</el-descriptions-item>
                                    <el-descriptions-item label="备注" :span="2">{{
                                        detail.remark || '-'
                                    }}</el-descriptions-item>
                                </el-descriptions>
                            </div>
                        </div>
                    </ContentWrap>

                    <ContentWrap>
                        <el-tabs v-model="activeTab" class="p-16px">
                            <el-tab-pane label="学员信息" name="student">
                                <div class="order-detail-student p-10px">
                                    <el-descriptions :column="4" border>
                                        <el-descriptions-item label="姓名">{{
                                            detail.customerName || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="性别">{{
                                            genderText
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="手机号">
                                            <MobileCopyInline
                                                :clue-id="detail.clueId"
                                                :mobile="detail.customerMobile"
                                            />
                                        </el-descriptions-item>
                                        <el-descriptions-item label="手机号2">
                                            <MobileCopyInline
                                                :clue-id="detail.clueId"
                                                :mobile="detail.customerMobile2"
                                                mobile-field="mobile2"
                                            />
                                        </el-descriptions-item>
                                        <el-descriptions-item label="地区" :span="2">{{
                                            areaText
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="微信">{{
                                            detail.wechat || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="微信2">{{
                                            detail.wechat2 || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="QQ">{{
                                            detail.qq || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="证件类型">{{
                                            detail.certificateType || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="证件号码">{{
                                            detail.idCardNo || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="最高学历">{{
                                            educationText
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="职业">{{
                                            detail.occupation || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="紧急联系号码">{{
                                            detail.emergencyMobile || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="紧急联系人">{{
                                            detail.emergencyContact || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="客户编号">{{
                                            detail.customerId || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="客户状态">{{
                                            consultBasicInfo?.statusName || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="意向度">{{
                                            consultBasicInfo?.intentLevelName || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="来源">{{
                                            consultBasicInfo?.clueSourceName || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="咨询项目">{{
                                            consultBasicInfo?.consultProjectName || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="名片归属">{{
                                            consultBasicInfo?.ownerName ||
                                            detail.cardOwnerUserName ||
                                            '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="归属部门">{{
                                            consultBasicInfo?.departmentName || '-'
                                        }}</el-descriptions-item>
                                        <el-descriptions-item label="标签" :span="2">{{
                                            consultTagText
                                        }}</el-descriptions-item>
                                    </el-descriptions>
                                </div>
                            </el-tab-pane>
                            <el-tab-pane label="预约记录" name="appointments">
                                <el-table
                                    v-if="consultAppointments.length"
                                    :data="consultAppointments"
                                    border
                                >
                                    <el-table-column
                                        prop="appointmentTypeName"
                                        label="操作类型"
                                        min-width="120"
                                    />
                                    <el-table-column label="预约时间" min-width="160">
                                        <template #default="{ row }">
                                            {{ formatDateTimeText(row.appointmentTime) }}
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="campusName"
                                        label="分校"
                                        min-width="140"
                                    />
                                    <el-table-column label="咨询项目" min-width="180">
                                        <template #default="{ row }">
                                            {{
                                                row.projectName ||
                                                row.productCategoryName ||
                                                row.productName ||
                                                '-'
                                            }}
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="预约价格" min-width="120">
                                        <template #default="{ row }">
                                            {{
                                                row.appointmentPrice !== undefined
                                                    ? formatAmount(row.appointmentPrice)
                                                    : '-'
                                            }}
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="记录人" min-width="120">
                                        <template #default="{ row }">
                                            {{ row.creatorName || row.creator || '-' }}
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="创建时间" min-width="160">
                                        <template #default="{ row }">
                                            {{ formatDateTimeText(row.createTime) }}
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="consultContent"
                                        label="备注"
                                        min-width="220"
                                    />
                                </el-table>
                                <el-empty
                                    v-else
                                    description="暂无咨询记录"
                                    :image-size="60"
                                    class="order-consult-section__empty"
                                />
                            </el-tab-pane>
                            <el-tab-pane label="商品信息" name="goods">
                                <el-table :data="detail.items || []" border>
                                    <el-table-column
                                        prop="productCategoryPath"
                                        label="商品分类"
                                        min-width="160"
                                    />
                                    <el-table-column
                                        prop="productCode"
                                        label="商品编码"
                                        min-width="120"
                                    />
                                    <el-table-column
                                        prop="productName"
                                        label="商品名称"
                                        min-width="180"
                                    />
                                    <el-table-column
                                        prop="productPrice"
                                        label="商品价格"
                                        min-width="100"
                                    >
                                        <template #default="{ row }">{{
                                            formatAmount(row.productPrice)
                                        }}</template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="payableAmount"
                                        label="应付金额"
                                        min-width="100"
                                    >
                                        <template #default="{ row }">{{
                                            formatAmount(row.payableAmount)
                                        }}</template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="expireTime"
                                        label="到期时间"
                                        min-width="120"
                                    >
                                        <template #default="{ row }">{{
                                            formatDateTimeText(row.expireTime)
                                        }}</template>
                                    </el-table-column>
                                    <el-table-column label="操作" min-width="120" fixed="right">
                                        <template #default="{ row }">
                                            <el-button
                                                v-if="canSignContractOrder"
                                                link
                                                type="success"
                                                :disabled="!canSignContract"
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
                                    <el-table-column
                                        prop="payMethod"
                                        label="支付方式"
                                        min-width="120"
                                    />
                                    <el-table-column
                                        prop="payAmount"
                                        label="支付金额"
                                        min-width="100"
                                    >
                                        <template #default="{ row }">{{
                                            formatAmount(row.payAmount)
                                        }}</template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="payStatus"
                                        label="支付状态"
                                        min-width="100"
                                    >
                                        <template #default="{ row }">{{
                                            payStatusLabel(row.payStatus)
                                        }}</template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="payNo"
                                        label="支付流水号"
                                        min-width="200"
                                    />
                                    <el-table-column
                                        prop="payProofUrl"
                                        label="支付凭证"
                                        min-width="120"
                                    >
                                        <template #default="{ row }">
                                            <el-image
                                                v-if="row.payProofUrl"
                                                :src="row.payProofUrl"
                                                :preview-src-list="[row.payProofUrl]"
                                                preview-teleported
                                                fit="cover"
                                                style="width: 48px; height: 48px; border-radius: 6px"
                                            />
                                            <span v-else>-</span>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="payTime"
                                        label="支付时间"
                                        min-width="180"
                                    >
                                        <template #default="{ row }"
                                            >{{ formatDateTimeText(row.payTime) }}
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="remark"
                                        label="支付备注"
                                        min-width="180"
                                    >
                                        <template #default="{ row }">
                                            {{ row.remark || '-' }}
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="confirmStatus"
                                        label="财务确认"
                                        min-width="100"
                                    >
                                        <template #default="{ row }">{{
                                            payConfirmStatusLabel(row.confirmStatus)
                                        }}</template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="confirmResult"
                                        label="确认结果"
                                        min-width="140"
                                    />
                                    <el-table-column label="操作" min-width="100" fixed="right">
                                        <template #default="{ row }">
                                            <el-button
                                                v-if="row.confirmStatus === 10"
                                                link
                                                type="primary"
                                                @click="handleEditPayRecord(row)"
                                            >
                                                修改
                                            </el-button>
                                            <span v-else>-</span>
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </el-tab-pane>
                            <el-tab-pane label="退款记录" name="refunds">
                                <el-table :data="detail.refunds || []" border>
                                    <el-table-column
                                        prop="refundNo"
                                        label="退款单号"
                                        min-width="180"
                                    />
                                    <el-table-column
                                        prop="refundMethod"
                                        label="退款方式"
                                        min-width="110"
                                    />
                                    <el-table-column
                                        prop="refundType"
                                        label="退款类型"
                                        min-width="100"
                                    >
                                        <template #default="{ row }">{{
                                            refundTypeLabel(row.refundType)
                                        }}</template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="refundAmount"
                                        label="退款金额"
                                        min-width="100"
                                    >
                                        <template #default="{ row }">{{
                                            formatAmount(row.refundAmount)
                                        }}</template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="refundStatus"
                                        label="退款状态"
                                        min-width="100"
                                    >
                                        <template #default="{ row }">{{
                                            refundStatusLabel(row.refundStatus)
                                        }}</template>
                                    </el-table-column>
                                    <el-table-column
                                        prop="refundReason"
                                        label="退款原因"
                                        min-width="160"
                                    />
                                    <el-table-column
                                        prop="refundRemark"
                                        label="退款备注"
                                        min-width="160"
                                    />
                                </el-table>
                            </el-tab-pane>
                        </el-tabs>
                    </ContentWrap>
                </div>
            </div>
        </div>
    </el-drawer>

    <RefundDialog ref="refundRef" @success="handleRefundSuccess" />
    <OrderPayDialog ref="payDialogRef" @success="handlePaySuccess" />
    <OrderContractSignDialog ref="contractSignRef" @success="handleContractSignSuccess" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import * as CustomerDetailApi from '@/api/crm/customerDetail'
import * as OrderApi from '@/api/crm/order'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { resolveTimestamp } from '@/utils/formatTime'
import MobileCopyInline from '@/views/crm/clue/MobileCopyInline.vue'
import DetailHeroCard from '@/views/crm/components/DetailHeroCard.vue'
import OrderContractSignDialog from './OrderContractSignDialog.vue'
import OrderPayDialog from '../components/OrderPayDialog.vue'
import RefundDialog from '../refund/RefundDialog.vue'
import {
    canSignOrderContract,
    INSTALLMENT_STATUS_OPTIONS,
    ORDER_STATUS_OPTIONS,
    PAY_CONFIRM_STATUS_OPTIONS,
    PAY_STATUS_OPTIONS,
    REFUND_STATUS_OPTIONS,
    REFUND_TYPE_OPTIONS,
    formatAmount,
    getOptionLabel,
    getRemainingAmount
} from '../utils'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'OrderDetailDrawer' })

const message = useMessage()
const drawerVisible = ref(false)
const loading = ref(false)
const refundRef = ref<InstanceType<typeof RefundDialog>>()
const contractSignRef = ref<InstanceType<typeof OrderContractSignDialog>>()
const payDialogRef = ref<InstanceType<typeof OrderPayDialog>>()
const detail = ref<OrderApi.OrderDetailRespVO>({ items: [], payRecords: [], refunds: [] } as any)
const consultBasicInfo = ref<CustomerDetailApi.CustomerBasicInfoRespVO>()
const consultAppointments = ref<CustomerDetailApi.CustomerAppointmentRespVO[]>([])
const activeTab = ref('student')
const canRepurchaseOrder = hasPermission(['crm:order:repurchase', 'crm:order:my-repurchase'])
const canSignContractOrder = hasPermission(['crm:order:sign-contract', 'crm:order:my-sign-contract'])
const canRefundOrder = hasPermission(['crm:order-refund:create', 'crm:order:my-refund'])
const canVoidOrder = hasPermission(['crm:order:void', 'crm:order:my-void'])
const orderAvatarText = computed(() => (detail.value.customerName || '订').slice(0, 1))
const firstProduct = computed(() => detail.value.items?.[0] || ({} as OrderApi.OrderItemRespVO))

const orderStatusLabel = (value?: number) => getOptionLabel(ORDER_STATUS_OPTIONS, value)
const payStatusLabel = (value?: number) => getOptionLabel(PAY_STATUS_OPTIONS, value)
const payConfirmStatusLabel = (value?: number) => getOptionLabel(PAY_CONFIRM_STATUS_OPTIONS, value)
const refundStatusLabel = (value?: number) => getOptionLabel(REFUND_STATUS_OPTIONS, value)
const refundTypeLabel = (value?: number) => getOptionLabel(REFUND_TYPE_OPTIONS, value)
const installmentStatusText = computed(() =>
    getOptionLabel(INSTALLMENT_STATUS_OPTIONS, detail.value.installmentStatus)
)
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
    detail.value.education === undefined || detail.value.education === null
        ? '-'
        : getDictLabel(DICT_TYPE.CRM_CLUE_EDUCATION, detail.value.education) ||
          String(detail.value.education)
)
const orderOwnerText = computed(() => {
    const owner = detail.value.ownerUserName || '-'
    const campus = detail.value.campusName ? `（${detail.value.campusName}）` : ''
    return `${owner}${campus}`
})
const canSignContract = computed(() => canSignOrderContract(detail.value))
const consultTagText = computed(() => {
    const tags = consultBasicInfo.value?.tags || []
    return tags.length ? tags.map((item) => item.name).join('、') : '-'
})
const formatDateTimeText = (value?: unknown) => {
    if (value === null || value === undefined || value === '') {
        return '-'
    }

    if (Array.isArray(value)) {
        const [year, month, day] = value
        if (
            typeof year === 'number' &&
            typeof month === 'number' &&
            typeof day === 'number' &&
            year >= 2000
        ) {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 00:00:00`
        }
        return '-'
    }

    if (typeof value === 'number') {
        if (!Number.isFinite(value) || value <= 0 || Math.abs(value) < 1000000000) {
            return '-'
        }
        return resolveTimestamp(value)?.format('YYYY-MM-DD HH:mm:ss') || '-'
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed || trimmed === '0') {
            return '-'
        }
        if (trimmed.includes('-') || trimmed.includes('/') || trimmed.includes('T')) {
            return resolveTimestamp(trimmed)?.format('YYYY-MM-DD HH:mm:ss') || trimmed
        }
        const numericValue = Number(trimmed)
        if (
            !Number.isFinite(numericValue) ||
            numericValue <= 0 ||
            Math.abs(numericValue) < 1000000000
        ) {
            return '-'
        }
        return resolveTimestamp(numericValue)?.format('YYYY-MM-DD HH:mm:ss') || '-'
    }

    return String(value)
}
const formatExpireTimeText = (...values: unknown[]) => {
    for (const value of values) {
        const text = formatDateTimeText(value)
        if (text !== '-') {
            return text
        }
    }
    return '-'
}
const formatCurrencyText = (value?: number | null) =>
    value === null || value === undefined ? '-' : `￥${formatAmount(value)}`

const loadConsultInfo = async () => {
    const clueId = detail.value.clueId
    if (!clueId) {
        consultBasicInfo.value = undefined
        consultAppointments.value = []
        return
    }
    const [basicInfo, appointments] = await Promise.all([
        CustomerDetailApi.getCustomerBasicInfo(clueId),
        CustomerDetailApi.getCustomerAppointments({ id: clueId, pageNo: 1, pageSize: 100 })
    ])
    consultBasicInfo.value = basicInfo
    consultAppointments.value = appointments?.list || []
}

const loadDetail = async (id: number) => {
    loading.value = true
    try {
        detail.value = await OrderApi.getOrder(id)
        await loadConsultInfo()
    } finally {
        loading.value = false
    }
}

const open = async (id: number, tab?: string) => {
    drawerVisible.value = true
    activeTab.value = tab || 'student'
    await loadDetail(id)
}

const handlePay = async () => {
    const remain = getRemainingAmount(detail.value.payableAmount, detail.value.paidAmount)
    if (!remain) {
        message.warning('当前订单没有可支付金额')
        return
    }
    payDialogRef.value?.open(detail.value.id, formatAmount(remain))
}

const handleEditPayRecord = (row: OrderApi.OrderPayRecordRespVO) => {
    payDialogRef.value?.open(row.orderId, undefined, row)
}

const handleRefund = async () => {
    refundRef.value?.open(detail.value)
}

const handleVoid = async () => {
    await ElMessageBox.confirm('确认作废当前订单吗？', '提示', { type: 'warning' })
    await OrderApi.voidOrder(detail.value.id)
    message.success('作废成功')
    await loadDetail(detail.value.id)
}

const handleRepurchase = async () => {
    await ElMessageBox.confirm(
        '确认激活当前订单复购吗？激活后客户将加入复购客户，不会生成新订单。',
        '提示',
        { type: 'warning' }
    )
    await OrderApi.repurchaseOrder(detail.value.id)
    message.success('订单复购已激活')
    await loadDetail(detail.value.id)
}

const handleContractSign = (productId?: number) => {
    if (!canSignContract.value) {
        message.warning('订单支付后才可以签署合同')
        return
    }
    contractSignRef.value?.open(detail.value, productId)
}

const handleRefundSuccess = async () => {
    await loadDetail(detail.value.id)
}

const handleContractSignSuccess = async () => {
    await loadDetail(detail.value.id)
}

const handlePaySuccess = async () => {
    await loadDetail(detail.value.id)
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.order-detail-summary {
    flex: 1;
}

.order-detail-summary__title {
    margin-bottom: 12px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}
.order-consult-section__empty {
    padding-top: 8px;
}

.order-detail-drawer__shell {
    height: 100%;
    display: flex;
    flex-direction: column;
}
</style>
