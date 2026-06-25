<template>
    <Dialog v-model="dialogVisible" title="新增工单" width="620px" append-to-body>
        <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="100px"
            v-loading="formLoading"
        >
            <el-form-item label="客户" prop="clueId">
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
            <el-form-item label="工单类型" prop="ticketType">
                <el-select v-model="formData.ticketType" class="!w-full">
                    <el-option
                        v-for="item in aftersalesTypeOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
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
            <!-- <el-form-item label="退款方式" prop="refundMethod">
                <el-input v-model="formData.refundMethod" placeholder="请输入退款方式" />
            </el-form-item> -->
            <!-- <el-form-item label="退款金额" prop="refundAmount">
                <el-input-number
                    v-model="formData.refundAmount"
                    :min="0.01"
                    :precision="2"
                    class="!w-full"
                />
            </el-form-item> -->
            <el-form-item label="处理人">
                <el-input
                    v-model="handlerUserName"
                    readonly
                    clearable
                    placeholder="请选择处理人"
                    @click="openUserSelect"
                    @clear="clearHandler"
                />
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
            <el-form-item label="补充备注">
                <el-input
                    v-model="formData.remark"
                    type="textarea"
                    :rows="3"
                    maxlength="500"
                    show-word-limit
                    placeholder="请输入补充备注"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <BaseButton type="primary" :loading="formLoading" @click="submitForm">确 定</BaseButton>
            <BaseButton @click="dialogVisible = false">取 消</BaseButton>
        </template>
    </Dialog>
    <UserSelectForm ref="userSelectFormRef" @confirm="handleUserSelectConfirm" />
    <OrderSelectDialog ref="orderSelectDialogRef" @confirm="handleOrderConfirm" />
</template>

<script setup lang="ts">
import { BaseButton } from '@/components/Button'
import OrderSelectDialog from '@/components/OrderSelectDialog.vue'
import UserSelectForm from '@/components/UserSelectForm/index.vue'
import * as AftersalesApi from '@/api/crm/aftersales'
import * as OrderApi from '@/api/crm/order'
import type { UserVO } from '@/api/system/user'
import { getAftersalesPriorityOptions, getAftersalesTypeOptions } from '../config'

defineOptions({ name: 'AftersalesForm' })

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const userSelectFormRef = ref<InstanceType<typeof UserSelectForm>>()
const orderSelectDialogRef = ref<InstanceType<typeof OrderSelectDialog>>()
const handlerUserName = ref('')
const selectedOrderDisplay = ref('')
const aftersalesTypeOptions = computed(() => getAftersalesTypeOptions())
const aftersalesPriorityOptions = computed(() => getAftersalesPriorityOptions())
const formData = ref<AftersalesApi.AftersalesCreateReqVO>({
    clueId: undefined as unknown as number,
    orderId: undefined as unknown as number,
    refundMethod: '原路返回',
    ticketType: 2,
    priority: 2,
    refundAmount: undefined,
    reason: '',
    remark: '',
    handlerUserId: undefined
})

const formRules = reactive({
    clueId: [{ required: true, message: '请选择客户', trigger: 'change' }],
    ticketType: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
    priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
    refundMethod: [{ required: true, message: '请输入退款方式', trigger: 'blur' }],
    reason: [
        { required: true, message: '请输入申请原因', trigger: 'blur' },
        { max: 500, message: '申请原因长度不能超过 500 个字符', trigger: 'blur' }
    ],
    remark: [{ max: 500, message: '补充备注长度不能超过 500 个字符', trigger: 'blur' }]
})

const emit = defineEmits(['success'])

const open = () => {
    dialogVisible.value = true
    resetForm()
}
defineExpose({ open })

const openOrderSelect = () => {
    orderSelectDialogRef.value?.open()
}

const handleOrderConfirm = (order: OrderApi.OrderDetailRespVO) => {
    if (!order?.clueId) {
        message.warning('该订单未关联客户，无法用于售后工单')
        return
    }
    formData.value.orderId = order.id
    formData.value.clueId = Number(order.clueId)
    selectedOrderDisplay.value = `${order.orderNo} / ${order.customerName || '--'}`
}

const clearSelectedOrder = () => {
    formData.value.orderId = undefined as unknown as number
    formData.value.clueId = undefined as unknown as number
    selectedOrderDisplay.value = ''
}

const openUserSelect = () => {
    const selectedList = formData.value.handlerUserId
        ? [{ id: formData.value.handlerUserId, nickname: handlerUserName.value }]
        : []
    userSelectFormRef.value?.open(0, selectedList, { title: '选择处理人', multiple: false })
}

const handleUserSelectConfirm = (_id: any, userList: UserVO[]) => {
    const user = userList?.[0]
    formData.value.handlerUserId = user?.id
    handlerUserName.value = user?.nickname || user?.username || ''
}

const clearHandler = () => {
    formData.value.handlerUserId = undefined
    handlerUserName.value = ''
}

const submitForm = async () => {
    await formRef.value.validate()
    formLoading.value = true
    try {
        await AftersalesApi.createAftersales(formData.value)
        message.success('新增成功')
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}

const resetForm = () => {
    formData.value = {
        clueId: undefined as unknown as number,
        orderId: undefined as unknown as number,
        refundMethod: '原路返回',
        ticketType: 2,
        priority: 2,
        refundAmount: undefined,
        reason: '',
        remark: '',
        handlerUserId: undefined
    }
    selectedOrderDisplay.value = ''
    handlerUserName.value = ''
    formRef.value?.resetFields()
}
</script>
