<template>
    <Dialog v-model="dialogVisible" title="新增工单" width="620px" append-to-body>
        <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="100px"
            v-loading="formLoading"
        >
            <el-form-item label="订单" prop="orderIds">
                <el-input
                    v-model="selectedOrderDisplay"
                    readonly
                    clearable
                    placeholder="请选择订单"
                    @click="openOrderSelect"
                    @clear="clearSelectedOrder"
                >
                    <template #suffix>
                        <Icon icon="ep:search" />
                    </template>
                </el-input>
            </el-form-item>
            <el-form-item label="工单来源" prop="source">
                <el-input :model-value="sourceLabel" disabled />
            </el-form-item>
            <el-form-item label="优先级" prop="priority">
                <el-select v-model="formData.priority" class="!w-full">
                    <el-option
                        v-for="item in aftersalesPriorityOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="申请原因" prop="reason">
                <el-input
                    v-model="formData.reason"
                    type="textarea"
                    :rows="3"
                    maxlength="500"
                    show-word-limit
                    placeholder="请输入申请原因"
                />
            </el-form-item>
            <el-form-item label="补充备注" prop="remark">
                <el-input
                    v-model="formData.remark"
                    type="textarea"
                    :rows="3"
                    maxlength="500"
                    show-word-limit
                    placeholder="请输入补充备注"
                />
            </el-form-item>
            <el-form-item label="附件" prop="attachmentUrl">
                <UploadFile
                    v-model="formData.attachmentUrl"
                    :limit="1"
                    :file-size="20"
                    :file-type="attachmentFileTypes"
                    :is-show-tip="false"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <BaseButton type="primary" :loading="formLoading" @click="submitForm">确 定</BaseButton>
            <BaseButton @click="dialogVisible = false">取 消</BaseButton>
        </template>
    </Dialog>
    <OrderSelectDialog ref="orderSelectDialogRef" @confirm="handleOrderConfirm" />
</template>

<script setup lang="ts">
import { BaseButton } from '@/components/Button'
import OrderSelectDialog from '@/components/OrderSelectDialog.vue'
import * as AftersalesApi from '@/api/crm/aftersales'
import * as OrderApi from '@/api/crm/order'
import {
    AFTERSALES_SOURCE,
    getAftersalesSourceLabel,
    getAftersalesPriorityOptions
} from '../config'

defineOptions({ name: 'AftersalesForm' })

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const orderSelectDialogRef = ref<InstanceType<typeof OrderSelectDialog>>()
const selectedOrderDisplay = ref('')
const selectedOrders = ref<OrderApi.OrderPageRespVO[]>([])
const orderSelectClueId = ref<number>()
const aftersalesPriorityOptions = computed(() => getAftersalesPriorityOptions())
const attachmentFileTypes = [
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'txt',
    'pdf',
    'png',
    'jpg',
    'jpeg',
    'zip',
    'rar'
]
const formData = ref<AftersalesApi.AftersalesCreateReqVO>({
    orderIds: [],
    priority: 2,
    source: AFTERSALES_SOURCE.MANUAL,
    reason: '',
    remark: '',
    attachmentUrl: ''
})
const sourceLabel = computed(() => getAftersalesSourceLabel(formData.value.source))

const formRules = reactive({
    orderIds: [
        {
            required: true,
            validator: (_rule: unknown, value: number[], callback: (error?: Error) => void) => {
                if (value?.length) {
                    callback()
                    return
                }
                callback(new Error('请选择订单'))
            },
            trigger: 'change'
        }
    ],
    priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
    source: [{ required: true, message: '请选择工单来源', trigger: 'change' }],
    reason: [
        { required: true, message: '请输入申请原因', trigger: 'blur' },
        { max: 500, message: '申请原因长度不能超过 500 个字符', trigger: 'blur' }
    ],
    remark: [{ max: 500, message: '补充备注长度不能超过 500 个字符', trigger: 'blur' }],
    attachmentUrl: [{ max: 500, message: '附件长度不能超过 500 个字符', trigger: 'blur' }]
})

const emit = defineEmits(['success'])

interface AftersalesFormOpenOptions {
    clueId?: number
    orderId?: number
    orderNo?: string
    customerId?: string
    customerName?: string
    source?: number
    orderFilterClueId?: number
}

const buildCustomerDisplay = (options: AftersalesFormOpenOptions) => {
    const parts = [options.customerId, options.customerName].filter(Boolean)
    return parts.length ? parts.join(' / ') : ''
}

const buildOrderDisplay = (options: AftersalesFormOpenOptions) => {
    const parts = [options.orderNo, options.customerName].filter(Boolean)
    return parts.length ? parts.join(' / ') : buildCustomerDisplay(options)
}

const open = (options: AftersalesFormOpenOptions = {}) => {
    dialogVisible.value = true
    resetForm()
    formData.value.source = options.source || AFTERSALES_SOURCE.MANUAL
    formData.value.orderIds = options.orderId ? [Number(options.orderId)] : []
    selectedOrders.value = options.orderId
        ? [
              {
                  id: Number(options.orderId),
                  orderNo: options.orderNo || '',
                  customerName: options.customerName || ''
              } as OrderApi.OrderPageRespVO
          ]
        : []
    orderSelectClueId.value = options.orderFilterClueId || options.clueId
    selectedOrderDisplay.value = options.orderId
        ? buildOrderDisplay(options)
        : buildCustomerDisplay(options)
}
defineExpose({ open })

const openOrderSelect = () => {
    orderSelectDialogRef.value?.open({
        scene: 'aftersales_create',
        clueId: orderSelectClueId.value,
        multiple: true
    })
}

const updateSelectedOrderDisplay = () => {
    if (!selectedOrders.value.length) {
        selectedOrderDisplay.value = ''
        return
    }
    if (selectedOrders.value.length === 1) {
        const order = selectedOrders.value[0]
        selectedOrderDisplay.value = `${order.orderNo} / ${order.customerName || '--'}`
        return
    }
    selectedOrderDisplay.value = `已选择 ${selectedOrders.value.length} 个订单：${selectedOrders.value
        .map((item) => item.orderNo)
        .filter(Boolean)
        .slice(0, 3)
        .join('、')}${selectedOrders.value.length > 3 ? ' 等' : ''}`
}

const handleOrderConfirm = (order: OrderApi.OrderDetailRespVO | OrderApi.OrderPageRespVO[]) => {
    const orders = Array.isArray(order) ? order : [order]
    const validOrders = orders.filter((item) => item?.id)
    if (!validOrders.length) {
        message.warning('请选择订单')
        return
    }
    formData.value.orderIds = Array.from(new Set(validOrders.map((item) => Number(item.id))))
    selectedOrders.value = validOrders as OrderApi.OrderPageRespVO[]
    const firstClueId = (validOrders[0] as OrderApi.OrderDetailRespVO).clueId
    if (firstClueId) {
        orderSelectClueId.value = Number(firstClueId)
    }
    updateSelectedOrderDisplay()
    formRef.value?.validateField?.('orderIds')
}

const clearSelectedOrder = () => {
    formData.value.orderIds = []
    selectedOrders.value = []
    selectedOrderDisplay.value = ''
}

const submitForm = async () => {
    await formRef.value.validate()
    formLoading.value = true
    try {
        await AftersalesApi.createAftersales({
            ...formData.value,
            reason: formData.value.reason.trim(),
            remark: formData.value.remark?.trim() || undefined,
            attachmentUrl: formData.value.attachmentUrl?.trim() || undefined
        })
        message.success('新增成功')
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}

const resetForm = () => {
    formData.value = {
        orderIds: [],
        priority: 2,
        source: AFTERSALES_SOURCE.MANUAL,
        reason: '',
        remark: '',
        attachmentUrl: ''
    }
    selectedOrderDisplay.value = ''
    selectedOrders.value = []
    orderSelectClueId.value = undefined
    formRef.value?.resetFields()
}
</script>
