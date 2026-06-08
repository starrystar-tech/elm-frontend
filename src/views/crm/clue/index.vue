<template>
    <ContentWrap>
        <Search
            :schema="searchSchema"
            expand-field="wechat"
            @reset="setSearchParams"
            @search="setSearchParams"
        >
            <template #consultProjectId="formModel">
                <ProductCategorySelect
                    v-model="formModel.consultProjectId"
                    placeholder="请选择咨询项目"
                />
            </template>
        </Search>

        <div class="mb-12px flex items-center justify-between gap-12px flex-wrap action-btn-wrap">
            <div class="flex gap-4px flex-wrap">
                <BaseButton plain :disabled="selectionList.length !== 2" @click="openMergeDialog"
                    >合并</BaseButton
                >
                <BaseButton
                    plain
                    :disabled="selectionList.length === 0"
                    @click="assignModeDialogVisible = true"
                    >修改分配方式</BaseButton
                >
                <BaseButton
                    plain
                    :disabled="selectionList.length === 0"
                    @click="silentDialogVisible = true"
                    >静默</BaseButton
                >
                <BaseButton
                    plain
                    :disabled="selectionList.length === 0"
                    @click="tagDialogVisible = true"
                    >标签</BaseButton
                >
                <BaseButton
                    v-if="canSmsSend"
                    plain
                    :disabled="selectionList.length === 0"
                    @click="openSmsDialog"
                    >发短信</BaseButton
                >
                <BaseButton
                    v-if="canComplaintTagUpdate"
                    plain
                    :disabled="selectionList.length === 0"
                    @click="openComplaintTagDialog"
                    >投诉标签</BaseButton
                >
            </div>
            <div class="flex gap-4px flex-wrap mr-12px">
                <BaseButton v-if="canCreate" type="primary" @click="openForm('create')"
                    >新增</BaseButton
                >
                <BaseButton plain @click="importDialogVisible = true">批量导入</BaseButton>
                <BaseButton v-if="canComplaintTagImport" plain @click="openComplaintImportDialog"
                    >投诉标签导入</BaseButton
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

    <ClueForm ref="formRef" @success="tableMethods.getList" />
    <ClueSmsDialog ref="smsDialogRef" @success="handleSmsSuccess" />
    <ClueDetailDrawer ref="detailRef" @refresh="tableMethods.getList" />
    <ClueEnrollDialog ref="enrollRef" @success="tableMethods.getList" />

    <Dialog v-model="assignModeDialogVisible" title="修改分配方式" width="420px">
        <el-radio-group v-model="assignModeForm.assignMode">
            <el-radio :label="1">自动</el-radio>
            <el-radio :label="2">手动</el-radio>
        </el-radio-group>
        <div class="mt-12px text-12px text-[var(--el-text-color-secondary)]">
            仅支持未分配数据修改分配方式
        </div>
        <template #footer>
            <el-button @click="assignModeDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleBatchUpdateAssignMode">确定</el-button>
        </template>
    </Dialog>

    <Dialog v-model="silentDialogVisible" title="批量静默" width="520px">
        <el-form :model="silentForm" label-width="90px">
            <el-form-item label="静默原因" required>
                <el-input v-model="silentForm.silentReason" placeholder="请输入静默原因" />
            </el-form-item>
            <!-- <el-form-item label="静默天数" required>
                <el-input-number
                    v-model="silentForm.silentDays"
                    :min="1"
                    controls-position="right"
                    style="width: 100%"
                />
            </el-form-item> -->
            <!-- <el-form-item label="备注">
                <el-input
                    v-model="silentForm.remark"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入备注"
                />
            </el-form-item> -->
        </el-form>
        <template #footer>
            <el-button @click="silentDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleBatchSilent">确定</el-button>
        </template>
    </Dialog>

    <Dialog v-model="tagDialogVisible" title="批量打标签" width="520px">
        <el-form label-width="80px">
            <el-form-item label="标签" required>
                <el-select
                    v-model="tagForm.tagIds"
                    multiple
                    filterable
                    placeholder="请选择标签"
                    style="width: 100%"
                >
                    <el-option
                        v-for="item in tagOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="tagDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleBatchTag">确定</el-button>
        </template>
    </Dialog>

    <Dialog v-model="complaintTagDialogVisible" title="批量打投诉标签" width="520px">
        <el-form label-width="100px">
            <el-form-item label="投诉标签" required>
                <el-select
                    v-model="complaintTagForm.complaintTagIds"
                    multiple
                    filterable
                    placeholder="请选择投诉标签"
                    style="width: 100%"
                >
                    <el-option
                        v-for="item in complaintTagOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
            <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
                增量打标，不会覆盖已有投诉标签关系
            </div>
        </el-form>
        <template #footer>
            <el-button @click="complaintTagDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleBatchComplaintTag">确定</el-button>
        </template>
    </Dialog>

    <ClueMergeDialog
        v-model="mergeDialogVisible"
        :clues="selectionList"
        :initial-keep-clue-id="mergeKeepClueId"
        @confirm="handleMerge"
    />

    <Dialog v-model="importDialogVisible" title="批量导入名片" width="480px">
        <div class="mb-12px flex items-center justify-between text-13px">
            <span class="text-[var(--el-text-color-secondary)]">支持 `.xlsx`、`.xls`、`.csv`</span>
            <el-link :href="CLUE_IMPORT_TEMPLATE_URL" target="_blank" type="primary">
                下载模板
            </el-link>
        </div>
        <el-upload
            v-model:file-list="importFileList"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls,.csv"
            action="none"
            drag
        >
            <Icon icon="ep:upload" />
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        </el-upload>
        <template #footer>
            <el-button @click="importDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="importLoading" @click="handleImport"
                >开始导入</el-button
            >
        </template>
    </Dialog>

    <ComplaintTagImportDialog ref="complaintImportDialogRef" @success="tableMethods.getList" />
    <ExportTaskDialog ref="exportDialogRef" @success="handleExportSuccess" />
</template>

<script setup lang="tsx">
import { computed, nextTick, reactive, ref } from 'vue'
import type { UploadUserFile } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import { useTable } from '@/hooks/web/useTable'
import { Table, type TableColumn } from '@/components/Table'
import { Search } from '@/components/Search'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { getClueIntentLevelOptions } from '@/components/ClueIntentLevel'
import ProductCategorySelect from '@/components/ProductCategorySelect.vue'
import { hasPermission } from '@/directives/permission/hasPermi'
import type { FormSchema } from '@/types/form'
import * as ClueApi from '@/api/crm/clue'
import * as UserApi from '@/api/system/user'
import * as AreaApi from '@/api/system/area'
import * as ClueSourceApi from '@/api/system/clueSource'
import * as TagGroupApi from '@/api/system/tag-group'
import * as ComplaintTagApi from '@/api/system/complaintTag'
import ClueForm from './ClueForm.vue'
import ClueSmsDialog from './ClueSmsDialog.vue'
import ComplaintTagImportDialog from './ComplaintTagImportDialog.vue'
import ClueDetailDrawer from './detail/ClueDetailDrawer.vue'
import ClueEnrollDialog from './detail/ClueEnrollDialog.vue'
import ClueMergeDialog from './components/ClueMergeDialog.vue'
import ExportTaskDialog from './components/ExportTaskDialog.vue'
import { renderCopyMobileCell } from './mobileCopy'

interface SearchParams {
    customer?: string
    mobile?: string
    areaId?: number
    status?: number
    tagId?: number
    complaintTagId?: number
    consultProjectId?: number
    clueSourceId?: number
    intentLevel?: number
    wechat?: string
    qq?: string
    currentOwnerId?: number
    allocationTimeRange?: string[]
    allocationType?: number
    assignMode?: number
    feedbackStatus?: number
    minOrderCount?: number
    maxOrderCount?: number
    creator?: string
    createTimeRange?: string[]
}

interface AreaOption {
    label: string
    value: number
}

defineOptions({ name: 'CrmClue' })

const CLUE_IMPORT_TEMPLATE_URL =
    'https://file.bgwa.cn/bgwa/20260604/%E9%A6%96%E5%92%A8%E5%90%8D%E7%89%87%E4%B8%8A%E4%BC%A0%E6%A8%A1%E6%9D%BF_1780538759251.csv'

const message = useMessage()
const canCreate = hasPermission(['crm:clue:create'])
const canExport = hasPermission(['crm:clue:export'])
const canSmsSend = hasPermission(['crm:clue:sms:send'])
const canComplaintTagUpdate = hasPermission(['crm:clue:complaint-tag:update'])
const canComplaintTagImport = hasPermission(['crm:clue:complaint-tag:import'])

const formRef = ref<InstanceType<typeof ClueForm>>()
const smsDialogRef = ref<InstanceType<typeof ClueSmsDialog>>()
const complaintImportDialogRef = ref<InstanceType<typeof ComplaintTagImportDialog>>()
const detailRef = ref<InstanceType<typeof ClueDetailDrawer>>()
const enrollRef = ref<InstanceType<typeof ClueEnrollDialog>>()
const exportDialogRef = ref<InstanceType<typeof ExportTaskDialog>>()
const importFileList = ref<UploadUserFile[]>([])
const importLoading = ref(false)
const importDialogVisible = ref(false)
const selectionList = ref<ClueApi.ClueVO[]>([])
const assignModeDialogVisible = ref(false)
const silentDialogVisible = ref(false)
const tagDialogVisible = ref(false)
const complaintTagDialogVisible = ref(false)
const mergeDialogVisible = ref(false)
const mergeKeepClueId = ref<number | undefined>()

const assignModeForm = reactive({ assignMode: 1 })
const silentForm = reactive({ silentReason: '', silentDays: 7, remark: '' })
const tagForm = reactive({ tagIds: [] as number[] })
const complaintTagForm = reactive({ complaintTagIds: [] as number[] })

const areaOptions = ref<AreaOption[]>([])
const userOptions = ref<{ label: string; value: number }[]>([])
const clueSourceOptions = ref<{ label: string; value: number }[]>([])
const tagOptions = ref<{ label: string; value: number }[]>([])
const complaintTagOptions = ref<{ label: string; value: number }[]>([])
const currentSearchParams = ref<SearchParams>({})

const statusOptions = [
    { label: '待分配', value: 1 },
    { label: '跟进中', value: 2 },
    { label: '已成交', value: 3 },
    { label: '公海', value: 4 },
    { label: '复购公海', value: 5 },
    { label: '静默', value: 6 }
]
const intentLevelOptions = getClueIntentLevelOptions()
const assignModeOptions = [
    { label: '自动', value: 1 },
    { label: '手动', value: 2 }
]
const feedbackStatusOptions = [
    { label: '有效', value: 1 },
    { label: '无效', value: 2 },
    { label: '未接通', value: 3 }
]
const allocationTypeOptions = [
    { label: '自动分配', value: 1 },
    { label: '手动分配', value: 2 },
    { label: '自己创建', value: 3 },
    { label: '公海领取', value: 4 },
    { label: '主管调配', value: 5 },
    { label: '无效再分配', value: 6 },
    { label: '批量分配', value: 7 },
    { label: '复购系统分配', value: 8 }
]

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
            placeholder: '请输入客户ID/名称',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'areaId',
        label: '地区',
        component: 'Select',
        componentProps: {
            placeholder: '请选择地区',
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px' }
        }
    },
    {
        field: 'status',
        label: '客户状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择客户状态',
            clearable: true,
            options: statusOptions,
            style: { width: '220px' }
        }
    },
    {
        field: 'tagId',
        label: '标签',
        component: 'Select',
        componentProps: {
            placeholder: '请选择标签',
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px' }
        }
    },
    {
        field: 'complaintTagId',
        label: '投诉标签',
        component: 'Select',
        componentProps: {
            placeholder: '请选择投诉标签',
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px' }
        }
    },
    {
        field: 'consultProjectId',
        label: '咨询项目',
        component: 'Select',
        componentProps: {
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'clueSourceId',
        label: '客户来源',
        component: 'Select',
        componentProps: {
            placeholder: '请选择客户来源',
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px' }
        }
    },
    {
        field: 'intentLevel',
        label: '意向度',
        component: 'Select',
        componentProps: {
            placeholder: '请选择意向度',
            clearable: true,
            options: intentLevelOptions,
            style: { width: '220px' }
        }
    },
    {
        field: 'wechat',
        label: '微信',
        component: 'Input',
        componentProps: { placeholder: '请输入微信', clearable: true, style: { width: '220px' } }
    },
    {
        field: 'qq',
        label: 'QQ',
        component: 'Input',
        componentProps: { placeholder: '请输入QQ', clearable: true, style: { width: '220px' } }
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
        field: 'allocationTimeRange',
        label: '分配时间',
        component: 'DatePicker',
        componentProps: {
            type: 'daterange',
            valueFormat: 'YYYY-MM-DD HH:mm:ss',
            startPlaceholder: '开始时间',
            endPlaceholder: '结束时间',
            style: { width: '220px' }
        }
    },
    {
        field: 'allocationType',
        label: '分配类型',
        component: 'Select',
        componentProps: {
            placeholder: '请选择分配类型',
            clearable: true,
            options: allocationTypeOptions,
            style: { width: '220px' }
        }
    },
    {
        field: 'assignMode',
        label: '分配方式',
        component: 'Select',
        componentProps: {
            placeholder: '请选择分配方式',
            clearable: true,
            options: assignModeOptions,
            style: { width: '220px' }
        }
    },
    {
        field: 'feedbackStatus',
        label: '反馈状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择反馈状态',
            clearable: true,
            options: feedbackStatusOptions,
            style: { width: '220px' }
        }
    },
    {
        field: 'minOrderCount',
        label: '报名次数起',
        value: null,
        component: 'InputNumber',
        componentProps: { min: 0, controlsPosition: 'right', style: { width: '220px' } }
    },
    {
        field: 'maxOrderCount',
        label: '报名次数止',
        value: null,
        component: 'InputNumber',
        componentProps: { min: 0, controlsPosition: 'right', style: { width: '220px' } }
    },
    {
        field: 'creator',
        label: '创建人',
        component: 'Input',
        componentProps: { placeholder: '请输入创建人', clearable: true, style: { width: '220px' } }
    },
    {
        field: 'createTimeRange',
        label: '创建时间',
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
    getListApi: async (params) =>
        await ClueApi.getCluePage({ ...(params as ClueApi.CluePageReqVO) })
})

const buildPageParams = (params: SearchParams = {}): ClueApi.CluePageReqVO => ({
    customer: params.customer || undefined,
    mobile: params.mobile || undefined,
    areaId: params.areaId,
    status: params.status,
    tagId: params.tagId,
    complaintTagId: params.complaintTagId,
    consultProjectId: params.consultProjectId,
    clueSourceId: params.clueSourceId,
    intentLevel: params.intentLevel,
    wechat: params.wechat || undefined,
    qq: params.qq || undefined,
    currentOwnerId: params.currentOwnerId,
    beginAllocationTime: params.allocationTimeRange?.[0],
    endAllocationTime: params.allocationTimeRange?.[1],
    allocationType: params.allocationType,
    assignMode: params.assignMode,
    feedbackStatus: params.feedbackStatus,
    minOrderCount: params.minOrderCount,
    maxOrderCount: params.maxOrderCount,
    creator: params.creator || undefined,
    beginCreateTime: params.createTimeRange?.[0],
    endCreateTime: params.createTimeRange?.[1]
})

const buildRegionText = (row: ClueApi.ClueVO) => {
    const regions = [row.province, row.city, row.district].filter(Boolean)
    return regions.length ? regions.join(' / ') : row.areaName || '--'
}

const buildTagText = (row: ClueApi.ClueVO) => (row.tagNames?.length ? row.tagNames.join('、') : '-')
const buildComplaintTagText = (row: ClueApi.ClueVO) =>
    row.complaintTagNames?.length ? row.complaintTagNames.join('、') : '-'

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'customerId', label: '客户ID', width: '130px' },
    {
        field: 'mobile',
        label: '联系电话',
        minWidth: '150px',
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
    { field: 'intentLevelName', label: '意向度', width: '100px' },
    {
        field: 'feedbackStatus',
        label: '反馈状态',
        width: '100px',
        slots: {
            default: (data) => (
                <span>
                    {feedbackStatusOptions.find((item) => item.value === data.row.feedbackStatus)
                        ?.label || '-'}
                </span>
            )
        }
    },
    {
        field: 'name',
        label: '姓名',
        width: '130px',
        fixed: 'left',
        slots: {
            default: (data) => (
                <div class="flex items-center gap-8px">
                    <el-avatar size={32} src={data.row.avatar}>
                        {(data.row.name || '线').slice(0, 1)}
                    </el-avatar>
                    <el-link
                        underline={false}
                        type="primary"
                        onClick={() => openDetail(data.row.id!)}
                    >
                        {data.row.name || '-'}
                    </el-link>
                </div>
            )
        }
    },
    { field: 'wechat', label: '微信', width: '130px' },
    { field: 'qq', label: 'QQ', width: '120px' },
    { field: 'clueSourceName', label: '来源', width: '130px' },
    { field: 'assignModeName', label: '分配方式', width: '120px' },
    { field: 'currentOwnerName', label: '归属人', width: '110px' },
    {
        field: 'region',
        label: '地区',
        minWidth: '160px',
        slots: { default: (data) => <span>{buildRegionText(data.row)}</span> }
    },
    { field: 'educationName', label: '学历', width: '100px' },
    { field: 'statusName', label: '客户状态', width: '110px' },
    {
        field: 'tagNames',
        label: '标签',
        minWidth: '150px',
        slots: { default: (data) => <span>{buildTagText(data.row)}</span> }
    },
    {
        field: 'complaintTagNames',
        label: '投诉标签',
        minWidth: '150px',
        slots: { default: (data) => <span>{buildComplaintTagText(data.row)}</span> }
    },
    { field: 'consultProjectName', label: '咨询项目', minWidth: '140px' },
    { field: 'createTime', label: '创建时间', minWidth: '170px', formatter: dateFormatter },
    {
        field: 'creatorName',
        label: '创建人',
        width: '120px',
        slots: {
            default: (data) => <span>{data.row.creatorName || data.row.creator || '--'}</span>
        }
    },
    {
        field: 'action',
        label: '操作',
        width: '170px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <>
                    <BaseButton link type="primary" onClick={() => openDetail(data.row.id)}>
                        详情
                    </BaseButton>
                    <BaseButton link type="primary" onClick={() => openEnroll(data.row.id)}>
                        报名
                    </BaseButton>
                </>
            )
        }
    }
])

const flattenAreas = (nodes: any[] = [], parents: string[] = []): AreaOption[] => {
    return nodes.flatMap((node) => {
        const path = [...parents, node.name]
        const current = node.id ? [{ label: path.join(' / '), value: Number(node.id) }] : []
        return current.concat(flattenAreas(node.children || [], path))
    })
}

const updateSchemaOptions = (field: string, options: { label: string; value: number }[]) => {
    const target = searchSchema.find((item) => item.field === field)
    if (target?.componentProps) {
        target.componentProps.options = options
    }
}

const loadComplaintTagOptions = async () => {
    const complaintTags = await ComplaintTagApi.getComplaintTagSimpleList()
    complaintTagOptions.value = (complaintTags || []).map((item) => ({
        label: item.name,
        value: Number(item.id)
    }))
}

const loadOptions = async () => {
    const [areas, users, sources, tagGroups, complaintTags] = await Promise.all([
        AreaApi.getAreaTree(),
        UserApi.getSimpleUserList(),
        ClueSourceApi.getEnabledClueSourceList(),
        TagGroupApi.getTagGroupList(),
        ComplaintTagApi.getComplaintTagSimpleList()
    ])

    areaOptions.value = flattenAreas(areas || [])
    userOptions.value = (users || []).map((item) => ({
        label: item.nickname || item.username,
        value: item.id
    }))
    clueSourceOptions.value = (sources || []).map((item) => ({
        label: item.name,
        value: Number(item.id)
    }))
    tagOptions.value = (tagGroups || []).flatMap((group) =>
        (group.tags || []).map((tag) => ({
            label: `${group.name} / ${tag.name}`,
            value: Number(tag.id)
        }))
    )
    complaintTagOptions.value = (complaintTags || []).map((item) => ({
        label: item.name,
        value: Number(item.id)
    }))

    updateSchemaOptions('areaId', areaOptions.value)
    updateSchemaOptions('currentOwnerId', userOptions.value)
    updateSchemaOptions('clueSourceId', clueSourceOptions.value)
    updateSchemaOptions('tagId', tagOptions.value)
    updateSchemaOptions('complaintTagId', complaintTagOptions.value)
}

const handleSelectionChange = (rows: ClueApi.ClueVO[]) => {
    selectionList.value = rows || []
}

const setSearchParams = (params: SearchParams) => {
    currentSearchParams.value = { ...params }
    tableMethods.setSearchParams(buildPageParams(params))
}

const openExportDialog = () => {
    exportDialogRef.value?.open({
        title: '导出名片查询',
        bizType: 'crm_clue_page_export',
        submit: async (payload) => {
            await ClueApi.createClueExportTask({
                ...buildPageParams(currentSearchParams.value),
                ...payload
            })
        }
    })
}

const handleExportSuccess = async () => {
    message.success('导出任务已创建，请到下载中心查看')
}

const openDetail = (id: number) => {
    detailRef.value?.open(id)
}

const openEnroll = async (id: number) => {
    const detail = await ClueApi.getClue(id)
    enrollRef.value?.open(detail)
}

const openForm = (type: 'create' | 'update', id?: number) => {
    formRef.value?.open(type, id)
}

const resetTableSelection = async () => {
    selectionList.value = []
    await tableMethods.clearSelection()
    await nextTick()
    await tableMethods.clearSelection()
}

const handleBatchUpdateAssignMode = async () => {
    await ClueApi.batchUpdateClueAssignMode({
        clueIds: selectionList.value.map((item) => Number(item.id)),
        assignMode: assignModeForm.assignMode
    })
    message.success('修改分配方式成功')
    assignModeDialogVisible.value = false
    await resetTableSelection()
    await tableMethods.getList()
    await resetTableSelection()
}

const handleBatchSilent = async () => {
    if (!silentForm.silentReason.trim()) {
        message.warning('请输入静默原因')
        return
    }
    await ClueApi.batchSilentClue({
        clueIds: selectionList.value.map((item) => Number(item.id)),
        silentReason: silentForm.silentReason.trim(),
        silentDays: Number(silentForm.silentDays),
        remark: silentForm.remark.trim() || undefined
    })
    message.success('批量静默成功')
    silentDialogVisible.value = false
    silentForm.silentReason = ''
    silentForm.silentDays = 7
    silentForm.remark = ''
    await resetTableSelection()
    await tableMethods.getList()
    await resetTableSelection()
}

const handleBatchTag = async () => {
    if (!tagForm.tagIds.length) {
        message.warning('请选择标签')
        return
    }
    await ClueApi.batchAppendClueTags({
        clueIds: selectionList.value.map((item) => Number(item.id)),
        tagIds: tagForm.tagIds
    })
    message.success('批量打标签成功')
    tagDialogVisible.value = false
    tagForm.tagIds = []
    await resetTableSelection()
    await tableMethods.getList()
    await resetTableSelection()
}

const openSmsDialog = () => {
    smsDialogRef.value?.open(selectionList.value.map((item) => Number(item.id)))
}

const handleSmsSuccess = async () => {
    await resetTableSelection()
    await tableMethods.getList()
    await resetTableSelection()
}

const openComplaintTagDialog = () => {
    complaintTagForm.complaintTagIds = []
    loadComplaintTagOptions()
    complaintTagDialogVisible.value = true
}

const handleBatchComplaintTag = async () => {
    if (!complaintTagForm.complaintTagIds.length) {
        message.warning('请选择投诉标签')
        return
    }
    await ClueApi.batchAppendComplaintTags({
        clueIds: selectionList.value.map((item) => Number(item.id)),
        complaintTagIds: complaintTagForm.complaintTagIds
    })
    message.success('批量打投诉标签成功')
    complaintTagDialogVisible.value = false
    complaintTagForm.complaintTagIds = []
    await resetTableSelection()
    await tableMethods.getList()
    await resetTableSelection()
}

const openMergeDialog = () => {
    if (selectionList.value.length !== 2) {
        message.warning('请选择两条线索进行合并')
        return
    }
    mergeKeepClueId.value = selectionList.value[0].id
    mergeDialogVisible.value = true
}

const handleMerge = async ({
    keepClueId,
    mergedClueId,
    remark,
    mergedData
}: {
    keepClueId: number
    mergedClueId: number
    remark?: string
    mergedData: ClueApi.ClueMergeDataReqVO
}) => {
    const keepId = Number(keepClueId)
    const mergedId = Number(mergedClueId)
    if (!keepId || !mergedId) {
        message.warning('请选择保留线索')
        return
    }
    await ClueApi.mergeClue({
        keepClueId: keepId,
        mergedClueId: mergedId,
        remark,
        mergedData
    })
    message.success('线索合并成功')
    mergeDialogVisible.value = false
    await resetTableSelection()
    await tableMethods.getList()
    await resetTableSelection()
}

const handleImport = async () => {
    if (!importFileList.value.length) {
        message.warning('请先选择导入文件')
        return
    }
    importLoading.value = true
    try {
        const formData = new FormData()
        formData.append('file', importFileList.value[0].raw as Blob)
        await ClueApi.importClues(formData)
        message.success('导入任务已提交')
        importDialogVisible.value = false
        importFileList.value = []
    } finally {
        importLoading.value = false
    }
}

const openComplaintImportDialog = () => {
    complaintImportDialogRef.value?.open()
}

onMounted(async () => {
    await loadOptions()
    tableMethods.getList()
})
</script>
