<template>
    <ContentWrap>
        <el-form :inline="true" :model="searchForm" class="mb-12px">
            <el-form-item label="联系电话">
                <el-input
                    v-model="searchForm.mobile"
                    clearable
                    placeholder="请输入联系电话"
                    style="width: 220px"
                />
            </el-form-item>
            <el-form-item label="姓名">
                <el-input
                    v-model="searchForm.customer"
                    clearable
                    placeholder="请输入姓名/客户编号"
                    style="width: 220px"
                />
            </el-form-item>
            <el-form-item label="归属人">
                <el-select
                    v-model="searchForm.currentOwnerId"
                    clearable
                    filterable
                    placeholder="全部"
                    style="width: 220px"
                >
                    <el-option
                        v-for="item in userOptions"
                        :key="item.id"
                        :label="item.nickname || item.username"
                        :value="item.id"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="静默时间">
                <el-date-picker
                    v-model="searchForm.silentTimeRange"
                    type="datetimerange"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    style="width: 320px"
                />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="handleSearch">查询</el-button>
                <el-button @click="handleReset">重置</el-button>
            </el-form-item>
        </el-form>

        <div class="mb-12px flex gap-8px flex-wrap">
            <BaseButton
                :disabled="selectionList.length === 0"
                type="primary"
                @click="assignDialogVisible = true"
                >批量分配</BaseButton
            >
            <BaseButton :disabled="selectionList.length === 0" plain @click="handleBackToPublicSea"
                >一键回公海</BaseButton
            >
        </div>

        <Table
            v-model:currentPage="tableObject.currentPage"
            v-model:pageSize="tableObject.pageSize"
            :columns="tableColumns"
            :data="tableObject.tableList"
            :loading="tableObject.loading"
            :pagination="{ total: tableObject.total }"
            row-key="id"
            selection
            reserve-selection
            @register="tableRegister"
            @selection-change="handleSelectionChange"
        />
    </ContentWrap>

    <Dialog v-model="assignDialogVisible" title="批量分配静默线索" width="420px">
        <el-form label-width="90px">
            <el-form-item label="归属人" required>
                <el-select
                    v-model="assignForm.ownerId"
                    filterable
                    placeholder="请选择归属人"
                    style="width: 100%"
                >
                    <el-option
                        v-for="item in userOptions"
                        :key="item.id"
                        :label="item.nickname || item.username"
                        :value="item.id"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="所属部门">
                <el-input :model-value="selectedDeptName" disabled />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="assignDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleBatchAssign">确定</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as ClueApi from '@/api/crm/clue'
import * as UserApi from '@/api/system/user'
import * as DeptApi from '@/api/system/dept'
import { BaseButton } from '@/components/Button'
import { ContentWrap } from '@/components/ContentWrap'
import { Table, type TableColumn } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'

defineOptions({ name: 'CrmClueSilent' })

const message = useMessage()
const userOptions = ref<UserApi.UserVO[]>([])
const deptOptions = ref<DeptApi.DeptVO[]>([])
const selectionList = ref<ClueApi.ClueVO[]>([])
const assignDialogVisible = ref(false)

const searchForm = reactive({
    customer: '',
    mobile: '',
    currentOwnerId: undefined as number | undefined,
    silentTimeRange: [] as string[]
})

const assignForm = reactive({
    ownerId: undefined as number | undefined
})

const buildParams = (): ClueApi.ClueSilentPageReqVO => ({
    customer: searchForm.customer || undefined,
    mobile: searchForm.mobile || undefined,
    currentOwnerId: searchForm.currentOwnerId,
    beginSilentTime: searchForm.silentTimeRange?.[0],
    endSilentTime: searchForm.silentTimeRange?.[1]
})

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ClueApi.ClueVO>({
    getListApi: async (params) => await ClueApi.getSilentCluePage({ ...buildParams(), ...params })
})

const selectedUser = computed(() =>
    userOptions.value.find((item) => item.id === assignForm.ownerId)
)
const selectedDeptName = computed(() => {
    const dept = deptOptions.value.find((item) => item.id === selectedUser.value?.deptId)
    return dept?.name || '--'
})

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'mobile', label: '联系电话', width: '140px' },
    { field: 'name', label: '姓名', width: '120px' },
    { field: 'currentOwnerName', label: '归属人', width: '120px' },
    { field: 'currentDepartmentName', label: '所属部门', width: '140px' },
    { field: 'consultProjectName', label: '咨询项目', minWidth: '140px' },
    { field: 'silentCount', label: '静默次数', width: '100px' },
    { field: 'silentReason', label: '最近静默原因', minWidth: '180px' },
    { field: 'lastSilentTime', label: '最近静默时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter }
])

const loadOptions = async () => {
    const [users, depts] = await Promise.all([
        UserApi.getSimpleUserList(),
        DeptApi.getSimpleDeptList()
    ])
    userOptions.value = users || []
    deptOptions.value = depts || []
}

const handleSelectionChange = (rows: ClueApi.ClueVO[]) => {
    selectionList.value = rows || []
}

const handleSearch = () => {
    tableMethods.setSearchParams(buildParams())
}

const handleReset = () => {
    Object.assign(searchForm, {
        customer: '',
        mobile: '',
        currentOwnerId: undefined,
        silentTimeRange: []
    })
    tableMethods.setSearchParams({})
}

const handleBatchAssign = async () => {
    if (!assignForm.ownerId) {
        message.warning('请选择归属人')
        return
    }
    const user = selectedUser.value
    if (!user?.deptId) {
        message.warning('所选归属人缺少所属部门，无法分配')
        return
    }
    await ClueApi.batchAssignSilentClue({
        clueIds: selectionList.value.map((item) => Number(item.id)),
        ownerId: Number(assignForm.ownerId),
        departmentId: Number(user.deptId)
    })
    message.success('批量分配成功')
    assignDialogVisible.value = false
    assignForm.ownerId = undefined
    await tableMethods.getList()
}

const handleBackToPublicSea = async () => {
    await message.confirm(`确定将选中的 ${selectionList.value.length} 条静默线索回退公海吗？`)
    await ClueApi.batchBackToPublicSea({
        clueIds: selectionList.value.map((item) => Number(item.id))
    })
    message.success('回公海成功')
    await tableMethods.getList()
}

onMounted(async () => {
    await loadOptions()
    tableMethods.getList()
})
</script>
