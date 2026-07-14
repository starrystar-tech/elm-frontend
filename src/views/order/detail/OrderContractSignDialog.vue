<template>
    <Dialog
        v-model="dialogVisible"
        title="签署合同"
        class="order-contract-sign-dialog"
        append-to-body
        width="780px"
    >
        <div v-loading="loading" class="order-contract-sign">
            <div v-if="shouldShowProductSelector" class="order-contract-sign__section">
                <div class="order-contract-sign__title">商品信息</div>
                <el-radio-group
                    v-model="selectedOrderItemId"
                    class="order-contract-sign__product-list"
                    @change="handleOrderItemChange"
                >
                    <el-radio
                        v-for="item in orderDetail.items || []"
                        :key="item.id"
                        :label="item.id"
                    >
                        {{ item.productName || item.productCode || `商品${item.id}` }}
                    </el-radio>
                </el-radio-group>
            </div>

            <div class="order-contract-sign__section">
                <el-tabs v-model="activeTab" class="order-contract-sign__tabs">
                    <el-tab-pane label="订单信息" name="order">
                        <div class="order-contract-sign__grid">
                            <div class="order-contract-sign__item">
                                <span class="label">订单编号：</span>
                                <span>{{ orderDetail.orderNo || '-' }}</span>
                            </div>
                            <div class="order-contract-sign__item">
                                <span class="label">客户姓名：</span>
                                <span>{{ orderDetail.customerName || '-' }}</span>
                            </div>
                            <div class="order-contract-sign__item">
                                <span class="label">手机号：</span>
                                <MobileCopyInline
                                    :clue-id="orderDetail.clueId"
                                    :mobile="orderDetail.customerMobile"
                                />
                            </div>
                            <div class="order-contract-sign__item">
                                <span class="label">报名分校：</span>
                                <span>{{ orderDetail.campusName || '-' }}</span>
                            </div>
                        </div>
                    </el-tab-pane>
                    <el-tab-pane label="合同记录" name="contract">
                        <div class="order-contract-sign__header">
                            <div
                                class="order-contract-sign__title order-contract-sign__title--compact"
                            >
                                合同记录
                            </div>
                            <!-- <el-button
                                v-if="activeContract"
                                plain
                                type="primary"
                                @click="handleOpenSignUrl(activeContract.id)"
                            >
                                继续签署
                            </el-button> -->
                        </div>
                        <el-table :data="contractList" border>
                            <el-table-column prop="contractNo" label="合同编号" min-width="160" />
                            <el-table-column
                                prop="contractTypeName"
                                label="合同类型"
                                min-width="120"
                            />
                            <el-table-column prop="statusName" label="合同状态" min-width="120" />
                            <el-table-column prop="signTime" label="签署时间" min-width="180" />
                            <el-table-column label="操作" min-width="220" fixed="right">
                                <template #default="{ row }">
                                    <el-button
                                        link
                                        type="primary"
                                        @click="handleOpenSignUrl(row.id)"
                                    >
                                        签署二维码
                                    </el-button>
                                    <el-button link type="primary" @click="handlePreview(row.id)">
                                        预览
                                    </el-button>
                                    <el-button
                                        v-if="canAbolishContract(row)"
                                        link
                                        type="danger"
                                        @click="handleAbolish(row)"
                                    >
                                        作废
                                    </el-button>
                                    <el-button
                                        v-if="canCancelContract(row.status)"
                                        link
                                        type="danger"
                                        @click="handleCancelSign(row.id)"
                                    >
                                        撤销签署
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>
                </el-tabs>
            </div>

            <div class="order-contract-sign__section">
                <div class="order-contract-sign__title">新建签署任务</div>
                <el-form label-width="110px">
                    <el-form-item label="合同模板">
                        <el-select
                            v-model="selectedTemplateId"
                            clearable
                            filterable
                            placeholder="请选择合同模板"
                            style="width: 100%"
                            @change="handleTemplateChange"
                        >
                            <el-option
                                v-for="item in templateOptions"
                                :key="item.id"
                                :label="item.templateName"
                                :value="item.id"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item
                        v-for="field in variableFields"
                        :key="field.id || field.variableName"
                        :label="field.variableName"
                    >
                        <ProvinceSelect
                            v-if="isProvinceVariable(field.variableName)"
                            v-model="variableForm[field.variableName]"
                            placeholder="请选择省份"
                        />
                        <el-input
                            v-else
                            v-model="variableForm[field.variableName]"
                            :placeholder="`请输入${field.variableName}`"
                            clearable
                        />
                    </el-form-item>
                </el-form>
            </div>
        </div>
        <template #footer>
            <el-button @click="dialogVisible = false">关闭</el-button>
            <el-button
                type="primary"
                :loading="submitting"
                :disabled="!selectedTemplateId || !selectedOrderItem"
                @click="handleCreateSignTask"
            >
                发起签署
            </el-button>
        </template>
    </Dialog>

    <Dialog
        v-model="signUrlDialogVisible"
        title="签署二维码"
        width="560px"
        :fullscreen="false"
        append-to-body
    >
        <div v-loading="signUrlLoading" class="order-contract-sign-url">
            <div class="order-contract-sign-url__tip">
                请让学员扫码打开签署页面完成合同签署，也可复制链接发送给学员。
            </div>
            <div v-if="signUrl" class="order-contract-sign-url__qr">
                <Qrcode :text="signUrl" :width="220" @done="handleSignQrcodeDone" />
                <div class="order-contract-sign-url__qr-tip">扫码签署合同</div>
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
import { computed, reactive, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Qrcode } from '@/components/Qrcode'
import * as ClueApi from '@/api/crm/clue'
import * as OrderApi from '@/api/crm/order'
import * as ContractApi from '@/api/system/contract'
import * as TemplateApi from '@/api/system/contract/template'
import ProvinceSelect from '@/components/ProvinceSelect.vue'
import { fenToYuan } from '@/utils'
import { buildAreaLabel } from '@/views/crm/clue/listShared'
import MobileCopyInline from '@/views/crm/clue/MobileCopyInline.vue'

defineOptions({ name: 'OrderContractSignDialog' })

const emit = defineEmits(['success'])
const message = useMessage()

const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const signUrlDialogVisible = ref(false)
const signUrlLoading = ref(false)
const signUrl = ref('')
const signQrcodeDataUrl = ref('')
const activeTab = ref('order')
const orderDetail = ref<OrderApi.OrderDetailRespVO>({
    items: [],
    payRecords: [],
    refunds: []
} as any)
const clueDetail = ref<ClueApi.ClueVO | null>(null)
const selectedOrderItemId = ref<number>()
const selectedTemplateId = ref<number>()
const contractList = ref<ContractApi.ContractOrderProductRespVO[]>([])
const templateOptions = ref<TemplateApi.ContractTemplateSimpleVO[]>([])
const variableFields = ref<ContractApi.ContractVariableVO[]>([])
const variableForm = reactive<Record<string, string>>({})
const plainMobileCache = reactive<Record<string, string>>({})

const selectedOrderItem = computed(() =>
    (orderDetail.value.items || []).find((item) => item.id === selectedOrderItemId.value)
)
const shouldShowProductSelector = computed(() => (orderDetail.value.items || []).length > 1)

const activeContract = computed(() =>
    contractList.value.find((item) => canContinueContract(item.status))
)

const canContinueContract = (status?: number) => status === 1
const canCancelContract = (status?: number) => status === 1
const canAbolishContract = (row: ContractApi.ContractOrderProductRespVO) =>
    Boolean(row.contractNo) && Number(row.status) === 4

const normalizeVariableName = (value?: string) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[\s_:/\\\-()（）【】\[\]{}，,。．、]/g, '')

const isProvinceVariable = (value?: string) => {
    const text = String(value || '').trim().toLowerCase()
    return text.includes('省份') || text.includes('province')
}

const matchVariableAlias = (variableName: string, aliases: string[]) => {
    const normalized = normalizeVariableName(variableName)
    if (!normalized) return false
    return aliases.some((alias) => {
        const normalizedAlias = normalizeVariableName(alias)
        if (!normalizedAlias) return false
        return normalized === normalizedAlias || normalized.includes(normalizedAlias)
    })
}

const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return ''
    return String(value).trim()
}

const formatDownloadFileName = (value: string) =>
    value
        .replace(/[\\/:*?"<>|]/g, '-')
        .replace(/\s+/g, '')
        .trim()

const formatFenAmount = (value: unknown) => {
    if (value === null || value === undefined || value === '') return ''
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return formatValue(value)
    return fenToYuan(numericValue)
}

const mobileAliases = [
    '手机号',
    '手机号码',
    '联系电话',
    '客户手机号',
    'mobile',
    'customermobile',
    'phone'
]

const mobile2Aliases = [
    '备用电话',
    '备用手机号',
    '第二手机号',
    '手机号2',
    '手机号码2',
    '联系电话2',
    'mobile2',
    'customermobile2',
    'phone2'
]

const buildDefaultVariableValue = (variableName: string) => {
    const item = selectedOrderItem.value
    const detail = orderDetail.value
    const clue = clueDetail.value
    const areaText = buildAreaLabel(clue || detail || {})
    const detailAddress = clue?.detailAddress || ''
    const fullAddress =
        [areaText !== '--' ? areaText : '', detailAddress].filter(Boolean).join(' ') || ''
    const educationText = clue?.educationName || ''
    const genderText = clue?.genderName || ''
    const semanticFields: Array<{ aliases: string[]; value: unknown }> = [
        { aliases: ['当前学历', '学历', 'education', 'educationname'], value: educationText },
        {
            aliases: [
                '姓名',
                '学员姓名',
                '学生姓名',
                '客户姓名',
                '乙方',
                'studentname',
                'customername'
            ],
            value: clue?.name || detail.customerName
        },
        {
            aliases: mobileAliases,
            value: clue?.mobile || detail.customerMobile
        },
        {
            aliases: mobile2Aliases,
            value: clue?.mobile2 || detail.customerMobile2
        },
        { aliases: ['微信', 'wechat'], value: clue?.wechat || detail.wechat },
        { aliases: ['微信2', '第二微信', 'wechat2'], value: clue?.wechat2 || detail.wechat2 },
        { aliases: ['微信备注名', 'wechatremark'], value: clue?.wechatRemark },
        { aliases: ['qq'], value: clue?.qq || detail.qq },
        { aliases: ['订单编号', '报名编号', 'orderno'], value: detail.orderNo },
        {
            aliases: ['客户编号', '学员编号', 'customerid'],
            value: clue?.customerId || detail.customerId
        },
        {
            aliases: ['证件号码', '身份证号', '证件号', 'idcard', 'idcardno'],
            value: clue?.idCardNo || detail.idCardNo
        },
        {
            aliases: ['证件类型', 'certificatetype'],
            value: clue?.certificateType || detail.certificateType
        },
        { aliases: ['性别', 'gender', 'gendername'], value: genderText },
        { aliases: ['出生日期', '生日', 'birthday'], value: clue?.birthday || detail.birthday },
        { aliases: ['职业', 'occupation'], value: clue?.occupation || detail.occupation },
        {
            aliases: ['紧急联系人', 'emergencycontact'],
            value: clue?.emergencyContact || detail.emergencyContact
        },
        {
            aliases: ['紧急联系人电话', '紧急联系电话', 'emergencymobile'],
            value: clue?.emergencyMobile || detail.emergencyMobile
        },
        { aliases: ['地区', '区域', 'area', 'areaname'], value: areaText !== '--' ? areaText : '' },
        {
            aliases: ['详细地址', '联系地址', 'detailaddress', 'address'],
            value: detailAddress || fullAddress
        },
        { aliases: ['完整地址', 'fulladdress'], value: fullAddress },
        { aliases: ['省份', 'province'], value: clue?.province || detail.province },
        { aliases: ['城市', 'city'], value: clue?.city || detail.city },
        { aliases: ['区县', '地区区县', 'district'], value: clue?.district || detail.district },
        { aliases: ['报名分校', '校区', 'campusname'], value: detail.campusName },
        {
            aliases: ['咨询项目', '项目名称', 'projectname'],
            value: clue?.consultProjectName || item?.projectName || detail.projectName
        },
        {
            aliases: ['商品名称', '产品名称', '课程名称', 'productname'],
            value: item?.productName || detail.mainProductName
        },
        {
            aliases: ['商品编码', '产品编码', 'productcode'],
            value: item?.productCode || detail.mainProductCode
        },
        {
            aliases: ['商品分类', '产品分类', 'productcategory'],
            value: item?.productCategoryPath || detail.mainProductCategoryPath
        },
        {
            aliases: ['应付金额', '合同金额', 'payableamount'],
            value: formatFenAmount(item?.payableAmount)
        },
        {
            aliases: ['商品价格', '课程价格', 'productprice'],
            value: formatFenAmount(item?.productPrice)
        },
        { aliases: ['报名时间', '报读时间', 'enrolltime'], value: detail.enrollTime },
        { aliases: ['到期时间', '截止时间', 'expiretime'], value: item?.expireTime },
        {
            aliases: ['归属人', '顾问', 'ownername'],
            value: clue?.currentOwnerName || detail.ownerUserName
        },
        { aliases: ['班主任', 'headteacher'], value: clue?.headteacherName }
    ]

    const matchedField = semanticFields.find((field) =>
        matchVariableAlias(variableName, field.aliases)
    )
    return formatValue(matchedField?.value)
}

const resetVariableForm = (fields: ContractApi.ContractVariableVO[]) => {
    Object.keys(variableForm).forEach((key) => delete variableForm[key])
    fields.forEach((field) => {
        variableForm[field.variableName] = buildDefaultVariableValue(field.variableName)
    })
}

const resolvePlainMobile = async (mobileField: 'mobile' | 'mobile2') => {
    const clueId = orderDetail.value.clueId || clueDetail.value?.id
    if (mobileField !== 'mobile') {
        return clueDetail.value?.mobile2 || orderDetail.value.customerMobile2 || ''
    }
    if (!clueId) return ''
    const cacheKey = String(clueId)
    if (plainMobileCache[cacheKey]) {
        return plainMobileCache[cacheKey]
    }
    plainMobileCache[cacheKey] = (await ClueApi.getClueMobile(Number(clueId))) || ''
    return plainMobileCache[cacheKey]
}

const fillPlainMobileVariables = async (fields: ContractApi.ContractVariableVO[]) => {
    if (!fields.length || !orderDetail.value.clueId) return
    const mobileFields = fields.filter(
        (field) =>
            matchVariableAlias(field.variableName, mobileAliases) &&
            !matchVariableAlias(field.variableName, mobile2Aliases)
    )
    const mobile2Fields = fields.filter((field) =>
        matchVariableAlias(field.variableName, mobile2Aliases)
    )
    if (!mobileFields.length && !mobile2Fields.length) return

    try {
        if (mobileFields.length) {
            const mobile = await resolvePlainMobile('mobile')
            if (mobile) {
                mobileFields.forEach((field) => {
                    variableForm[field.variableName] = mobile
                })
            }
        }
        if (mobile2Fields.length) {
            const mobile2 = await resolvePlainMobile('mobile2')
            if (mobile2) {
                mobile2Fields.forEach((field) => {
                    variableForm[field.variableName] = mobile2
                })
            }
        }
    } catch (error) {
        console.warn('[OrderContractSignDialog] load plain mobile failed', error)
    }
}

const loadContractList = async () => {
    if (!orderDetail.value.orderNo || !selectedOrderItem.value?.productId) {
        contractList.value = []
        return
    }
    contractList.value = await ContractApi.getContractListByOrderProduct({
        orderNo: orderDetail.value.orderNo,
        productId: Number(selectedOrderItem.value.productId)
    })
}

const loadTemplateList = async () => {
    templateOptions.value = await TemplateApi.getContractTemplateList({
        campusId: orderDetail.value.campusId,
        templateStatus: 0
    })
}

const handleTemplateChange = async (templateId?: number) => {
    selectedTemplateId.value = templateId
    variableFields.value = []
    Object.keys(variableForm).forEach((key) => delete variableForm[key])
    if (!templateId) {
        return
    }
    const variables = await ContractApi.getContractTemplateVariables(templateId)
    variableFields.value = variables || []
    resetVariableForm(variableFields.value)
    await fillPlainMobileVariables(variableFields.value)
}

const handleOrderItemChange = async () => {
    selectedTemplateId.value = undefined
    variableFields.value = []
    Object.keys(variableForm).forEach((key) => delete variableForm[key])
    await loadContractList()
}

const openSignUrlDialog = async (id: number) => {
    signUrl.value = ''
    signQrcodeDataUrl.value = ''
    signUrlDialogVisible.value = true
    signUrlLoading.value = true
    try {
        const url = await ContractApi.getContractSignUrl(id)
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

const handleOpenSignUrl = async (id: number) => {
    await openSignUrlDialog(id)
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
    const link = document.createElement('a')
    const orderNo = formatDownloadFileName(orderDetail.value.orderNo || 'contract') || 'contract'
    link.href = signQrcodeDataUrl.value
    link.download = `签署二维码-${orderNo}.png`
    link.click()
}

const handlePreview = async (id: number) => {
    const url = await ContractApi.getContractPreviewUrl(id)
    if (!url) {
        message.warning('未获取到预览链接')
        return
    }
    window.open(url, '_blank')
}

const handleCancelSign = async (id: number) => {
    await ElMessageBox.confirm('确认撤销当前签署任务吗？', '撤销签署', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    })
    await ContractApi.cancelContractSign(id)
    message.success('撤销成功')
    await loadContractList()
    emit('success')
}

const handleAbolish = async (row: ContractApi.ContractOrderProductRespVO) => {
    await ElMessageBox.confirm('确认作废该合同吗？', '作废合同', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    })
    if (!row.contractNo) return

    await ContractApi.abolishContract({
        contractId: row.contractNo,
        reason: undefined
    })
    message.success('作废成功')
    await loadContractList()
    emit('success')
}

const handleCreateSignTask = async () => {
    if (!selectedOrderItem.value || !selectedTemplateId.value) {
        message.warning('请先选择商品和合同模板')
        return
    }
    submitting.value = true
    try {
        const resp = await ContractApi.createContractSignTask({
            orderItemId: Number(selectedOrderItem.value.id),
            contractTemplateId: Number(selectedTemplateId.value),
            parameterJson: JSON.stringify(variableForm)
        })
        message.success('签署任务已创建')
        if (resp?.id) {
            await openSignUrlDialog(Number(resp.id))
        }
        await loadContractList()
        emit('success')
    } finally {
        submitting.value = false
    }
}

const open = async (
    payload: OrderApi.OrderPageRespVO | OrderApi.OrderDetailRespVO,
    productId?: number
) => {
    dialogVisible.value = true
    loading.value = true
    try {
        selectedTemplateId.value = undefined
        variableFields.value = []
        signUrlDialogVisible.value = false
        signUrl.value = ''
        signQrcodeDataUrl.value = ''
        clueDetail.value = null
        Object.keys(plainMobileCache).forEach((key) => delete plainMobileCache[key])
        Object.keys(variableForm).forEach((key) => delete variableForm[key])
        let detail = payload as OrderApi.OrderDetailRespVO
        if (!detail.items) {
            detail = await OrderApi.getOrder(Number(payload.id))
        }
        orderDetail.value = detail
        clueDetail.value = detail.clueId ? await ClueApi.getClue(Number(detail.clueId)) : null
        const items = detail.items || []
        activeTab.value = 'order'
        selectedOrderItemId.value =
            items.find((item) => item.productId === productId)?.id || items[0]?.id
        await Promise.all([loadTemplateList(), loadContractList()])
    } finally {
        loading.value = false
    }
}

defineExpose({ open })
</script>

<style lang="scss">
.order-contract-sign-dialog .el-dialog__body {
    padding: 0 15px !important;
}
.order-contract-sign {
    padding: 8px 4px 0;
}

.order-contract-sign__section + .order-contract-sign__section {
    margin-top: 18px;
}

.order-contract-sign__tabs {
    margin-top: -4px;
}

.order-contract-sign__title {
    margin-bottom: 12px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.order-contract-sign__title--compact {
    margin-bottom: 0;
}

.order-contract-sign__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.order-contract-sign__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 24px;
}

.order-contract-sign__item {
    font-size: 14px;
    color: var(--el-text-color-primary);
}

.order-contract-sign__item .label {
    color: var(--el-text-color-regular);
}

.order-contract-sign__product-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.order-contract-sign-url__tip {
    margin-bottom: 12px;
    color: var(--el-text-color-regular);
}

.order-contract-sign-url__qr {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin: 8px 0 16px;
    padding: 16px;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
}

.order-contract-sign-url__qr-tip {
    font-size: 13px;
    color: var(--el-text-color-secondary);
}
</style>
