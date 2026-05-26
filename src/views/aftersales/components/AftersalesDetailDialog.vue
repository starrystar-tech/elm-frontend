<template>
    <Dialog v-model="dialogVisible" title="工单详情" width="760px" append-to-body>
        <el-descriptions :column="2" border v-loading="loading">
            <el-descriptions-item label="工单号">{{
                detail?.ticketNo || '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="线索ID">{{ detail?.clueId || '--' }}</el-descriptions-item>
            <el-descriptions-item label="订单编号">{{
                detail?.orderNo || '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="客户">{{
                detail?.customerName || '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{
                detail?.customerMobile || '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="工单类型">{{ typeLabel }}</el-descriptions-item>
            <el-descriptions-item label="优先级">{{ priorityLabel }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ statusLabel }}</el-descriptions-item>
            <el-descriptions-item label="处理人">{{
                detail?.handlerUserName || '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{
                detail?.createTime || '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="领取时间">{{
                detail?.receiveTime || '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="处理时间">{{
                detail?.processTime || '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="退款金额">{{
                detail?.refundAmount ?? '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="申请原因" :span="2">{{
                detail?.reason || '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="补充备注" :span="2">{{
                detail?.remark || '--'
            }}</el-descriptions-item>
            <el-descriptions-item label="处理结果" :span="2">{{
                detail?.processResult || '--'
            }}</el-descriptions-item>
        </el-descriptions>
    </Dialog>
</template>

<script setup lang="ts">
import * as AftersalesApi from '@/api/crm/aftersales'
import {
    getAftersalesPriorityLabel,
    getAftersalesStatusLabel,
    getAftersalesTypeLabel
} from '../config'

defineOptions({ name: 'AftersalesDetailDialog' })

const dialogVisible = ref(false)
const loading = ref(false)
const detail = ref<AftersalesApi.AftersalesRespVO>()

const typeLabel = computed(() => getAftersalesTypeLabel(detail.value?.ticketType))
const priorityLabel = computed(() => getAftersalesPriorityLabel(detail.value?.priority))
const statusLabel = computed(() => getAftersalesStatusLabel(detail.value?.status))

const open = async (id: number) => {
    dialogVisible.value = true
    loading.value = true
    try {
        detail.value = await AftersalesApi.getAftersales(id)
    } finally {
        loading.value = false
    }
}
defineExpose({ open })
</script>
