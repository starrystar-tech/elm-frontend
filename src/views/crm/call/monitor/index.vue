<template>
    <div class="call-monitor-page">
        <ContentWrap>
            <Search :model="searchParams" @search="setSearchParams" @reset="resetSearchParams">
                <el-form-item label="部门" prop="deptId">
                    <DeptSelector
                        v-model="searchParams.deptId"
                        placeholder="请选择部门"
                        style="width: 220px"
                    />
                </el-form-item>
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
                <el-form-item label="通话日期" prop="dateRange">
                    <el-date-picker
                        v-model="searchParams.dateRange"
                        type="daterange"
                        value-format="YYYY-MM-DD"
                        start-placeholder="开始日期"
                        end-placeholder="结束日期"
                        style="width: 240px"
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
            <div class="action-btn-wrap">
                <BaseButton plain @click="handleExport">导出</BaseButton>
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
        <UserSelectForm ref="userSelectFormRef" @confirm="handleUserSelectConfirm" />
    </div>
</template>

<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue'
import { Search } from '@/components/Search'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { Table, type TableColumn } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import type { UserVO } from '@/api/system/user'
import * as OutboundCallRecordApi from '@/api/system/call/record'
import UserSelectForm from '@/components/UserSelectForm/index.vue'
import DeptSelector from '@/views/system/dept/components/DeptSelector.vue'

defineOptions({ name: 'CrmCallMonitor' })

const message = useMessage()
const selectedUserName = ref('')
const userSelectFormRef = ref<InstanceType<typeof UserSelectForm>>()

const defaultSearchParams = {
    deptId: undefined as number | undefined,
    userId: undefined as number | undefined,
    dateRange: undefined as string[] | undefined
}

const searchParams = reactive({ ...defaultSearchParams })

const formatDurationClock = (durationSeconds?: number) => {
    const totalSeconds = Math.max(0, Math.floor(durationSeconds || 0))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<OutboundCallRecordApi.CallMonitorVO>({
    getListApi: async (params) =>
        await OutboundCallRecordApi.getCallMonitorPage(
            params as OutboundCallRecordApi.CallMonitorPageReqVO
        )
})

const tableColumns = reactive<TableColumn[]>([
    { field: 'userName', label: '用户', minWidth: '120px' },
    { field: 'departmentName', label: '所在部门', minWidth: '140px' },
    { field: 'outgoingCalls', label: '呼出次数', minWidth: '100px' },
    { field: 'outgoingCustomers', label: '呼出客户数', minWidth: '110px' },
    {
        field: 'outgoingDurationSeconds',
        label: '呼出总时长',
        minWidth: '120px',
        formatter: (_row: unknown, _column: unknown, cellValue: number) =>
            formatDurationClock(cellValue)
    },
    {
        field: 'averageOutgoingDurationSeconds',
        label: '平均呼出时长',
        minWidth: '130px',
        formatter: (_row: unknown, _column: unknown, cellValue: number) =>
            formatDurationClock(cellValue)
    },
    { field: 'answeredCalls', label: '接听次数', minWidth: '100px' },
    { field: 'answeredCustomers', label: '接听客户数', minWidth: '110px' },
    {
        field: 'answeredDurationSeconds',
        label: '接听总时长',
        minWidth: '120px',
        formatter: (_row: unknown, _column: unknown, cellValue: number) =>
            formatDurationClock(cellValue)
    },
    {
        field: 'averageAnsweredDurationSeconds',
        label: '平均接听时长',
        minWidth: '130px',
        formatter: (_row: unknown, _column: unknown, cellValue: number) =>
            formatDurationClock(cellValue)
    }
])

const setSearchParams = (params: Recordable) => {
    searchParams.deptId = params.deptId || undefined
    searchParams.userId = params.userId || undefined
    searchParams.dateRange = params.dateRange?.length ? params.dateRange : undefined
    tableMethods.setSearchParams(buildPageParams(searchParams))
}

const resetSearchParams = () => {
    clearSelectedUser()
    searchParams.deptId = undefined
    searchParams.dateRange = undefined
    tableMethods.setSearchParams(buildPageParams({}))
}

const buildPageParams = (params: typeof defaultSearchParams) => {
    const result: OutboundCallRecordApi.CallMonitorPageReqVO = {
        deptId: params.deptId,
        userId: params.userId
    }
    if (params.dateRange?.length) {
        result.beginCreateTime = `${params.dateRange[0]} 00:00:00`
        result.endCreateTime = `${params.dateRange[1]} 23:59:59`
    }
    return result
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

const handleExport = async () => {
    await OutboundCallRecordApi.createCallMonitorExportTask({
        ...buildPageParams(searchParams)
    })
    message.success('导出任务已创建，请到下载中心查看')
}

onMounted(async () => {
    await tableMethods.getList()
})
</script>
