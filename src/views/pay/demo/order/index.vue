<template>
    <ContentWrap>
        <div class="mb-10px">
            <BaseButton type="primary" @click="openForm">发起订单</BaseButton>
        </div>
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

    <Dialog title="发起订单" v-model="dialogVisible" width="500px">
        <Search
            ref="formRef"
            v-loading="formLoading"
            :model="formData"
            :rules="formRules"
            label-width="100px"
        >
            <el-form-item label="商品" prop="spuId">
                <el-select
                    v-model="formData.spuId"
                    placeholder="请输入下单商品"
                    clearable
                    style="width: 380px"
                >
                    <el-option
                        v-for="item in spus"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id"
                    >
                        <span style="float: left">{{ item.name }}</span>
                        <span style="float: right; font-size: 13px; color: #8492a6">
                            ￥{{ (item.price / 100.0).toFixed(2) }}
                        </span>
                    </el-option>
                </el-select>
            </el-form-item>
        </Search>
        <template #footer>
            <BaseButton :disabled="formLoading" type="primary" @click="submitForm"
                >确 定</BaseButton
            >
            <BaseButton @click="dialogVisible = false">取 消</BaseButton>
        </template>
    </Dialog>
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import * as PayDemoApi from '@/api/pay/demo/order'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { DICT_TYPE } from '@/utils/dict'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { Dialog } from '@/components/Dialog'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'

defineOptions({ name: 'PayDemoOrder' })

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable({
    getListApi: async (params) => await PayDemoApi.getDemoOrderPage(params)
})

const setList = computed(() => tableObject.tableList)

const handlePay = (row: Recordable) => {
    router.push({
        name: 'PayCashier',
        query: {
            id: row.payOrderId,
            returnUrl: encodeURIComponent('/pay/demo/order?id=' + row.id)
        }
    })
}

const handleRefund = async (row: Recordable) => {
    const id = row.id
    try {
        await message.confirm('是否确认退款编号为"' + id + '"的示例订单?')
        await PayDemoApi.refundDemoOrder(id)
        await tableMethods.getList()
        message.success('发起退款成功！')
    } catch {}
}

const formatPrice = (price?: number) => `￥${((price || 0) / 100).toFixed(2)}`

const tableColumns = reactive<TableColumn[]>([
    { field: 'id', label: '订单编号' },
    { field: 'userId', label: '用户编号' },
    { field: 'spuName', label: '商品名字' },
    {
        field: 'price',
        label: '支付价格',
        slots: { default: (data) => <>{formatPrice(data.row.price)}</> }
    },
    {
        field: 'refundPrice',
        label: '退款金额',
        slots: { default: (data) => <>{formatPrice(data.row.refundPrice)}</> }
    },
    {
        field: 'createTime',
        label: '创建时间',
        width: '180px',
        formatter: dateFormatter
    },
    { field: 'payOrderId', label: '支付单号' },
    {
        field: 'payStatus',
        label: '是否支付',
        slots: {
            default: (data) => (
                <DictTag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.payStatus} />
            )
        }
    },
    {
        field: 'payTime',
        label: '支付时间',
        width: '180px',
        formatter: dateFormatter
    },
    {
        field: 'refundTime',
        label: '退款时间',
        width: '180px',
        slots: {
            default: (data) =>
                data.row.refundTime ? (
                    <span>{formatDate(data.row.refundTime)}</span>
                ) : data.row.payRefundId ? (
                    <span>退款中，等待退款结果</span>
                ) : null
        }
    },
    {
        field: 'action',
        label: '操作',
        width: '160px',
        slots: {
            default: (data) => (
                <>
                    {!data.row.payStatus ? (
                        <BaseButton link type="primary" onClick={() => handlePay(data.row)}>
                            前往支付
                        </BaseButton>
                    ) : null}
                    {data.row.payStatus && !data.row.payRefundId ? (
                        <BaseButton link type="danger" onClick={() => handleRefund(data.row)}>
                            发起退款
                        </BaseButton>
                    ) : null}
                </>
            )
        }
    }
])

const formRef = ref()
const spus = ref([
    { id: 1, name: '华为手机', price: 1 },
    { id: 2, name: '小米电视', price: 10 },
    { id: 3, name: '苹果手表', price: 100 },
    { id: 4, name: '华硕笔记本', price: 1000 },
    { id: 5, name: '蔚来汽车', price: 200000 }
])
const dialogVisible = ref(false)
const formLoading = ref(false)
const formData = ref<Recordable>({})
const formRules = {
    spuId: [{ required: true, message: '商品编号不能为空', trigger: 'blur' }]
}

const reset = () => {
    formData.value = { spuId: undefined }
    formRef.value?.resetFields()
}

const openForm = () => {
    reset()
    dialogVisible.value = true
}

const submitForm = async () => {
    if (!formRef.value) return
    const valid = await formRef.value.validate()
    if (!valid) return
    formLoading.value = true
    try {
        await PayDemoApi.createDemoOrder(formData.value)
        message.success(t('common.createSuccess'))
        dialogVisible.value = false
    } finally {
        formLoading.value = false
        await tableMethods.getList()
    }
}

onMounted(() => {
    tableMethods.getList()
})
</script>
