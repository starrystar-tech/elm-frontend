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
                <el-form-item label="选择部门" prop="ownerDeptId">
                    <DeptSelector
                        v-model="form.ownerDeptId"
                        :include-root="false"
                        :disabled="isEdit"
                    />
                </el-form-item>
                <el-form-item label="公海类型" prop="seaType">
                    <el-select
                        v-model="form.seaType"
                        clearable
                        placeholder="请选择公海类型"
                        :disabled="isEdit"
                    >
                        <el-option label="首咨公海" :value="1" />
                        <el-option label="复购公海" :value="2" />
                    </el-select>
                </el-form-item>
                <el-form-item label="共享部门" prop="sharedDeptIds">
                    <DeptSelector v-model="form.sharedDeptIds" multiple :include-root="false" />
                </el-form-item>
                <el-form-item label="客户来源" prop="clueSourceIds">
                    <SourceSelect
                        v-model="form.clueSourceIds"
                        multiple
                        use-id
                        :show-all-option="false"
                    />
                </el-form-item>
                <el-form-item label="项目" prop="consultProjectIds">
                    <ProductTypeSelect v-model="form.consultProjectIds" multiple />
                </el-form-item>
                <el-form-item label="地域" prop="areaIds">
                    <AreaSelect v-model="form.areaIds" multiple />
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
import AreaSelect from '@/components/AreaSelect.vue'
import ProductTypeSelect from '@/components/ProductTypeSelect.vue'
import DeptSelector from '@/views/system/dept/components/DeptSelector.vue'
import SourceSelect from '@/components/SourceSelect.vue'
import type { FormSchema } from '@/types/form'
import * as PoolShareApi from '@/api/crm/poolshare'

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
    ownerDeptId?: number
    seaType?: number
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
    ownerDeptId: undefined,
    seaType: undefined,
    sharedDeptIds: [],
    clueSourceIds: [],
    consultProjectIds: [],
    areaIds: [],
    status: 0
})

const seaTypeOptions = [
    { label: '首咨公海', value: 1 },
    { label: '复购公海', value: 2 }
]

const rules = reactive({
    ownerDeptId: [{ required: true, message: '请选择部门', trigger: 'change' }],
    seaType: [{ required: true, message: '请选择公海类型', trigger: 'change' }],
    sharedDeptIds: [{ required: true, message: '请选择共享部门', trigger: 'change' }]
})

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'ownerDeptId',
        label: '部门',
        component: 'DeptSelector',
        componentProps: {
            placeholder: '请选择部门',
            style: { width: '220px', minWidth: '220px' }
        }
    },
    {
        field: 'sharedDeptId',
        label: '共享部门',
        component: 'DeptSelector',
        componentProps: {
            placeholder: '请选择共享部门',
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
        component: 'ProductTypeSelect',
        componentProps: {
            placeholder: '请选择项目',
            style: { width: '220px', minWidth: '220px' }
        }
    },
    {
        field: 'clueSourceId',
        label: '来源',
        component: 'SourceSelect',
        componentProps: {
            useId: true,
            style: { width: '220px', minWidth: '220px' }
        }
    },
    {
        field: 'areaId',
        label: '地域',
        component: 'AreaSelect',
        componentProps: {
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
        ownerDeptId: undefined,
        seaType: undefined,
        sharedDeptIds: [],
        clueSourceIds: [],
        consultProjectIds: [],
        areaIds: [],
        status: 0
    })
}

const normalizeIdList = (values: number[]) => {
    return [...new Set((values || []).filter((value) => Number(value) > 0))]
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
        ownerDeptId: data.ownerDeptId,
        seaType: data.seaType,
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
        const ownerDeptIds = form.ownerDeptId ? [form.ownerDeptId] : []
        const seaTypes = form.seaType ? [form.seaType] : []
        const sharedDeptIds = normalizeIdList(form.sharedDeptIds)
        const clueSourceIds = normalizeIdList(form.clueSourceIds)
        const consultProjectIds = normalizeIdList(form.consultProjectIds)
        const areaIds = [...new Set((form.areaIds || []).filter((value) => Number(value) !== 0))]
        if (!ownerDeptIds.length) {
            message.error('请选择部门')
            return
        }
        if (!sharedDeptIds.length) {
            message.error('请选择共享部门')
            return
        }
        if (!seaTypes.length) {
            message.error('请选择公海类型')
            return
        }
        if (isEdit.value && form.id) {
            const payload: PoolShareApi.CrmCluePoolShareRuleUpdateReqVO = {
                id: form.id,
                ownerDeptId: ownerDeptIds[0],
                ownerDeptIds,
                seaType: seaTypes[0],
                seaTypes,
                sharedDeptIds,
                status: form.status,
                clueSourceIds: clueSourceIds.length ? clueSourceIds : undefined,
                consultProjectIds: consultProjectIds.length ? consultProjectIds : undefined,
                areaIds: areaIds.length ? areaIds : undefined
            }
            await PoolShareApi.updateCluePoolShareRule(payload)
        } else {
            const payload: PoolShareApi.CrmCluePoolShareRuleCreateReqVO = {
                ownerDeptIds,
                status: form.status,
                seaTypes,
                sharedDeptIds,
                clueSourceIds: clueSourceIds.length ? clueSourceIds : undefined,
                consultProjectIds: consultProjectIds.length ? consultProjectIds : undefined,
                areaIds: areaIds.length ? areaIds : undefined
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

onMounted(() => {
    tableMethods.getList()
})
</script>

<style scoped>
.panel-wrap {
    padding: 8px 6px;
}
</style>
