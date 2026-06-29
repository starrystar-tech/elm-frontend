<template>
    <el-drawer
        v-model="drawerVisible"
        title="客户详情"
        direction="rtl"
        size="1120px"
        append-to-body
        :close-on-click-modal="false"
        class="clue-detail-drawer"
    >
        <div class="clue-detail-drawer__shell">
            <div class="clue-detail-drawer__body">
                <ClueDetailContent
                    :clue="clue"
                    :clue-id="clueId"
                    :loading="loading"
                    :can-update="canUpdate"
                    :log-list="logList"
                    :editing="editing"
                    :saving="saving"
                    :consult-saving="consultSaving"
                    :project-options="projectOptions"
                    :product-category-options="productCategoryOptions"
                    :campus-options="campusOptions"
                    :clue-source-options="clueSourceOptions"
                    :tag-options="tagOptions"
                    :complaint-tag-options="complaintTagOptions"
                    :wework-contacts="weworkContacts"
                    :customer-basic-info="customerBasicInfo"
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
                    :sms-records="smsRecords"
                    :sms-total="smsPagination.total"
                    :sms-page-no="smsPagination.pageNo"
                    :sms-page-size="smsPagination.pageSize"
                    :outbound-call-records="outboundCallRecords"
                    :outbound-call-total="outboundCallPagination.total"
                    :outbound-call-page-no="outboundCallPagination.pageNo"
                    :outbound-call-page-size="outboundCallPagination.pageSize"
                    @edit="openForm"
                    @cancel-edit="cancelEdit"
                    @save="handleSave"
                    @save-consult="handleSaveConsult"
                    @sms="handleSms"
                    @enroll="openEnroll"
                    @release="handleRelease"
                    @tag="handleTag"
                    @change-appointment-page="handleAppointmentPageChange"
                    @change-order-page="handleOrderPageChange"
                    @change-ticket-page="handleTicketPageChange"
                    @change-track-page="handleTrackPageChange"
                    @change-outbound-call-page="handleOutboundCallPageChange"
                    @change-sms-page="handleSmsPageChange"
                    @close="drawerVisible = false"
                />
            </div>
        </div>
    </el-drawer>

    <ClueEnrollDialog ref="enrollRef" @success="handleEnrollSuccess" />
    <ClueSmsDialog ref="smsDialogRef" />
    <Dialog v-model="tagDialogVisible" title="加标签" width="520px">
        <el-form label-width="80px">
            <el-form-item label="标签" required>
                <el-select
                    v-model="tagForm.tagIds"
                    multiple
                    filterable
                    clearable
                    placeholder="请选择标签"
                    style="width: 100%"
                >
                    <el-option
                        v-for="item in tagOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="tagDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitTag">确定</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import * as AftersalesApi from '@/api/crm/aftersales'
import * as ClueApi from '@/api/crm/clue'
import * as CustomerDetailApi from '@/api/crm/customerDetail'
import * as OrderApi from '@/api/crm/order'
import * as ProductCategoryApi from '@/api/crm/product/category'
import { BizTypeEnum } from '@/api/crm/permission'
import { getOperateLogPage } from '@/api/crm/operateLog'
import type { OutboundCallRecordVO } from '@/api/system/call/record'
import type { OperateLogVO } from '@/api/system/operatelog'
import * as CampusApi from '@/api/system/campus'
import * as ComplaintTagApi from '@/api/system/complaintTag'
import * as ClueSourceApi from '@/api/system/clueSource'
import * as SmsLogApi from '@/api/system/sms/smsLog'
import * as TagGroupApi from '@/api/system/tag-group'
import { hasPermission } from '@/directives/permission/hasPermi'
import { normalizeIdCardNo } from '@/utils/idCard'
import ClueSmsDialog from '../ClueSmsDialog.vue'
import ClueEnrollDialog from './ClueEnrollDialog.vue'
import ClueDetailContent from './ClueDetailContent.vue'

defineOptions({ name: 'ClueDetailDrawer' })

const emit = defineEmits<{
    refresh: []
}>()

const drawerVisible = ref(false)
const clueId = ref(0)
const loading = ref(false)
const saving = ref(false)
const consultSaving = ref(false)
const editing = ref(false)
const clue = ref<ClueApi.ClueVO>({})
const logList = ref<OperateLogVO[]>([])
const canUpdate = hasPermission(['crm:clue:basic-info:update'])
const canClueManagementRelease = hasPermission(['crm:clue-management:query'])
const enrollRef = ref<InstanceType<typeof ClueEnrollDialog>>()
const smsDialogRef = ref<InstanceType<typeof ClueSmsDialog>>()
const message = useMessage()
const projectOptions = ref<{ id: number; name: string; children?: any[] }[]>([])
const productCategoryOptions = ref<any[]>([])
const campusOptions = ref<CampusApi.CampusVO[]>([])
const clueSourceOptions = ref<{ label: string; value: number }[]>([])
const tagOptions = ref<{ label: string; value: number }[]>([])
const complaintTagOptions = ref<{ label: string; value: number }[]>([])
const weworkContacts = ref<CustomerDetailApi.CustomerWeworkContactItem[]>([])
const customerBasicInfo = ref<CustomerDetailApi.CustomerBasicInfoRespVO>()
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
const tagDialogVisible = ref(false)
const tagForm = reactive({ tagIds: [] as number[] })

const loadOptions = async () => {
    const [projects, tagGroups, complaintTags, clueSources, campuses] = await Promise.all([
        ProductCategoryApi.getProductCategorySimpleList(),
        TagGroupApi.getTagGroupList(),
        ComplaintTagApi.getComplaintTagSimpleList(),
        ClueSourceApi.getEnabledClueSourceList(),
        CampusApi.getSimpleCampusList()
    ])
    projectOptions.value = (projects || []).map((item) => ({
        ...item,
        id: Number(item.id)
    }))
    productCategoryOptions.value = projects || []
    campusOptions.value = campuses || []
    tagOptions.value = (tagGroups || []).flatMap((group) =>
        (group.tags || []).map((tag) => ({
            label: `${group.name} / ${tag.name}`,
            value: Number(tag.id)
        }))
    )
    complaintTagOptions.value = (complaintTags || []).map((item) => ({
        label: item.name,
        value: Number(item.id)
    }))
    clueSourceOptions.value = (clueSources || []).map((item) => ({
        label: item.name,
        value: Number(item.id)
    }))
}

const getOperateLog = async () => {
    const data = await getOperateLogPage({
        bizType: BizTypeEnum.CRM_CLUE,
        bizId: clueId.value
    })
    logList.value = data.list || []
}

const getClue = async () => {
    if (!clueId.value) return
    loading.value = true
    try {
        const [clueResp, weworkResp, basicInfoResp] =
            await Promise.all([
                ClueApi.getClue(clueId.value),
                CustomerDetailApi.getCustomerWeworkInfo(clueId.value),
                CustomerDetailApi.getCustomerBasicInfo(clueId.value)
            ])
        clue.value = clueResp
        weworkContacts.value = weworkResp?.contacts || []
        customerBasicInfo.value = basicInfoResp
        await Promise.all([
            loadAppointmentRecords(),
            loadOrderRecords(),
            loadTicketRecords(),
            loadTrackRecords(),
            loadSmsRecords(),
            loadOutboundCallRecords()
        ])
        await getOperateLog()
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
    appointments.value = pageResp?.list || []
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
    orderRecords.value = pageResp?.list || []
    orderPagination.total = Number(pageResp?.total || 0)
    return orderRecords.value
}

const loadTicketRecords = async () => {
    if (!clueId.value) return []
    const pageResp = await AftersalesApi.getAftersalesPage({
        pageNo: ticketPagination.pageNo,
        pageSize: ticketPagination.pageSize,
        clueId: clueId.value
    })
    ticketRecords.value = pageResp?.list || []
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
    trackList.value = pageResp?.list || []
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
    smsRecords.value = sortByCreateTimeDesc(pageResp?.list || [])
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
    outboundCallRecords.value = pageResp?.list || []
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
    editing.value = true
}

const cancelEdit = () => {
    editing.value = false
}

const handleSave = async (payload: { formRef: any; formData: any }) => {
    const valid = await payload.formRef?.validate?.()
    if (!valid) return

    saving.value = true
    try {
        const formData = payload.formData
        await ClueApi.updateClueBasicInfo({
            id: Number(clue.value.id),
            name: formData.name?.trim() || '',
            mobile: formData.mobile.trim(),
            mobile2: formData.mobile2?.trim() || undefined,
            wechat: formData.wechat?.trim() || undefined,
            wechat2: formData.wechat2?.trim() || undefined,
            wechatRemark: formData.wechatRemark?.trim() || undefined,
            qq: formData.qq?.trim() || undefined,
            avatar: formData.avatar?.trim() || undefined,
            idCardNo: normalizeIdCardNo(formData.idCardNo) || undefined,
            certificateType: formData.certificateType?.trim() || undefined,
            occupation: formData.occupation?.trim() || undefined,
            emergencyMobile: formData.emergencyMobile?.trim() || undefined,
            emergencyContact: formData.emergencyContact?.trim() || undefined,
            gender: formData.gender,
            education: formData.education,
            intentLevel: formData.intentLevel,
            areaId: Number(formData.areaId),
            consultProjectId: Number(formData.consultProjectId),
            clueSourceId: formData.clueSourceId ? Number(formData.clueSourceId) : undefined,
            tagIds: formData.tagIds?.length ? formData.tagIds : undefined,
            complaintTagIds: formData.complaintTagIds?.length
                ? formData.complaintTagIds
                : undefined,
            remark: formData.remark?.trim() || undefined
        })
        message.success('保存成功')
        editing.value = false
        await getClue()
        emit('refresh')
    } finally {
        saving.value = false
    }
}

const handleSaveConsult = async (payload: CustomerDetailApi.CustomerConsultRecordCreateReqVO) => {
    consultSaving.value = true
    try {
        if (payload.consultType === 2) {
            await CustomerDetailApi.createCustomerAppointment(payload)
        } else {
            await CustomerDetailApi.createCustomerConsultRecord(payload)
        }
        message.success('保存成功')
        await getClue()
        emit('refresh')
    } finally {
        consultSaving.value = false
    }
}

const openEnroll = () => {
    enrollRef.value?.open(clue.value)
}

const handleEnrollSuccess = async () => {
    await getClue()
    emit('refresh')
}

const handleSms = () => {
    if (!clue.value.id) return
    smsDialogRef.value?.open([Number(clue.value.id)])
}

const handleRelease = async () => {
    if (!clue.value.id) return
    await message.confirm('确认释放该客户吗？')
    if (canClueManagementRelease) {
        await ClueApi.releaseClueManagement({
            clueIds: [Number(clue.value.id)]
        })
    } else {
        await ClueApi.releaseMyClue({
            clueIds: [Number(clue.value.id)]
        })
    }
    message.success('释放成功')
    await getClue()
    emit('refresh')
}

const handleTag = () => {
    tagForm.tagIds = (clue.value.tagIds || []).map((item) => Number(item))
    tagDialogVisible.value = true
}

const submitTag = async () => {
    if (!clue.value.id || !tagForm.tagIds.length) {
        message.warning('请选择标签')
        return
    }
    await ClueApi.batchAppendClueTags({
        clueIds: [Number(clue.value.id)],
        tagIds: tagForm.tagIds
    })
    message.success('加标签成功')
    tagDialogVisible.value = false
    await getClue()
    emit('refresh')
}

const open = async (id: number) => {
    clueId.value = id
    appointmentPagination.pageNo = 1
    orderPagination.pageNo = 1
    ticketPagination.pageNo = 1
    trackPagination.pageNo = 1
    outboundCallPagination.pageNo = 1
    smsPagination.pageNo = 1
    drawerVisible.value = true
    editing.value = false
    await loadOptions()
    await getClue()
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.clue-detail-drawer__shell {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.clue-detail-drawer__body {
    flex: 1;
    padding: 0px 0px 0;
    overflow: auto;
}

:deep(.clue-detail-drawer .el-drawer) {
    width: min(1320px, 92vw) !important;
    border-radius: 20px 0 0 20px;
    overflow: hidden;
    box-shadow: -8px 0 32px rgba(15, 23, 42, 0.16);
}

:deep(.clue-detail-drawer .el-drawer__body) {
    padding: 0;
}

@media (max-width: 768px) {
    :deep(.clue-detail-drawer .el-drawer) {
        width: 100vw !important;
        border-radius: 0;
    }

    .clue-detail-drawer__body {
        padding: 16px 16px 0;
    }
}
</style>
