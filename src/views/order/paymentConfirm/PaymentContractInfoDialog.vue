<template>
    <Dialog v-model="dialogVisible" title="合同信息" width="980px" append-to-body>
        <div v-loading="loading" class="payment-contract-detail">
            <el-descriptions :column="4" border class="payment-contract-detail__meta">
                <el-descriptions-item label="订单编号">
                    {{ orderDetail.orderNo || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="客户姓名">
                    {{ orderDetail.customerName || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="客户编号">
                    {{ orderDetail.customerId || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="手机号">
                    {{ orderDetail.customerMobile || '-' }}
                </el-descriptions-item>
            </el-descriptions>

            <el-table v-if="contractList.length" :data="contractList" border>
                <el-table-column prop="contractNo" label="合同编号" min-width="170" />
                <el-table-column prop="docTitle" label="合同名称" min-width="180" show-overflow-tooltip />
                <el-table-column prop="productName" label="商品名称" min-width="180" show-overflow-tooltip />
                <el-table-column label="合同类型" min-width="110">
                    <template #default="{ row }">
                        {{ getContractTypeLabel(row.contractType) }}
                    </template>
                </el-table-column>
                <el-table-column label="合同状态" min-width="110">
                    <template #default="{ row }">
                        <el-tag :type="getContractStatusType(row.status)">
                            {{ row.statusDesc || getContractStatusLabel(row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="支付金额" min-width="110">
                    <template #default="{ row }">
                        {{ formatPayFee(row.payFee) }}
                    </template>
                </el-table-column>
                <el-table-column prop="creatorName" label="操作人" min-width="110" />
                <el-table-column label="创建时间" min-width="170">
                    <template #default="{ row }">
                        {{ formatDateTime(row.createTime) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" min-width="220" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openSignUrlDialog(row)">
                            签署二维码
                        </el-button>
                        <el-button link type="primary" @click="handlePreview(row)">预览</el-button>
                        <el-button link type="primary" @click="handleDownload(row)">下载</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <el-empty v-else description="暂无合同信息" :image-size="60" />
        </div>

        <template #footer>
            <el-button @click="dialogVisible = false">关闭</el-button>
        </template>
    </Dialog>

    <Dialog
        v-model="signUrlDialogVisible"
        title="签署二维码"
        width="560px"
        :fullscreen="false"
        append-to-body
    >
        <div v-loading="signUrlLoading" class="contract-sign-url">
            <div v-if="signUrl" class="contract-sign-url__qr">
                <Qrcode :text="signUrl" :width="220" @done="handleSignQrcodeDone" />
                <div class="contract-sign-url__qr-tip">扫码签署合同</div>
            </div>
            <el-input v-model="signUrl" readonly>
                <template #append>
                    <el-button :disabled="!signUrl" @click="handleCopySignUrl">复制链接</el-button>
                </template>
            </el-input>
        </div>
        <template #footer>
            <el-button @click="signUrlDialogVisible = false">关闭</el-button>
            <el-button :disabled="!signQrcodeDataUrl" @click="handleDownloadSignQrcode">
                下载二维码
            </el-button>
            <el-button :disabled="!signUrl" type="primary" @click="handleCopySignUrl">
                复制链接
            </el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import * as OrderApi from '@/api/crm/order'
import * as ContractApi from '@/api/system/contract'
import { Qrcode } from '@/components/Qrcode'
import { resolveTimestamp } from '@/utils/formatTime'

defineOptions({ name: 'PaymentContractInfoDialog' })

const message = useMessage()
const dialogVisible = ref(false)
const loading = ref(false)
const contractList = ref<ContractApi.ContractPageRespVO[]>([])
const orderDetail = ref<OrderApi.OrderDetailRespVO>({ items: [], payRecords: [], refunds: [] } as any)
const signUrlDialogVisible = ref(false)
const signUrlLoading = ref(false)
const signUrl = ref('')
const signQrcodeDataUrl = ref('')
const currentContract = ref<ContractApi.ContractPageRespVO>()

const formatDateTime = (value?: string | number | Date | null) => {
    if (value === null || value === undefined || value === '' || Number(value) === 0) {
        return '--'
    }
    const resolvedValue = value instanceof Date ? value.getTime() : value
    return resolveTimestamp(resolvedValue)?.format('YYYY-MM-DD HH:mm:ss') || String(value)
}

const formatDownloadFileName = (value: string) =>
    value.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '').trim()

const formatPayFee = (value?: number | null) => {
    if (value === null || value === undefined) return '--'
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return String(value)
    return (numericValue / 1000).toFixed(2)
}

const getContractTypeLabel = (value?: number) => {
    if (Number(value) === 1) return '普通合同'
    if (Number(value) === 2) return '解约合同'
    return '--'
}

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

const openSignUrlDialog = async (row: ContractApi.ContractPageRespVO) => {
    currentContract.value = row
    signUrl.value = ''
    signQrcodeDataUrl.value = ''
    signUrlDialogVisible.value = true
    signUrlLoading.value = true
    try {
        const url = await ContractApi.getContractSignUrl(row.id)
        if (!url) {
            message.warning('未获取到签署链接')
            signUrlDialogVisible.value = false
            return
        }
        signUrl.value = url
    } finally {
        signUrlLoading.value = false
    }
}

const handleCopySignUrl = async () => {
    if (!signUrl.value) {
        message.warning('未获取到签署链接')
        return
    }
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(signUrl.value)
    } else {
        const textarea = document.createElement('textarea')
        textarea.value = signUrl.value
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
    }
    message.success('复制成功')
}

const handleSignQrcodeDone = (url: string) => {
    signQrcodeDataUrl.value = url
}

const handleDownloadSignQrcode = () => {
    if (!signQrcodeDataUrl.value) {
        message.warning('二维码生成中，请稍后再试')
        return
    }
    const contractNo = formatDownloadFileName(
        currentContract.value?.contractNo || currentContract.value?.orderNo || 'contract'
    )
    const link = document.createElement('a')
    link.href = signQrcodeDataUrl.value
    link.download = `签署二维码-${contractNo || 'contract'}.png`
    link.click()
}

const handlePreview = async (row: ContractApi.ContractPageRespVO) => {
    const url = await ContractApi.getContractPreviewUrl(row.id)
    if (!url) {
        message.warning('未获取到预览链接')
        return
    }
    window.open(url, '_blank')
}

const handleDownload = async (row: ContractApi.ContractPageRespVO) => {
    const url = await ContractApi.getContractDownloadUrl(row.id)
    if (!url) {
        message.warning('未获取到下载链接')
        return
    }
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.download = `${formatDownloadFileName(row.contractNo || row.docTitle || 'contract')}.pdf`
    link.click()
}

const open = async (orderId: number) => {
    dialogVisible.value = true
    loading.value = true
    contractList.value = []
    orderDetail.value = { items: [], payRecords: [], refunds: [] } as any
    try {
        const detail = await OrderApi.getOrder(orderId)
        orderDetail.value = detail
        if (detail.clueId) {
            contractList.value = await ContractApi.getContractListByClue(Number(detail.clueId), detail.orderNo)
        }
    } finally {
        loading.value = false
    }
}

defineExpose({ open })
</script>

<style scoped>
.payment-contract-detail {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.payment-contract-detail__meta {
    width: 100%;
}

.contract-sign-url {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.contract-sign-url__qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.contract-sign-url__qr-tip {
    color: var(--el-text-color-secondary);
    font-size: 13px;
}
</style>
