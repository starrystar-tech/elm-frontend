<template>
  <ContentWrap>
    <Search
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="-mb-15px"
      label-width="68px"
    >
      <el-form-item label="用户昵称" prop="nickname">
        <el-input
          v-model="queryParams.nickname"
          class="!w-240px"
          clearable
          placeholder="请输入用户昵称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="手机号" prop="mobile">
        <el-input
          v-model="queryParams.mobile"
          class="!w-240px"
          clearable
          placeholder="请输入手机号"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="注册时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item label="登录时间" prop="loginDate">
        <el-date-picker
          v-model="queryParams.loginDate"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
          end-placeholder="结束日期"
          start-placeholder="开始日期"
          type="daterange"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item label="用户标签" prop="tagIds">
        <MemberTagSelect v-model="queryParams.tagIds" />
      </el-form-item>
      <el-form-item label="用户等级" prop="levelId">
        <MemberLevelSelect v-model="queryParams.levelId" />
      </el-form-item>
      <el-form-item label="用户分组" prop="groupId">
        <MemberGroupSelect v-model="queryParams.groupId" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search" />
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh" />
          重置
        </el-button>
        <BaseButton v-if="canSendCoupon" @click="openCoupon">发送优惠券</BaseButton>
      </el-form-item>
    </Search>
  </ContentWrap>

  <ContentWrap>
    <Table
      v-model:currentPage="tableObject.currentPage"
      v-model:pageSize="tableObject.pageSize"
      :columns="tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{ total: tableObject.total }"
      stripe
      show-overflow-tooltip
      selection
      @register="tableRegister"
      @selection-change="handleSelectionChange"
    />
  </ContentWrap>

  <UserForm ref="formRef" @success="tableMethods.getList" />
  <UserLevelUpdateForm ref="updateLevelFormRef" @success="tableMethods.getList" />
  <UserPointUpdateForm ref="updatePointFormRef" @success="tableMethods.getList" />
  <UserBalanceUpdateForm ref="updateBalanceFormRef" @success="tableMethods.getList" />
  <CouponSendForm ref="couponSendFormRef" />
</template>

<script lang="tsx" setup>
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElTag } from 'element-plus'
import { reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as UserApi from '@/api/member/user'
import { DICT_TYPE } from '@/utils/dict'
import UserForm from './UserForm.vue'
import MemberTagSelect from '@/views/member/tag/components/MemberTagSelect.vue'
import MemberLevelSelect from '@/views/member/level/components/MemberLevelSelect.vue'
import MemberGroupSelect from '@/views/member/group/components/MemberGroupSelect.vue'
import UserLevelUpdateForm from './components/UserLevelUpdateForm.vue'
import UserPointUpdateForm from './components/UserPointUpdateForm.vue'
import UserBalanceUpdateForm from './components/UserBalanceUpdateForm.vue'
import { CouponSendForm } from '@/views/mall/promotion/coupon/components'
import { checkPermi } from '@/utils/permission'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'MemberUser' })

const message = useMessage()
const { push } = useRouter()
const canSendCoupon = hasPermission(['promotion:coupon:send'])

const queryParams = reactive({
  nickname: null,
  mobile: null,
  loginDate: [],
  createTime: [],
  tagIds: [],
  levelId: null,
  groupId: null
})
const queryFormRef = ref()
const selectedIds = ref<number[]>([])

const { tableObject, tableMethods, register: tableRegister } = useTable<UserApi.UserVO>({
  getListApi: async (params) => await UserApi.getUserPage(params)
})

const handleQuery = () => {
  tableMethods.setSearchParams(queryParams)
}

const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

const openDetail = (id: number) => {
  push({ name: 'MemberUserDetail', params: { id } })
}

const formRef = ref<InstanceType<typeof UserForm>>()
const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleSelectionChange = (rows: UserApi.UserVO[]) => {
  selectedIds.value = rows.map((row) => row.id)
}

const couponSendFormRef = ref<InstanceType<typeof CouponSendForm>>()
const openCoupon = () => {
  if (selectedIds.value.length === 0) {
    message.warning('请选择要发送优惠券的用户')
    return
  }
  couponSendFormRef.value?.open(selectedIds.value)
}

const updateLevelFormRef = ref<InstanceType<typeof UserLevelUpdateForm>>()
const updatePointFormRef = ref<InstanceType<typeof UserPointUpdateForm>>()
const updateBalanceFormRef = ref<InstanceType<typeof UserBalanceUpdateForm>>()

const handleCommand = (command: string, row: UserApi.UserVO) => {
  switch (command) {
    case 'handleUpdate':
      openForm('update', row.id)
      break
    case 'handleUpdateLevel':
      updateLevelFormRef.value?.open(row.id)
      break
    case 'handleUpdatePoint':
      updatePointFormRef.value?.open(row.id)
      break
    case 'handleUpdateBlance':
      updateBalanceFormRef.value?.open(row.id)
      break
  }
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '用户编号', width: '120px' },
  {
    field: 'avatar',
    label: '头像',
    width: '80px',
    slots: {
      default: (data) => <img src={data.row.avatar} style="width: 40px" />
    }
  },
  { field: 'mobile', label: '手机号', width: '120px' },
  { field: 'nickname', label: '昵称', width: '80px' },
  { field: 'levelName', label: '等级', width: '100px' },
  { field: 'groupName', label: '分组', width: '100px' },
  {
    field: 'tagNames',
    label: '用户标签',
    showOverflowTooltip: false,
    slots: {
      default: (data) => (
        <>
          {(data.row.tagNames || []).map((tagName: string, index: number) => (
            <ElTag key={index} class="mr-5px">
              {tagName}
            </ElTag>
          ))}
        </>
      )
    }
  },
  { field: 'point', label: '积分', width: '100px' },
  {
    field: 'status',
    label: '状态',
    width: '100px',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'loginDate', label: '登录时间', width: '180px', formatter: dateFormatter },
  { field: 'createTime', label: '注册时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '140px',
    fixed: 'right',
    showOverflowTooltip: false,
    slots: {
      default: (data) => {
        const row = data.row as UserApi.UserVO
        return (
          <div class="flex items-center justify-center">
            <BaseButton link type="primary" onClick={() => openDetail(row.id)}>
              详情
            </BaseButton>
            {checkPermi([
              'member:user:update',
              'member:user:update-level',
              'member:user:update-point',
              'pay:wallet:update-balance'
            ]) ? (
              <ElDropdown onCommand={(command: string) => handleCommand(command, row)}>
                <BaseButton link type="primary">更多</BaseButton>
                {{
                  dropdown: () => (
                    <ElDropdownMenu>
                      {checkPermi(['member:user:update']) ? (
                        <ElDropdownItem command="handleUpdate">编辑</ElDropdownItem>
                      ) : null}
                      {checkPermi(['member:user:update-level']) ? (
                        <ElDropdownItem command="handleUpdateLevel">修改等级</ElDropdownItem>
                      ) : null}
                      {checkPermi(['member:user:update-point']) ? (
                        <ElDropdownItem command="handleUpdatePoint">修改积分</ElDropdownItem>
                      ) : null}
                      {checkPermi(['pay:wallet:update-balance']) ? (
                        <ElDropdownItem command="handleUpdateBlance">修改余额</ElDropdownItem>
                      ) : null}
                    </ElDropdownMenu>
                  )
                }}
              </ElDropdown>
            ) : null}
          </div>
        )
      }
    }
  }
])

onMounted(() => {
  handleQuery()
})
</script>
