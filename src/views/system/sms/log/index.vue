<template>
    <ContentWrap>
        <Search
            :schema="searchSchema"
            label-width="100px"
            @reset="setSearchParams"
            @search="setSearchParams"
        />
        <div class="action-btn-wrap">
            <BaseButton
                v-if="canExport"
                type="primary"
                plain
                :loading="exportLoading"
                @click="handleExport"
            >
                导出
            </BaseButton>
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

    <SmsLogDetail ref="detailRef" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions, getDictLabel } from '@/utils/dict'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import * as SmsChannelApi from '@/api/system/sms/smsChannel'
import * as SmsLogApi from '@/api/system/sms/smsLog'
import SmsLogDetail from './SmsLogDetail.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'SystemSmsLog' })

const canQuery = hasPermission(['system:sms-log:query'])
const canExport = hasPermission(['system:sms-log:export'])

const channelList = ref<SmsChannelApi.SmsChannelVO[]>([])

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'mobile',
        label: '手机号',
        component: 'Input',
        componentProps: {
            placeholder: '请输入手机号',
            clearable: true,
            style: { width: '240px' }
        }
    },
    {
        field: 'channelId',
        label: '短信渠道',
        component: 'Select',
        componentProps: {
            placeholder: '请选择短信渠道',
            clearable: true,
            options: [],
            style: { width: '240px' }
        }
    },
    {
        field: 'templateId',
        label: '模板编号',
        component: 'Input',
        componentProps: {
            placeholder: '请输入模板编号',
            clearable: true,
            style: { width: '240px' }
        }
    },
    {
        field: 'sendStatus',
        label: '发送状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择发送状态',
            clearable: true,
            options: getIntDictOptions(DICT_TYPE.SYSTEM_SMS_SEND_STATUS),
            style: { width: '240px' }
        }
    },
    {
        field: 'sendTime',
        label: '发送时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            startPlaceholder: '开始日期',
            endPlaceholder: '结束日期',
            style: { width: '240px' }
        }
    },
    {
        field: 'receiveStatus',
        label: '接收状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择接收状态',
            clearable: true,
            options: getIntDictOptions(DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS),
            style: { width: '240px' }
        }
    },
    {
        field: 'receiveTime',
        label: '接收时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            startPlaceholder: '开始日期',
            endPlaceholder: '结束日期',
            style: { width: '240px' }
        }
    }
])

const detailRef = ref<InstanceType<typeof SmsLogDetail>>()
const openDetail = (data: SmsLogApi.SmsLogVO) => {
    detailRef.value?.open(data)
}

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<SmsLogApi.SmsLogVO>({
    getListApi: async (params) => await SmsLogApi.getSmsLogPage(params),
    exportListApi: async (params) => await SmsLogApi.exportSmsLog(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(params)
}

const getChannelName = (channelId: number | null) => {
    const channel = channelList.value.find((item) => item.id === channelId)
    if (!channel) return ''
    return `${channel.signature}【 ${getDictLabel(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE, channel.code)}】`
}

const handleExport = async () => {
    await tableMethods.exportList('短信日志.xls')
}

const tableColumns = reactive<TableColumn[]>([
    { field: 'id', label: '编号' },
    { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
    {
        field: 'mobile',
        label: '手机号',
        width: '140px',
        slots: {
            default: (data) => (
                <>
                    <div>{data.row.mobile}</div>
                    {data.row.userId ? <div>{data.row.userId}</div> : null}
                </>
            )
        }
    },
    {
        field: 'sendStatus',
        label: '发送状态',
        width: '180px',
        slots: {
            default: (data) => (
                <>
                    <DictTag type={DICT_TYPE.SYSTEM_SMS_SEND_STATUS} value={data.row.sendStatus} />
                    <div>{formatDate(data.row.sendTime)}</div>
                </>
            )
        }
    },
    {
        field: 'receiveStatus',
        label: '接收状态',
        width: '180px',
        slots: {
            default: (data) => (
                <>
                    <DictTag
                        type={DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS}
                        value={data.row.receiveStatus}
                    />
                    <div>{formatDate(data.row.receiveTime)}</div>
                </>
            )
        }
    },
    {
        field: 'channelId',
        label: '短信渠道',
        width: '180px',
        slots: {
            default: (data) => (
                <>
                    <DictTag
                        type={DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE}
                        value={data.row.channelCode}
                    />
                </>
            )
        }
    },
    { field: 'templateCode', label: '模板编号', width: '180px', showOverflowTooltip: true },
    {
        field: 'templateType',
        label: '短信类型',
        slots: {
            default: (data) => (
                <DictTag type={DICT_TYPE.SYSTEM_SMS_TEMPLATE_TYPE} value={data.row.templateType} />
            )
        }
    },
    {
        field: 'action',
        label: '操作',
        width: '100px',
        fixed: 'right',
        slots: {
            default: (data) =>
                canQuery ? (
                    <BaseButton
                        link
                        type="primary"
                        onClick={() => openDetail(data.row as SmsLogApi.SmsLogVO)}
                    >
                        详情
                    </BaseButton>
                ) : null
        }
    }
])

onMounted(async () => {
    channelList.value = await SmsChannelApi.getSimpleSmsChannelList()
    searchSchema[1].componentProps = {
        ...(searchSchema[1].componentProps || {}),
        options: channelList.value.map((channel) => ({
            label: `${channel.signature}【 ${getDictLabel(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE, channel.code)}】`,
            value: channel.id
        }))
    }
    await tableMethods.getList()
})
</script>
