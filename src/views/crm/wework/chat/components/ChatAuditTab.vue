<template>
    <div class="audit-layout">
        <aside class="corp-panel">
            <button
                v-for="corp in corpOptions"
                :key="corp.value"
                class="corp-item"
                :class="{ active: corp.value === selectedCorpId }"
                @click="selectCorp(corp.value)"
            >
                {{ corp.label }}
            </button>
        </aside>

        <section class="audit-main" v-loading="loading">
            <div class="audit-tabs pt-10px">
                <button
                    v-for="tab in tabs"
                    :key="tab.value"
                    class="audit-tab"
                    :class="{ active: activeTab === tab.value }"
                    @click="activeTab = tab.value"
                >
                    {{ tab.label }}
                </button>
            </div>

            <div v-if="activeTab === 'employee'" class="audit-card">
                <Search
                    :model="employeeFilters"
                    :schema="employeeSearchSchema"
                    @register="registerEmployeeSearch"
                    @search="handleEmployeeSearch"
                    @reset="handleEmployeeReset"
                >
                    <template #user>
                        <el-input
                            v-model="employeeFilters.user"
                            placeholder="请选择用户"
                            readonly
                            @click="openUserSelect"
                            class="search-field-unified"
                        />
                    </template>
                    <template #wework>
                        <WeworkStaffSelect
                            :model-value="employeeFilters.wework"
                            :corp-id="selectedCorpId"
                            placeholder="请选择员工企微"
                            class="search-field-unified"
                            @update:model-value="handleWeworkChange"
                        />
                    </template>
                    <template #deptId>
                        <DeptSelector
                            :model-value="employeeFilters.deptId"
                            class="search-field-unified"
                            placeholder="请选择部门"
                            @update:model-value="handleDeptChange"
                        />
                    </template>
                    <template #friendCountRange>
                        <div class="search-range-group">
                            <el-input-number
                                v-model="employeeFilters.friendCountRange[0]"
                                :min="0"
                                :controls="false"
                                placeholder="最小值"
                                class="search-range-input"
                            />
                            <span class="search-range-separator">-</span>
                            <el-input-number
                                v-model="employeeFilters.friendCountRange[1]"
                                :min="0"
                                :controls="false"
                                placeholder="最大值"
                                class="search-range-input"
                            />
                        </div>
                    </template>
                    <template #singleChatCountRange>
                        <div class="search-range-group">
                            <el-input-number
                                v-model="employeeFilters.singleChatCountRange[0]"
                                :min="0"
                                :controls="false"
                                placeholder="最小值"
                                class="search-range-input"
                            />
                            <span class="search-range-separator">-</span>
                            <el-input-number
                                v-model="employeeFilters.singleChatCountRange[1]"
                                :min="0"
                                :controls="false"
                                placeholder="最大值"
                                class="search-range-input"
                            />
                        </div>
                    </template>
                    <template #groupChatCountRange>
                        <div class="search-range-group">
                            <el-input-number
                                v-model="employeeFilters.groupChatCountRange[0]"
                                :min="0"
                                :controls="false"
                                placeholder="最小值"
                                class="search-range-input"
                            />
                            <span class="search-range-separator">-</span>
                            <el-input-number
                                v-model="employeeFilters.groupChatCountRange[1]"
                                :min="0"
                                :controls="false"
                                placeholder="最大值"
                                class="search-range-input"
                            />
                        </div>
                    </template>
                </Search>
                <el-table :data="employeeRows" stripe>
                    <el-table-column prop="user" label="用户" min-width="120" />
                    <el-table-column prop="department" label="所属部门" min-width="140" />
                    <el-table-column prop="wework" label="员工企微" min-width="180">
                        <template #default="{ row }">
                            <span>{{ resolveWeworkDisplay(row.wework).name }}</span>
                            <span
                                v-if="resolveWeworkDisplay(row.wework).corp"
                                class="wework-corp-name"
                            >
                                @{{ resolveWeworkDisplay(row.wework).corp }}
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="archiveStatus" label="存档状态" width="120" />
                    <el-table-column prop="friendCount" label="企微好友数" width="120" />
                    <el-table-column prop="singleChatCount" label="今日单聊会话数" width="140" />
                    <el-table-column prop="groupChatCount" label="今日群聊会话数" width="140" />
                    <el-table-column prop="lastActiveTimeText" label="上次聊天时间" width="180" />
                    <el-table-column label="操作" width="120" fixed="right">
                        <template #default="{ row }">
                            <el-button link type="primary" @click="openContext(row)">
                                会话详情
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <div v-else class="audit-card">
                <Search
                    :model="contentFilters"
                    :schema="contentSearchSchema"
                    @search="handleContentSearch"
                    @reset="handleContentReset"
                />
                <el-table :data="contentRows" stripe>
                    <el-table-column prop="senderType" label="发送人类型" width="120" />
                    <el-table-column prop="sender" label="发送人" min-width="160" />
                    <el-table-column prop="receiver" label="接收对象" min-width="180" />
                    <el-table-column prop="chatTimeText" label="聊天时间" width="180" />
                    <el-table-column
                        prop="content"
                        label="聊天内容"
                        min-width="320"
                        show-overflow-tooltip
                    />
                    <el-table-column label="操作" width="120" fixed="right">
                        <template #default="{ row }">
                            <el-button link type="primary" @click="openContext(row)">
                                查看上下文
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </section>

        <UserSelectForm ref="userSelectFormRef" @confirm="handleUserSelectConfirm" />
    </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { Search } from '@/components/Search'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { useWeworkChatAuditStore } from '@/store/modules/weworkChatAudit'
import UserSelectForm from '@/components/UserSelectForm/index.vue'
import WeworkStaffSelect from '@/components/WeworkStaffSelect/index.vue'
import DeptSelector from '@/views/system/dept/components/DeptSelector.vue'
import type { FormSchema } from '@/types/form'
import type { UserVO } from '@/api/system/user'
import * as WeworkChatApi from '@/api/crm/wework/chat'
import * as WeworkContactApi from '@/api/crm/wework/contact'

const router = useRouter()
const tagsViewStore = useTagsViewStore()
const weworkChatAuditStore = useWeworkChatAuditStore()
const loading = ref(false)
const message = useMessage()
const selectedCorpId = ref('')
const activeTab = ref<'employee' | 'content'>('employee')
const corpOptions = ref<{ value: string; label: string }[]>([])
const employeeRows = ref<any[]>([])
const contentRows = ref<any[]>([])

const employeeFilters = reactive({
    user: '',
    userList: [] as UserVO[],
    wework: '',
    deptId: undefined as number | undefined,
    keyword: '',
    lastActiveTimeRange: [] as string[],
    friendCountRange: [undefined, undefined] as Array<number | undefined>,
    singleChatCountRange: [undefined, undefined] as Array<number | undefined>,
    groupChatCountRange: [undefined, undefined] as Array<number | undefined>,
    friendCountMin: undefined as number | undefined,
    friendCountMax: undefined as number | undefined,
    singleChatCountMin: undefined as number | undefined,
    singleChatCountMax: undefined as number | undefined,
    groupChatCountMin: undefined as number | undefined,
    groupChatCountMax: undefined as number | undefined
})

const contentFilters = reactive({
    keyword: '',
    senderType: '',
    timeRange: [] as string[]
})

const saveAuditState = () => {
    weworkChatAuditStore.setCache({
        activeTab: activeTab.value,
        selectedCorpId: selectedCorpId.value,
        employeeFilters: {
            ...employeeFilters,
            userList: employeeFilters.userList || []
        },
        contentFilters: {
            ...contentFilters
        }
    })
}

const restoreAuditState = () => {
    const parsed = weworkChatAuditStore.getCache
    if (!parsed) return
    try {
        if (parsed.activeTab === 'employee' || parsed.activeTab === 'content') {
            activeTab.value = parsed.activeTab
        }
        selectedCorpId.value = parsed.selectedCorpId || ''
        Object.assign(employeeFilters, {
            ...employeeFilters,
            ...(parsed.employeeFilters || {})
        })
        Object.assign(contentFilters, {
            ...contentFilters,
            ...(parsed.contentFilters || {})
        })
    } catch (error) {
        console.warn('[ChatAuditTab] restoreAuditState failed', error)
    }
}

const registerEmployeeSearch = (_searchMethods: any) => {}

const handleWeworkChange = (value?: string) => {
    employeeFilters.wework = value || ''
    saveAuditState()
}

const handleDeptChange = (value?: number) => {
    employeeFilters.deptId = value
    saveAuditState()
}

const employeeSearchSchema = computed<FormSchema[]>(() => [
    {
        field: 'user',
        label: '用户',
        component: 'Input',
        componentProps: {
            placeholder: '请输入用户',
            style: { width: '240px' }
        }
    },
    {
        field: 'wework',
        label: '员工企微',
        component: 'Input',
        componentProps: {
            style: { width: '240px' }
        }
    },
    {
        field: 'deptId',
        label: '所属部门',
        component: 'Input',
        componentProps: {
            style: { width: '240px' }
        }
    },
    {
        field: 'lastActiveTimeRange',
        label: '上次聊天时间',
        component: 'DatePicker',
        componentProps: {
            type: 'datetimerange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            startPlaceholder: '开始时间',
            endPlaceholder: '结束时间',
            defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
            style: { width: '240px' }
        }
    },
    {
        field: 'friendCountRange',
        label: '好友数',
        component: 'Input',
        value: [undefined, undefined],
        componentProps: {
            style: { width: '220px' }
        }
    },
    {
        field: 'singleChatCountRange',
        label: '今日单聊会话数',
        component: 'Input',
        value: [undefined, undefined],
        componentProps: {
            style: { width: '220px' }
        }
    },
    {
        field: 'groupChatCountRange',
        label: '今日群聊会话数',
        component: 'Input',
        value: [undefined, undefined],
        componentProps: {
            style: { width: '220px' }
        }
    }
])

const contentSearchSchema = computed<FormSchema[]>(() => [
    {
        field: 'keyword',
        label: '聊天内容',
        component: 'Input',
        componentProps: {
            placeholder: '请输入聊天内容关键词',
            clearable: true
        }
    },
    {
        field: 'senderType',
        label: '发送人类型',
        component: 'Select',
        componentProps: {
            placeholder: '请选择发送人类型',
            options: [
                { label: '全部类型', value: '' },
                { label: '员工', value: '员工' },
                { label: '客户', value: '客户' }
            ]
        }
    },
    {
        field: 'timeRange',
        label: '聊天时间',
        component: 'DatePicker',
        componentProps: {
            type: 'datetimerange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            startPlaceholder: '开始时间',
            endPlaceholder: '结束时间',
            defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
            style: { width: '240px' }
        }
    }
])

const userSelectFormRef = ref<InstanceType<typeof UserSelectForm>>()
const resolveSelectedUserNames = (userList: UserVO[]) =>
    (userList || [])
        .map((item) => item.nickname || item.username)
        .filter(Boolean)
        .join('、')

const resolveStaffUserIds = () => {
    const corpId = selectedCorpId.value
    return (employeeFilters.userList || [])
        .map(
            (user) => user.wecomBindList?.find((bind) => bind.corpId === corpId)?.staffUserId || ''
        )
        .filter(Boolean)
}

const resolveAuditStaffUserIds = () => {
    if (employeeFilters.wework) {
        return [employeeFilters.wework]
    }
    return resolveStaffUserIds()
}

const openUserSelect = () => {
    userSelectFormRef.value?.open('chat-audit-user', employeeFilters.userList, {
        multiple: false,
        title: '选择用户'
    })
}

const handleUserSelectConfirm = (_activityId: string, userList: UserVO[]) => {
    const validUsers = (userList || []).filter((user) =>
        user.wecomBindList?.some((bind) => bind.corpId === selectedCorpId.value)
    )
    if (userList?.length && !validUsers.length) {
        message.warning('所选用户未绑定当前企业微信成员账号')
    }
    employeeFilters.userList = validUsers
    employeeFilters.user = resolveSelectedUserNames(validUsers)
    saveAuditState()
}

const resetEmployeeFilters = () => {
    employeeFilters.user = ''
    employeeFilters.userList = []
    employeeFilters.wework = ''
    employeeFilters.deptId = undefined
    employeeFilters.keyword = ''
    employeeFilters.lastActiveTimeRange = []
    employeeFilters.friendCountRange = [undefined, undefined]
    employeeFilters.singleChatCountRange = [undefined, undefined]
    employeeFilters.groupChatCountRange = [undefined, undefined]
    employeeFilters.friendCountMin = undefined
    employeeFilters.friendCountMax = undefined
    employeeFilters.singleChatCountMin = undefined
    employeeFilters.singleChatCountMax = undefined
    employeeFilters.groupChatCountMin = undefined
    employeeFilters.groupChatCountMax = undefined
}

const handleEmployeeSearch = (params: Recordable) => {
    Object.assign(employeeFilters, {
        ...params,
        friendCountMin: employeeFilters.friendCountRange[0] ?? undefined,
        friendCountMax: employeeFilters.friendCountRange[1] ?? undefined,
        singleChatCountMin: employeeFilters.singleChatCountRange[0] ?? undefined,
        singleChatCountMax: employeeFilters.singleChatCountRange[1] ?? undefined,
        groupChatCountMin: employeeFilters.groupChatCountRange[0] ?? undefined,
        groupChatCountMax: employeeFilters.groupChatCountRange[1] ?? undefined
    })
    saveAuditState()
    loadAuditPage()
}

const handleEmployeeReset = () => {
    resetEmployeeFilters()
    saveAuditState()
    loadAuditPage()
}

const handleContentSearch = (params: Recordable) => {
    Object.assign(contentFilters, {
        keyword: '',
        senderType: '',
        timeRange: [],
        ...params
    })
    saveAuditState()
    loadAuditPage()
}

const handleContentReset = () => {
    contentFilters.keyword = ''
    contentFilters.senderType = ''
    contentFilters.timeRange = []
    saveAuditState()
    loadAuditPage()
}

const tabs = [
    { label: '按员工查询', value: 'employee' },
    { label: '按聊天内容查询', value: 'content' }
] as const

const loadCorpOptions = async () => {
    const rows = await WeworkContactApi.getWeworkCompanySimpleList()
    corpOptions.value = (rows || []).map((item) => ({
        value: item.corpId,
        label: item.companyName || item.label || item.corpId
    }))
    if (!selectedCorpId.value && corpOptions.value.length) {
        selectedCorpId.value = corpOptions.value[0].value
    }
}

const selectCorp = (corpId: string) => {
    selectedCorpId.value = corpId
    saveAuditState()
}

const openContext = (row: any) => {
    const targetFromUser =
        row.fromUser || employeeFilters.wework || resolveAuditStaffUserIds()[0] || undefined
    const targetRoute = router.resolve({
        name: 'CrmWeworkChatAuditDetail',
        query: {
            openKey: `${Date.now()}`,
            corpId: row.corpId || selectedCorpId.value || undefined,
            fromUser: targetFromUser
        }
    })
    targetRoute.meta = {
        ...targetRoute.meta,
        title: '审计详情'
    }
    tagsViewStore.addView(targetRoute as any)
    router.push(targetRoute)
}

const resolveWeworkDisplay = (value?: string) => {
    if (!value) {
        return { name: '-', corp: '' }
    }
    const [name, ...corpParts] = value.split('@')
    return {
        name: name || value,
        corp: corpParts.join('@')
    }
}

const resolveRangeStartUnix = (value?: string) => {
    return value ? dayjs(value).startOf('minute').unix() : undefined
}

const resolveRangeEndUnix = (value?: string) => {
    return value ? dayjs(value).endOf('minute').unix() : undefined
}

const loadAuditPage = async () => {
    loading.value = true
    try {
        const isEmployee = activeTab.value === 'employee'
        const selectedStaffUserIds = resolveAuditStaffUserIds()
        const params: WeworkChatApi.WeworkChatAuditReqVO = {
            pageNo: 1,
            pageSize: 100,
            corpId: selectedCorpId.value || undefined,
            auditMode: isEmployee ? 'employee' : 'content',
            keyword: isEmployee
                ? employeeFilters.keyword || undefined
                : contentFilters.keyword || undefined,
            fromUser: isEmployee ? selectedStaffUserIds[0] || undefined : undefined,
            fromUserList: isEmployee ? selectedStaffUserIds : undefined,
            deptId: isEmployee ? employeeFilters.deptId : undefined,
            beginLastActiveTime: isEmployee
                ? resolveRangeStartUnix(employeeFilters.lastActiveTimeRange[0])
                : undefined,
            endLastActiveTime: isEmployee
                ? resolveRangeEndUnix(employeeFilters.lastActiveTimeRange[1])
                : undefined,
            minFriendCount: isEmployee ? employeeFilters.friendCountMin : undefined,
            maxFriendCount: isEmployee ? employeeFilters.friendCountMax : undefined,
            minSingleChatCount: isEmployee ? employeeFilters.singleChatCountMin : undefined,
            maxSingleChatCount: isEmployee ? employeeFilters.singleChatCountMax : undefined,
            minGroupChatCount: isEmployee ? employeeFilters.groupChatCountMin : undefined,
            maxGroupChatCount: isEmployee ? employeeFilters.groupChatCountMax : undefined,
            senderType: !isEmployee ? contentFilters.senderType || undefined : undefined,
            beginMsgTime: !isEmployee
                ? resolveRangeStartUnix(contentFilters.timeRange[0])
                : undefined,
            endMsgTime: !isEmployee ? resolveRangeEndUnix(contentFilters.timeRange[1]) : undefined
        }
        const resp = await WeworkChatApi.getWeworkChatAuditPage(params)
        const rows = (resp.list || []).map((item) => ({
            ...item,
            lastActiveTimeText: item.lastActiveTime
                ? dayjs.unix(item.lastActiveTime).format('YYYY-MM-DD HH:mm:ss')
                : '-',
            chatTimeText: item.chatTime
                ? dayjs.unix(item.chatTime).format('YYYY-MM-DD HH:mm:ss')
                : '-'
        }))
        if (isEmployee) {
            employeeRows.value = rows
        } else {
            contentRows.value = rows
        }
    } finally {
        loading.value = false
    }
}

watch([activeTab, selectedCorpId], loadAuditPage)
watch(selectedCorpId, () => {
    const validUsers = (employeeFilters.userList || []).filter((user) =>
        user.wecomBindList?.some((bind) => bind.corpId === selectedCorpId.value)
    )
    employeeFilters.userList = validUsers
    employeeFilters.user = resolveSelectedUserNames(validUsers)
    saveAuditState()
})

onMounted(async () => {
    restoreAuditState()
    await loadCorpOptions()
    await loadAuditPage()
})

onActivated(async () => {
    restoreAuditState()
    await loadCorpOptions()
    await loadAuditPage()
})
</script>

<style scoped lang="scss">
.audit-layout {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    gap: 8px;
}
.corp-panel,
.audit-card {
    background: #fff;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
}
.corp-panel {
    padding: 8px;
    min-height: 640px;
}
.corp-item,
.audit-tab {
    border: none;
    background: transparent;
    cursor: pointer;
}
.corp-item {
    width: 100%;
    margin-bottom: 6px;
    padding: 9px 12px;
    border-radius: 6px;
    text-align: left;
    color: #606266;
}
.corp-item.active {
    background: #b4c5f5;
    color: #303133;
}
.audit-tabs {
    display: flex;
    gap: 24px;
    margin-bottom: 12px;
}
.audit-tab {
    padding: 4px 0 10px;
    color: #606266;
}
.audit-tab.active {
    color: #409eff;
    box-shadow: inset 0 -2px 0 #409eff;
}
.audit-card {
    padding: 16px;
}
.audit-card :deep(.search-content) {
    margin-bottom: 12px;
}
.audit-card :deep(.el-form) {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    column-gap: 20px;
}
.audit-card :deep(.el-form-item) {
    margin-right: 0;
    margin-bottom: 14px;
}
.audit-card :deep(.el-form-item__label) {
    font-weight: 400;
}
.wework-corp-name {
    color: #fa8c16;
}
.search-field-unified {
    width: 240px;
}
.search-field-unified:deep(.el-input),
.search-field-unified:deep(.el-input__wrapper),
.search-field-unified:deep(.el-select) {
    width: 100%;
}
.search-range-group {
    width: 220px;
    display: flex;
    align-items: center;
    gap: 6px;
}
.search-range-input {
    flex: 1;
}
.search-range-input:deep(.el-input__wrapper) {
    width: 100%;
}
.search-range-input:deep(.el-input__inner) {
    text-align: center;
}
.search-range-separator {
    color: #909399;
    flex: none;
}
</style>
