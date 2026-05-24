<template>
    <ContentWrap>
        <el-form :inline="true" :model="searchForm" class="mb-12px">
            <el-form-item label="文件名">
                <el-input
                    v-model="searchForm.fileName"
                    clearable
                    placeholder="请输入文件名"
                    style="width: 220px"
                />
            </el-form-item>
            <el-form-item label="任务状态">
                <el-select
                    v-model="searchForm.status"
                    clearable
                    placeholder="全部"
                    style="width: 180px"
                >
                    <el-option label="处理中" :value="1" />
                    <el-option label="已完成" :value="2" />
                </el-select>
            </el-form-item>
            <el-form-item label="创建人">
                <el-input
                    v-model="searchForm.creator"
                    clearable
                    placeholder="请输入创建人"
                    style="width: 220px"
                />
            </el-form-item>
            <el-form-item label="创建时间">
                <el-date-picker
                    v-model="searchForm.createTimeRange"
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
</template>

<script setup lang="tsx">
import { computed, reactive } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as ClueApi from '@/api/crm/clue'
import { ContentWrap } from '@/components/ContentWrap'
import { Table, type TableColumn } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'

defineOptions({ name: 'CrmClueImportTask' })

const searchForm = reactive({
    fileName: '',
    status: undefined as number | undefined,
    creator: '',
    createTimeRange: [] as string[]
})

const buildParams = (): ClueApi.ClueImportTaskPageReqVO => ({
    fileName: searchForm.fileName || undefined,
    status: searchForm.status,
    creator: searchForm.creator || undefined,
    beginCreateTime: searchForm.createTimeRange?.[0],
    endCreateTime: searchForm.createTimeRange?.[1]
})

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ClueApi.ClueImportTaskVO>({
    getListApi: async (params) =>
        await ClueApi.getClueImportTaskPage({ ...buildParams(), ...params })
})

const handleSearch = () => {
    tableMethods.setSearchParams(buildParams())
}

const handleReset = () => {
    Object.assign(searchForm, {
        fileName: '',
        status: undefined,
        creator: '',
        createTimeRange: []
    })
    tableMethods.setSearchParams({})
}

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'id', label: '任务编号', width: '100px' },
    { field: 'fileName', label: '文件名', minWidth: '220px' },
    {
        field: 'status',
        label: '任务状态',
        width: '110px',
        slots: {
            default: (data) => (
                <span>
                    {data.row.status === 1 ? '处理中' : data.row.status === 2 ? '已完成' : '-'}
                </span>
            )
        }
    },
    { field: 'totalCount', label: '导入总数', width: '100px' },
    { field: 'successCount', label: '成功数', width: '100px' },
    { field: 'failCount', label: '失败数', width: '100px' },
    { field: 'startedAt', label: '开始处理时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'finishedAt', label: '处理完成时间', minWidth: '170px', formatter: dateFormatter },
    { field: 'creator', label: '创建人', width: '120px' },
    { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter }
])

onMounted(() => {
    tableMethods.getList()
})
</script>
