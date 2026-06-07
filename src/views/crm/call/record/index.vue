<template>
    <ContentWrap>
        <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
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
import { onMounted, reactive } from 'vue'
import { ElTooltip } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import * as OutboundCallRecordApi from '@/api/system/call/record'

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

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'calleeMobile',
        label: '手机号',
        component: 'Input',
        componentProps: {
            placeholder: '请输入被叫手机号',
            clearable: true,
            style: { width: '220px' }
        }
    },
    // {
    //     field: 'callType',
    //     label: '通话类型',
    //     component: 'Select',
    //     componentProps: {
    //         placeholder: '请选择通话类型',
    //         clearable: true,
    //         options: [
    //             { label: '公网外呼', value: 1 },
    //             { label: '内部通话', value: 2 }
    //         ],
    //         style: { width: '180px' }
    //     }
    // },
    {
        field: 'status',
        label: '状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择状态',
            clearable: true,
            options: [
                { label: '发起中', value: 10 },
                { label: '已提交', value: 20 },
                { label: '已接通', value: 30 },
                { label: '失败', value: 40 },
                { label: '无人接听', value: 50 },
                { label: '忙线', value: 60 },
                { label: '已挂断', value: 70 }
            ],
            style: { width: '220px' }
        }
    },
    {
        field: 'createTime',
        label: '发起时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            startPlaceholder: '开始时间',
            endPlaceholder: '结束时间',
            defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
            style: { width: '220px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<OutboundCallRecordApi.OutboundCallRecordVO>({
    getListApi: async (params) => await OutboundCallRecordApi.getOutboundCallRecordPage(params)
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(params)
}

const tableColumns = reactive<TableColumn[]>([
    { field: 'recordNo', label: '记录编号', width: '150px' },
    { field: 'callerDisplayNumber', label: '主叫号码', width: '120px' },
    { field: 'calleeMobile', label: '被叫号码', width: '120px' },
    { field: 'createTime', label: '发起时间', formatter: dateFormatter, width: '170px' },
    { field: 'answerTime', label: '接通时间', formatter: dateFormatter, width: '170px' },
    { field: 'endTime', label: '结束时间', formatter: dateFormatter, width: '170px' },
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
    {
        field: 'recordingSyncStatusDesc',
        label: '语音同步',
        minWidth: '180px',
        slots: {
            default: (data) => {
                const statusText = data.row.recordingSyncStatusDesc || '-'
                const message = data.row.recordingSyncMessage
                if (!message) {
                    return <span>{statusText}</span>
                }
                return (
                    <ElTooltip content={message} placement="top">
                        <span>{statusText}</span>
                    </ElTooltip>
                )
            }
        }
    },
    // { field: 'callTypeDesc', label: '通话类型', width: '110px' },
    { field: 'submitMessage', label: '提交日志', minWidth: '160px' },
    { field: 'originateDisposition', label: '外呼结果', width: '160px' },
    { field: 'jobUuid', label: '任务号', width: '240px' },
    { field: 'statusDesc', label: '状态', width: '110px' },
    { field: 'userNickname', label: '发起人', width: '120px' },
    { field: 'gatewayName', label: '网关', width: '170px' },
    // { field: 'backupGatewayName', label: '备网关', width: '170px' },
    { field: 'durationSeconds', label: '通话时长(秒)', width: '120px' },
    { field: 'failReason', label: '失败原因', minWidth: '220px' },
    { field: 'hangupCause', label: '挂断原因', width: '160px' }
])

onMounted(() => {
    tableMethods.getList()
})
</script>
