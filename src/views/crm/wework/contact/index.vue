<template>
    <ContentWrap>
        <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
        <el-tabs v-model="activeName" @tab-click="handleTabClick" class="list-tabs-compact">
            <el-tab-pane label="有手机号" name="1" />
            <el-tab-pane label="无手机号" name="2" />
        </el-tabs>

        <div class="action-btn-wrap">
            <BaseButton type="primary" :loading="syncLoading" @click="handleSync"
                >同步企微客户</BaseButton
            >
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
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { ElMessageBox, type TabsPaneContext } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getStrDictOptions } from '@/utils/dict'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import type { FormSchema } from '@/types/form'
import { useTable } from '@/hooks/web/useTable'
import * as WeworkContactApi from '@/api/crm/wework/contact'
import * as WeappApi from '@/api/system/weapp'

defineOptions({ name: 'CrmWeworkContact' })

const message = useMessage()
const syncLoading = ref(false)
const hasPhone = ref(true)
const activeName = ref('1')
const companyOptions = ref<{ label: string; value: string }[]>([])
const memberOptions = ref<{ label: string; value: string }[]>([])
const corpCompanyMap = ref<Record<string, string>>({})

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'companyName',
        label: '企微',
        component: 'Select',
        componentProps: {
            options: [],
            clearable: true,
            placeholder: '请选择企微',
            style: { width: '220px' }
        }
    },
    {
        field: 'staffUserId',
        label: '成员',
        component: 'Select',
        componentProps: {
            options: [],
            clearable: true,
            placeholder: '输入查询成员',
            style: { width: '220px' }
        }
    },
    {
        field: 'customerKeyword',
        label: '客户',
        component: 'Input',
        componentProps: {
            clearable: true,
            placeholder: '客户昵称/备注名',
            style: { width: '220px' }
        }
    },
    {
        field: 'mobile',
        label: '手机号',
        component: 'Input',
        componentProps: {
            clearable: true,
            placeholder: '输入手机号',
            style: { width: '220px' }
        }
    },
    {
        field: 'addWay',
        label: '添加方式',
        component: 'Select',
        componentProps: {
            clearable: true,
            placeholder: '请选择添加方式',
            options: getStrDictOptions(DICT_TYPE.WEWORK_FOLLOW_USER_ADD_WAY),
            style: { width: '220px' }
        }
    },
    {
        field: 'dateRange',
        label: '添加时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            startPlaceholder: '开始时间',
            endPlaceholder: '结束时间',
            style: { width: '300px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<WeworkContactApi.WeworkContactVO>({
    getListApi: async (params) => {
        const dateRange = params.dateRange || []
        return await WeworkContactApi.getWeworkContactPage({
            ...params,
            hasPhone: hasPhone.value,
            beginAddTime: dateRange[0],
            endAddTime: dateRange[1]
        })
    },
    defaultParams: {
        hasPhone: true
    }
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams({ ...params, hasPhone: hasPhone.value })
}

const handlePhoneTabChange = () => {
    const params = { ...(tableObject.params || {}) }
    tableMethods.setSearchParams({ ...params, hasPhone: hasPhone.value })
}

const handleTabClick = (tab: TabsPaneContext) => {
    activeName.value = String(tab.paneName)
    hasPhone.value = activeName.value === '1'
    handlePhoneTabChange()
}

const handleSync = async () => {
    syncLoading.value = true
    try {
        const resp = await WeworkContactApi.syncWeworkContacts()
        message.success(resp?.message || '已提交后台同步任务，请稍后刷新列表查看结果')
    } finally {
        syncLoading.value = false
    }
}

const handleUpdateRemarkMobile = async (row: WeworkContactApi.WeworkContactVO) => {
    const result = await ElMessageBox.prompt('请输入备注手机号，多个请用英文逗号分隔', '备注手机号', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: row.mobile || '',
        inputPlaceholder: '例如：13800000000,13900000000'
    })
    const mobile = (result.value || '').trim()
    await WeworkContactApi.updateWeworkRemarkMobile({ id: row.id, mobile })
    message.success('保存成功')
    await tableMethods.getList()
}

const loadFilterOptions = async () => {
    const [weappList, members] = await Promise.all([
        WeappApi.getWeappConfigList(),
        WeworkContactApi.getWeworkMemberSimpleList()
    ])

    const appList = (weappList || []).filter((item) => !!item?.corpId)
    corpCompanyMap.value = appList.reduce(
        (acc: Record<string, string>, item) => {
            acc[item.corpId] = item.companyName || item.corpId
            return acc
        },
        {} as Record<string, string>
    )
    companyOptions.value = appList.map((item) => ({
        label: item.companyName || item.corpId,
        value: item.corpId
    }))
    memberOptions.value = members.map((item: any) => ({ label: item.name, value: item.userId }))

    searchSchema[0].componentProps = {
        ...(searchSchema[0].componentProps || {}),
        options: companyOptions.value
    }
    searchSchema[1].componentProps = {
        ...(searchSchema[1].componentProps || {}),
        options: memberOptions.value
    }
}

const tableColumns = reactive<TableColumn[]>([
    {
        field: 'customerName',
        label: '客户',
        width: '260px',
        slots: {
            default: (data) => {
                const row = data.row as WeworkContactApi.WeworkContactVO
                return (
                    <div class="flex items-center gap-8px">
                        <el-avatar size={32} src={row.avatar}>
                            {(row.customerName || '客').slice(0, 1)}
                        </el-avatar>
                        <div>
                            <div>
                                {row.customerName || '-'}@
                                {row.corpName ? (
                                    <span class="text-[#fa8c16]">{row.corpName}</span>
                                ) : (
                                    <span class="text-[#52c41a]">个微</span>
                                )}
                            </div>
                            <div class="text-12px text-[var(--el-text-color-secondary)]">
                                昵称: {row.customerNickname || '-'}
                            </div>
                        </div>
                    </div>
                )
            }
        }
    },
    { field: 'mobile', label: '手机号', width: '160px' },
    {
        field: 'staffName',
        label: '添加成员',
        width: '180px',
        slots: {
            default: (data) => {
                const row = data.row as WeworkContactApi.WeworkContactVO
                return (
                    <div class="flex items-center gap-8px">
                        <el-avatar size={28} src={row.staffAvatar}>
                            {(row.staffName || '员').slice(0, 1)}
                        </el-avatar>
                        <span>{row.staffName || '-'}</span>
                    </div>
                )
            }
        }
    },
    {
        field: 'addWay',
        label: '添加方式',
        width: '180px',
        slots: {
            default: (data) => (
                <DictTag type={DICT_TYPE.WEWORK_FOLLOW_USER_ADD_WAY} value={data.row.addWay} />
            )
        }
    },
    {
        field: 'addTime',
        label: '添加时间',
        width: '180px',
        formatter: dateFormatter
    },
    {
        field: 'corpName',
        label: '所属企业',
        width: '180px',
        slots: {
            default: (data) => {
                const row = data.row as WeworkContactApi.WeworkContactVO
                return corpCompanyMap.value[row.corpId] || '-'
            }
        }
    },
    { field: 'remark', label: '备注', showOverflowTooltip: true },
    {
        field: 'action',
        label: '操作',
        width: '120px',
        fixed: 'right',
        hidden: hasPhone.value,
        slots: {
            default: (data) => {
                const row = data.row as WeworkContactApi.WeworkContactVO
                if (hasPhone.value) {
                    return null
                }
                return (
                    <BaseButton link type="primary" onClick={() => handleUpdateRemarkMobile(row)}>
                        备注手机号
                    </BaseButton>
                )
            }
        }
    }
])

onMounted(async () => {
    await loadFilterOptions()
    await tableMethods.getList()
})
</script>
