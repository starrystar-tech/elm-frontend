<template>
    <el-drawer
        v-model="dialogVisible"
        title="工单详情"
        size="720px"
        append-to-body
        :close-on-click-modal="false"
        class="aftersales-detail-drawer"
    >
        <div class="aftersales-detail">
            <section class="aftersales-detail-section">
                <el-descriptions
                    :column="2"
                    border
                    v-loading="loading"
                    class="aftersales-detail-descriptions"
                >
                    <el-descriptions-item label="工单号">{{
                        detail?.ticketNo || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="客户编号">{{
                        detail?.customerId || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="客户">{{
                        detail?.customerName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="联系电话">
                        <MobileCopyInline :clue-id="detail?.clueId" :mobile="detail?.customerMobile" />
                    </el-descriptions-item>
                    <el-descriptions-item label="关联订单号">{{
                        detail?.orderNo || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="报名时间">{{
                        formatDateTime(detail?.enrollTime)
                    }}</el-descriptions-item>
                    <el-descriptions-item label="报名分校">{{
                        detail?.campusName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="分期状态">{{
                        installmentStatusLabel
                    }}</el-descriptions-item>
                    <el-descriptions-item label="尾款渠道" :span="2">{{
                        detail?.finalPaymentChannel || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="工单来源">{{ sourceLabel }}</el-descriptions-item>
                    <el-descriptions-item label="优先级">{{ priorityLabel }}</el-descriptions-item>
                    <el-descriptions-item label="状态">{{ statusLabel }}</el-descriptions-item>
                    <el-descriptions-item label="处理人">{{
                        detail?.handlerUserName || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{
                        formatDateTime(detail?.createTime)
                    }}</el-descriptions-item>
                    <el-descriptions-item label="领取时间">{{
                        formatDateTime(detail?.receiveTime)
                    }}</el-descriptions-item>
                    <el-descriptions-item label="最后处理时间">{{
                        formatDateTime(detail?.processTime)
                    }}</el-descriptions-item>
                    <el-descriptions-item label="处理结果">{{ resultLabel }}</el-descriptions-item>
                    <el-descriptions-item label="退款金额">
                        ￥{{ formatAftersalesCentAmount(detail?.refundAmount) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="挽单金额">
                        ￥{{ formatAftersalesCentAmount(detail?.retainAmount) }}
                    </el-descriptions-item>
                    <el-descriptions-item label="投诉标签" :span="2">{{
                        formatComplaintTags(detail?.complaintTags)
                    }}</el-descriptions-item>
                    <el-descriptions-item label="申请原因" :span="2">{{
                        detail?.reason || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="补充备注" :span="2">{{
                        detail?.remark || '--'
                    }}</el-descriptions-item>
                    <el-descriptions-item label="工单附件" :span="2">
                        <div v-if="detail?.attachmentUrl" class="aftersales-detail-attachment">
                            <el-link
                                :href="detail.attachmentUrl"
                                :underline="false"
                                target="_blank"
                                type="primary"
                            >
                                {{ attachmentName }}
                            </el-link>
                            <el-link
                                :underline="false"
                                type="primary"
                                @click="handleDownloadAttachment"
                            >
                                下载
                            </el-link>
                        </div>
                        <span v-else>--</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="最后处理备注" :span="2">{{
                        detail?.processResult || '--'
                    }}</el-descriptions-item>
                </el-descriptions>
            </section>
            <section class="aftersales-detail-section">
                <div class="aftersales-detail-section__header">学员合同附件</div>
            <el-table
                :data="contractList"
                border
                size="small"
                v-loading="contractLoading"
                empty-text="暂无合同附件"
                class="aftersales-detail-table"
            >
                <el-table-column prop="contractNo" label="合同编号" min-width="150" show-overflow-tooltip />
                <el-table-column prop="orderNo" label="订单编号" min-width="150" show-overflow-tooltip />
                <el-table-column prop="docTitle" label="合同名称" min-width="180" show-overflow-tooltip />
                <el-table-column label="合同状态" width="100">
                    <template #default="{ row }">
                        <el-tag :type="getContractStatusType(row.status)">
                            {{ row.statusDesc || getContractStatusLabel(row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" width="160">
                    <template #default="{ row }">
                        {{ formatDateTime(row.createTime) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="80" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="handlePreviewContract(row)">
                            查看
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            </section>
            <section class="aftersales-detail-section">
                <div class="aftersales-detail-section__header">历史售后工单</div>
            <el-table
                :data="detail?.historyTickets || []"
                border
                size="small"
                v-loading="loading"
                empty-text="暂无历史工单"
                class="aftersales-detail-table"
            >
                <el-table-column label="工单号" min-width="150" show-overflow-tooltip>
                    <template #default="{ row }">
                        <span>{{ row.ticketNo || '--' }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="orderNo" label="关联订单号" min-width="150" show-overflow-tooltip />
                <el-table-column label="状态" width="90">
                    <template #default="{ row }">
                        {{ getAftersalesStatusLabel(row.status) }}
                    </template>
                </el-table-column>
                <el-table-column label="处理结果" width="110">
                    <template #default="{ row }">
                        {{ getAftersalesResultLabel(row.aftersalesResult) }}
                    </template>
                </el-table-column>
                <el-table-column prop="handlerUserName" label="处理人" width="100" />
                <el-table-column label="创建时间" width="160">
                    <template #default="{ row }">
                        {{ formatDateTime(row.createTime) }}
                    </template>
                </el-table-column>
                <el-table-column prop="reason" label="申请原因" min-width="160" show-overflow-tooltip />
            </el-table>
            </section>
            <section v-if="detail?.processLogs?.length" class="aftersales-detail-section">
                <div class="aftersales-detail-section__header">处理日志</div>
            <el-timeline class="aftersales-detail-timeline">
                <el-timeline-item
                    v-for="(log, index) in detail.processLogs"
                    :key="index"
                    :timestamp="formatDateTime(log.processTime)"
                    placement="top"
                    type="primary"
                    hollow
                >
                    <div class="aftersales-log-card">
                        <div class="aftersales-log-card__header">
                            <span
                                >处理人：<strong>{{ log.handlerUserName || '--' }}</strong></span
                            >
                            <el-tag size="small" type="success">
                                {{ log.aftersalesResultDesc || '--' }}
                            </el-tag>
                        </div>
                        <div
                            v-if="shouldShowLogRefundAmount(log.aftersalesResult)"
                            class="aftersales-log-card__row"
                        >
                            退款金额：￥{{ formatAftersalesCentAmount(log.refundAmount) }}
                        </div>
                        <div
                            v-if="shouldShowLogRetainAmount(log.aftersalesResult)"
                            class="aftersales-log-card__row"
                        >
                            挽回金额：￥{{ formatAftersalesCentAmount(log.retainAmount) }}
                        </div>
                        <div v-if="log.remark" class="aftersales-log-card__row">
                            备注：{{ log.remark }}
                        </div>
                    </div>
                </el-timeline-item>
            </el-timeline>
            </section>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import * as AftersalesApi from '@/api/crm/aftersales'
import * as ContractApi from '@/api/system/contract'
import { getFileNameFromUrl } from '@/utils/file'
import { formatDate } from '@/utils/formatTime'
import MobileCopyInline from '@/views/crm/clue/MobileCopyInline.vue'
import {
    getAftersalesPriorityLabel,
    getAftersalesStatusLabel,
    getAftersalesSourceLabel,
    getAftersalesResultLabel,
    getAftersalesInstallmentStatusLabel,
    formatAftersalesCentAmount,
    formatComplaintTags
} from '../config'

defineOptions({ name: 'AftersalesDetailDialog' })

const dialogVisible = ref(false)
const loading = ref(false)
const contractLoading = ref(false)
const detail = ref<AftersalesApi.AftersalesRespVO>()
const contractList = ref<ContractApi.ContractPageRespVO[]>([])
const formatDateTime = (value?: string | Date) => (value ? formatDate(value as Date) : '--')

const sourceLabel = computed(() => getAftersalesSourceLabel(detail.value?.source))
const priorityLabel = computed(() => getAftersalesPriorityLabel(detail.value?.priority))
const statusLabel = computed(() => getAftersalesStatusLabel(detail.value?.status))
const resultLabel = computed(() => getAftersalesResultLabel(detail.value?.aftersalesResult))
const installmentStatusLabel = computed(() =>
    getAftersalesInstallmentStatusLabel(detail.value?.installmentStatus)
)
const attachmentName = computed(() =>
    detail.value?.attachmentUrl ? getFileNameFromUrl(detail.value.attachmentUrl) : '--'
)

const getContractStatusLabel = (value?: number) => {
    const statusMap: Record<number, string> = {
        1: '待签署',
        2: '已拒签',
        3: '已撤销',
        4: '已签署',
        5: '已废弃'
    }
    return statusMap[Number(value)] || '--'
}

const getContractStatusType = (value?: number) => {
    const status = Number(value)
    if (status === 4) return 'success'
    if (status === 1) return 'warning'
    if ([2, 3, 5].includes(status)) return 'info'
    return undefined
}

const loadContracts = async (clueId?: number) => {
    contractList.value = []
    if (!clueId) return
    contractLoading.value = true
    try {
        contractList.value = await ContractApi.getContractListByClue(Number(clueId))
    } finally {
        contractLoading.value = false
    }
}

const handlePreviewContract = async (row: ContractApi.ContractPageRespVO) => {
    const url = await ContractApi.getContractPreviewUrl(row.id)
    if (!url) {
        message.warning('未获取到合同查看链接')
        return
    }
    window.open(url, '_blank')
}

const triggerBrowserDownload = (url: string, fileName: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

const handleDownloadAttachment = () => {
    const url = detail.value?.attachmentUrl
    if (!url) {
        message.warning('未获取到附件下载链接')
        return
    }
    const fileName = attachmentName.value || 'attachment'
    fetch(url, { credentials: 'include' })
        .then(async (response) => {
            if (!response.ok) {
                throw new Error(`download failed: ${response.status}`)
            }
            const blob = await response.blob()
            const blobUrl = URL.createObjectURL(blob)
            triggerBrowserDownload(blobUrl, fileName)
            window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
        })
        .catch(() => {
            message.error('附件下载失败，请稍后重试')
        })
}

const shouldShowLogRefundAmount = (aftersalesResult?: number) => Number(aftersalesResult) === 3

const shouldShowLogRetainAmount = (aftersalesResult?: number) =>
    [2, 3].includes(Number(aftersalesResult))

const message = useMessage()

const open = async (id: number) => {
    dialogVisible.value = true
    loading.value = true
    detail.value = undefined
    contractList.value = []
    try {
        detail.value = await AftersalesApi.getAftersales(id)
    } finally {
        loading.value = false
    }
    await loadContracts(detail.value?.clueId)
}
defineExpose({ open })
</script>

<style scoped lang="scss">
:global(.aftersales-detail-drawer .el-drawer__header) {
    padding: 20px 22px 16px;
    margin-bottom: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

:global(.aftersales-detail-drawer .el-drawer__body) {
    padding: 18px 22px 24px;
    background: linear-gradient(180deg, #f7f9fc 0%, #ffffff 42%);
}

.aftersales-detail {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.aftersales-detail-section {
    padding: 16px;
    overflow: hidden;
    background: #fff;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    box-shadow: 0 8px 22px rgb(31 45 61 / 5%);
}

.aftersales-detail-section:first-child {
    padding: 0;
}

.aftersales-detail-section__header {
    position: relative;
    margin-bottom: 14px;
    padding-left: 12px;
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
    color: var(--el-text-color-primary);
}

.aftersales-detail-section__header::before {
    position: absolute;
    top: 1px;
    bottom: 1px;
    left: 0;
    width: 4px;
    content: '';
    background: var(--el-color-primary);
    border-radius: 4px;
}

.aftersales-detail-descriptions {
    :deep(.el-descriptions__body) {
        background: #fff;
    }

    :deep(.el-descriptions__label) {
        width: 116px;
        font-weight: 600;
        color: var(--el-text-color-regular);
        background: #f5f7fb;
    }

    :deep(.el-descriptions__content) {
        color: var(--el-text-color-primary);
    }
}

.aftersales-detail-table {
    border-radius: 8px;

    :deep(.el-table__header th) {
        color: var(--el-text-color-regular);
        background: #f7f9fc;
    }

    :deep(.el-table__empty-block) {
        min-height: 72px;
    }
}

.aftersales-detail-attachment {
    display: flex;
    align-items: center;
    gap: 16px;
    min-height: 22px;
}

.aftersales-detail-timeline {
    padding-left: 4px;
    margin: 0;
}

.aftersales-log-card {
    padding: 14px 16px;
    background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
}

.aftersales-log-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    color: var(--el-text-color-primary);
}

.aftersales-log-card__row {
    margin-top: 8px;
    font-size: 13px;
    line-height: 20px;
    color: var(--el-text-color-regular);
}
</style>
