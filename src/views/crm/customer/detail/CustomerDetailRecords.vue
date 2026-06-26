<template>
    <ContentWrap>
        <el-tabs v-model="activeTabName" class="p-10px">
            <el-tab-pane label="预约记录" name="reservations">
                <el-table v-if="appointments.length" :data="appointments" border>
                    <el-table-column prop="appointmentTypeName" label="操作类型" min-width="100" />
                    <el-table-column prop="appointmentTime" label="预约时间" min-width="160">
                        <template #default="{ row }">
                            {{ formatDateTime(row.appointmentTime) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="campusName" label="校区" min-width="120" />
                    <el-table-column label="咨询项目" min-width="160">
                        <template #default="{ row }">
                            {{ row.projectName || '--' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="商品分类" min-width="160">
                        <template #default="{ row }">
                            {{ row.productCategoryName || '--' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="商品名称" min-width="180">
                        <template #default="{ row }">
                            {{ row.productName || '--' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="预约价格" min-width="120">
                        <template #default="{ row }">
                            {{
                                row.appointmentPrice !== undefined && row.appointmentPrice !== null
                                    ? row.appointmentPrice
                                    : '--'
                            }}
                        </template>
                    </el-table-column>
                    <el-table-column label="记录人" min-width="120">
                        <template #default="{ row }">
                            {{ row.creatorName || row.creator || '--' }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="createTime" label="创建时间" min-width="160">
                        <template #default="{ row }">
                            {{ formatDateTime(row.createTime) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="consultContent" label="备注" min-width="220" />
                </el-table>
                <el-empty v-else description="暂无预约记录" :image-size="60" />
            </el-tab-pane>

            <el-tab-pane label="订单列表" name="orders">
                <el-table v-if="orderRecords.length" :data="orderRecords" border>
                    <el-table-column prop="orderNo" label="订单编号" min-width="160" />
                    <el-table-column prop="createTime" label="创建时间" min-width="160">
                        <template #default="{ row }">
                            {{ formatDateTime(row.createTime) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="mainProductName" label="商品名称" min-width="180" />
                    <el-table-column prop="campusName" label="校区" min-width="120" />
                    <el-table-column prop="payableAmount" label="应付金额" min-width="100" />
                    <el-table-column prop="paidAmount" label="已付金额" min-width="100" />
                    <el-table-column prop="ownerUserName" label="归属人" min-width="100" />
                </el-table>
                <el-empty v-else description="暂无订单记录" :image-size="60" />
            </el-tab-pane>

            <el-tab-pane label="工单记录" name="tickets">
                <el-table v-if="ticketRecords.length" :data="ticketRecords" border>
                    <el-table-column prop="ticketNo" label="工单号" min-width="160" />
                    <el-table-column prop="customerName" label="客户姓名" min-width="120" />
                    <el-table-column prop="orderNo" label="订单编号" min-width="160" />
                    <el-table-column prop="handlerUserName" label="处理人" min-width="100" />
                    <el-table-column label="状态" min-width="100">
                        <template #default="{ row }">
                            {{ getAftersalesStatusLabel(row.status) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="reason" label="申请原因" min-width="180" />
                    <el-table-column label="创建时间" min-width="160">
                        <template #default="{ row }">
                            {{ formatDateTime(row.createTime) }}
                        </template>
                    </el-table-column>
                </el-table>
                <el-empty v-else description="暂无工单记录" :image-size="60" />
            </el-tab-pane>

            <el-tab-pane label="通话记录" name="calls">
                <el-table v-if="outboundCallRecords.length" :data="outboundCallRecords" border>
                    <el-table-column prop="recordNo" label="记录编号" min-width="180" />
                    <el-table-column prop="calleeMobile" label="被叫号码" min-width="140" />
                    <el-table-column prop="userNickname" label="主叫" min-width="120" />
                    <el-table-column prop="createTime" label="发起时间" min-width="160">
                        <template #default="{ row }">
                            {{ formatDateTime(row.createTime) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="状态" min-width="100">
                        <template #default="{ row }">
                            {{ row.statusDesc || '--' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="外呼结果" min-width="180">
                        <template #default="{ row }">
                            {{ getCallResultText(row) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="通话时长" min-width="100">
                        <template #default="{ row }">
                            {{ formatCallDuration(row.durationSeconds) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="录音" min-width="220">
                        <template #default="{ row }">
                            <audio
                                v-if="row.recordingFileUrl"
                                controls
                                preload="metadata"
                                :src="row.recordingFileUrl"
                                style="width: 200px"
                            ></audio>
                            <template v-else>--</template>
                        </template>
                    </el-table-column>
                </el-table>
                <el-empty v-else description="暂无通话记录" :image-size="60" />
            </el-tab-pane>

            <el-tab-pane label="短信记录" name="sms">
                <el-table v-if="smsRecords.length" :data="smsRecords" border>
                    <el-table-column prop="createTime" label="创建时间" min-width="160">
                        <template #default="{ row }">
                            {{ formatDateTime(row.createTime) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="mobile" label="手机号" min-width="140" />
                    <el-table-column label="发送状态" min-width="120">
                        <template #default="{ row }">
                            {{ getSmsSendStatusLabel(row.sendStatus) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="接收状态" min-width="120">
                        <template #default="{ row }">
                            {{ getSmsReceiveStatusLabel(row.receiveStatus) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="短信渠道" min-width="140">
                        <template #default="{ row }">
                            {{ getSmsChannelLabel(row.channelCode) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="templateId" label="模板编号" min-width="100" />
                    <el-table-column
                        prop="templateContent"
                        label="短信内容"
                        min-width="260"
                        show-overflow-tooltip
                    />
                </el-table>
                <el-empty v-else description="暂无短信记录" :image-size="60" />
            </el-tab-pane>
        </el-tabs>
    </ContentWrap>
</template>

<script lang="ts" setup>
import type * as AftersalesApi from '@/api/crm/aftersales'
import type * as CustomerDetailApi from '@/api/crm/customerDetail'
import type * as OrderApi from '@/api/crm/order'
import type { OutboundCallRecordVO } from '@/api/system/call/record'
import type * as SmsLogApi from '@/api/system/sms/smsLog'
import { ContentWrap } from '@/components/ContentWrap'
import { getDictLabel } from '@/utils/dict'
import { resolveTimestamp } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { getAftersalesStatusLabel } from '@/views/aftersales/config'

defineOptions({ name: 'CustomerDetailRecords' })

defineProps<{
    appointments: CustomerDetailApi.CustomerAppointmentRespVO[]
    orderRecords: OrderApi.OrderPageRespVO[]
    ticketRecords: AftersalesApi.AftersalesRespVO[]
    outboundCallRecords: OutboundCallRecordVO[]
    smsRecords: SmsLogApi.SmsLogVO[]
}>()

const activeTabName = ref('reservations')

const formatDateTime = (value?: string | number | Date | null) => {
    if (value === null || value === undefined || value === '' || Number(value) === 0) {
        return '--'
    }
    return resolveTimestamp(value)?.format('YYYY-MM-DD HH:mm:ss') || String(value)
}

const getSmsSendStatusLabel = (value?: number | null) => {
    if (value === null || value === undefined) return '--'
    return getDictLabel(DICT_TYPE.SYSTEM_SMS_SEND_STATUS, Number(value)) || '--'
}

const getSmsReceiveStatusLabel = (value?: number | null) => {
    if (value === null || value === undefined) return '--'
    return getDictLabel(DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS, Number(value)) || '--'
}

const getSmsChannelLabel = (value?: string) =>
    value ? getDictLabel(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE, value) || value : '--'

const getCallResultText = (row: OutboundCallRecordVO) =>
    row.failReason || row.hangupCause || row.originateDisposition || row.statusDesc || '--'

const formatCallDuration = (durationSeconds?: number) => {
    if (!durationSeconds || durationSeconds < 0) return '--'
    const totalSeconds = Math.floor(durationSeconds)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
</script>
