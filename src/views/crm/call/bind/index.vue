<template>
    <div class="seat-page">
        <div class="seat-page__stats">
            <div class="seat-stat">
                <span class="seat-stat__label">员工总数</span>
                <strong class="seat-stat__value">{{ stats.total }}</strong>
            </div>
            <div class="seat-stat seat-stat--green">
                <span class="seat-stat__label">已绑定坐席</span>
                <strong class="seat-stat__value">{{ stats.bound }}</strong>
            </div>
            <div class="seat-stat seat-stat--orange">
                <span class="seat-stat__label">待绑定坐席</span>
                <strong class="seat-stat__value">{{ stats.unbound }}</strong>
            </div>
        </div>

        <ContentWrap>
            <Search :model="searchParams" @search="setSearchParams" @reset="resetSearchParams">
                <el-form-item label="员工" prop="userId">
                    <el-input
                        v-model="selectedUserName"
                        clearable
                        placeholder="请选择员工"
                        style="width: 220px"
                        @click="openUserSelect"
                        @clear="clearSelectedUser"
                    />
                </el-form-item>
                <el-form-item label="所属部门" prop="deptId">
                    <DeptSelector
                        v-model="searchParams.deptId"
                        placeholder="请选择所属部门"
                        style="width: 220px"
                    />
                </el-form-item>
                <el-form-item label="绑定状态" prop="bindStatus">
                    <el-select
                        v-model="searchParams.bindStatus"
                        clearable
                        placeholder="请选择绑定状态"
                        style="width: 220px"
                    >
                        <el-option label="已绑定" value="bound" />
                        <el-option label="未绑定" value="unbound" />
                    </el-select>
                </el-form-item>
                <el-form-item label="线路" prop="outboundRouteId">
                    <OutboundRouteSelect
                        v-model="searchParams.outboundRouteId"
                        placeholder="请选择线路"
                        style="width: 220px"
                    />
                </el-form-item>
                <el-form-item label-width="0">
                    <el-button type="primary" @click="setSearchParams(searchParams)">
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

        <Dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
            <el-form
                ref="formRef"
                v-loading="dialogLoading"
                :model="formData"
                :rules="formRules"
                label-width="100px"
            >
                <el-form-item label="员工姓名">
                    <el-input :model-value="formData.nickname" disabled />
                </el-form-item>
                <el-form-item label="登录账号">
                    <el-input :model-value="formData.username" disabled />
                </el-form-item>
                <el-form-item label="所属部门">
                    <el-input :model-value="formData.deptName" disabled />
                </el-form-item>
                <!-- <el-form-item label="呼叫工号">
                    <el-input :model-value="formData.callNo || '--'" disabled />
                </el-form-item> -->
                <el-form-item label="坐席" prop="callExt">
                    <el-select
                        v-model="formData.callExt"
                        clearable
                        filterable
                        placeholder="请选择坐席"
                        style="width: 100%"
                    >
                        <el-option
                            v-for="seat in availableSeatOptions"
                            :key="seat.id"
                            :label="buildSeatOptionLabel(seat)"
                            :value="seat.seatExt"
                            :disabled="isSeatOptionDisabled(seat)"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="外显号码" prop="callerDisplayNumber">
                    <el-input
                        v-model="formData.callerDisplayNumber"
                        maxlength="32"
                        clearable
                        placeholder="请输入外显号码"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="dialogSaving" @click="handleSubmit">
                    保存
                </el-button>
            </template>
        </Dialog>
        <UserSelectForm ref="userSelectFormRef" @confirm="handleUserSelectConfirm" />
    </div>
</template>

<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormRules } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as CallSeatApi from '@/api/system/call/seat'
import * as UserApi from '@/api/system/user'
import type { UserVO } from '@/api/system/user'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import OutboundRouteSelect from '@/components/OutboundRouteSelect.vue'
import { useTable } from '@/hooks/web/useTable'
import UserSelectForm from '@/components/UserSelectForm/index.vue'
import DeptSelector from '@/views/system/dept/components/DeptSelector.vue'
import * as OutboundRouteApi from '@/api/system/call/router'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'CrmCallSeat' })

interface SeatSearchParams {
    userId?: number
    deptId?: number
    bindStatus?: 'bound' | 'unbound'
    outboundRouteId?: number
}

const message = useMessage()
const canBind = hasPermission(['system:call-seat:bind'])
const formRef = ref()
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const dialogSaving = ref(false)
const dialogTitle = ref('绑定坐席')
const selectedUserName = ref('')
const userSelectFormRef = ref<InstanceType<typeof UserSelectForm>>()
const seatOptions = ref<CallSeatApi.CallSeatVO[]>([])
const routeOptions = ref<OutboundRouteApi.OutboundRouteVO[]>([])

const searchParams = reactive<SeatSearchParams>({})
const currentUserDetail = ref<UserApi.UserVO | null>(null)
const formData = reactive({
    id: undefined as number | undefined,
    nickname: '',
    username: '',
    deptName: '',
    callNo: '',
    callExt: '',
    callerDisplayNumber: ''
})

const formRules = reactive<FormRules>({})

const buildPageParams = (params: SeatSearchParams = {}) => {
    const nextParams: Record<string, any> = {
        deptId: params.deptId,
        userId: params.userId,
        status: 0
    }
    if (params.bindStatus === 'bound') {
        nextParams.hasCallExt = true
    }
    if (params.bindStatus === 'unbound') {
        nextParams.hasCallExt = false
    }
    nextParams.outboundRouteId = params.outboundRouteId
    return nextParams
}

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<UserApi.UserVO>({
    getListApi: UserApi.getUserPage
})

const stats = reactive({
    total: 0,
    bound: 0,
    unbound: 0
})

const routeNameMap = computed(() =>
    routeOptions.value.reduce<Record<number, string>>((acc, item) => {
        if (item.id !== undefined) {
            acc[item.id] = item.numberPrefix ? `${item.name}（${item.numberPrefix}）` : item.name
        }
        return acc
    }, {})
)

const loadGlobalStats = async () => {
    const result = await UserApi.getUserCallSeatStats()
    stats.total = Number(result?.total || 0)
    stats.bound = Number(result?.bound || 0)
    stats.unbound = Number(result?.unbound || 0)
}

const loadSeatOptions = async () => {
    seatOptions.value = await CallSeatApi.getCallSeatSimpleList()
}

const loadRouteOptions = async () => {
    routeOptions.value = (await OutboundRouteApi.getOutboundRouteSimpleList()) || []
}

const setSearchParams = (params: SeatSearchParams) => {
    searchParams.userId = params.userId
    searchParams.deptId = params.deptId
    searchParams.bindStatus = params.bindStatus
    searchParams.outboundRouteId = params.outboundRouteId
    tableMethods.setSearchParams(buildPageParams(params))
}

const resetSearchParams = () => {
    clearSelectedUser()
    searchParams.deptId = undefined
    searchParams.bindStatus = undefined
    searchParams.outboundRouteId = undefined
    tableMethods.setSearchParams(buildPageParams({}))
}

const textCell = (value?: string | number) => {
    if (value === null || value === undefined) return '--'
    const text = String(value).trim()
    return text || '--'
}

const openUserSelect = () => {
    const selectedList = searchParams.userId
        ? [{ id: searchParams.userId, nickname: selectedUserName.value }]
        : []
    userSelectFormRef.value?.open(0, selectedList, { title: '选择员工', multiple: false })
}

const handleUserSelectConfirm = (_id: any, userList: UserVO[]) => {
    const user = userList?.[0]
    searchParams.userId = user?.id
    selectedUserName.value = user?.nickname || user?.username || ''
}

const clearSelectedUser = () => {
    searchParams.userId = undefined
    selectedUserName.value = ''
}

const resetDialog = () => {
    currentUserDetail.value = null
    formData.id = undefined
    formData.nickname = ''
    formData.username = ''
    formData.deptName = ''
    formData.callNo = ''
    formData.callExt = ''
    formData.callerDisplayNumber = ''
    formRef.value?.resetFields?.()
}

const availableSeatOptions = computed(() =>
    seatOptions.value.filter((seat) => seat.status === 0 || seat.seatExt === formData.callExt)
)

const buildSeatOptionLabel = (seat: CallSeatApi.CallSeatVO) => {
    const parts = [seat.seatExt]
    if (seat.inUse) {
        const owner = [seat.currentUserName, seat.currentUserAccount].filter(Boolean).join('/')
        parts.push(owner ? `使用中:${owner}` : '使用中')
    } else {
        parts.push('空闲')
    }
    if (seat.status === 1) {
        parts.push('停用')
    }
    return parts.join(' | ')
}

const isSeatOptionDisabled = (seat: CallSeatApi.CallSeatVO) => {
    if (seat.seatExt === formData.callExt) return false
    return seat.status === 1 || Boolean(seat.inUse)
}

const openBindDialog = async (row: UserApi.UserVO) => {
    dialogTitle.value = row.callExt ? '修改坐席' : '绑定坐席'
    dialogVisible.value = true
    dialogLoading.value = true
    resetDialog()
    try {
        const [detail] = await Promise.all([UserApi.getUser(row.id), loadSeatOptions()])
        currentUserDetail.value = detail
        formData.id = detail.id
        formData.nickname = detail.nickname || ''
        formData.username = detail.username || ''
        formData.deptName = detail.deptName || ''
        formData.callNo = detail.callNo || ''
        formData.callExt = detail.callExt || ''
        formData.callerDisplayNumber = detail.callerDisplayNumber || ''
    } finally {
        dialogLoading.value = false
    }
}

const handleSubmit = async () => {
    const valid = await formRef.value?.validate?.()
    if (!valid || !currentUserDetail.value) return
    dialogSaving.value = true
    try {
        const callExt = String(formData.callExt || '').trim()
        const callerDisplayNumber = String(formData.callerDisplayNumber || '').trim()
        await UserApi.bindUserCallSeat({
            id: currentUserDetail.value.id,
            callExt,
            callerDisplayNumber
        })
        message.success('坐席绑定已保存')
        dialogVisible.value = false
        await tableMethods.getList()
        await loadGlobalStats()
    } finally {
        dialogSaving.value = false
    }
}

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'nickname', label: '员工姓名', minWidth: 120, fixed: 'left' },
    { field: 'username', label: '登录账号', minWidth: 130 },
    {
        field: 'deptName',
        label: '所属部门',
        minWidth: 140,
        formatter: (_, __, value) => textCell(value)
    },
    {
        field: 'mobile',
        label: '手机号',
        minWidth: 140,
        formatter: (_, __, value) => textCell(value)
    },
    // {
    //     field: 'callNo',
    //     label: '呼叫工号',
    //     width: 110,
    //     formatter: (_, __, value) => textCell(value)
    // },
    {
        field: 'callExt',
        label: '坐席',
        width: 120,
        slots: {
            default: (data) =>
                data.row.callExt ? (
                    <span class="seat-tag seat-tag--bound">{data.row.callExt}</span>
                ) : (
                    <span class="seat-tag seat-tag--empty">未绑定</span>
                )
        }
    },
    {
        field: 'callerDisplayNumber',
        label: '外显号码',
        minWidth: 140,
        formatter: (_, __, value) => textCell(value)
    },
    {
        field: 'outboundRouteId',
        label: '线路',
        minWidth: 180,
        formatter: (row) =>
            row.outboundRouteId ? textCell(routeNameMap.value[row.outboundRouteId]) : '--'
    },
    { field: 'createTime', label: '创建时间', minWidth: 170, formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: 120,
        fixed: 'right',
        slots: {
            default: (data) => (
                <>
                    {canBind ? (
                        <BaseButton link type="primary" onClick={() => openBindDialog(data.row)}>
                            {data.row.callExt ? '修改' : '绑定'}
                        </BaseButton>
                    ) : null}
                </>
            )
        }
    }
])

onMounted(async () => {
    await Promise.all([tableMethods.getList(), loadGlobalStats(), loadRouteOptions()])
})
</script>

<style scoped>
.seat-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.seat-page__hero {
    overflow: hidden;
    border: 1px solid rgba(15, 23, 42, 0.06);
    background:
        radial-gradient(circle at top right, rgba(249, 115, 22, 0.18), transparent 28%),
        linear-gradient(135deg, #fff8ef 0%, #ffffff 42%, #f6fbff 100%);
}

.seat-page__hero-main {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
}

.seat-page__eyebrow {
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #c2410c;
    font-weight: 600;
    margin-bottom: 10px;
}

.seat-page__title {
    margin: 0;
    font-size: 28px;
    line-height: 1.15;
    color: #111827;
}

.seat-page__subtitle {
    margin: 10px 0 0;
    max-width: 720px;
    color: #4b5563;
    line-height: 1.7;
}

.seat-page__tips {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.seat-page__tip-card {
    min-width: 150px;
    padding: 14px 16px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid rgba(148, 163, 184, 0.18);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.seat-page__tip-label {
    font-size: 12px;
    color: #64748b;
}

.seat-page__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.seat-stat {
    padding: 18px 20px;
    border-radius: 18px;
    background: #ffffff;
    border: 1px solid rgba(148, 163, 184, 0.14);
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.seat-stat--green {
    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
}

.seat-stat--orange {
    background: linear-gradient(135deg, #fff7ed 0%, #ffffff 100%);
}

.seat-stat__label {
    display: block;
    font-size: 13px;
    color: #64748b;
    margin-bottom: 8px;
}

.seat-stat__value {
    font-size: 28px;
    color: #0f172a;
}

.seat-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
}

.seat-tag--bound {
    color: #166534;
    background: #dcfce7;
}

.seat-tag--empty {
    color: #b45309;
    background: #ffedd5;
}

@media (max-width: 900px) {
    .seat-page__stats {
        grid-template-columns: 1fr;
    }
}
</style>
