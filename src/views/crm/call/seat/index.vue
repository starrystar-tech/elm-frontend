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
            <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
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
                    <el-input
                        v-model="formData.callExt"
                        maxlength="32"
                        clearable
                        placeholder="请输入坐席，例如 1001"
                    />
                </el-form-item>
                <el-form-item label="外显号码" prop="callerDisplayNumber">
                    <el-input
                        v-model="formData.callerDisplayNumber"
                        maxlength="32"
                        clearable
                        placeholder="请输入外显号码"
                    />
                </el-form-item>
                <el-form-item label="坐席密码" prop="callPassword">
                    <el-input
                        v-model="formData.callPassword"
                        type="password"
                        maxlength="64"
                        clearable
                        placeholder="请输入坐席密码"
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
    </div>
</template>

<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue'
import type { FormRules } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as UserApi from '@/api/system/user'
import * as DeptApi from '@/api/system/dept'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'CrmCallSeat' })

interface SeatSearchParams {
    keyword?: string
    deptId?: number
    bindStatus?: 'bound' | 'unbound'
}

const message = useMessage()
const formRef = ref()
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const dialogSaving = ref(false)
const dialogTitle = ref('绑定坐席')

const deptOptions = ref<{ label: string; value: number }[]>([])
const currentUserDetail = ref<UserApi.UserVO | null>(null)
const formData = reactive({
    id: undefined as number | undefined,
    nickname: '',
    username: '',
    deptName: '',
    callNo: '',
    callExt: '',
    callPassword: '',
    callerDisplayNumber: ''
})

const formRules = reactive<FormRules>({
    callExt: [
        {
            pattern: /^\d+$/,
            message: '坐席只能输入数字',
            trigger: 'blur'
        }
    ]
})

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'keyword',
        label: '员工',
        component: 'Input',
        componentProps: {
            placeholder: '请输入姓名或登录账号',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'deptId',
        label: '所属部门',
        component: 'Select',
        componentProps: {
            placeholder: '请选择所属部门',
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px' }
        }
    },
    {
        field: 'bindStatus',
        label: '绑定状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择绑定状态',
            clearable: true,
            options: [
                { label: '已绑定', value: 'bound' },
                { label: '未绑定', value: 'unbound' }
            ],
            style: { width: '220px' }
        }
    }
])

const buildPageParams = (params: SeatSearchParams = {}) => {
    const keyword = params.keyword?.trim()
    const nextParams: Record<string, any> = {
        deptId: params.deptId,
        keyword: keyword || undefined
    }
    if (params.bindStatus === 'bound') {
        nextParams.hasCallExt = true
    }
    if (params.bindStatus === 'unbound') {
        nextParams.hasCallExt = false
    }
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

const loadGlobalStats = async () => {
    const result = await UserApi.getUserCallSeatStats()
    stats.total = Number(result?.total || 0)
    stats.bound = Number(result?.bound || 0)
    stats.unbound = Number(result?.unbound || 0)
}

const setSearchParams = (params: SeatSearchParams) => {
    tableMethods.setSearchParams(buildPageParams(params))
}

const textCell = (value?: string | number) => {
    if (value === null || value === undefined) return '--'
    const text = String(value).trim()
    return text || '--'
}

const updateSchemaOptions = (field: string, options: { label: string; value: number }[]) => {
    const target = searchSchema.find((item) => item.field === field)
    if (target?.componentProps) {
        target.componentProps.options = options
    }
}

const loadDeptOptions = async () => {
    const list = await DeptApi.getSimpleDeptList()
    deptOptions.value = (list || []).map((item) => ({
        label: item.name,
        value: item.id
    }))
    updateSchemaOptions('deptId', deptOptions.value)
}

const resetDialog = () => {
    currentUserDetail.value = null
    formData.id = undefined
    formData.nickname = ''
    formData.username = ''
    formData.deptName = ''
    formData.callNo = ''
    formData.callExt = ''
    formData.callPassword = ''
    formData.callerDisplayNumber = ''
    formRef.value?.resetFields?.()
}

const openBindDialog = async (row: UserApi.UserVO) => {
    dialogTitle.value = row.callExt ? '修改坐席' : '绑定坐席'
    dialogVisible.value = true
    dialogLoading.value = true
    resetDialog()
    try {
        const detail = await UserApi.getUser(row.id)
        currentUserDetail.value = detail
        formData.id = detail.id
        formData.nickname = detail.nickname || ''
        formData.username = detail.username || ''
        formData.deptName = detail.deptName || ''
        formData.callNo = detail.callNo || ''
        formData.callExt = detail.callExt || ''
        formData.callPassword = detail.callPassword || ''
        formData.callerDisplayNumber = detail.callerDisplayNumber || ''
    } finally {
        dialogLoading.value = false
    }
}

const handleClearSeat = async (row: UserApi.UserVO) => {
    const detail = await UserApi.getUser(row.id)
    await message.confirm(`确认清空“${row.nickname}”的坐席吗？`)
    await UserApi.updateUser({
        ...detail,
        callExt: '',
        callPassword: '',
        callerDisplayNumber: ''
    })
    message.success('已清空坐席')
    await tableMethods.getList()
    await loadGlobalStats()
}

const handleSubmit = async () => {
    const valid = await formRef.value?.validate?.()
    if (!valid || !currentUserDetail.value) return
    dialogSaving.value = true
    try {
        await UserApi.updateUser({
            ...currentUserDetail.value,
            callExt: formData.callExt.trim(),
            callPassword: formData.callPassword.trim(),
            callerDisplayNumber: formData.callerDisplayNumber.trim()
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
    { field: 'createTime', label: '创建时间', minWidth: 170, formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: 170,
        fixed: 'right',
        slots: {
            default: (data) => (
                <>
                    <BaseButton link type="primary" onClick={() => openBindDialog(data.row)}>
                        {data.row.callExt ? '修改' : '绑定'}
                    </BaseButton>
                    {data.row.callExt ? (
                        <BaseButton link type="danger" onClick={() => handleClearSeat(data.row)}>
                            清空
                        </BaseButton>
                    ) : null}
                </>
            )
        }
    }
])

onMounted(async () => {
    await loadDeptOptions()
    await Promise.all([tableMethods.getList(), loadGlobalStats()])
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
