<template>
    <ContentWrap>
        <Search :model="searchForm" @reset="resetSearchParams" @search="setSearchParams">
            <el-form-item label="主叫" prop="userId">
                <el-input
                    v-model="selectedUserName"
                    clearable
                    placeholder="请选择主叫"
                    style="width: 220px"
                    @click="openUserSelect"
                    @clear="clearSelectedUser"
                />
            </el-form-item>
            <el-form-item label="线路" prop="outboundRouteId">
                <el-select
                    v-model="searchForm.outboundRouteId"
                    clearable
                    filterable
                    placeholder="请选择线路"
                    style="width: 220px"
                >
                    <el-option
                        v-for="item in outboundRouteOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="手机号" prop="calleeMobile">
                <el-input
                    v-model="searchForm.calleeMobile"
                    clearable
                    placeholder="请输入被叫手机号"
                    style="width: 220px"
                />
            </el-form-item>
            <el-form-item label="状态" prop="status">
                <el-select
                    v-model="searchForm.status"
                    clearable
                    placeholder="请选择状态"
                    style="width: 220px"
                >
                    <el-option
                        v-for="item in statusOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="发起时间" prop="createTime">
                <el-date-picker
                    v-model="searchForm.createTime"
                    type="daterange"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
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
import { onMounted, reactive, ref } from 'vue'
import { ElTooltip } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { useTable } from '@/hooks/web/useTable'
import * as OutboundCallRecordApi from '@/api/system/call/record'
import * as OutboundRouteApi from '@/api/system/call/router'
import type { UserVO } from '@/api/system/user'
import UserSelectForm from '@/components/UserSelectForm/index.vue'

defineOptions({ name: 'CrmCallRecord' })

const formatDuration = (durationSeconds?: number) => {
    if (!durationSeconds || durationSeconds < 0) {
        return '00:00'
    }
    const totalSeconds = Math.floor(durationSeconds)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const buildCallResultText = (row: Recordable) => {
    return row.failReason || row.hangupCause || row.originateDisposition || row.statusDesc || '-'
}

const outboundRouteOptions = ref<{ label: string; value: number }[]>([])
const selectedUserName = ref('')
const userSelectFormRef = ref<InstanceType<typeof UserSelectForm>>()
const searchForm = reactive<OutboundCallRecordApi.OutboundCallRecordPageReqVO>({
    userId: undefined,
    outboundRouteId: undefined,
    calleeMobile: undefined,
    status: undefined,
    createTime: undefined
})
const statusOptions = [
    { label: '发起中', value: 10 },
    { label: '已提交', value: 20 },
    { label: '已接通', value: 30 },
    { label: '失败', value: 40 },
    { label: '无人接听', value: 50 },
    { label: '忙线', value: 60 },
    { label: '已挂断', value: 70 }
]

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<OutboundCallRecordApi.OutboundCallRecordVO>({
    getListApi: async (params) =>
        await OutboundCallRecordApi.getOutboundCallRecordPage(
            params as OutboundCallRecordApi.OutboundCallRecordPageReqVO
        )
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(params)
}

const resetSearchParams = () => {
    clearSelectedUser()
    searchForm.outboundRouteId = undefined
    searchForm.calleeMobile = undefined
    searchForm.status = undefined
    searchForm.createTime = undefined
    tableMethods.setSearchParams({})
}

const loadOutboundRouteOptions = async () => {
    const routes = (await OutboundRouteApi.getOutboundRouteSimpleList()) || []
    outboundRouteOptions.value = routes.map((item) => ({
        label: `${item.name}（${item.numberPrefix}）`,
        value: item.id as number
    }))
}

const openUserSelect = () => {
    const selectedList = searchForm.userId
        ? [{ id: searchForm.userId, nickname: selectedUserName.value }]
        : []
    userSelectFormRef.value?.open(0, selectedList, { title: '选择呼叫人', multiple: false })
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
    { field: 'recordNo', label: '记录编号', width: '190px' },
    { field: 'userNickname', label: '主叫', width: '120px' },
    { field: 'calleeMobile', label: '被叫号码', width: '130px' },
    { field: 'createTime', label: '发起时间', formatter: dateFormatter, width: '180px' },
    { field: 'answerTime', label: '接通时间', formatter: dateFormatter, width: '180px' },
    { field: 'endTime', label: '结束时间', formatter: dateFormatter, width: '180px' },
    { field: 'ringDurationSeconds', label: '振铃时长(秒)', width: '120px' },
    { field: 'statusDesc', label: '状态', width: '110px' },
    {
        field: 'recordingFileUrl',
        label: '通话录音',
        minWidth: '250px',
        showOverflowTooltip: false,
        slots: {
            default: (data) => {
                if (
                    !data.row.recordingFileUrl ||
                    !data.row.durationSeconds ||
                    data.row.durationSeconds <= 0
                ) {
                    return <>-</>
                }
                return (
                    <div style="display: flex; align-items: center; gap: 8px">
                        <audio controls preload="none" style="width: 220px">
                            <source src={data.row.recordingFileUrl} />
                        </audio>
                        <span style="color: var(--el-text-color-secondary); font-size: 12px">
                            {formatDuration(data.row.durationSeconds)}
                        </span>
                    </div>
                )
            }
        }
    },
    { field: 'outboundRouteName', label: '线路名称', width: '110px' },
    // {
    //     field: 'recordingSyncStatusDesc',
    //     label: '语音同步',
    //     minWidth: '180px',
    //     slots: {
    //         default: (data) => {
    //             const statusText = data.row.recordingSyncStatusDesc || '-'
    //             const message = data.row.recordingSyncMessage
    //             if (!message) {
    //                 return <span>{statusText}</span>
    //             }
    //             return (
    //                 <ElTooltip content={message} placement="top">
    //                     <span>{statusText}</span>
    //                 </ElTooltip>
    //             )
    //         }
    //     }
    // },
    // { field: 'callTypeDesc', label: '通话类型', width: '110px' },
    { field: 'submitMessage', label: '提交日志', minWidth: '160px' },
    {
        field: 'callResult',
        label: '呼叫结果',
        width: '180px',
        slots: {
            default: (data) => <span>{buildCallResultText(data.row)}</span>
        }
    },
    // { field: 'jobUuid', label: '任务号', width: '240px' },
    // { field: 'gatewayName', label: '网关', width: '170px' },
    // { field: 'backupGatewayName', label: '备网关', width: '170px' },
    { field: 'durationSeconds', label: '通话时长(秒)', width: '120px' }
    // { field: 'failReason', label: '失败原因', minWidth: '220px' }
    // { field: 'originateDisposition', label: '外呼结果原值', width: '160px' },
    // { field: 'hangupCause', label: '挂断原因原值', width: '160px' }
])

onMounted(async () => {
    await loadOutboundRouteOptions()
    await tableMethods.getList()
})
</script>
