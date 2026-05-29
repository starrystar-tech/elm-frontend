<template>
    <Dialog v-model="dialogVisible" title="签署合同" width="980px">
        <div v-loading="loading" class="order-contract-sign">
            <div class="order-contract-sign__section">
                <div class="order-contract-sign__title">订单信息</div>
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
                        <span>{{ orderDetail.customerMobile || '-' }}</span>
                    </div>
                    <div class="order-contract-sign__item">
                        <span class="label">报名分校：</span>
                        <span>{{ orderDetail.campusName || '-' }}</span>
                    </div>
                </div>
            </div>

            <div class="order-contract-sign__section">
                <div class="order-contract-sign__title">商品信息</div>
                <el-radio-group
                    v-model="selectedOrderItemId"
                    class="order-contract-sign__product-list"
                    @change="handleOrderItemChange"
                >
                    <el-radio-button
                        v-for="item in orderDetail.items || []"
                        :key="item.id"
                        :label="item.id"
                    >
                        {{ item.productName || item.productCode || `商品${item.id}` }}
                    </el-radio-button>
                </el-radio-group>
            </div>

            <div class="order-contract-sign__section">
                <div class="order-contract-sign__header">
                    <div class="order-contract-sign__title">合同记录</div>
                    <el-button
                        v-if="activeContract"
                        plain
                        type="primary"
                        @click="handleOpenSignUrl(activeContract.id)"
                    >
                        继续签署
                    </el-button>
                </div>
                <el-table :data="contractList" border>
                    <el-table-column prop="contractNo" label="合同编号" min-width="160" />
                    <el-table-column prop="contractTypeName" label="合同类型" min-width="120" />
                    <el-table-column prop="statusName" label="合同状态" min-width="120" />
                    <el-table-column prop="signTime" label="签署时间" min-width="180" />
                    <el-table-column prop="revokeReason" label="撤销原因" min-width="160" />
                    <el-table-column label="操作" min-width="220" fixed="right">
                        <template #default="{ row }">
                            <el-button link type="primary" @click="handleOpenSignUrl(row.id)">
                                签署链接
                            </el-button>
                            <el-button link type="primary" @click="handlePreview(row.id)">
                                预览
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
                    <el-form-item v-if="variableFields.length" label="模板变量">
                        <div class="order-contract-sign__variables">
                            <div
                                v-for="field in variableFields"
                                :key="field.id || field.variableName"
                                class="order-contract-sign__variable"
                            >
                                <span class="order-contract-sign__variable-label">
                                    {{ field.variableName }}
                                </span>
                                <el-input
                                    v-model="variableForm[field.variableName]"
                                    :placeholder="`请输入${field.variableName}`"
                                    clearable
                                />
                            </div>
                        </div>
                    </el-form-item>
                    <el-empty
                        v-else-if="selectedTemplateId"
                        description="当前模板未配置变量"
                        :image-size="60"
                    />
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
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import * as OrderApi from '@/api/crm/order'
import * as ContractApi from '@/api/system/contract'
import * as TemplateApi from '@/api/system/contract/template'

defineOptions({ name: 'OrderContractSignDialog' })

const emit = defineEmits(['success'])
const message = useMessage()

const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const orderDetail = ref<OrderApi.OrderDetailRespVO>({ items: [], payRecords: [], refunds: [] } as any)
const selectedOrderItemId = ref<number>()
const selectedTemplateId = ref<number>()
const contractList = ref<ContractApi.ContractOrderProductRespVO[]>([])
const templateOptions = ref<TemplateApi.ContractTemplateSimpleVO[]>([])
const variableFields = ref<ContractApi.ContractVariableVO[]>([])
const variableForm = reactive<Record<string, string>>({})

const selectedOrderItem = computed(() =>
    (orderDetail.value.items || []).find((item) => item.id === selectedOrderItemId.value)
)

const activeContract = computed(() => contractList.value.find((item) => canContinueContract(item.status)))

const canContinueContract = (status?: number) => status === 1
const canCancelContract = (status?: number) => status === 1

const buildDefaultVariableValue = (variableName: string) => {
    const item = selectedOrderItem.value
    const detail = orderDetail.value
    const lowerName = variableName.toLowerCase()
    const areaText = [detail.province, detail.city, detail.district].filter(Boolean).join('/')
    const sourceMap: Record<string, string | number | undefined> = {
        studentname: detail.customerName,
        customername: detail.customerName,
        mobile: detail.customerMobile,
        customermobile: detail.customerMobile,
        wechat: detail.wechat,
        wechat2: detail.wechat2,
        qq: detail.qq,
        orderno: detail.orderNo,
        customerid: detail.customerId,
        idcardno: detail.idCardNo,
        certificatetype: detail.certificateType,
        campusname: detail.campusName,
        projectname: item?.projectName || detail.projectName,
        productname: item?.productName || detail.mainProductName,
        productcode: item?.productCode || detail.mainProductCode,
        productcategory: item?.productCategoryPath || detail.mainProductCategoryPath,
        payableamount: item?.payableAmount,
        productprice: item?.productPrice,
        enrolltime: detail.enrollTime,
        expiretime: item?.expireTime,
        area: areaText || undefined
    }
    return String(sourceMap[lowerName] ?? '')
}

const resetVariableForm = (fields: ContractApi.ContractVariableVO[]) => {
    Object.keys(variableForm).forEach((key) => delete variableForm[key])
    fields.forEach((field) => {
        variableForm[field.variableName] = buildDefaultVariableValue(field.variableName)
    })
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
        templateType: 1,
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
}

const handleOrderItemChange = async () => {
    selectedTemplateId.value = undefined
    variableFields.value = []
    Object.keys(variableForm).forEach((key) => delete variableForm[key])
    await loadContractList()
}

const handleOpenSignUrl = async (id: number) => {
    const url = await ContractApi.getContractSignUrl(id)
    if (!url) {
        message.warning('未获取到签署链接')
        return
    }
    window.open(url, '_blank')
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
    await ElMessageBox.confirm('确认撤销当前签署任务吗？', '提示', { type: 'warning' })
    await ContractApi.cancelContractSign(id)
    message.success('撤销成功')
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
        if (resp?.signUrl) {
            window.open(resp.signUrl, '_blank')
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
        let detail = payload as OrderApi.OrderDetailRespVO
        if (!detail.items) {
            detail = await OrderApi.getOrder(Number(payload.id))
        }
        orderDetail.value = detail
        const items = detail.items || []
        selectedOrderItemId.value = items.find((item) => item.productId === productId)?.id || items[0]?.id
        await Promise.all([loadTemplateList(), loadContractList()])
    } finally {
        loading.value = false
    }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.order-contract-sign {
    padding: 8px 4px 0;
}

.order-contract-sign__section + .order-contract-sign__section {
    margin-top: 18px;
}

.order-contract-sign__title {
    margin-bottom: 12px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
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

.order-contract-sign__variables {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px;
}

.order-contract-sign__variable {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.order-contract-sign__variable-label {
    font-size: 13px;
    color: var(--el-text-color-regular);
}
</style>
