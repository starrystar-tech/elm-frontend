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
                <div v-if="appointments.length" class="record-pagination">
                    <el-pagination
                        background
                        layout="total, prev, pager, next, sizes"
                        :total="appointmentTotal"
                        :current-page="appointmentPageNo"
                        :page-size="appointmentPageSize"
                        :page-sizes="[10, 20, 50, 100]"
                        @current-change="
                            emit('change-appointment-page', {
                                pageNo: $event,
                                pageSize: appointmentPageSize
                            })
                        "
                        @size-change="
                            emit('change-appointment-page', { pageNo: 1, pageSize: $event })
                        "
                    />
                </div>
                <el-empty v-else description="暂无预约记录" :image-size="60" />
            </el-tab-pane>

            <el-tab-pane label="报名记录" name="orders">
                <el-table v-if="orderRecords.length" :data="orderRecords" border>
                    <el-table-column prop="orderNo" label="订单编号" min-width="160" />
                    <el-table-column prop="createTime" label="创建时间" min-width="160">
                        <template #default="{ row }">
                            {{ formatDateTime(row.createTime) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="mainProductName" label="商品名称" min-width="180" />
                    <el-table-column prop="campusName" label="校区" min-width="120" />
                    <el-table-column prop="payableAmount" label="应付金额" min-width="100">
                        <template #default="{ row }">
                            {{ formatAmount(row.payableAmount) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="paidAmount" label="已付金额" min-width="100">
                        <template #default="{ row }">
                            {{ formatAmount(row.paidAmount) }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="ownerUserName" label="归属人" min-width="100" />
                </el-table>
                <div v-if="orderRecords.length" class="record-pagination">
                    <el-pagination
                        background
                        layout="total, prev, pager, next, sizes"
                        :total="orderTotal"
                        :current-page="orderPageNo"
                        :page-size="orderPageSize"
                        :page-sizes="[10, 20, 50, 100]"
                        @current-change="emit('change-order-page', { pageNo: $event, pageSize: orderPageSize })"
                        @size-change="emit('change-order-page', { pageNo: 1, pageSize: $event })"
                    />
                </div>
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
                <div v-if="ticketRecords.length" class="record-pagination">
                    <el-pagination
                        background
                        layout="total, prev, pager, next, sizes"
                        :total="ticketTotal"
                        :current-page="ticketPageNo"
                        :page-size="ticketPageSize"
                        :page-sizes="[10, 20, 50, 100]"
                        @current-change="emit('change-ticket-page', { pageNo: $event, pageSize: ticketPageSize })"
                        @size-change="emit('change-ticket-page', { pageNo: 1, pageSize: $event })"
                    />
                </div>
                <el-empty v-else description="暂无工单记录" :image-size="60" />
            </el-tab-pane>

            <el-tab-pane label="客户轨迹" name="tracks">
                <el-timeline v-if="parsedTrackList.length" class="clue-timeline">
                    <el-timeline-item
                        v-for="item in parsedTrackList"
                        :key="item.id"
                        :hide-timestamp="true"
                        type="primary"
                        hollow
                    >
                        <div class="timeline-card">
                            <div class="timeline-card__header">
                                <span class="timeline-card__title">{{ item.typeName || '轨迹' }}</span>
                                <span class="timeline-card__meta">
                                    操作: {{ item.operator || '--' }} |
                                    {{ formatDateTime(item.createTime) }}
                                </span>
                            </div>
                            <div class="timeline-card__body">
                                <template v-if="item.displayLines.length">
                                    <p
                                        v-for="(line, index) in item.displayLines"
                                        :key="`${item.id}-${index}`"
                                    >
                                        <span v-if="line.type === 'mobile'" class="track-mobile-line">
                                            <span>{{ line.label }}：</span>
                                            <span class="track-mobile-line__value">
                                                {{
                                                    isTrackMobileVisible(item.id, index)
                                                        ? line.value
                                                        : maskTrackMobile(line.value)
                                                }}
                                            </span>
                                            <el-button
                                                link
                                                class="track-mobile-line__toggle"
                                                :aria-label="
                                                    isTrackMobileVisible(item.id, index)
                                                        ? '隐藏手机号'
                                                        : '显示手机号'
                                                "
                                                @click="toggleTrackMobileVisible(item.id, index)"
                                            >
                                                <el-icon>
                                                    <Hide v-if="isTrackMobileVisible(item.id, index)" />
                                                    <View v-else />
                                                </el-icon>
                                            </el-button>
                                        </span>
                                        <template v-else>{{ line.text }}</template>
                                    </p>
                                </template>
                                <p v-else>{{ item.content || '--' }}</p>
                            </div>
                        </div>
                    </el-timeline-item>
                </el-timeline>
                <div v-if="parsedTrackList.length" class="record-pagination">
                    <el-pagination
                        background
                        layout="total, prev, pager, next, sizes"
                        :total="trackTotal"
                        :current-page="trackPageNo"
                        :page-size="trackPageSize"
                        :page-sizes="[10, 20, 50, 100]"
                        @current-change="
                            emit('change-track-page', {
                                pageNo: $event,
                                pageSize: trackPageSize
                            })
                        "
                        @size-change="emit('change-track-page', { pageNo: 1, pageSize: $event })"
                    />
                </div>
                <el-empty v-else description="暂无客户轨迹" :image-size="60" />
            </el-tab-pane>

            <el-tab-pane label="通话记录" name="calls">
                <el-table v-if="outboundCallRecords.length" :data="outboundCallRecords" border>
                    <el-table-column prop="recordNo" label="记录编号" min-width="180" />
                    <el-table-column label="被叫号码" min-width="170">
                        <template #default="{ row }">
                            <OutboundCallMobileCopyInline
                                :record-id="row.id"
                                :clue-id="row.clueId"
                                :mobile="row.calleeMobile"
                            />
                        </template>
                    </el-table-column>
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
                    <el-table-column label="通话时长" min-width="100">
                        <template #default="{ row }">
                            {{ formatCallDuration(row.durationSeconds) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="录音" min-width="340">
                        <template #default="{ row }">
                            <AudioPlayer
                                v-if="row.recordingFileUrl"
                                :src="row.recordingFileUrl"
                                :duration="row.durationSeconds"
                                :record-id="row.id"
                            />
                            <template v-else>--</template>
                        </template>
                    </el-table-column>
                </el-table>
                <div v-if="outboundCallRecords.length" class="record-pagination">
                    <el-pagination
                        background
                        layout="total, prev, pager, next, sizes"
                        :total="outboundCallTotal"
                        :current-page="outboundCallPageNo"
                        :page-size="outboundCallPageSize"
                        :page-sizes="[10, 20, 50, 100]"
                        @current-change="
                            emit('change-outbound-call-page', {
                                pageNo: $event,
                                pageSize: outboundCallPageSize
                            })
                        "
                        @size-change="
                            emit('change-outbound-call-page', { pageNo: 1, pageSize: $event })
                        "
                    />
                </div>
                <el-empty v-else description="暂无通话记录" :image-size="60" />
            </el-tab-pane>

            <el-tab-pane label="短信记录" name="sms">
                <el-table v-if="smsRecords.length" :data="smsRecords" border>
                    <el-table-column prop="createTime" label="创建时间" min-width="160">
                        <template #default="{ row }">
                            {{ formatDateTime(row.createTime) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="手机号" min-width="170">
                        <template #default="{ row }">
                            <SmsLogMobileCopyInline
                                :mobile="row.mobile"
                                :clue-id="clueId"
                                :primary-mobile="primaryMobile"
                                :secondary-mobile="secondaryMobile"
                            />
                        </template>
                    </el-table-column>
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
                <div v-if="smsRecords.length" class="record-pagination">
                    <el-pagination
                        background
                        layout="total, prev, pager, next, sizes"
                        :total="smsTotal"
                        :current-page="smsPageNo"
                        :page-size="smsPageSize"
                        :page-sizes="[10, 20, 50, 100]"
                        @current-change="emit('change-sms-page', { pageNo: $event, pageSize: smsPageSize })"
                        @size-change="emit('change-sms-page', { pageNo: 1, pageSize: $event })"
                    />
                </div>
                <el-empty v-else description="暂无短信记录" :image-size="60" />
            </el-tab-pane>
        </el-tabs>
    </ContentWrap>
</template>

<script lang="ts" setup>
import { Hide, View } from '@element-plus/icons-vue'
import type * as AftersalesApi from '@/api/crm/aftersales'
import type * as ClueApi from '@/api/crm/clue'
import type * as CustomerDetailApi from '@/api/crm/customerDetail'
import type * as OrderApi from '@/api/crm/order'
import type { OutboundCallRecordVO } from '@/api/system/call/record'
import type * as CampusApi from '@/api/system/campus'
import type * as SmsLogApi from '@/api/system/sms/smsLog'
import { ContentWrap } from '@/components/ContentWrap'
import AudioPlayer from '@/components/AudioPlayer/index.vue'
import * as CampusApiService from '@/api/system/campus'
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { resolveTimestamp } from '@/utils/formatTime'
import { getAftersalesStatusLabel } from '@/views/aftersales/config'
import OutboundCallMobileCopyInline from '@/views/crm/call/OutboundCallMobileCopyInline.vue'
import SmsLogMobileCopyInline from '@/views/crm/clue/SmsLogMobileCopyInline.vue'
import { formatAmount } from '@/views/order/utils'

defineOptions({ name: 'CustomerDetailRecords' })

const emit = defineEmits<{
    'change-appointment-page': [payload: { pageNo: number; pageSize: number }]
    'change-order-page': [payload: { pageNo: number; pageSize: number }]
    'change-ticket-page': [payload: { pageNo: number; pageSize: number }]
    'change-track-page': [payload: { pageNo: number; pageSize: number }]
    'change-outbound-call-page': [payload: { pageNo: number; pageSize: number }]
    'change-sms-page': [payload: { pageNo: number; pageSize: number }]
}>()

const activeTabName = ref('reservations')
const props = defineProps<{
    clue?: ClueApi.ClueVO
    clueId?: number
    primaryMobile?: string
    secondaryMobile?: string
    appointments: CustomerDetailApi.CustomerAppointmentRespVO[]
    appointmentTotal: number
    appointmentPageNo: number
    appointmentPageSize: number
    orderRecords: OrderApi.OrderPageRespVO[]
    orderTotal: number
    orderPageNo: number
    orderPageSize: number
    ticketRecords: AftersalesApi.AftersalesRespVO[]
    ticketTotal: number
    ticketPageNo: number
    ticketPageSize: number
    trackList: CustomerDetailApi.CustomerTrackRespVO[]
    trackTotal: number
    trackPageNo: number
    trackPageSize: number
    outboundCallRecords: OutboundCallRecordVO[]
    outboundCallTotal: number
    outboundCallPageNo: number
    outboundCallPageSize: number
    smsRecords: SmsLogApi.SmsLogVO[]
    smsTotal: number
    smsPageNo: number
    smsPageSize: number
}>()
const deptNameMap = ref<Record<number, string>>({})
const userNameMap = ref<Record<number, string>>({})
const campusNameMap = ref<Record<number, string>>({})
const visibleTrackMobileMap = ref<Record<string, boolean>>({})

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

const CLAIM_SOURCE_LABELS: Record<number, string> = {
    3: '复购激活'
}

const TRACK_FIELD_LABELS: Record<string, string> = {
    clueId: '客户编号',
    clueIds: '客户编号',
    silentReason: '静默原因',
    ownerId: '归属人',
    claimSource: '领取来源',
    action: '操作',
    orderNo: '订单编号',
    departmentId: '归属部门',
    seaType: '公海类型',
    externalUserId: '企微客户编号',
    staffUserId: '添加成员',
    source: '客户来源',
    consultProjectId: '咨询项目编号',
    projectId: '咨询项目编号',
    productCategoryId: '商品分类编号',
    productId: '商品编号',
    campusId: '校区编号',
    allocationType: '分配类型',
    ownerUserName: '归属人',
    headteacherUserId: '班主任',
    mobile: '手机号',
    mobile2: '手机号2'
}

const TRACK_FIELD_ORDER = [
    'orderNo',
    'ownerUserName',
    'headteacherUserName',
    'allocationType',
    'claimSource',
    'action',
    'departmentId',
    'ownerUserId',
    'headteacherUserId',
    'orderId'
]

const TRACK_ACTION_LABELS: Record<string, string> = {
    repurchase_activate: '复购激活'
}

const TRACK_HIDDEN_FIELDS = new Set([
    'ownerUserId',
    'ownerId',
    'orderId',
    'headteacherUserId'
])
const TRACK_MOBILE_LINE_PATTERN = /^(手机号|手机号2|联系电话|联系电话2|mobile|mobile2)\s*[:：]\s*(.+)$/

const filterTrackLines = (lines: string[]) =>
    lines.filter((line) => Boolean(String(line || '').trim()))

const parseTrackMobileLine = (line?: string) => {
    const match = String(line || '').trim().match(TRACK_MOBILE_LINE_PATTERN)
    if (!match) return undefined
    return {
        label: TRACK_FIELD_LABELS[match[1]] || match[1],
        value: match[2]?.trim() || ''
    }
}

const maskTrackMobile = (mobile?: string) => {
    const value = String(mobile || '').trim()
    if (!value) return '--'
    if (value.length <= 4) return '*'.repeat(value.length)
    if (value.length <= 7) return `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`
    return `${value.slice(0, 3)}${'*'.repeat(Math.max(4, value.length - 7))}${value.slice(-4)}`
}

const getTrackMobileVisibleKey = (trackId: number | string | undefined, index: number) =>
    `${trackId || 'track'}-${index}`

const isTrackMobileVisible = (trackId: number | string | undefined, index: number) =>
    Boolean(visibleTrackMobileMap.value[getTrackMobileVisibleKey(trackId, index)])

const toggleTrackMobileVisible = (trackId: number | string | undefined, index: number) => {
    const key = getTrackMobileVisibleKey(trackId, index)
    visibleTrackMobileMap.value[key] = !visibleTrackMobileMap.value[key]
}

const getTrackMobileLinesFromContent = (content?: string) => {
    if (!content || !content.trim().startsWith('{')) return []
    try {
        const parsed = JSON.parse(content)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return []
        return ['mobile', 'mobile2']
            .map((key) => {
                const value = (parsed as Record<string, unknown>)[key]
                if (value === null || value === undefined || value === '') return ''
                return `${TRACK_FIELD_LABELS[key]}：${String(value)}`
            })
            .filter(Boolean)
    } catch {
        return []
    }
}

const getFallbackTrackMobileLines = () =>
    [
        { key: 'mobile', value: props.primaryMobile || props.clue?.mobile },
        { key: 'mobile2', value: props.secondaryMobile || props.clue?.mobile2 }
    ]
        .map(({ key, value }) => (value ? `${TRACK_FIELD_LABELS[key]}：${value}` : ''))
        .filter(Boolean)

const ensureTrackMobileLines = (
    lines: string[],
    item: CustomerDetailApi.CustomerTrackRespVO
) => {
    const normalizedLines = filterTrackLines(lines)
    const hasMobileLine = normalizedLines.some((line) => parseTrackMobileLine(line))
    if (hasMobileLine) return normalizedLines
    const contentMobileLines = getTrackMobileLinesFromContent(item.content)
    return [
        ...normalizedLines,
        ...(contentMobileLines.length ? contentMobileLines : getFallbackTrackMobileLines())
    ]
}

const buildTrackDisplayLines = (lines: string[]) =>
    lines.map((line) => {
        const mobileLine = parseTrackMobileLine(line)
        if (mobileLine) {
            return {
                type: 'mobile' as const,
                label: mobileLine.label,
                value: mobileLine.value,
                text: ''
            }
        }
        return {
            type: 'text' as const,
            text: line,
            label: '',
            value: ''
        }
    })

const formatConsultValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return ''
    return String(value)
}

const formatTrackFieldValue = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') return ''
    if (key === 'clueId' || key === 'clueIds') {
        return props.clue?.customerId || String(value)
    }
    if (Array.isArray(value)) {
        return value.filter((item) => item !== null && item !== undefined && item !== '').join('、')
    }
    if (key === 'seaType') {
        return Number(value) === 1 ? '首咨公海' : Number(value) === 2 ? '复购公海' : String(value)
    }
    if (key === 'claimSource') {
        return CLAIM_SOURCE_LABELS[Number(value)] || String(value)
    }
    if (key === 'allocationType') {
        return getDictLabel(DICT_TYPE.CRM_CLUE_ALLOCATION_TYPE, Number(value)) || String(value)
    }
    if (key === 'action') {
        return TRACK_ACTION_LABELS[String(value)] || String(value)
    }
    if (key === 'campusId') {
        return campusNameMap.value[Number(value)] || String(value)
    }
    if (key === 'departmentId') {
        return (
            deptNameMap.value[Number(value)] ||
            (Number(props.clue?.currentDepartmentId) === Number(value)
                ? props.clue?.currentDepartmentName
                : '') ||
            String(value)
        )
    }
    if (key === 'ownerUserName' || key === 'headteacherUserName') {
        return String(value)
    }
    if (key === 'ownerUserId' || key === 'ownerId' || key === 'headteacherUserId') {
        return (
            userNameMap.value[Number(value)] ||
            (Number(props.clue?.currentOwnerId) === Number(value) ? props.clue?.currentOwnerName : '') ||
            String(value)
        )
    }
    if (typeof value === 'boolean') {
        return value ? '是' : '否'
    }
    if (typeof value === 'string' && /time|date/i.test(key)) {
        return formatDateTime(value)
    }
    return String(value)
}

const buildConsultTrackLines = (content?: string) => {
    if (!content || !content.trim().startsWith('{')) {
        return content ? [content] : []
    }
    try {
        const parsed = JSON.parse(content)
        const campusName = campusNameMap.value[Number(parsed.campusId)] || ''
        const consultResultLabel = getDictLabel(
            DICT_TYPE.CRM_CLUE_CONSULT_RESULT,
            Number(parsed.consultResult)
        )
        const consultTypeLabel = getDictLabel(
            DICT_TYPE.CRM_CLUE_CONSULT_TYPE,
            Number(parsed.consultType)
        )
        const invalidTypeLabel = getDictLabel(
            DICT_TYPE.CRM_CLUE_INVALID_TYPE,
            Number(parsed.invalidType)
        )
        const notConnectedReasonLabel = getDictLabel(
            DICT_TYPE.CRM_CLUE_NOT_CONNECTED_REASON,
            Number(parsed.notConnectedReason)
        )
        const lines = [
            consultResultLabel ? `是否有效：${consultResultLabel}` : '',
            consultTypeLabel ? `操作类型：${consultTypeLabel}` : '',
            campusName ? `校区：${campusName}` : '',
            formatConsultValue(parsed.projectId) ? `咨询项目编号：${parsed.projectId}` : '',
            formatConsultValue(parsed.productCategoryId)
                ? `商品分类编号：${parsed.productCategoryId}`
                : '',
            formatConsultValue(parsed.productId) ? `商品编号：${parsed.productId}` : '',
            formatConsultValue(parsed.appointmentPrice)
                ? `预约价格：${parsed.appointmentPrice}`
                : '',
            parsed.appointmentTime ? `预约时间：${formatDateTime(parsed.appointmentTime)}` : '',
            parsed.nextFollowTime ? `下次回访时间：${formatDateTime(parsed.nextFollowTime)}` : '',
            parsed.needRemind !== null && parsed.needRemind !== undefined
                ? `是否提醒：${parsed.needRemind ? '是' : '否'}`
                : '',
            invalidTypeLabel ? `无效类型：${invalidTypeLabel}` : '',
            parsed.invalidReason ? `无效原因：${parsed.invalidReason}` : '',
            notConnectedReasonLabel ? `未接通原因：${notConnectedReasonLabel}` : '',
            parsed.consultContent ? `备注：${parsed.consultContent}` : ''
        ].filter(Boolean)
        return lines.length ? lines : [content]
    } catch {
        return [content]
    }
}

const buildJsonTrackLines = (content?: string) => {
    if (!content || !content.trim().startsWith('{')) {
        return content ? [content] : []
    }
    try {
        const parsed = JSON.parse(content)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return [content]
        }
        const normalizedParsed = { ...(parsed as Record<string, unknown>) }
        if (
            !normalizedParsed.ownerUserName &&
            normalizedParsed.ownerUserId !== null &&
            normalizedParsed.ownerUserId !== undefined
        ) {
            normalizedParsed.ownerUserName = formatTrackFieldValue(
                'ownerUserId',
                normalizedParsed.ownerUserId
            )
        }
        if (
            !normalizedParsed.ownerUserName &&
            normalizedParsed.ownerId !== null &&
            normalizedParsed.ownerId !== undefined
        ) {
            normalizedParsed.ownerUserName = formatTrackFieldValue('ownerId', normalizedParsed.ownerId)
        }
        if (
            !normalizedParsed.headteacherUserName &&
            normalizedParsed.headteacherUserId !== null &&
            normalizedParsed.headteacherUserId !== undefined
        ) {
            normalizedParsed.headteacherUserName = formatTrackFieldValue(
                'headteacherUserId',
                normalizedParsed.headteacherUserId
            )
        }
        if (
            !normalizedParsed.departmentName &&
            normalizedParsed.departmentId !== null &&
            normalizedParsed.departmentId !== undefined
        ) {
            normalizedParsed.departmentName = formatTrackFieldValue(
                'departmentId',
                normalizedParsed.departmentId
            )
        }
        const entries = Object.entries(normalizedParsed)
        const orderedKeys = Array.from(
            new Set([
                ...['clueId', 'clueIds', 'silentReason'].filter((key) => key in normalizedParsed),
                ...TRACK_FIELD_ORDER.filter((key) => key in normalizedParsed),
                ...entries.map(([key]) => key).filter((key) => !TRACK_FIELD_ORDER.includes(key))
            ])
        )
        const lines = orderedKeys
            .map((key) => {
                if (TRACK_HIDDEN_FIELDS.has(key)) return ''
                if (key === 'departmentName') return ''
                const formattedValue = formatTrackFieldValue(key, normalizedParsed[key])
                if (!formattedValue) return ''
                return `${TRACK_FIELD_LABELS[key] || key}：${formattedValue}`
            })
            .filter(Boolean)
        return lines.length ? lines : [content]
    } catch {
        return [content]
    }
}

const loadTrackOptionMaps = async () => {
    try {
        const [depts, users, campuses] = await Promise.all([
            DeptApi.getSimpleDeptList(),
            UserApi.getSimpleUserList(),
            CampusApiService.getSimpleCampusList()
        ])
        deptNameMap.value = Object.fromEntries(
            (depts || []).map((item) => [Number(item.id), item.name || String(item.id)])
        )
        userNameMap.value = Object.fromEntries(
            (users || []).map((item) => [Number(item.id), item.nickname || item.username || String(item.id)])
        )
        campusNameMap.value = Object.fromEntries(
            ((campuses || []) as CampusApi.CampusVO[]).map((item) => [
                Number(item.id),
                item.name || String(item.id)
            ])
        )
    } catch {
        deptNameMap.value = {}
        userNameMap.value = {}
        campusNameMap.value = {}
    }
}

const parsedTrackList = computed(() =>
    (props.trackList || []).map((item) => {
        const lines = (() => {
            const rawContentLines = (item.contentLines || []).filter(Boolean)
            if (rawContentLines.length) {
                if (rawContentLines.length === 1) {
                    const [singleLine] = rawContentLines
                    if (singleLine?.trim().startsWith('{')) {
                        const parsedLines = item.type === 4 || item.typeName === '咨询信息'
                            ? buildConsultTrackLines(singleLine)
                            : buildJsonTrackLines(singleLine)
                        return ensureTrackMobileLines(parsedLines, item)
                    }
                }
                return ensureTrackMobileLines(rawContentLines, item)
            }
            const parsedLines = item.type === 4 || item.typeName === '咨询信息'
                ? buildConsultTrackLines(item.content)
                : buildJsonTrackLines(item.content)
            return ensureTrackMobileLines(parsedLines, item)
        })()
        return {
            ...item,
            lines,
            displayLines: buildTrackDisplayLines(lines)
        }
    })
)

onMounted(() => {
    loadTrackOptionMaps()
})
</script>

<style scoped lang="scss">
.clue-timeline {
    padding-right: 8px;
}

.timeline-card {
    padding: 12px 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-bg-color);
}

.timeline-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
}

.timeline-card__title {
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.timeline-card__meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.timeline-card__body {
    color: var(--el-text-color-regular);
    line-height: 1.6;
    word-break: break-all;
}

.timeline-card__body p {
    margin: 0;
}

.timeline-card__body p + p {
    margin-top: 4px;
}

.track-mobile-line {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.track-mobile-line__value {
    font-family: var(--el-font-family);
    color: var(--el-text-color-primary);
}

.track-mobile-line__toggle {
    height: 20px;
    min-height: 20px;
    padding: 0 2px;
    color: var(--el-color-primary);
    vertical-align: middle;
}

.record-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
}
</style>
