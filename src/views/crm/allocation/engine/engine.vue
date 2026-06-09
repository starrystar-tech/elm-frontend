<template>
    <div>
        <Search
            :schema="engineSearchSchema"
            :model="engineSearchForm"
            @search="setEngineSearchParams"
            @reset="setEngineSearchParams"
        >
            <template #callGroupId>
                <CallGroupSelect
                    v-model="engineSearchForm.callGroupId"
                    placeholder="请选择呼叫组"
                    style="width: 220px"
                />
            </template>
            <template #sourceCode>
                <SourceSelect
                    v-model="engineSearchForm.sourceCode"
                    placeholder="请选择来源"
                    style="width: 220px"
                />
            </template>
            <template #projectCode>
                <ProjectSelect
                    v-model="engineSearchForm.projectCode"
                    placeholder="请选择项目"
                    style="width: 220px"
                />
            </template>
            <template #regionId>
                <AreaSelect
                    v-model="engineSearchForm.regionId"
                    :data="areaTree"
                    placeholder="请选择地区"
                    style="width: 220px"
                />
            </template>
        </Search>

        <BaseButton
            type="primary"
            v-hasPermi="['system:allocation-engine:update']"
            @click="openEngineForm('create')"
        >
            新增引擎
        </BaseButton>
        <Table
            v-model:currentPage="engineTableObject.currentPage"
            v-model:pageSize="engineTableObject.pageSize"
            :columns="engineColumns"
            :data="engineTableObject.tableList"
            :loading="engineTableObject.loading"
            :pagination="{ total: engineTableObject.total }"
            @register="engineTableRegister"
        />

        <EngineForm
            v-model="engineDialogVisible"
            :title="engineDialogTitle"
            :loading="engineSaving"
            :form-data="engineForm"
            :rules="engineRules"
            :user-level-options="userLevelOptions"
            :area-tree="areaTree"
            @submit="saveEngine"
        />
    </div>
</template>

<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue'
import { Search } from '@/components/Search'
import { BaseButton } from '@/components/Button'
import { Table, type TableColumn } from '@/components/Table'
import { getStrDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import type { FormSchema } from '@/types/form'
import { useTable } from '@/hooks/web/useTable'
import { hasPermission } from '@/directives/permission/hasPermi'
import * as EngineApi from '@/api/system/allocation/engine'
import * as AreaApi from '@/api/system/area'
import * as ProductCategoryApi from '@/api/crm/product/category'
import EngineForm from './EngineForm.vue'
import SourceSelect from '@/components/SourceSelect.vue'
import CallGroupSelect from '@/components/CallGroupSelect.vue'
import ProjectSelect from '@/components/ProjectSelect.vue'
import AreaSelect from '@/components/AreaSelect.vue'
import { findPath } from '@/utils/tree'

const message = useMessage()
const userLevelOptions = getStrDictOptions('crm_allocation_user_level')

const engineSearchSchema = reactive<FormSchema[]>([
    {
        field: 'engineName',
        label: '引擎名称',
        component: 'Input',
        componentProps: {
            clearable: true,
            placeholder: '请输入引擎名称',
            style: { width: '220px' }
        }
    },
    {
        field: 'status',
        label: '状态',
        component: 'Select',
        componentProps: {
            clearable: true,
            placeholder: '请选择状态',
            options: [
                { label: '启用', value: 0 },
                { label: '停用', value: 1 }
            ],
            style: { width: '220px' }
        }
    },
    {
        field: 'callGroupId',
        label: '呼叫组',
        component: 'Input',
        componentProps: {
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'sourceCode',
        label: '来源',
        component: 'Input',
        componentProps: {
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'projectCode',
        label: '项目',
        component: 'Input',
        componentProps: {
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'regionId',
        label: '地区',
        component: 'Input',
        componentProps: {
            clearable: true,
            style: { width: '220px' }
        }
    }
])

const {
    tableObject: engineTableObject,
    tableMethods: engineTableMethods,
    register: engineTableRegister
} = useTable<EngineApi.AllocationEngineVO>({
    getListApi: async (params) => await EngineApi.getAllocationEnginePage(params)
})

const engineSearchForm = reactive({
    engineName: '',
    status: undefined as number | undefined,
    callGroupId: undefined as number | undefined,
    sourceCode: '',
    projectCode: '',
    regionId: undefined as number | undefined
})

const normalizeRegionId = (value: unknown): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined
    if (Array.isArray(value)) {
        const last = value[value.length - 1]
        const numberValue = Number(last)
        return Number.isFinite(numberValue) ? numberValue : undefined
    }
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : undefined
}

const setEngineSearchParams = (params: Recordable = {}) => {
    const mergedParams = {
        ...engineSearchForm,
        ...params
    }
    const regionId = normalizeRegionId(mergedParams.regionId)
    engineTableMethods.setSearchParams({
        ...mergedParams,
        regionId
    })
}

const areaTree = ref<any[]>([])
const projectNameMap = ref<Record<string, string>>({})

const dedupeTexts = (values: Array<string | undefined | null>) =>
    Array.from(new Set(values.map((item) => String(item || '').trim()).filter(Boolean)))

const formatRegionName = (regionId?: number) => {
    if (!regionId) return ''
    const path = findPath(
        areaTree.value || [],
        (node: any) => Number(node?.id) === Number(regionId)
    ) as any[] | null
    const names = Array.isArray(path)
        ? path
              .filter((item) => Number(item?.id) !== -1)
              .map((item) => item?.name)
              .filter(Boolean)
        : []
    return names.length ? names.join(' / ') : String(regionId)
}

const formatRuleText = (
    row: EngineApi.AllocationEngineVO,
    field: 'sourceCode' | 'projectCode' | 'regionId'
) => {
    const rules = row.rules || []
    if (!rules.length) return '--'
    if (field === 'sourceCode') {
        const texts = dedupeTexts(rules.map((item) => item.sourceCode))
        return texts.length ? texts.join('、') : '--'
    }
    if (field === 'projectCode') {
        const texts = dedupeTexts(
            rules.map((item) => projectNameMap.value[item.projectCode] || item.projectCode)
        )
        return texts.length ? texts.join('、') : '--'
    }
    const texts = dedupeTexts(rules.map((item) => formatRegionName(item.regionId)))
    return texts.length ? texts.join('、') : '--'
}

const engineColumns = computed<TableColumn[]>(() => [
    { field: 'engineName', label: '引擎名称', minWidth: '160px' },
    {
        field: 'status',
        label: '状态',
        width: '90px',
        slots: {
            default: (data) => (
                <el-tag type={data.row.status === 0 ? 'success' : 'info'}>
                    {data.row.status === 0 ? '启用' : '停用'}
                </el-tag>
            )
        }
    },
    { field: 'callGroupNames', label: '呼叫组', minWidth: '180px' },
    {
        field: 'sourceCode',
        label: '来源',
        minWidth: '180px',
        formatter: (_row: EngineApi.AllocationEngineVO) => formatRuleText(_row, 'sourceCode')
    },
    {
        field: 'projectCode',
        label: '项目',
        minWidth: '180px',
        formatter: (_row: EngineApi.AllocationEngineVO) => formatRuleText(_row, 'projectCode')
    },
    {
        field: 'regionId',
        label: '地区',
        minWidth: '220px',
        formatter: (_row: EngineApi.AllocationEngineVO) => formatRuleText(_row, 'regionId')
    },
    {
        field: 'updateTime',
        label: '更新时间',
        minWidth: '170px',
        formatter: (row: any, column: any, value: any) => dateFormatter(row, column, value)
    },
    {
        field: 'action',
        label: '操作',
        width: '170px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <>
                    {hasPermission(['system:allocation-engine:update']) ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => openEngineForm('update', data.row)}
                        >
                            修改
                        </BaseButton>
                    ) : null}
                    {hasPermission(['system:allocation-engine:update']) ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => toggleEngineStatus(data.row)}
                        >
                            {data.row.status === 0 ? '停用' : '启用'}
                        </BaseButton>
                    ) : null}
                </>
            )
        }
    }
])

const engineDialogVisible = ref(false)
const engineDialogTitle = ref('新增分配引擎')
const engineSaving = ref(false)
const engineForm = reactive<EngineApi.AllocationEngineVO>({
    engineName: '',
    status: 1,
    timeRangeType: 'unlimited',
    startTime: undefined,
    endTime: undefined,
    callGroupIdList: [],
    applicableLevelList: [],
    enableWeightLimit: false,
    weightLimits: [],
    rules: [],
    remark: ''
})

const engineRules = reactive({
    engineName: [{ required: true, message: '引擎名称不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
    timeRangeType: [{ required: true, message: '分配时间范围类型不能为空', trigger: 'change' }],
    callGroupIdList: [{ required: true, message: '呼叫组不能为空', trigger: 'change' }],
    applicableLevelList: [{ required: true, message: '适用等级不能为空', trigger: 'change' }],
    enableWeightLimit: [{ required: true, message: '是否配置权重上限不能为空', trigger: 'change' }]
})

const loadEngineMeta = async () => {
    if (!areaTree.value.length) areaTree.value = await AreaApi.getAreaTree()
    if (!Object.keys(projectNameMap.value).length) {
        const list = (await ProductCategoryApi.getProductCategorySimpleList()) || []
        projectNameMap.value = Object.fromEntries(
            (list as ProductCategoryApi.ProductCategoryVO[])
                .filter((item) => Number(item.parentId) === 0)
                .map((item) => [item.code, item.name])
        )
    }
}

const resetEngineForm = () => {
    Object.assign(engineForm, {
        id: undefined,
        engineName: '',
        status: 1,
        timeRangeType: 'unlimited',
        startTime: undefined,
        endTime: undefined,
        callGroupIdList: [],
        applicableLevelList: [],
        enableWeightLimit: false,
        weightLimits: [],
        rules: [],
        remark: ''
    })
}

const openEngineForm = async (type: 'create' | 'update', row?: EngineApi.AllocationEngineVO) => {
    await loadEngineMeta()
    engineDialogTitle.value = type === 'create' ? '新增分配引擎' : '修改分配引擎'
    engineDialogVisible.value = true
    resetEngineForm()
    if (type === 'update' && row?.id) {
        const detail = await EngineApi.getAllocationEngine(row.id)
        Object.assign(engineForm, detail)
        engineForm.callGroupIdList = detail.callGroupIdList || []
        engineForm.applicableLevelList = detail.applicableLevelList || []
        engineForm.weightLimits = detail.weightLimits || []
        engineForm.rules = detail.rules || []
    }
}

const saveEngine = async (payload: Recordable) => {
    engineSaving.value = true
    try {
        const submitData = {
            ...payload,
            rules: (payload.rules || []).filter(
                (i: any) => i.sourceCode && i.projectCode && i.regionId
            ),
            weightLimits: payload.enableWeightLimit ? payload.weightLimits || [] : []
        }
        if (payload.id) {
            await EngineApi.updateAllocationEngine(submitData)
            message.success('修改成功')
        } else {
            await EngineApi.createAllocationEngine(submitData)
            message.success('新增成功')
        }
        engineDialogVisible.value = false
        await engineTableMethods.getList()
    } finally {
        engineSaving.value = false
    }
}

const toggleEngineStatus = async (row: EngineApi.AllocationEngineVO) => {
    await EngineApi.updateAllocationEngineStatus({ id: row.id!, status: row.status === 1 ? 0 : 1 })
    message.success(row.status === 0 ? '停用成功' : '启用成功')
    await engineTableMethods.getList()
}

onMounted(async () => {
    await Promise.all([engineTableMethods.getList(), loadEngineMeta()])
})
</script>
