<!-- 数据统计 - 客户画像 -->
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
        <el-tab-pane label="城市分布分析" lazy name="areaRef">
          <PortraitCustomerArea ref="areaRef" :query-params="queryParams" />
        </el-tab-pane>
        <el-tab-pane label="客户级别分析" lazy name="levelRef">
          <PortraitCustomerLevel ref="levelRef" :query-params="queryParams" />
        </el-tab-pane>
        <el-tab-pane label="客户来源分析" lazy name="sourceRef">
          <PortraitCustomerSource ref="sourceRef" :query-params="queryParams" />
        </el-tab-pane>
        <el-tab-pane label="客户行业分析" lazy name="industryRef">
          <PortraitCustomerIndustry ref="industryRef" :query-params="queryParams" />
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
import { beginOfDay, defaultShortcuts, endOfDay, formatDate } from '@/utils/formatTime'
import { defaultProps, handleTree } from '@/utils/tree'
import type { FormSchema } from '@/types/form'
import PortraitCustomerArea from './components/PortraitCustomerArea.vue'
import PortraitCustomerIndustry from './components/PortraitCustomerIndustry.vue'
import PortraitCustomerSource from './components/PortraitCustomerSource.vue'
import PortraitCustomerLevel from './components/PortraitCustomerLevel.vue'

defineOptions({ name: 'CrmStatisticsPortrait' })

const createDefaultTimes = () => [
  formatDate(beginOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24 * 7))),
  formatDate(endOfDay(new Date(new Date().getTime() - 3600 * 1000 * 24)))
]

const queryParams = reactive({
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

const activeTab = ref('areaRef')
const areaRef = ref()
const levelRef = ref()
const sourceRef = ref()
const industryRef = ref()

const handleQuery = () => {
  switch (activeTab.value) {
    case 'areaRef':
      areaRef.value?.loadData?.()
      break
    case 'levelRef':
      levelRef.value?.loadData?.()
      break
    case 'sourceRef':
      sourceRef.value?.loadData?.()
      break
    case 'industryRef':
      industryRef.value?.loadData?.()
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
