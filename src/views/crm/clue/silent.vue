<template>
    <ContentWrap>
        <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />

        <div class="mb-12px flex items-center justify-between gap-12px flex-wrap action-btn-wrap">
            <div class="flex gap-8px flex-wrap">
                <BaseButton
                    type="primary"
                    :disabled="selectionList.length === 0"
                    @click="assignDialogVisible = true"
                    >批量分配</BaseButton
                >
                <BaseButton :disabled="selectionList.length === 0" plain @click="handleBackToPublicSea"
                    >一键回公海</BaseButton
                >
                <BaseButton v-if="canExport" plain @click="openExportDialog">导出</BaseButton>
            </div>
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

    <ClueDetailDrawer ref="detailRef" @refresh="tableMethods.getList" />

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
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
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
    <ExportTaskDialog ref="exportDialogRef" @success="handleExportSuccess" />
</template>

<script setup lang="tsx">
import { computed, nextTick, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import * as ClueApi from '@/api/crm/clue'
import { renderCopyMobileCell } from './mobileCopy'
import * as UserApi from '@/api/system/user'
import * as DeptApi from '@/api/system/dept'
import { hasPermission } from '@/directives/permission/hasPermi'
import ClueDetailDrawer from './detail/ClueDetailDrawer.vue'
import ExportTaskDialog from './components/ExportTaskDialog.vue'

defineOptions({ name: 'CrmClueSilent' })

const message = useMessage()
const detailRef = ref<InstanceType<typeof ClueDetailDrawer>>()
const canExport = hasPermission(['crm:clue:silent:query'])
const userOptions = ref<{ label: string; value: number; deptId?: number }[]>([])
const deptOptions = ref<DeptApi.DeptVO[]>([])
const selectionList = ref<ClueApi.ClueVO[]>([])
const assignDialogVisible = ref(false)
const exportDialogRef = ref<InstanceType<typeof ExportTaskDialog>>()
const currentSearchParams = ref<Record<string, any>>({})

const assignForm = reactive({
    ownerId: undefined as number | undefined
})

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'mobile',
        label: '联系电话',
        component: 'Input',
        componentProps: {
            placeholder: '请输入联系电话',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'customer',
        label: '客户',
        component: 'Input',
        componentProps: {
            placeholder: '请输入姓名/客户编号',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'currentOwnerId',
        label: '归属人',
        component: 'Select',
        componentProps: {
            placeholder: '请选择归属人',
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px' }
        }
    },
    {
        field: 'silentCountRange',
        label: '静默次数',
        component: 'AmountRangeInput',
        componentProps: {
            startPlaceholder: '静默次数起',
            endPlaceholder: '静默次数止',
            style: { width: '220px' }
        }
    },
    {
        field: 'silentTimeRange',
        label: '静默时间',
        component: 'DatePicker',
        componentProps: {
            type: 'datetimerange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            startPlaceholder: '开始时间',
            endPlaceholder: '结束时间',
            style: { width: '220px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ClueApi.ClueVO>({
    getListApi: async (params) => await ClueApi.getSilentCluePage(params as ClueApi.ClueSilentPageReqVO)
})

const selectedUser = computed(() => userOptions.value.find((item) => item.value === assignForm.ownerId))
const selectedDeptName = computed(() => {
    const dept = deptOptions.value.find((item) => item.id === selectedUser.value?.deptId)
    return dept?.name || '--'
})

const resetTableSelection = async () => {
    selectionList.value = []
    await tableMethods.clearSelection()
    await nextTick()
    await tableMethods.clearSelection()
}

const openDetail = (id?: number) => {
    if (!id) return
    detailRef.value?.open(id)
}

const tableColumns = computed<TableColumn[]>(() => [
    {
        field: 'mobile',
        label: '联系电话',
        width: '170px',
        slots: {
            default: (data) =>
                renderCopyMobileCell({
                    row: data.row,
                    mobile: data.row.mobile,
                    clueId: data.row.id,
                    success: message.success,
                    warning: message.warning
                })
        }
    },
    { field: 'name', label: '姓名', width: '120px' },
    { field: 'currentOwnerName', label: '归属人', width: '120px' },
    { field: 'currentDepartmentName', label: '所属部门', width: '140px' },
    { field: 'consultProjectName', label: '咨询项目', minWidth: '160px' },
    { field: 'intentLevelName', label: '意向度', width: '100px' },
    {
        field: 'tagNames',
        label: '标签',
        minWidth: '150px',
        slots: { default: (data) => <span>{(data.row.tagNames as string[])?.length ? (data.row.tagNames as string[]).join('、') : '-'}</span> }
    },
    { field: 'silentCount', label: '静默次数', width: '100px' },
    { field: 'silentReason', label: '最近静默原因', minWidth: '200px' },
    { field: 'lastSilentTime', label: '最近静默时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '120px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <BaseButton link type="primary" onClick={() => openDetail(Number(data.row.id))}>
                    详情
                </BaseButton>
            )
        }
    }
])

const loadOptions = async () => {
    const [users, depts] = await Promise.all([UserApi.getSimpleUserList(), DeptApi.getSimpleDeptList()])
    userOptions.value = (users || []).map((item) => ({
        label: item.nickname || item.username,
        value: item.id,
        deptId: item.deptId
    }))
    deptOptions.value = depts || []
    const ownerField = searchSchema.find((item) => item.field === 'currentOwnerId')
    if (ownerField?.componentProps) {
        ownerField.componentProps.options = userOptions.value
    }
}

const handleSelectionChange = (rows: ClueApi.ClueVO[]) => {
    selectionList.value = rows || []
}

const setSearchParams = (params: Record<string, any>) => {
    currentSearchParams.value = { ...params }
    const { silentTimeRange, silentCountRange, ...rest } = params
    tableMethods.setSearchParams({
        ...rest,
        minSilentCount: silentCountRange?.[0] ? Number(silentCountRange[0]) : undefined,
        maxSilentCount: silentCountRange?.[1] ? Number(silentCountRange[1]) : undefined,
        beginSilentTime: silentTimeRange?.[0],
        endSilentTime: silentTimeRange?.[1]
    })
}

const buildExportParams = () => {
    const { silentTimeRange, silentCountRange, ...rest } = currentSearchParams.value
    return {
        ...rest,
        minSilentCount: silentCountRange?.[0] ? Number(silentCountRange[0]) : undefined,
        maxSilentCount: silentCountRange?.[1] ? Number(silentCountRange[1]) : undefined,
        beginSilentTime: silentTimeRange?.[0],
        endSilentTime: silentTimeRange?.[1]
    }
}

const openExportDialog = () => {
    exportDialogRef.value?.open({
        title: '导出静默数据',
        bizType: 'crm_clue_silent_page_export',
        submit: async (payload) => {
            await ClueApi.createSilentClueExportTask({
                ...buildExportParams(),
                ...payload
            })
        }
    })
}

const handleExportSuccess = () => {
    message.success('导出任务已创建，请到下载中心查看')
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
    await resetTableSelection()
    await tableMethods.getList()
    await resetTableSelection()
}

const handleBackToPublicSea = async () => {
    await message.confirm(`确定将选中的 ${selectionList.value.length} 条静默线索回退公海吗？`)
    await ClueApi.batchBackToPublicSea({
        clueIds: selectionList.value.map((item) => Number(item.id))
    })
    message.success('回公海成功')
    await resetTableSelection()
    await tableMethods.getList()
    await resetTableSelection()
}

onMounted(async () => {
    await loadOptions()
    tableMethods.getList()
})
</script>
