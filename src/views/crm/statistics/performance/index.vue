<!-- 数据统计 - 员工业绩分析 -->
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
        <el-tab-pane label="员工合同数量统计" name="ContractCountPerformance" lazy>
          <ContractCountPerformance
            :query-params="queryParams"
            ref="ContractCountPerformanceRef"
          />
        </el-tab-pane>
        <el-tab-pane label="员工合同金额统计" name="ContractPricePerformance" lazy>
          <ContractPricePerformance
            :query-params="queryParams"
            ref="ContractPricePerformanceRef"
          />
        </el-tab-pane>
        <el-tab-pane label="员工回款金额统计" name="ReceivablePricePerformance" lazy>
          <ReceivablePricePerformance
            :query-params="queryParams"
            ref="ReceivablePricePerformanceRef"
          />
        </el-tab-pane>
      </el-tabs>
    </div>
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import { ContentWrap } from '@/components/ContentWrap'
import { Search } from '@/components/Search'
import { useUserStore } from '@/store/modules/user'
import { beginOfDay, endOfDay, formatDate } from '@/utils/formatTime'
import { defaultProps, handleTree } from '@/utils/tree'
import type { FormSchema } from '@/types/form'
import ContractCountPerformance from './components/ContractCountPerformance.vue'
import ContractPricePerformance from './components/ContractPricePerformance.vue'
import ReceivablePricePerformance from './components/ReceivablePricePerformance.vue'

defineOptions({ name: 'CrmStatisticsPerformance' })

const currentYear = String(new Date().getFullYear())

const queryParams = reactive({
  deptId: useUserStore().getUser.deptId,
  userId: undefined,
  year: currentYear,
  times: [
    formatDate(beginOfDay(new Date(new Date().getFullYear(), 0, 1))),
    formatDate(endOfDay(new Date(new Date().getFullYear(), 11, 31)))
  ]
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
    field: 'year',
    label: '选择年份',
    component: 'DatePicker',
    componentProps: {
      type: 'year',
      valueFormat: 'YYYY',
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

const activeTab = ref('ContractCountPerformance')
const ContractCountPerformanceRef = ref()
const ContractPricePerformanceRef = ref()
const ReceivablePricePerformanceRef = ref()

const handleQuery = () => {
  const selectYear = Number(queryParams.year || currentYear)
  queryParams.times = [
    formatDate(beginOfDay(new Date(selectYear, 0, 1))),
    formatDate(endOfDay(new Date(selectYear, 11, 31)))
  ]

  switch (activeTab.value) {
    case 'ContractCountPerformance':
      ContractCountPerformanceRef.value?.loadData?.()
      break
    case 'ContractPricePerformance':
      ContractPricePerformanceRef.value?.loadData?.()
      break
    case 'ReceivablePricePerformance':
      ReceivablePricePerformanceRef.value?.loadData?.()
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
