<!-- 数据统计 - 员工客户分析 -->
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
      <el-tabs v-model="activeTab">
        <el-tab-pane label="客户总量分析" lazy name="customerSummary">
          <CustomerSummary ref="customerSummaryRef" :query-params="queryParams" />
        </el-tab-pane>
        <el-tab-pane label="客户跟进次数分析" lazy name="followUpSummary">
          <CustomerFollowUpSummary ref="followUpSummaryRef" :query-params="queryParams" />
        </el-tab-pane>
        <el-tab-pane label="客户跟进方式分析" lazy name="followUpType">
          <CustomerFollowUpType ref="followUpTypeRef" :query-params="queryParams" />
        </el-tab-pane>
        <el-tab-pane label="客户转化率分析" lazy name="conversionStat">
          <CustomerConversionStat ref="conversionStatRef" :query-params="queryParams" />
        </el-tab-pane>
        <el-tab-pane label="公海客户分析" lazy name="poolSummary">
          <CustomerPoolSummary ref="customerPoolSummaryRef" :query-params="queryParams" />
        </el-tab-pane>
        <el-tab-pane label="员工客户成交周期分析" lazy name="dealCycleByUser">
          <CustomerDealCycleByUser ref="dealCycleByUserRef" :query-params="queryParams" />
        </el-tab-pane>
        <el-tab-pane label="地区客户成交周期分析" lazy name="dealCycleByArea">
          <CustomerDealCycleByArea ref="dealCycleByAreaRef" :query-params="queryParams" />
        </el-tab-pane>
        <el-tab-pane label="产品客户成交周期分析" lazy name="dealCycleByProduct">
          <CustomerDealCycleByProduct ref="dealCycleByProductRef" :query-params="queryParams" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import { Search } from '@/components/Search'
import { ContentWrap } from '@/components/ContentWrap'
import { useUserStore } from '@/store/modules/user'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { beginOfDay, defaultShortcuts, endOfDay, formatDate } from '@/utils/formatTime'
import { defaultProps, handleTree } from '@/utils/tree'
import type { FormSchema } from '@/types/form'
import CustomerConversionStat from './components/CustomerConversionStat.vue'
import CustomerDealCycleByUser from './components/CustomerDealCycleByUser.vue'
import CustomerDealCycleByArea from './components/CustomerDealCycleByArea.vue'
import CustomerDealCycleByProduct from './components/CustomerDealCycleByProduct.vue'
import CustomerFollowUpSummary from './components/CustomerFollowUpSummary.vue'
import CustomerFollowUpType from './components/CustomerFollowUpType.vue'
import CustomerSummary from './components/CustomerSummary.vue'
import CustomerPoolSummary from './components/CustomerPoolSummary.vue'

defineOptions({ name: 'CrmStatisticsCustomer' })

const createDefaultTimes = () => [
  formatDate(beginOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24 * 7))),
  formatDate(endOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24)))
]

const queryParams = reactive({
  interval: 2,
  deptId: useUserStore().getUser.deptId,
  userId: undefined,
  times: createDefaultTimes()
})

const deptList = ref<Tree[]>([])
const userList = ref<UserApi.UserVO[]>([])

const userListByDeptId = computed(() =>
  queryParams.deptId
    ? userList.value.filter((u: UserApi.UserVO) => u.deptId === queryParams.deptId)
    : []
)

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
    field: 'interval',
    label: '时间间隔',
    component: 'Select',
    componentProps: {
      options: getIntDictOptions(DICT_TYPE.DATE_INTERVAL),
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
      style: { width: '240px' },
      onChange: () => {
        queryParams.userId = undefined
        syncSearchSchema()
      }
    }
  },
  {
    field: 'userId',
    label: '员工',
    component: 'Select',
    componentProps: {
      options: [],
      placeholder: '请选择员工',
      style: { width: '240px' }
    }
  }
])

const syncSearchSchema = () => {
  const deptSchema = searchSchema.find((item) => item.field === 'deptId')
  const userSchema = searchSchema.find((item) => item.field === 'userId')
  if (deptSchema?.componentProps) {
    deptSchema.componentProps.data = deptList.value
  }
  if (userSchema?.componentProps) {
    userSchema.componentProps.options = userListByDeptId.value.map((user) => ({
      label: user.nickname,
      value: user.id
    }))
  }
}

const activeTab = ref('customerSummary')
const customerSummaryRef = ref()
const followUpSummaryRef = ref()
const followUpTypeRef = ref()
const conversionStatRef = ref()
const customerPoolSummaryRef = ref()
const dealCycleByUserRef = ref()
const dealCycleByAreaRef = ref()
const dealCycleByProductRef = ref()

const handleQuery = () => {
  switch (activeTab.value) {
    case 'customerSummary':
      customerSummaryRef.value?.loadData?.()
      break
    case 'followUpSummary':
      followUpSummaryRef.value?.loadData?.()
      break
    case 'followUpType':
      followUpTypeRef.value?.loadData?.()
      break
    case 'conversionStat':
      conversionStatRef.value?.loadData?.()
      break
    case 'poolSummary':
      customerPoolSummaryRef.value?.loadData?.()
      break
    case 'dealCycleByUser':
      dealCycleByUserRef.value?.loadData?.()
      break
    case 'dealCycleByArea':
      dealCycleByAreaRef.value?.loadData?.()
      break
    case 'dealCycleByProduct':
      dealCycleByProductRef.value?.loadData?.()
      break
  }
}

const setSearchParams = (params: Recordable) => {
  Object.assign(queryParams, params)
  syncSearchSchema()
  handleQuery()
}

watch(activeTab, () => {
  handleQuery()
})

watch(userListByDeptId, () => {
  syncSearchSchema()
})

onMounted(async () => {
  deptList.value = handleTree(await DeptApi.getSimpleDeptList())
  userList.value = handleTree(await UserApi.getSimpleUserList())
  syncSearchSchema()
})
</script>
