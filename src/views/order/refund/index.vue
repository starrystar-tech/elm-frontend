<template>
    <ContentWrap>
        <Search
            ref="searchRef"
            :schema="searchSchema"
            :model="searchForm"
            @search="setSearchParams"
            @reset="handleReset"
        >
            <template #creator>
                <el-input
                    v-model="creatorDisplayName"
                    readonly
                    placeholder="请选择创建人"
                    style="width: 220px"
                    @click="openUserSelect"
                >
                    <template #suffix>
                        <el-icon
                            v-if="creatorDisplayName"
                            class="cursor-pointer"
                            @click.stop="clearSelectedUser"
                        >
                            <CircleClose />
                        </el-icon>
                    </template>
                </el-input>
            </template>
        </Search>
        <Table
            v-model:currentPage="tableObject.currentPage"
            v-model:pageSize="tableObject.pageSize"
            :columns="tableColumns"
            :data="tableObject.tableList"
            :loading="tableObject.loading"
            :pagination="{ total: tableObject.total }"
            @register="tableRegister"
        />
    </ContentWrap>

    <RefundAuditDialog ref="auditRef" @success="tableMethods.getList" />
    <UserSelectForm ref="userSelectFormRef" @confirm="handleUserSelectConfirm" />
</template>

<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue'
import { CircleClose } from '@element-plus/icons-vue'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import type { SearchExpose } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { dateFormatter } from '@/utils/formatTime'
import * as OrderApi from '@/api/crm/order'
import { REFUND_STATUS_OPTIONS, REFUND_TYPE_OPTIONS, formatAmount, getOptionLabel } from '../utils'
import RefundAuditDialog from './RefundAuditDialog.vue'
import { renderCopyMobileCell } from '@/views/crm/clue/mobileCopy'
import UserSelectForm from '@/components/UserSelectForm/index.vue'
import type { UserVO } from '@/api/system/user'

defineOptions({ name: 'OrderRefund' })

const message = useMessage()
const auditRef = ref<InstanceType<typeof RefundAuditDialog>>()
const searchRef = ref<SearchExpose>()
const userSelectFormRef = ref<InstanceType<typeof UserSelectForm>>()
const defaultSearchForm = {
    mobile: '',
    customer: '',
    orderNo: '',
    refundStatus: undefined,
    refundNo: '',
    refundType: undefined,
    refundTimeRange: [],
    refundAmountRange: [],
    creator: '',
    createTimeRange: []
}
const searchForm = reactive<Recordable>({ ...defaultSearchForm })
const creatorDisplayName = ref('')

const searchSchema = computed<FormSchema[]>(() => [
    {
        field: 'mobile',
        label: '联系电话',
        component: 'Input',
        componentProps: { placeholder: '请输入手机号', clearable: true, style: { width: '220px' } }
    },
    {
        field: 'customer',
        label: '客户',
        component: 'Input',
        componentProps: {
            placeholder: '请输入客户编号/姓名',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'orderNo',
        label: '订单编号',
        component: 'Input',
        componentProps: {
            placeholder: '请输入订单编号',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'refundStatus',
        label: '退款状态',
        component: 'Select',
        componentProps: {
            options: REFUND_STATUS_OPTIONS,
            placeholder: '请选择',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'refundNo',
        label: '退款单号',
        component: 'Input',
        componentProps: {
            placeholder: '请输入退款单号',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'refundType',
        label: '退款类型',
        component: 'Select',
        componentProps: {
            options: REFUND_TYPE_OPTIONS,
            placeholder: '请选择',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'refundTimeRange',
        label: '退款时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            style: { width: '220px' }
        }
    },
    {
        field: 'refundAmountRange',
        label: '退款金额',
        component: 'AmountRangeInput',
        componentProps: {
            style: { width: '220px' },
            startPlaceholder: '最小金额',
            endPlaceholder: '最大金额'
        }
    },
    {
        field: 'creator',
        label: '创建人',
        component: 'Input'
    },
    {
        field: 'createTimeRange',
        label: '创建时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            style: { width: '220px' }
        }
    }
])

const syncSearchField = async (value: string) => {
    searchForm.creator = value
    await searchRef.value?.setValues({ creator: value })
}

const openUserSelect = () => {
    userSelectFormRef.value?.open(0, [], { title: '选择创建人', multiple: false })
}

const handleUserSelectConfirm = (_id: any, userList: UserVO[]) => {
    const user = userList?.[0]
    const userName = user?.nickname || user?.username || ''
    creatorDisplayName.value = userName
    syncSearchField(user?.id ? String(user.id) : '')
}

const clearSelectedUser = () => {
    creatorDisplayName.value = ''
    syncSearchField('')
}

const handleReset = async (params: Recordable) => {
    Object.assign(searchForm, defaultSearchForm)
    creatorDisplayName.value = ''
    await searchRef.value?.setValues({ ...defaultSearchForm })
    setSearchParams(params)
}

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<OrderApi.OrderRefundRespVO>({
    getListApi: async (params) => {
        const {
            refundTimeRange = [],
            refundAmountRange = [],
            createTimeRange = [],
            ...rest
        } = params
        return await OrderApi.getRefundPage({
            ...rest,
            beginRefundTime: refundTimeRange[0],
            endRefundTime: refundTimeRange[1],
            beginCreateTime: createTimeRange[0],
            endCreateTime: createTimeRange[1],
            minRefundAmount: refundAmountRange[0] ? Number(refundAmountRange[0]) : undefined,
            maxRefundAmount: refundAmountRange[1] ? Number(refundAmountRange[1]) : undefined
        })
    }
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(params)
}

const openAudit = (row: OrderApi.OrderRefundRespVO, readonly = row.refundStatus !== 0) => {
    auditRef.value?.open(row, readonly)
}

const getOrderClueDetail = async (id: number) => {
    const detail = await OrderApi.getOrder(id)
    return { clueId: detail.clueId }
}

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'refundNo', label: '退款单号', minWidth: '160px' },
    { field: 'refundMethod', label: '退款方式', minWidth: '110px' },
    {
        field: 'refundType',
        label: '退款类型',
        minWidth: '100px',
        formatter: (_r, _c, v) => getOptionLabel(REFUND_TYPE_OPTIONS, v)
    },
    {
        field: 'refundAmount',
        label: '退款金额',
        minWidth: '100px',
        formatter: (_r, _c, v) => formatAmount(v)
    },
    {
        field: 'refundStatus',
        label: '退款状态',
        minWidth: '100px',
        formatter: (_r, _c, v) => getOptionLabel(REFUND_STATUS_OPTIONS, v)
    },
    { field: 'refundReason', label: '退款原因', minWidth: '160px' },
    { field: 'refundRemark', label: '退款备注', minWidth: '160px' },
    { field: 'orderNo', label: '订单编号', minWidth: '160px' },
    { field: 'customerName', label: '姓名', minWidth: '100px' },
    { field: 'customerId', label: '客户编号', minWidth: '100px' },
    {
        field: 'customerMobile',
        label: '手机号',
        minWidth: '170px',
        slots: {
            default: (data) =>
                renderCopyMobileCell({
                    row: { id: data.row.orderId },
                    mobile: data.row.customerMobile,
                    getDetail: getOrderClueDetail,
                    success: message.success,
                    warning: message.warning
                })
        }
    },
    {
        field: 'creatorName',
        label: '创建人',
        minWidth: '110px'
    },
    { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'auditUserName', label: '审批人', minWidth: '100px' },
    { field: 'refundTime', label: '退款时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'auditRemark', label: '审批备注', minWidth: '160px' },
    {
        field: 'action',
        label: '操作',
        width: '160px',
        fixed: 'right',
        slots: {
            default: (data) => {
                const row = data.row as OrderApi.OrderRefundRespVO
                return row.refundStatus === 0 ? (
                    <BaseButton link type="primary" onClick={() => openAudit(row, false)}>
                        审核
                    </BaseButton>
                ) : (
                    <BaseButton link type="primary" onClick={() => openAudit(row, true)}>
                        查看
                    </BaseButton>
                )
            }
        }
    }
])

onMounted(() => {
    tableMethods.getList()
})
</script>
