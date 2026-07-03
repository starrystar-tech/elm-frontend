<template>
    <div class="detail-wrap">
        <CustomerDetailsHeader :clue="clue" :loading="loading">
            <el-button v-hasPermi="['crm:clue:basic-info:update']" type="primary" @click="openForm"
                >编辑</el-button
            >
            <el-button type="default" @click="goBack">返回</el-button>
        </CustomerDetailsHeader>

        <el-col>
            <el-tabs v-model="activeTabName">
                <el-tab-pane label="基本信息" name="basicInfo">
                    <CustomerDetailsInfo :clue="clue" :order-records="orderRecords" :ticket-records="ticketRecords" />
                </el-tab-pane>
            </el-tabs>
            <CustomerDetailRecords
                :clue="clue"
                :clue-id="clue.id"
                :primary-mobile="clue.mobile"
                :secondary-mobile="clue.mobile2"
                :appointments="appointments"
                :appointment-total="appointmentPagination.total"
                :appointment-page-no="appointmentPagination.pageNo"
                :appointment-page-size="appointmentPagination.pageSize"
                :order-records="orderRecords"
                :order-total="orderPagination.total"
                :order-page-no="orderPagination.pageNo"
                :order-page-size="orderPagination.pageSize"
                :ticket-records="ticketRecords"
                :ticket-total="ticketPagination.total"
                :ticket-page-no="ticketPagination.pageNo"
                :ticket-page-size="ticketPagination.pageSize"
                :track-list="trackList"
                :track-total="trackPagination.total"
                :track-page-no="trackPagination.pageNo"
                :track-page-size="trackPagination.pageSize"
                :outbound-call-records="outboundCallRecords"
                :outbound-call-total="outboundCallPagination.total"
                :outbound-call-page-no="outboundCallPagination.pageNo"
                :outbound-call-page-size="outboundCallPagination.pageSize"
                :sms-records="smsRecords"
                :sms-total="smsPagination.total"
                :sms-page-no="smsPagination.pageNo"
                :sms-page-size="smsPagination.pageSize"
                @change-appointment-page="handleAppointmentPageChange"
                @change-order-page="handleOrderPageChange"
                @change-ticket-page="handleTicketPageChange"
                @change-track-page="handleTrackPageChange"
                @change-outbound-call-page="handleOutboundCallPageChange"
                @change-sms-page="handleSmsPageChange"
            />
        </el-col>

        <CustomerForm ref="formRef" @success="getClue" />
    </div>
</template>

<script lang="ts" setup>
import * as AftersalesApi from '@/api/crm/aftersales'
import * as ClueApi from '@/api/crm/clue'
import * as CustomerDetailApi from '@/api/crm/customerDetail'
import * as OrderApi from '@/api/crm/order'
import type { OutboundCallRecordVO } from '@/api/system/call/record'
import type * as SmsLogApi from '@/api/system/sms/smsLog'
import CustomerForm from '@/views/crm/customer/CustomerForm.vue'
import CustomerDetailsInfo from './CustomerDetailsInfo.vue'
import CustomerDetailsHeader from './CustomerDetailsHeader.vue'
import CustomerDetailRecords from './CustomerDetailRecords.vue'
import { useTagsViewStore } from '@/store/modules/tagsView'

defineOptions({ name: 'CrmCustomerDetail' })

const clueId = ref(0)
const clue = ref<ClueApi.ClueVO>({} as ClueApi.ClueVO)
const loading = ref(true)
const activeTabName = ref('basicInfo')
const formRef = ref<InstanceType<typeof CustomerForm>>()
const message = useMessage()
const { delView } = useTagsViewStore()
const { push, currentRoute } = useRouter()
const { params } = useRoute()
const appointments = ref<CustomerDetailApi.CustomerAppointmentRespVO[]>([])
const orderRecords = ref<OrderApi.OrderPageRespVO[]>([])
const ticketRecords = ref<AftersalesApi.AftersalesRespVO[]>([])
const trackList = ref<CustomerDetailApi.CustomerTrackRespVO[]>([])
const smsRecords = ref<SmsLogApi.SmsLogVO[]>([])
const outboundCallRecords = ref<OutboundCallRecordVO[]>([])
const appointmentPagination = reactive({ pageNo: 1, pageSize: 10, total: 0 })
const orderPagination = reactive({ pageNo: 1, pageSize: 10, total: 0 })
const ticketPagination = reactive({ pageNo: 1, pageSize: 10, total: 0 })
const trackPagination = reactive({ pageNo: 1, pageSize: 10, total: 0 })
const outboundCallPagination = reactive({ pageNo: 1, pageSize: 10, total: 0 })
const smsPagination = reactive({ pageNo: 1, pageSize: 10, total: 0 })

const getClue = async () => {
    loading.value = true
    try {
        clue.value = await ClueApi.getClue(clueId.value)
        await Promise.all([
            loadAppointmentRecords(),
            loadOrderRecords(),
            loadTicketRecords(),
            loadTrackRecords(),
            loadOutboundCallRecords(),
            loadSmsRecords()
        ])
    } finally {
        loading.value = false
    }
}

const loadAppointmentRecords = async () => {
    if (!clueId.value) return []
    const pageResp = await CustomerDetailApi.getCustomerAppointments({
        id: clueId.value,
        pageNo: appointmentPagination.pageNo,
        pageSize: appointmentPagination.pageSize
    })
    appointments.value = Array.isArray(pageResp?.list) ? pageResp.list : []
    appointmentPagination.total = Number(pageResp?.total || 0)
    return appointments.value
}

const loadOrderRecords = async () => {
    if (!clueId.value) return []
    const pageResp = await OrderApi.getOrderPage({
        pageNo: orderPagination.pageNo,
        pageSize: orderPagination.pageSize,
        clueId: clueId.value
    })
    orderRecords.value = Array.isArray(pageResp?.list) ? pageResp.list : []
    orderPagination.total = Number(pageResp?.total || 0)
    return orderRecords.value
}

const loadTicketRecords = async () => {
    const pageResp = await AftersalesApi.getAftersalesPage({
        pageNo: ticketPagination.pageNo,
        pageSize: ticketPagination.pageSize,
        clueId: clueId.value
    })
    ticketRecords.value = Array.isArray(pageResp?.list) ? pageResp.list : []
    ticketPagination.total = Number(pageResp?.total || 0)
    return ticketRecords.value
}

const loadTrackRecords = async () => {
    if (!clueId.value) return []
    const pageResp = await CustomerDetailApi.getCustomerTracks({
        id: clueId.value,
        pageNo: trackPagination.pageNo,
        pageSize: trackPagination.pageSize
    })
    trackList.value = Array.isArray(pageResp?.list) ? pageResp.list : []
    trackPagination.total = Number(pageResp?.total || 0)
    return trackList.value
}

const sortByCreateTimeDesc = <T extends { createTime?: string | Date | null }>(list: T[]) =>
    [...list].sort((a, b) => {
        const timeA = a.createTime ? new Date(a.createTime).getTime() : 0
        const timeB = b.createTime ? new Date(b.createTime).getTime() : 0
        return timeB - timeA
    })

const loadSmsRecords = async () => {
    if (!clueId.value) return []
    const pageResp = await CustomerDetailApi.getCustomerSmsLogs({
        pageNo: smsPagination.pageNo,
        pageSize: smsPagination.pageSize,
        clueId: clueId.value
    })
    smsRecords.value = sortByCreateTimeDesc(Array.isArray(pageResp?.list) ? pageResp.list : [])
    smsPagination.total = Number(pageResp?.total || 0)
    return smsRecords.value
}

const loadOutboundCallRecords = async () => {
    if (!clueId.value) return []
    const pageResp = await CustomerDetailApi.getCustomerOutboundCallRecords({
        id: clueId.value,
        pageNo: outboundCallPagination.pageNo,
        pageSize: outboundCallPagination.pageSize
    })
    outboundCallRecords.value = Array.isArray(pageResp?.list) ? pageResp.list : []
    outboundCallPagination.total = Number(pageResp?.total || 0)
    return outboundCallRecords.value
}

const handleAppointmentPageChange = async (payload: { pageNo: number; pageSize: number }) => {
    appointmentPagination.pageNo = payload.pageNo
    appointmentPagination.pageSize = payload.pageSize
    await loadAppointmentRecords()
}

const handleOrderPageChange = async (payload: { pageNo: number; pageSize: number }) => {
    orderPagination.pageNo = payload.pageNo
    orderPagination.pageSize = payload.pageSize
    await loadOrderRecords()
}

const handleTicketPageChange = async (payload: { pageNo: number; pageSize: number }) => {
    ticketPagination.pageNo = payload.pageNo
    ticketPagination.pageSize = payload.pageSize
    await loadTicketRecords()
}

const handleTrackPageChange = async (payload: { pageNo: number; pageSize: number }) => {
    trackPagination.pageNo = payload.pageNo
    trackPagination.pageSize = payload.pageSize
    await loadTrackRecords()
}

const handleOutboundCallPageChange = async (payload: { pageNo: number; pageSize: number }) => {
    outboundCallPagination.pageNo = payload.pageNo
    outboundCallPagination.pageSize = payload.pageSize
    await loadOutboundCallRecords()
}

const handleSmsPageChange = async (payload: { pageNo: number; pageSize: number }) => {
    smsPagination.pageNo = payload.pageNo
    smsPagination.pageSize = payload.pageSize
    await loadSmsRecords()
}

const openForm = () => {
    formRef.value?.open('update', clueId.value)
}

const goBack = () => {
    delView(unref(currentRoute))
    push({ name: 'CrmCustomer' })
}

onMounted(async () => {
    if (!params.id) {
        message.warning('参数错误，学员不能为空！')
        goBack()
        return
    }
    clueId.value = Number(params.id)
    appointmentPagination.pageNo = 1
    orderPagination.pageNo = 1
    ticketPagination.pageNo = 1
    trackPagination.pageNo = 1
    outboundCallPagination.pageNo = 1
    smsPagination.pageNo = 1
    await getClue()
})
</script>
