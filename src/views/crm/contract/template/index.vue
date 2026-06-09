<template>
    <ContentWrap>
        <el-tabs v-model="activeTab" class="list-tabs-compact-in-pane">
            <el-tab-pane label="合同模板" name="templates">
                <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
                <div class="action-btn-wrap">
                    <BaseButton v-if="canManage" type="primary" @click="openManageUrl"
                        >模板管理</BaseButton
                    >
                    <BaseButton v-if="canSync" @click="handleSync">同步合同模板</BaseButton>
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
            </el-tab-pane>
            <el-tab-pane label="模板字段" name="fields">
                <Search
                    :schema="fieldSearchSchema"
                    @search="setFieldSearchParams"
                    @reset="setFieldSearchParams"
                />
                <div class="action-btn-wrap">
                    <BaseButton
                        v-if="canVariableCreate"
                        type="primary"
                        plain
                        @click="openVariableForm('create')"
                        >新增模板字段</BaseButton
                    >
                </div>
                <Table
                    v-model:currentPage="fieldTableObject.currentPage"
                    v-model:pageSize="fieldTableObject.pageSize"
                    :columns="fieldTableColumns"
                    :data="fieldTableObject.tableList"
                    :loading="fieldTableObject.loading"
                    :pagination="{ total: fieldTableObject.total }"
                    @register="fieldTableRegister"
                />
            </el-tab-pane>
        </el-tabs>
    </ContentWrap>

    <Dialog v-model="dialogVisible" :title="dialogTitle" width="760px">
        <el-form ref="formRef" v-loading="formLoading" :model="formData" label-width="110px">
            <el-form-item label="模板名称">
                <el-input v-model="formData.templateName" disabled />
            </el-form-item>
            <el-form-item label="模板ID">
                <el-input v-model="formData.templateId" disabled />
            </el-form-item>
            <el-form-item label="模板类型">
                <el-tag>{{
                    formData.templateTypeName || templateTypeText(formData.templateType)
                }}</el-tag>
            </el-form-item>
            <el-form-item label="适用校区">
                <el-select
                    v-model="formData.campusIds"
                    multiple
                    clearable
                    filterable
                    placeholder="请选择适用校区"
                    style="width: 100%"
                >
                    <el-option
                        v-for="item in campusOptions"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id!"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="合同变量">
                <el-select
                    v-model="formData.contractVariableIds"
                    multiple
                    clearable
                    filterable
                    placeholder="请选择合同变量"
                    style="width: 100%"
                >
                    <el-option
                        v-for="item in variableOptions"
                        :key="item.id"
                        :label="item.variableName"
                        :value="item.id!"
                    />
                </el-select>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button :disabled="formLoading" type="primary" @click="submitForm">保 存</el-button>
            <el-button @click="dialogVisible = false">取 消</el-button>
        </template>
    </Dialog>

    <TemplateFieldDialog ref="variableFormRef" @success="handleFieldDialogSuccess" />
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import * as CampusApi from '@/api/system/campus'
import * as VariableApi from '@/api/system/contract/variable'
import * as TemplateApi from '@/api/system/contract/template'
import TemplateFieldDialog from './TemplateFieldDialog.vue'

defineOptions({ name: 'ContractTemplate' })

const canUpdate = hasPermission(['system:contract-template:update'])
const canSync = hasPermission(['system:contract-template:sync'])
const canManage = hasPermission(['system:contract-template:manage'])
const canPreview = hasPermission(['system:contract-template:perview'])
const canVariableCreate = hasPermission(['system:contract-variable:create'])
const canVariableUpdate = hasPermission(['system:contract-variable:update'])
const canVariableDelete = hasPermission(['system:contract-variable:delete'])

const message = useMessage()
const activeTab = ref('templates')

const campusOptions = ref<CampusApi.CampusVO[]>([])
const variableOptions = ref<VariableApi.ContractVariableVO[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('编辑模板')
const formLoading = ref(false)
const formRef = ref()
const variableFormRef = ref<InstanceType<typeof TemplateFieldDialog>>()
const formData = ref<Partial<TemplateApi.ContractTemplateVO>>({})

const templateTypeOptions = [
    { label: '普通合同', value: 1 },
    { label: '解除合同', value: 2 }
]

const templateStatusOptions = [
    { label: '启用', value: 0 },
    { label: '禁用', value: 1 }
]

const templateTypeText = (value?: number) =>
    templateTypeOptions.find((item) => item.value === value)?.label || '-'

const templateStatusText = (value?: number) =>
    templateStatusOptions.find((item) => item.value === value)?.label || '-'

const fieldSearchSchema = computed<FormSchema[]>(() => [
    {
        field: 'variableName',
        label: '名称',
        component: 'Input',
        componentProps: {
            placeholder: '请输入名称',
            clearable: true,
            style: { width: '220px' }
        }
    }
])

const searchSchema = computed<FormSchema[]>(() => [
    {
        field: 'templateName',
        label: '模板名称',
        component: 'Input',
        componentProps: {
            placeholder: '请输入模板名称',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'campusId',
        label: '适用校区',
        component: 'Select',
        componentProps: {
            options: campusOptions.value.map((item) => ({ label: item.name, value: item.id })),
            placeholder: '请选择校区',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'templateType',
        label: '模板类型',
        component: 'Select',
        componentProps: {
            options: templateTypeOptions,
            placeholder: '请选择模板类型',
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'templateStatus',
        label: '模板状态',
        component: 'Select',
        componentProps: {
            options: templateStatusOptions,
            placeholder: '请选择模板状态',
            clearable: true,
            style: { width: '220px' }
        }
    }
])

const {
    tableObject: fieldTableObject,
    tableMethods: fieldTableMethods,
    register: fieldTableRegister
} = useTable<VariableApi.ContractVariableVO>({
    getListApi: async (params) => await VariableApi.getContractVariablePage(params)
})

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<TemplateApi.ContractTemplateVO>({
    getListApi: async (params) => await TemplateApi.getContractTemplatePage(params)
})

const setFieldSearchParams = (params: Recordable) => {
    fieldTableMethods.setSearchParams(params)
}

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(params)
}

const loadBaseOptions = async () => {
    const [campuses, variables] = await Promise.all([
        CampusApi.getSimpleCampusList(),
        VariableApi.getContractVariableList()
    ])
    campusOptions.value = campuses || []
    variableOptions.value = variables || []
}

const openVariableForm = (type: 'create' | 'update', id?: number) => {
    variableFormRef.value?.open(type, id)
}

const handleFieldDialogSuccess = async () => {
    await fieldTableMethods.getList()
    await loadBaseOptions()
}

const handleDeleteVariable = async (id: number) => {
    await message.confirm('确认删除该模板字段吗？')
    await VariableApi.deleteContractVariable(id)
    message.success('删除成功')
    await fieldTableMethods.getList()
    await loadBaseOptions()
}

const openForm = async (id: number) => {
    dialogVisible.value = true
    formLoading.value = true
    try {
        formData.value = await TemplateApi.getContractTemplate(id)
    } finally {
        formLoading.value = false
    }
}

const submitForm = async () => {
    formLoading.value = true
    try {
        await TemplateApi.updateContractTemplate({
            id: formData.value.id,
            templateId: formData.value.templateId,
            templateName: formData.value.templateName,
            templateType: formData.value.templateType,
            campusIds: formData.value.campusIds || [],
            contractVariableIds: formData.value.contractVariableIds || []
        })
        message.success('保存成功')
        dialogVisible.value = false
        await tableMethods.getList()
    } finally {
        formLoading.value = false
    }
}

const handleSync = async () => {
    await TemplateApi.syncContractTemplate()
    message.success('同步成功')
    await tableMethods.getList()
}

const openManageUrl = async () => {
    const url = await TemplateApi.getContractTemplateManageUrl()
    window.open(url, '_blank')
}

const handlePreview = async (templateId: string) => {
    const url = await TemplateApi.getContractTemplatePreviewUrl(templateId)
    window.open(url, '_blank')
}

const fieldTableColumns = reactive<TableColumn[]>([
    { field: 'variableName', label: '名称', minWidth: '260px' },
    {
        field: 'fieldType',
        label: '模板类型',
        minWidth: '120px',
        slots: {
            default: () => '文本'
        }
    },
    {
        field: 'action',
        label: '操作',
        width: '150px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <>
                    {canVariableUpdate ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => openVariableForm('update', data.row.id)}
                        >
                            编辑
                        </BaseButton>
                    ) : null}
                    {canVariableDelete ? (
                        <BaseButton
                            link
                            type="danger"
                            onClick={() => handleDeleteVariable(data.row.id)}
                        >
                            删除
                        </BaseButton>
                    ) : null}
                </>
            )
        }
    }
])

const tableColumns = reactive<TableColumn[]>([
    { field: 'templateName', label: '模板名称', minWidth: '220px' },
    { field: 'templateId', label: '模板ID', minWidth: '160px' },
    {
        field: 'templateType',
        label: '模板类型',
        width: '120px',
        slots: {
            default: (data) => data.row.templateTypeName || templateTypeText(data.row.templateType)
        }
    },
    {
        field: 'templateStatus',
        label: '模板状态',
        width: '100px',
        slots: {
            default: (data) => (
                <el-tag type={data.row.templateStatus === 0 ? 'primary' : 'warning'}>
                    {templateStatusText(data.row.templateStatus)}
                </el-tag>
            )
        }
    },
    {
        field: 'contractVariableNames',
        label: '必填字段',
        minWidth: '220px',
        slots: {
            default: (data) => data.row.contractVariableNames || '-'
        }
    },
    {
        field: 'campusNames',
        label: '校区',
        minWidth: '220px',
        slots: {
            default: (data) => data.row.campusNames || '-'
        }
    },
    { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '180px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <>
                    {canUpdate ? (
                        <BaseButton link type="primary" onClick={() => openForm(data.row.id)}>
                            配置
                        </BaseButton>
                    ) : null}
                    {canPreview ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => handlePreview(data.row.templateId)}
                        >
                            预览
                        </BaseButton>
                    ) : null}
                </>
            )
        }
    }
])

onMounted(async () => {
    await loadBaseOptions()
    await fieldTableMethods.getList()
    await tableMethods.getList()
})
</script>
