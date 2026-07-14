<template>
  <div class="seat-manage-page">
    <div class="seat-manage-page__stats">
      <div class="seat-stat-card">
        <span class="seat-stat-card__label">坐席总数</span>
        <strong class="seat-stat-card__value">{{ stats.total }}</strong>
      </div>
      <div class="seat-stat-card seat-stat-card--using">
        <span class="seat-stat-card__label">使用中</span>
        <strong class="seat-stat-card__value">{{ stats.inUse }}</strong>
      </div>
      <div class="seat-stat-card seat-stat-card--idle">
        <span class="seat-stat-card__label">空闲</span>
        <strong class="seat-stat-card__value">{{ stats.idle }}</strong>
      </div>
      <div class="seat-stat-card seat-stat-card--disabled">
        <span class="seat-stat-card__label">停用</span>
        <strong class="seat-stat-card__value">{{ stats.disabled }}</strong>
      </div>
    </div>

    <ContentWrap>
      <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
      <div class="mb-10px">
        <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增坐席</BaseButton>
      </div>
      <Table
        v-model:currentPage="tableObject.currentPage"
        v-model:pageSize="tableObject.pageSize"
        :columns="tableColumns"
        :data="tableObject.tableList"
        :loading="tableObject.loading"
        :pagination="{ total: tableObject.total }"
        stripe
        show-overflow-tooltip
        @register="tableRegister"
      />
    </ContentWrap>

    <Dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form
        ref="formRef"
        v-loading="dialogLoading"
        :model="formData"
        :rules="formRules"
        label-width="110px"
      >
        <el-form-item label="坐席分机" prop="seatExt">
          <el-input v-model="formData.seatExt" clearable maxlength="64" placeholder="请输入坐席分机" />
        </el-form-item>
        <el-form-item label="SIP 密码" prop="sipPassword">
          <el-input v-model="formData.sipPassword" clearable maxlength="128" placeholder="请输入 SIP 密码" />
        </el-form-item>
        <el-form-item label="语音信箱密码" prop="voicemailPassword">
          <el-input
            v-model="formData.voicemailPassword"
            clearable
            maxlength="128"
            placeholder="请输入语音信箱密码"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="0">启用</el-radio>
            <el-radio :value="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            :rows="3"
            maxlength="255"
            placeholder="请输入备注"
            show-word-limit
            type="textarea"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogSaving" @click="handleSubmit">保存</el-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElTag, type FormRules } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as CallSeatApi from '@/api/system/call/seat'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'CrmCallSeat' })

const canQuery = hasPermission(['system:call-seat:query'])
const canCreate = hasPermission(['system:call-seat:create'])
const canUpdate = hasPermission(['system:call-seat:update'])
const canDelete = hasPermission(['system:call-seat:delete'])

const message = useMessage()
const formRef = ref()
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const dialogSaving = ref(false)
const dialogTitle = ref('新增坐席')

const stats = reactive<CallSeatApi.CallSeatStatsVO>({
  total: 0,
  inUse: 0,
  idle: 0,
  disabled: 0
})

const formData = reactive<CallSeatApi.CallSeatVO>({
  id: undefined,
  seatExt: '',
  sipPassword: '',
  voicemailPassword: '',
  status: 0,
  remark: ''
})

const formRules = reactive<FormRules>({
  seatExt: [
    { required: true, message: '请输入坐席分机', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9._@-]+$/,
      message: '坐席分机仅支持字母、数字、点、下划线、中划线和 @',
      trigger: 'blur'
    }
  ],
  sipPassword: [{ required: true, message: '请输入 SIP 密码', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
})

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'keyword',
    label: '关键字',
    component: 'Input',
    componentProps: { placeholder: '请输入坐席分机/备注', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'status',
    label: '状态',
    component: 'Select',
    componentProps: {
      clearable: true,
      placeholder: '请选择状态',
      style: { width: '220px' },
      options: [
        { label: '启用', value: 0 },
        { label: '停用', value: 1 }
      ]
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<CallSeatApi.CallSeatVO>({
  getListApi: async (params) => await CallSeatApi.getCallSeatPage(params),
  delListApi: async (id) => await CallSeatApi.deleteCallSeat(id as number)
})

const setSearchParams = (params: Recordable = {}) => {
  tableMethods.setSearchParams({
    keyword: params.keyword,
    status: params.status
  })
}

const loadStats = async () => {
  if (!canQuery) return
  const result = await CallSeatApi.getCallSeatStats()
  stats.total = Number(result?.total || 0)
  stats.inUse = Number(result?.inUse || 0)
  stats.idle = Number(result?.idle || 0)
  stats.disabled = Number(result?.disabled || 0)
}

const resetFormData = () => {
  formData.id = undefined
  formData.seatExt = ''
  formData.sipPassword = ''
  formData.voicemailPassword = ''
  formData.status = 0
  formData.remark = ''
}

const openForm = async (type: 'create' | 'update', id?: number) => {
  resetFormData()
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增坐席' : '编辑坐席'
  formRef.value?.clearValidate()
  if (type !== 'update' || !id) return
  dialogLoading.value = true
  try {
    const data = await CallSeatApi.getCallSeat(id)
    formData.id = data.id
    formData.seatExt = data.seatExt
    formData.sipPassword = data.sipPassword
    formData.voicemailPassword = data.voicemailPassword || ''
    formData.status = data.status
    formData.remark = data.remark || ''
  } finally {
    dialogLoading.value = false
  }
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  dialogSaving.value = true
  try {
    const payload: CallSeatApi.CallSeatVO = {
      id: formData.id,
      seatExt: formData.seatExt.trim(),
      sipPassword: formData.sipPassword.trim(),
      voicemailPassword: formData.voicemailPassword?.trim() || undefined,
      status: formData.status,
      remark: formData.remark?.trim() || undefined
    }
    if (payload.id) {
      await CallSeatApi.updateCallSeat(payload)
      message.success('修改成功')
    } else {
      await CallSeatApi.createCallSeat(payload)
      message.success('新增成功')
    }
    dialogVisible.value = false
    await tableMethods.getList()
    await loadStats()
  } finally {
    dialogSaving.value = false
  }
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
  await loadStats()
}

const statusLabel = (row: CallSeatApi.CallSeatVO) => {
  if (row.status === 1) return '停用'
  return row.inUse ? '使用中' : '空闲'
}

const statusType = (row: CallSeatApi.CallSeatVO) => {
  if (row.status === 1) return 'info'
  return row.inUse ? 'success' : 'warning'
}

const currentUserText = (row: CallSeatApi.CallSeatVO) => {
  const parts = [row.currentUserName, row.currentUserAccount, row.currentDeptName].filter(Boolean)
  return parts.length ? parts.join(' / ') : '--'
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'seatExt', label: '坐席分机', minWidth: 120 },
  { field: 'sipPassword', label: 'SIP 密码', minWidth: 180 },
  { field: 'voicemailPassword', label: '语音信箱密码', minWidth: 180 },
  {
    field: 'statusText',
    label: '状态',
    width: 110,
    slots: {
      default: ({ row }) => <ElTag type={statusType(row)}>{statusLabel(row)}</ElTag>
    }
  },
  {
    field: 'currentUserName',
    label: '当前使用人',
    minWidth: 220,
    slots: {
      default: ({ row }) => currentUserText(row)
    }
  },
  { field: 'currentCallerDisplayNumber', label: '外显号码', minWidth: 140, formatter: (_r, _c, value) => value || '--' },
  { field: 'remark', label: '备注', minWidth: 180, formatter: (_r, _c, value) => value || '--' },
  { field: 'createTime', label: '创建时间', width: 180, formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: 180,
    fixed: 'right',
    slots: {
      default: ({ row }) => (
        <>
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => openForm('update', row.id)}>
              编辑
            </BaseButton>
          ) : null}
          {canDelete ? (
            <BaseButton link type="danger" onClick={() => handleDelete(row.id)}>
              删除
            </BaseButton>
          ) : null}
        </>
      )
    }
  }
])

onMounted(async () => {
  if (canQuery) {
    await tableMethods.getList()
    await loadStats()
  }
})
</script>

<style scoped>
.seat-manage-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.seat-manage-page__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.seat-stat-card {
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.seat-stat-card__label {
  font-size: 13px;
  color: #606266;
}

.seat-stat-card__value {
  font-size: 28px;
  line-height: 1;
  color: #303133;
}

.seat-stat-card--using .seat-stat-card__value {
  color: #67c23a;
}

.seat-stat-card--idle .seat-stat-card__value {
  color: #e6a23c;
}

.seat-stat-card--disabled .seat-stat-card__value {
  color: #909399;
}

@media (max-width: 1200px) {
  .seat-manage-page__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .seat-manage-page__stats {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>
