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
                    <CustomerDetailsInfo :clue="clue" />
                </el-tab-pane>
            </el-tabs>
            <CustomerDetailRecords
                :appointments="appointments"
                :order-records="orderRecords"
                :ticket-records="ticketRecords"
                :outbound-call-records="outboundCallRecords"
                :sms-records="smsRecords"
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
import * as SmsLogApi from '@/api/system/sms/smsLog'
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
const smsRecords = ref<SmsLogApi.SmsLogVO[]>([])
const outboundCallRecords = ref<OutboundCallRecordVO[]>([])

const getClue = async () => {
    loading.value = true
    try {
        const [clueResp, appointmentsResp, callRecordsResp] = await Promise.all([
            ClueApi.getClue(clueId.value),
            CustomerDetailApi.getCustomerAppointments(clueId.value),
            CustomerDetailApi.getCustomerOutboundCallRecords(clueId.value)
        ])
        clue.value = clueResp
        appointments.value = appointmentsResp || []
        outboundCallRecords.value = callRecordsResp || []
        orderRecords.value = await loadOrderRecords(clueResp)
        ticketRecords.value = await loadTicketRecords()
        smsRecords.value = await loadSmsRecords(clueResp)
    } finally {
        loading.value = false
    }
}

const loadOrderRecords = async (clueResp: ClueApi.ClueVO) => {
    const params: OrderApi.OrderPageReqVO = {
        pageNo: 1,
        pageSize: 20
    }
    if (clueResp.mobile) {
        params.mobile = clueResp.mobile
    }
    if (!params.mobile && clueResp.name) {
        params.customer = clueResp.name
    }
    if (!params.mobile && !params.customer) {
        return []
    }
    const pageResp = await OrderApi.getOrderPage(params)
    return pageResp?.list || []
}

const loadTicketRecords = async () => {
    const pageResp = await AftersalesApi.getAftersalesPage({
        pageNo: 1,
        pageSize: 20,
        clueId: clueId.value
    })
    return pageResp?.list || []
}

const buildMobileList = (clueResp: ClueApi.ClueVO) =>
    Array.from(new Set([clueResp.mobile, clueResp.mobile2].filter(Boolean) as string[]))

const sortByCreateTimeDesc = <T extends { createTime?: string | Date | null }>(list: T[]) =>
    [...list].sort((a, b) => {
        const timeA = a.createTime ? new Date(a.createTime).getTime() : 0
        const timeB = b.createTime ? new Date(b.createTime).getTime() : 0
        return timeB - timeA
    })

const loadSmsRecords = async (clueResp: ClueApi.ClueVO) => {
    const mobileList = buildMobileList(clueResp)
    if (!mobileList.length) return []
    const pageList = await Promise.all(
        mobileList.map((mobile) =>
            SmsLogApi.getSmsLogPage({
                pageNo: 1,
                pageSize: 50,
                mobile
            })
        )
    )
    const recordMap = new Map<number, SmsLogApi.SmsLogVO>()
    pageList.forEach((pageResp) => {
        ;(pageResp?.list || []).forEach((item) => {
            if (item?.id != null) {
                recordMap.set(Number(item.id), item)
            }
        })
    })
    return sortByCreateTimeDesc(Array.from(recordMap.values()))
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
    await getClue()
})
</script>
