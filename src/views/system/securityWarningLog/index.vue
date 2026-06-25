<template>
  <ContentWrap>
    <Search :model="searchForm" @reset="resetSearchParams" @search="setSearchParams">
      <el-form-item label="用户" prop="userId">
        <el-input
          v-model="selectedUserName"
          clearable
          placeholder="请选择用户"
          style="width: 220px"
          @click="openUserSelect"
          @clear="clearSelectedUser"
        />
      </el-form-item>
      <el-form-item label="预警类型" prop="warningType">
        <el-select
          v-model="searchForm.warningType"
          clearable
          placeholder="请选择预警类型"
          style="width: 220px"
        >
          <el-option
            v-for="item in warningTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="预警时间" prop="warningTime">
        <el-date-picker
          v-model="searchForm.warningTime"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          style="width: 220px"
        />
      </el-form-item>
      <el-form-item label-width="0">
        <el-button type="primary" @click="setSearchParams(searchForm)">
          <Icon class="mr-5px" icon="ep:search" />
          查询
        </el-button>
        <el-button @click="resetSearchParams">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
      </el-form-item>
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
  <UserSelectForm ref="userSelectFormRef" @confirm="handleUserSelectConfirm" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as SecurityWarningLogApi from '@/api/system/securityWarningLog'
import type { UserVO } from '@/api/system/user'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { useTable } from '@/hooks/web/useTable'
import UserSelectForm from '@/components/UserSelectForm/index.vue'

defineOptions({ name: 'SystemSecurityWarningLog' })

const warningTypeOptions = [
  { label: '异常登录', value: 1 },
  { label: '高频复制', value: 3 }
]

const selectedUserName = ref('')
const userSelectFormRef = ref<InstanceType<typeof UserSelectForm>>()
const searchForm = reactive<SecurityWarningLogApi.SecurityWarningLogPageReqVO>({
  userId: undefined,
  warningType: undefined,
  warningTime: undefined
})

const { tableObject, tableMethods, register: tableRegister } =
  useTable<SecurityWarningLogApi.SecurityWarningLogVO>({
    getListApi: async (params) =>
      await SecurityWarningLogApi.getSecurityWarningLogPage(
        params as SecurityWarningLogApi.SecurityWarningLogPageReqVO
      )
  })

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const resetSearchParams = () => {
  clearSelectedUser()
  searchForm.warningType = undefined
  searchForm.warningTime = undefined
  tableMethods.setSearchParams({})
}

const openUserSelect = () => {
  const selectedList = searchForm.userId
    ? [{ id: searchForm.userId, nickname: selectedUserName.value }]
    : []
  userSelectFormRef.value?.open(0, selectedList, { title: '选择用户', multiple: false })
}

const handleUserSelectConfirm = (_id: any, userList: UserVO[]) => {
  const user = userList?.[0]
  searchForm.userId = user?.id
  selectedUserName.value = user?.nickname || user?.username || ''
}

const clearSelectedUser = () => {
  searchForm.userId = undefined
  selectedUserName.value = ''
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '日志编号', width: '100px' },
  { field: 'warningTypeName', label: '预警类型', width: '140px' },
  { field: 'warningContent', label: '预警内容', minWidth: '320px' },
  { field: 'username', label: '用户账号', width: '140px' },
  { field: 'nickname', label: '用户名称', width: '140px' },
  { field: 'deptName', label: '所属部门', width: '160px' },
  { field: 'warningTime', label: '预警时间', formatter: dateFormatter, width: '180px' }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
