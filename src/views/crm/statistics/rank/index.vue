<!-- BI 排行榜 -->
<template>
    <ContentWrap>
        <Search
            :schema="searchSchema"
            :model="queryParams"
            :remove-no-value-item="false"
            @reset="setSearchParams"
            @search="setSearchParams"
        />
        <div class="px-4 py-2">
            <el-tabs v-model="activeTab" class="statistics-rank-tabs">
                <el-tab-pane label="合同金额排行" name="contractPriceRank" lazy>
                    <ContractPriceRank :query-params="queryParams" ref="contractPriceRankRef" />
                </el-tab-pane>
                <el-tab-pane label="回款金额排行" name="receivablePriceRank" lazy>
                    <ReceivablePriceRank :query-params="queryParams" ref="receivablePriceRankRef" />
                </el-tab-pane>
                <el-tab-pane label="签约合同排行" name="contractCountRank" lazy>
                    <ContractCountRank :query-params="queryParams" ref="contractCountRankRef" />
                </el-tab-pane>
                <el-tab-pane label="产品销量排行" name="productSalesRank" lazy>
                    <ProductSalesRank :query-params="queryParams" ref="productSalesRankRef" />
                </el-tab-pane>
                <el-tab-pane label="新增客户数排行" name="customerCountRank" lazy>
                    <CustomerCountRank :query-params="queryParams" ref="customerCountRankRef" />
                </el-tab-pane>
                <el-tab-pane label="新增联系人数排行" name="contactCountRank" lazy>
                    <ContactCountRank :query-params="queryParams" ref="contactCountRankRef" />
                </el-tab-pane>
                <el-tab-pane label="跟进次数排行" name="followCountRank" lazy>
                    <FollowCountRank :query-params="queryParams" ref="followCountRankRef" />
                </el-tab-pane>
                <el-tab-pane label="跟进客户数排行" name="followCustomerCountRank" lazy>
                    <FollowCustomerCountRank
                        :query-params="queryParams"
                        ref="followCustomerCountRankRef"
                    />
                </el-tab-pane>
            </el-tabs>
        </div>
    </ContentWrap>
</template>

<script lang="ts" setup>
import ContractPriceRank from './components/ContractPriceRank.vue'
import ReceivablePriceRank from './components/ReceivablePriceRank.vue'
import ContractCountRank from './components/ContractCountRank.vue'
import ProductSalesRank from './components/ProductSalesRank.vue'
import CustomerCountRank from './components/CustomerCountRank.vue'
import ContactCountRank from './components/ContactCountRank.vue'
import FollowCountRank from './components/FollowCountRank.vue'
import FollowCustomerCountRank from './components/FollowCustomerCountRank.vue'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { defaultProps, handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import { beginOfDay, defaultShortcuts, endOfDay, formatDate } from '@/utils/formatTime'
import { useUserStore } from '@/store/modules/user'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'CrmStatisticsRank' })

const createDefaultTimes = () => [
    formatDate(beginOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24 * 7))),
    formatDate(endOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24)))
]

const queryParams = reactive({
    deptId: useUserStore().getUser.deptId,
    times: createDefaultTimes()
})

const deptList = ref<Tree[]>([])

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'times',
        label: '时间范围',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
            shortcuts: defaultShortcuts,
            style: { width: '240px' }
        }
    },
    {
        field: 'deptId',
        label: '归属部门',
        component: 'TreeSelect',
        componentProps: {
            data: [],
            props: defaultProps,
            nodeKey: 'id',
            checkStrictly: true,
            placeholder: '请选择归属部门',
            style: { width: '240px' }
        }
    }
])

const syncSearchSchema = () => {
    const deptSchema = searchSchema.find((item) => item.field === 'deptId')
    if (deptSchema?.componentProps) {
        deptSchema.componentProps.data = deptList.value
    }
}

const activeTab = ref('contractPriceRank')
const contractPriceRankRef = ref()
const receivablePriceRankRef = ref()
const contractCountRankRef = ref()
const productSalesRankRef = ref()
const customerCountRankRef = ref()
const contactCountRankRef = ref()
const followCountRankRef = ref()
const followCustomerCountRankRef = ref()

const handleQuery = () => {
    switch (activeTab.value) {
        case 'contractPriceRank':
            contractPriceRankRef.value?.loadData?.()
            break
        case 'receivablePriceRank':
            receivablePriceRankRef.value?.loadData?.()
            break
        case 'contractCountRank':
            contractCountRankRef.value?.loadData?.()
            break
        case 'productSalesRank':
            productSalesRankRef.value?.loadData?.()
            break
        case 'customerCountRank':
            customerCountRankRef.value?.loadData?.()
            break
        case 'contactCountRank':
            contactCountRankRef.value?.loadData?.()
            break
        case 'followCountRank':
            followCountRankRef.value?.loadData?.()
            break
        case 'followCustomerCountRank':
            followCustomerCountRankRef.value?.loadData?.()
            break
    }
}

const setSearchParams = (params: Recordable) => {
    Object.assign(queryParams, params)
    handleQuery()
}

watch(activeTab, () => {
    handleQuery()
})

onMounted(async () => {
    deptList.value = handleTree(await DeptApi.getSimpleDeptList())
    syncSearchSchema()
})
</script>
