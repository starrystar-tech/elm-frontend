<template>
    <div class="panel-wrap">
        <Search
            :schema="searchSchema"
            :model="searchForm"
            @reset="handleResetSearch"
            @search="handleSearch"
        />

        <div class="mb-12px flex items-center justify-end gap-12px flex-wrap action-btn-wrap">
            <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">
                + 新增公海共享
            </BaseButton>
        </div>

        <Table
            v-model:currentPage="tableObject.currentPage"
            v-model:pageSize="tableObject.pageSize"
            :columns="tableColumns"
            :data="tableObject.tableList"
            :loading="tableObject.loading"
            :pagination="{ total: tableObject.total }"
            row-key="id"
            @register="tableRegister"
        />

        <Dialog
            v-model="dialogVisible"
            :title="isEdit ? '修改公海共享' : '新增公海共享'"
            width="600px"
            :fullscreen="false"
            append-to-body
        >
            <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
                <el-form-item label="选择部门" prop="ownerDeptIds">
                    <el-select
                        v-model="form.ownerDeptIds"
                        multiple
                        clearable
                        filterable
                        placeholder="请选择部门"
                        :disabled="isEdit"
                    >
                        <el-option
                            v-for="item in deptOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="公海类型" prop="seaTypes">
                    <el-select
                        v-model="form.seaTypes"
                        multiple
                        clearable
                        placeholder="请选择公海类型"
                        :disabled="isEdit"
                    >
                        <el-option label="首咨公海" :value="1" />
                        <el-option label="复购公海" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item label="共享部门" prop="sharedDeptIds">
                    <el-select
                        v-model="form.sharedDeptIds"
                        multiple
                        clearable
                        filterable
                        placeholder="请选择共享部门"
                    >
                        <el-option
                            v-for="item in deptOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="客户来源" prop="clueSourceIds">
                    <el-select
                        v-model="form.clueSourceIds"
                        multiple
                        clearable
                        filterable
                        placeholder="请选择客户来源"
                    >
                        <el-option
                            v-for="item in sourceOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="项目" prop="consultProjectIds">
                    <el-select
                        v-model="form.consultProjectIds"
                        multiple
                        clearable
                        filterable
                        placeholder="请选择项目"
                    >
                        <el-option
                            v-for="item in projectOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="地域" prop="areaIds">
                    <AreaSelector v-model="form.areaIds" multiple />
                </el-form-item>
                <el-form-item label="状态">
                    <el-radio-group v-model="form.status">
                        <el-radio :value="0">启用</el-radio>
                        <el-radio :value="1">停用</el-radio>
                    </el-radio-group>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue'
import { hasPermission } from '@/directives/permission/hasPermi'
import { useTable } from '@/hooks/web/useTable'
import { Table, type TableColumn } from '@/components/Table'
import { Search } from '@/components/Search'
import { BaseButton } from '@/components/Button'
import AreaSelector from '@/components/AreaSelector.vue'
import type { FormSchema } from '@/types/form'
import * as PoolShareApi from '@/api/crm/poolshare'
import * as DeptApi from '@/api/system/dept'
import * as ClueSourceApi from '@/api/system/clueSource'
import * as ProductCategoryApi from '@/api/crm/product/category'
import * as AreaApi from '@/api/system/area'

defineOptions({ name: 'PoolShareRuleTab' })

interface SearchParams {
    ownerDeptId?: number
    sharedDeptId?: number
    seaType?: number
    consultProjectId?: number
    clueSourceId?: number
    areaId?: number
}

interface Form {
    id?: number
    ownerDeptIds: number[]
    seaTypes: number[]
    sharedDeptIds: number[]
    clueSourceIds: number[]
    consultProjectIds: number[]
    areaIds: number[]
    status: number
}

const message = useMessage()
const canCreate = hasPermission(['crm:clue-pool-share-rule:create'])
const canUpdate = hasPermission(['crm:clue-pool-share-rule:update'])
const canDelete = hasPermission(['crm:clue-pool-share-rule:delete'])

const saving = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const searchForm = reactive<SearchParams>({})
const form = reactive<Form>({
    ownerDeptIds: [],
    seaTypes: [],
    sharedDeptIds: [],
    clueSourceIds: [],
    consultProjectIds: [],
    areaIds: [],
    status: 0
})

const deptOptions = ref<{ label: string; value: number }[]>([])
const sourceOptions = ref<{ label: string; value: number }[]>([])
const projectOptions = ref<{ label: string; value: number }[]>([])
const areaOptions = ref<{ label: string; value: number }[]>([])

const seaTypeOptions = [
    { label: '首咨公海', value: 1 },
    { label: '复购公海', value: 2 }
]

const rules = reactive({
    ownerDeptIds: [{ required: true, message: '请选择部门', trigger: 'change' }],
    seaTypes: [{ required: true, message: '请选择公海类型', trigger: 'change' }],
    sharedDeptIds: [{ required: true, message: '请选择共享部门', trigger: 'change' }]
})

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'ownerDeptId',
        label: '部门',
        component: 'Select',
        componentProps: {
            placeholder: '请选择部门',
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px', minWidth: '220px' }
        }
    },
    {
        field: 'sharedDeptId',
        label: '共享部门',
        component: 'Select',
        componentProps: {
            placeholder: '请选择共享部门',
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px', minWidth: '220px' }
        }
    },
    {
        field: 'seaType',
        label: '公海类型',
        component: 'Select',
        componentProps: {
            placeholder: '请选择公海类型',
            clearable: true,
            options: seaTypeOptions,
            style: { width: '220px', minWidth: '220px' }
        }
    },
    {
        field: 'consultProjectId',
        label: '项目',
        component: 'Select',
        componentProps: {
            placeholder: '请选择项目',
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px', minWidth: '220px' }
        }
    },
    {
        field: 'clueSourceId',
        label: '来源',
        component: 'Select',
        componentProps: {
            placeholder: '请选择来源',
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px', minWidth: '220px' }
        }
    },
    {
        field: 'areaId',
        label: '地域',
        component: 'Select',
        componentProps: {
            placeholder: '请选择地域',
            clearable: true,
            filterable: true,
            options: [],
            style: { width: '220px', minWidth: '220px' }
        }
    }
])

const buildPageParams = (
    params: SearchParams = {}
): PoolShareApi.CrmCluePoolShareRulePageReqVO => ({
    ownerDeptId: params.ownerDeptId,
    sharedDeptId: params.sharedDeptId,
    seaType: params.seaType,
    consultProjectId: params.consultProjectId,
    clueSourceId: params.clueSourceId,
    areaId: params.areaId
})

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<PoolShareApi.CrmCluePoolShareRuleRespVO>({
    getListApi: async (params) =>
        await PoolShareApi.getCluePoolShareRulePage({
            ...(params as PoolShareApi.CrmCluePoolShareRulePageReqVO)
        }),
    defaultParams: buildPageParams(searchForm)
})

const tableColumns = reactive<TableColumn[]>([
    {
        field: 'ownerDeptName',
        label: '部门',
        minWidth: '150px'
    },
    {
        field: 'status',
        label: '状态',
        width: '100px',
        slots: {
            default: (data) => (
                <el-tag type={data.row.status === 0 ? 'success' : 'danger'}>
                    {data.row.status === 0 ? '启用' : '禁用'}
                </el-tag>
            )
        }
    },
    {
        field: 'seaType',
        label: '公海类型',
        width: '120px',
        slots: {
            default: (data) => <span>{data.row.seaType === 1 ? '首咨公海' : '复购公海'}</span>
        }
    },
    {
        field: 'sharedDeptNames',
        label: '共享部门',
        minWidth: '200px',
        slots: {
            default: (data) => <span>{data.row.sharedDeptNames?.join(',') || '--'}</span>
        }
    },
    {
        field: 'clueSourceNames',
        label: '来源',
        minWidth: '120px',
        slots: {
            default: (data) => <span>{data.row.clueSourceNames?.join(',') || '--'}</span>
        }
    },
    {
        field: 'consultProjectNames',
        label: '项目',
        minWidth: '120px',
        slots: {
            default: (data) => <span>{data.row.consultProjectNames?.join(',') || '--'}</span>
        }
    },
    {
        field: 'areaNames',
        label: '地域',
        minWidth: '120px',
        slots: {
            default: (data) => <span>{data.row.areaNames?.join(',') || '--'}</span>
        }
    },
    {
        field: 'action',
        label: '操作',
        width: '180px',
        fixed: 'right',
        slots: {
            default: (data) => {
                const row = data.row as PoolShareApi.CrmCluePoolShareRuleRespVO
                return (
                    <>
                        {canUpdate ? (
                            <BaseButton link type="primary" onClick={() => handleEdit(row)}>
                                修改
                            </BaseButton>
                        ) : null}
                        {canUpdate ? (
                            <BaseButton link type="primary" onClick={() => handleToggleStatus(row)}>
                                {row.status === 0 ? '禁用' : '启用'}
                            </BaseButton>
                        ) : null}
                        {canDelete ? (
                            <BaseButton link type="danger" onClick={() => handleDelete(row)}>
                                删除
                            </BaseButton>
                        ) : null}
                    </>
                )
            }
        }
    }
])

const buildDeptOptions = (data: DeptApi.DeptVO[] = []): { label: string; value: number }[] => {
    const result: { label: string; value: number }[] = []
    const build = (items: any[], prefix = '') => {
        items.forEach((item) => {
            if (item.id !== undefined) {
                result.push({ label: `${prefix}${item.name}`, value: Number(item.id) })
                if (item?.children?.length) {
                    build(item.children, `${prefix}${item.name}/`)
                }
            }
        })
    }
    build(data)
    return result
}

const buildSourceOptions = (
    data: ClueSourceApi.ClueSourceVO[] = []
): { label: string; value: number }[] => {
    return data
        .filter((item) => item.id !== undefined)
        .map((item) => ({ label: item.name, value: Number(item.id) }))
}

const buildProjectOptions = (
    data: ProductCategoryApi.ProductCategoryVO[] = []
): { label: string; value: number }[] => {
    return data
        .filter((item) => item.id !== undefined)
        .map((item) => ({ label: item.name, value: Number(item.id) }))
}

const buildAreaOptions = (data: any[] = []): { label: string; value: number }[] => {
    const result: { label: string; value: number }[] = []
    const walk = (nodes: any[], prefix = '') => {
        nodes.forEach((item) => {
            if (item.id !== undefined) {
                result.push({ label: `${prefix}${item.name}`, value: Number(item.id) })
                if (item.children && item.children.length) {
                    walk(item.children, `${prefix}${item.name}/`)
                }
            }
        })
    }
    walk(data)
    return result
}

const updateSchemaOptions = (field: string, options: { label: string; value: number }[]) => {
    const target = searchSchema.find((item) => item.field === field)
    if (target?.componentProps) {
        target.componentProps.options = options
    }
}

const loadOptions = async () => {
    const [deptData, sourceData, projectData, areaData] = await Promise.all([
        DeptApi.getSimpleDeptList(),
        ClueSourceApi.getEnabledClueSourceList(),
        ProductCategoryApi.getProductCategorySimpleList(),
        AreaApi.getAreaTree()
    ])
    deptOptions.value = buildDeptOptions(deptData)
    sourceOptions.value = buildSourceOptions(sourceData)
    projectOptions.value = buildProjectOptions(projectData)
    areaOptions.value = buildAreaOptions(areaData)

    updateSchemaOptions('ownerDeptId', deptOptions.value)
    updateSchemaOptions('sharedDeptId', deptOptions.value)
    updateSchemaOptions('consultProjectId', projectOptions.value)
    updateSchemaOptions('clueSourceId', sourceOptions.value)
    updateSchemaOptions('areaId', areaOptions.value)
}

const handleSearch = (params: SearchParams) => {
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
            searchForm[key as keyof SearchParams] = value as never
        }
    })
    tableMethods.setSearchParams(buildPageParams(searchForm))
}

const handleResetSearch = () => {
    Object.keys(searchForm).forEach((key) => {
        delete searchForm[key as keyof SearchParams]
    })
    tableMethods.setSearchParams(buildPageParams())
}

const resetForm = () => {
    Object.assign(form, {
        id: undefined,
        ownerDeptIds: [],
        seaTypes: [],
        sharedDeptIds: [],
        clueSourceIds: [],
        consultProjectIds: [],
        areaIds: [],
        status: 0
    })
}

const openForm = (type: 'create' | 'update', id?: number) => {
    isEdit.value = type === 'update'
    resetForm()
    if (type === 'update' && id) {
        loadFormData(id)
    }
    dialogVisible.value = true
}

const loadFormData = async (id: number) => {
    const data = await PoolShareApi.getCluePoolShareRule(id)
    Object.assign(form, {
        id: data.id,
        ownerDeptIds: data.ownerDeptId ? [data.ownerDeptId] : [],
        seaTypes: data.seaType ? [data.seaType] : [],
        sharedDeptIds: [...(data.sharedDeptIds || [])],
        clueSourceIds: [...(data.clueSourceIds || [])],
        consultProjectIds: [...(data.consultProjectIds || [])],
        areaIds: [...(data.areaIds || [])],
        status: data.status
    })
}

const handleEdit = async (row: PoolShareApi.CrmCluePoolShareRuleRespVO) => {
    openForm('update', row.id)
}

const handleToggleStatus = async (row: PoolShareApi.CrmCluePoolShareRuleRespVO) => {
    const newStatus = row.status === 0 ? 1 : 0
    const action = newStatus === 0 ? '启用' : '禁用'
    await ElMessageBox.confirm(`确认${action}该共享规则吗？`, action, { type: 'warning' })
    await PoolShareApi.updateCluePoolShareRuleStatus({ id: row.id, status: newStatus })
    message.success(`${action}成功`)
    await tableMethods.getList()
}

const handleDelete = async (row: PoolShareApi.CrmCluePoolShareRuleRespVO) => {
    await ElMessageBox.confirm('确认删除该共享规则吗？', '删除', { type: 'warning' })
    await PoolShareApi.deleteCluePoolShareRule(row.id)
    message.success('删除成功')
    await tableMethods.getList()
}

const handleSave = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return

    saving.value = true
    try {
        if (isEdit.value && form.id) {
            const payload: PoolShareApi.CrmCluePoolShareRuleUpdateReqVO = {
                id: form.id,
                ownerDeptId: form.ownerDeptIds[0] || 0,
                seaType: form.seaTypes[0] || 0,
                sharedDeptIds: form.sharedDeptIds,
                clueSourceIds: form.clueSourceIds.length ? form.clueSourceIds : undefined,
                consultProjectIds: form.consultProjectIds.length
                    ? form.consultProjectIds
                    : undefined,
                areaIds: form.areaIds.length ? form.areaIds : undefined
            }
            await PoolShareApi.updateCluePoolShareRule(payload)
        } else {
            const payload: PoolShareApi.CrmCluePoolShareRuleCreateReqVO = {
                ownerDeptIds: form.ownerDeptIds,
                status: form.status,
                seaTypes: form.seaTypes,
                sharedDeptIds: form.sharedDeptIds,
                clueSourceIds: form.clueSourceIds.length ? form.clueSourceIds : undefined,
                consultProjectIds: form.consultProjectIds.length
                    ? form.consultProjectIds
                    : undefined,
                areaIds: form.areaIds.length ? form.areaIds : undefined
            }
            await PoolShareApi.createCluePoolShareRule(payload)
        }
        message.success(isEdit.value ? '修改成功' : '新增成功')
        dialogVisible.value = false
        await tableMethods.getList()
    } finally {
        saving.value = false
    }
}

onMounted(async () => {
    await loadOptions()
    tableMethods.getList()
})
</script>

<style scoped>
.panel-wrap {
    padding: 8px 6px;
}
</style>
