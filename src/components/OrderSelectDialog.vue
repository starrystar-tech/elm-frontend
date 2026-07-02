<template>
    <Dialog v-model="dialogVisible" title="选择订单" width="1080px" append-to-body>
        <ContentWrap>
            <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
        </ContentWrap>
        <ContentWrap class="mt-10px">
            <Table
                v-model:currentPage="tableObject.currentPage"
                v-model:pageSize="tableObject.pageSize"
                :columns="tableColumns"
                :data="tableObject.tableList"
                :loading="tableObject.loading"
                :pagination="{ total: tableObject.total }"
                :selection="multiple"
                row-key="id"
                reserve-selection
                @register="tableRegister"
            />
        </ContentWrap>
        <template #footer>
            <el-button @click="dialogVisible = false">取 消</el-button>
            <el-button v-if="multiple" type="primary" @click="handleBatchConfirm">确 定</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="tsx">
import { computed, ref } from 'vue'
import { ElLink } from 'element-plus'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { dateFormatter } from '@/utils/formatTime'
import * as OrderApi from '@/api/crm/order'

defineOptions({ name: 'OrderSelectDialog' })

const emit = defineEmits<{
    confirm: [order: OrderApi.OrderDetailRespVO | OrderApi.OrderPageRespVO[]]
}>()

interface OrderSelectOpenOptions extends Partial<OrderApi.OrderPageReqVO> {
    multiple?: boolean
}

const message = useMessage()
const dialogVisible = ref(false)
const multiple = ref(false)
const baseSearchParams = ref<Partial<OrderApi.OrderPageReqVO>>({})

const searchSchema = computed<FormSchema[]>(() => [
    {
        field: 'orderNo',
        label: '订单编号',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    },
    {
        field: 'customer',
        label: '客户',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    },
    {
        field: 'mobile',
        label: '联系电话',
        component: 'Input',
        componentProps: { clearable: true, style: { width: '220px' } }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<OrderApi.OrderPageRespVO>({
    getListApi: async (params) => await OrderApi.getOrderPage(params)
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams({
        ...baseSearchParams.value,
        ...params
    })
}

const open = async (options: OrderSelectOpenOptions = {}) => {
    dialogVisible.value = true
    multiple.value = !!options.multiple
    baseSearchParams.value = {
        clueId: options.clueId
    }
    await tableMethods.clearSelection()
    tableMethods.setSearchParams({
        ...baseSearchParams.value,
        orderNo: undefined,
        customer: undefined,
        mobile: undefined
    })
}

const handleSelect = async (row: OrderApi.OrderPageRespVO) => {
    const detail = await OrderApi.getOrder(row.id)
    if (!detail?.clueId) {
        message.warning('该订单未关联客户，无法用于售后工单')
        return
    }
    dialogVisible.value = false
    emit('confirm', detail)
}

const handleBatchConfirm = async () => {
    const selections = await tableMethods.getSelections()
    if (!selections.length) {
        message.warning('请选择订单')
        return
    }
    dialogVisible.value = false
    emit('confirm', selections)
}

const tableColumns = computed<TableColumn[]>(() => {
    const columns: TableColumn[] = [
        { field: 'orderNo', label: '订单编号', minWidth: '180px' },
        { field: 'customerName', label: '客户', minWidth: '120px' },
        { field: 'customerMobile', label: '手机号', minWidth: '150px' },
        { field: 'campusName', label: '校区', minWidth: '140px' },
        { field: 'projectName', label: '项目', minWidth: '160px' },
        { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter }
    ]
    if (!multiple.value) {
        columns.push({
            field: 'action',
            label: '操作',
            width: '90px',
            fixed: 'right',
            slots: {
                default: (data) => (
                    <ElLink
                        type="primary"
                        underline={false}
                        onClick={() => handleSelect(data.row as OrderApi.OrderPageRespVO)}
                    >
                        选择
                    </ElLink>
                )
            }
        })
    }
    return columns
})

defineExpose({ open })
</script>
