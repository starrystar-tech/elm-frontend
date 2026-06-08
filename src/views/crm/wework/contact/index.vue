<template>
    <ContentWrap>
        <el-tabs v-model="activeName" @tab-click="handleTabClick" class="list-tabs-compact">
            <el-tab-pane label="有手机号" name="1" />
            <el-tab-pane label="无手机号" name="2" />
        </el-tabs>
        <div class="tab-content-wrap">
            <Search
                ref="searchRef"
                :schema="searchSchema"
                @search="setSearchParams"
                @reset="setSearchParams"
            />
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
                row-key="id"
                :loading="tableObject.loading"
                :pagination="{ total: tableObject.total }"
                @register="tableRegister"
            />
        </div>
    </ContentWrap>

    <ClueDetailDrawer ref="detailRef" @refresh="tableMethods.getList" />
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
import type { SearchExpose } from '@/components/Search'
import type { FormSchema } from '@/types/form'
import { useTable } from '@/hooks/web/useTable'
import * as WeworkContactApi from '@/api/crm/wework/contact'
import * as WeappApi from '@/api/system/weapp'
import ClueDetailDrawer from '@/views/crm/clue/detail/ClueDetailDrawer.vue'
import { renderCopyMobileCell } from '@/views/crm/clue/mobileCopy'

defineOptions({ name: 'CrmWeworkContact' })

const message = useMessage()
const searchRef = ref<SearchExpose>()
const syncLoading = ref(false)
const hasPhone = ref(true)
const activeName = ref('1')
const companyOptions = ref<{ label: string; value: string }[]>([])
const memberOptions = ref<{ label: string; value: string }[]>([])
const allMemberList = ref<WeworkContactApi.WeworkMemberSimpleVO[]>([])
const corpCompanyMap = ref<Record<string, string>>({})
const detailRef = ref<InstanceType<typeof ClueDetailDrawer>>()

const handleViewDetail = (row: WeworkContactApi.WeworkContactVO) => {
    if (row.clueId) {
        detailRef.value?.open(row.clueId)
    }
}

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'companyName',
        label: '企微',
        component: 'Select',
        componentProps: {
            options: [],
            clearable: true,
            placeholder: '请选择企微',
            style: { width: '220px' },
            onChange: (corpId?: string) => {
                handleCompanyChange(corpId)
            }
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
            style: { width: '220px' }
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

const setSearchParams = async (params: Recordable) => {
    await loadCorpMembers(params.companyName)
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
    const result = await ElMessageBox.prompt('请输入1个手机号', '备注手机号', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: row.mobile || '',
        inputPlaceholder: '例如：13800000000',
        inputValidator: (value) => {
            const v = (value || '').trim()
            if (!v) return true
            if (!/^1\d{10}$/.test(v)) {
                return '请输入正确的11位手机号'
            }
            return true
        }
    })
    const mobile = (result.value || '').trim()
    await WeworkContactApi.updateWeworkRemarkMobile({ id: row.id, mobile })
    message.success('保存成功')
    await tableMethods.getList()
}

const buildMemberOptions = (members: WeworkContactApi.WeworkMemberSimpleVO[]) =>
    members.map((item) => ({ label: item.name, value: item.userId }))

const syncMemberOptions = async (options: { label: string; value: string }[]) => {
    memberOptions.value = options
    searchSchema[1].componentProps = {
        ...(searchSchema[1].componentProps || {}),
        options
    }
    await searchRef.value?.setSchema([
        {
            field: 'staffUserId',
            path: 'componentProps.options',
            value: options
        }
    ])
}

const loadCorpMembers = async (corpId?: string) => {
    if (!corpId) {
        await syncMemberOptions(buildMemberOptions(allMemberList.value))
        return
    }
    const members = await WeworkContactApi.getWeworkMemberSimpleList(corpId)
    const corpMembers =
        members?.length > 0 ? members : allMemberList.value.filter((item) => item.corpId === corpId)
    await syncMemberOptions(buildMemberOptions(corpMembers))
}

const handleCompanyChange = async (corpId?: string) => {
    await loadCorpMembers(corpId)
    const formData = await searchRef.value?.getFormData<{ staffUserId?: string }>()
    if (!formData?.staffUserId) {
        return
    }
    const exists = memberOptions.value.some((item) => item.value === formData.staffUserId)
    if (!exists) {
        await searchRef.value?.setValues({ staffUserId: undefined })
    }
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
    allMemberList.value = members || []
    memberOptions.value = buildMemberOptions(allMemberList.value)

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
                        </div>
                    </div>
                )
            }
        }
    },
    {
        field: 'mobile',
        label: '手机号',
        width: '190px',
        slots: {
            default: (data) =>
                renderCopyMobileCell({
                    row: data.row,
                    mobile: data.row.mobile,
                    directCopyWhenMissingClueId: true,
                    success: message.success,
                    warning: message.warning
                })
        }
    },
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
                        <span>
                            {row.staffName || '-'}{' '}
                            <span class="text-[#fa8c16]">
                                @{corpCompanyMap.value[row.corpId] || row.corpName || '个微'}
                            </span>
                        </span>
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
        slots: {
            default: (data) => {
                const row = data.row as WeworkContactApi.WeworkContactVO
                const actions = []
                if (row.clueId) {
                    actions.push(
                        <BaseButton
                            key="detail"
                            link
                            type="primary"
                            onClick={() => handleViewDetail(row)}
                        >
                            详情
                        </BaseButton>
                    )
                }
                if (!hasPhone.value) {
                    actions.push(
                        <BaseButton
                            key="remark"
                            link
                            type="primary"
                            onClick={() => handleUpdateRemarkMobile(row)}
                        >
                            备注手机号
                        </BaseButton>
                    )
                }
                return actions.length > 0 ? <span class="flex gap-12px">{actions}</span> : null
            }
        }
    }
])

onMounted(async () => {
    await loadFilterOptions()
    await tableMethods.getList()
})
</script>
