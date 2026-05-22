<template>
    <ContentWrap>
        <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams">
            <template #levelCode="form">
                <UserLevelSelect
                    v-model="form.levelCode"
                    placeholder="请选择用户等级"
                    style="width: 220px"
                />
            </template>
        </Search>
        <div class="mb-10px flex items-center justify-between px-15px">
            <BaseButton v-if="canCreate" type="primary" @click="openForm('create')"
                >新增</BaseButton
            >
            <span class="text-14px text-[var(--el-text-color-secondary)]">
                权重修改将会次日生效，为避免影响您的使用，请提前修改。
            </span>
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

    <Dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
        <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
            <el-form-item label="用户等级" prop="levelCode">
                <UserLevelSelect
                    v-model="formData.levelCode"
                    placeholder="请选择用户等级"
                    style="width: 100%"
                />
            </el-form-item>
            <el-form-item label="权重" prop="weight">
                <el-input-number
                    v-model="formData.weight"
                    :min="0"
                    :max="10000"
                    :precision="0"
                    style="width: 100%"
                    controls-position="right"
                    placeholder="请输入权重"
                />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
                <el-input
                    v-model="formData.remark"
                    clearable
                    maxlength="255"
                    show-word-limit
                    type="textarea"
                    :rows="3"
                    placeholder="请输入备注"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button type="primary" :loading="submitLoading" @click="handleSubmit"
                >确 定</el-button
            >
            <el-button @click="dialogVisible = false">取 消</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import type { FormSchema } from '@/types/form'
import { Search } from '@/components/Search'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { Table, type TableColumn } from '@/components/Table'
import { hasPermission } from '@/directives/permission/hasPermi'
import { useTable } from '@/hooks/web/useTable'
import * as AllocationWeightApi from '@/api/crm/allocation/weight'
import UserLevelSelect from '@/components/UserLevelSelect.vue'

defineOptions({ name: 'CrmAllocationWeight' })

const message = useMessage()
const canCreate = hasPermission(['crm:allocation-weight-config:create'])
const canUpdate = hasPermission(['crm:allocation-weight-config:update'])
const canDelete = hasPermission(['crm:allocation-weight-config:delete'])

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'levelCode',
        label: '用户等级',
        component: 'Input',
        componentProps: {
            clearable: true,
            style: { width: '220px' }
        }
    },
    {
        field: 'levelName',
        label: '等级名称',
        component: 'Input',
        componentProps: {
            clearable: true,
            placeholder: '请输入等级名称',
            style: { width: '240px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<AllocationWeightApi.AllocationWeightConfigVO>({
    getListApi: async (params) => await AllocationWeightApi.getAllocationWeightConfigPage(params),
    delListApi: async (id) => await AllocationWeightApi.deleteAllocationWeightConfig(Number(id))
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(params)
}

const dialogVisible = ref(false)
const submitLoading = ref(false)
const formType = ref<'create' | 'update'>('create')
const formRef = ref()
const formData = reactive({
    id: undefined as number | undefined,
    levelCode: '',
    weight: undefined as number | undefined,
    remark: ''
})

const formRules = reactive({
    levelCode: [{ required: true, message: '用户等级不能为空', trigger: 'change' }],
    weight: [{ required: true, message: '权重不能为空', trigger: 'change' }]
})

const dialogTitle = computed(() =>
    formType.value === 'create' ? '新增用户等级权重' : '修改用户等级权重'
)

const resetForm = () => {
    formData.id = undefined
    formData.levelCode = ''
    formData.weight = undefined
    formData.remark = ''
    formRef.value?.resetFields()
}

const openForm = async (
    type: 'create' | 'update',
    row?: AllocationWeightApi.AllocationWeightConfigVO
) => {
    formType.value = type
    dialogVisible.value = true
    resetForm()
    if (type === 'update' && row?.id) {
        const detail = await AllocationWeightApi.getAllocationWeightConfig(row.id)
        formData.id = detail.id
        formData.levelCode = detail.levelCode || ''
        formData.weight = detail.weight
        formData.remark = detail.remark || ''
    }
}

const handleSubmit = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return
    submitLoading.value = true
    try {
        const payload: AllocationWeightApi.AllocationWeightConfigVO = {
            id: formData.id,
            levelCode: formData.levelCode,
            weight: Number(formData.weight || 0),
            remark: formData.remark?.trim() || ''
        }
        if (formType.value === 'create') {
            await AllocationWeightApi.createAllocationWeightConfig(payload)
            message.success('新增成功')
        } else {
            await AllocationWeightApi.updateAllocationWeightConfig(payload)
            message.success('修改成功')
        }
        dialogVisible.value = false
        await tableMethods.getList()
    } finally {
        submitLoading.value = false
    }
}

const handleDelete = async (id?: number) => {
    if (!id) return
    await tableMethods.delList(id, false)
}

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'id', label: 'ID', width: '80px' },
    { field: 'levelName', label: '用户等级', width: '140px' },
    { field: 'weight', label: '权重', width: '120px' },
    {
        field: 'remark',
        label: '备注',
        minWidth: '220px',
        slots: { default: (data) => <span>{data.row.remark || '-'}</span> }
    },
    {
        field: 'createTime',
        label: '创建时间',
        minWidth: '170px',
        formatter: (row: any, column: any, value: any) => dateFormatter(row, column, value)
    },
    {
        field: 'updateTime',
        label: '更新时间',
        minWidth: '170px',
        formatter: (row: any, column: any, value: any) => dateFormatter(row, column, value)
    },
    {
        field: 'updater',
        label: '更新人',
        width: '120px',
        slots: { default: (data) => <span>{data.row.updaterName || data.row.updater || '-'}</span> }
    },
    {
        field: 'action',
        label: '操作',
        width: '160px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <>
                    {canUpdate ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => openForm('update', data.row)}
                        >
                            修改
                        </BaseButton>
                    ) : null}
                    {canDelete ? (
                        <BaseButton link type="danger" onClick={() => handleDelete(data.row.id)}>
                            删除
                        </BaseButton>
                    ) : null}
                </>
            )
        }
    }
])

onMounted(() => {
    tableMethods.getList()
})
</script>
