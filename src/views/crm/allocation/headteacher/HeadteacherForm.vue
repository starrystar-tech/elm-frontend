<template>
    <Dialog :title="dialogTitle" v-model="dialogVisible" width="620px">
        <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="100px"
            v-loading="formLoading"
        >
            <el-form-item label="项目" prop="projectId">
                <el-tree-select
                    v-model="formData.projectId"
                    :data="projectOptions"
                    :props="treeProps"
                    node-key="id"
                    check-strictly
                    filterable
                    clearable
                    default-expand-all
                    placeholder="请选择项目"
                    style="width: 100%"
                />
            </el-form-item>
            <el-form-item label="班主任" prop="headteacherUserId">
                <HeadteacherSelect v-model="formData.headteacherUserId" />
            </el-form-item>
            <el-form-item label="负责类型" prop="scopeType">
                <el-radio-group v-model="formData.scopeType">
                    <el-radio :label="HEADTEACHER_SCOPE_TYPE.ALL">全公司</el-radio>
                    <el-radio :label="HEADTEACHER_SCOPE_TYPE.DEPT">指定部门</el-radio>
                    <el-radio :label="HEADTEACHER_SCOPE_TYPE.AREA">指定区域</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item
                v-if="formData.scopeType === HEADTEACHER_SCOPE_TYPE.DEPT"
                label="负责部门"
                prop="scopeValueIds"
            >
                <el-tree-select
                    v-model="formData.scopeValueIds"
                    :data="deptOptions"
                    :props="treeProps"
                    node-key="id"
                    multiple
                    filterable
                    check-strictly
                    default-expand-all
                    placeholder="请选择部门"
                    style="width: 100%"
                />
            </el-form-item>
            <el-form-item
                v-if="formData.scopeType === HEADTEACHER_SCOPE_TYPE.AREA"
                label="负责区域"
                prop="scopeValueIds"
            >
                <AreaSelect
                    v-model="formData.scopeValueIds"
                    multiple
                    :include-all-node="false"
                    placeholder="请选择区域"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button type="primary" :loading="formLoading" @click="submitForm">确 定</el-button>
            <el-button @click="dialogVisible = false">取 消</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import * as HeadteacherApi from '@/api/crm/allocation/headteacher'
import * as ProductCategoryApi from '@/api/crm/product/category'
import * as DeptApi from '@/api/system/dept'
import { handleTree } from '@/utils/tree'
import AreaSelect from '@/components/AreaSelect.vue'
import HeadteacherSelect from '@/views/common/HeadteacherSelect.vue'

defineOptions({ name: 'CrmHeadteacherAllocationForm' })

const message = useMessage()
const { t } = useI18n()

const emit = defineEmits(['success'])

const HEADTEACHER_SCOPE_TYPE = HeadteacherApi.HEADTEACHER_SCOPE_TYPE

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref<'create' | 'update'>('create')
const formRef = ref()

const projectOptions = ref<any[]>([])
const deptOptions = ref<any[]>([])

const treeProps = {
    value: 'id',
    label: 'name',
    children: 'children'
}

const createDefaultFormData = (): HeadteacherApi.HeadteacherAllocationSaveReqVO => ({
    id: undefined,
    projectId: undefined,
    headteacherUserId: undefined,
    scopeType: HEADTEACHER_SCOPE_TYPE.ALL,
    scopeValueIds: []
})

const formData = ref<HeadteacherApi.HeadteacherAllocationSaveReqVO>(createDefaultFormData())

const validateScopeValueIds = (_rule: any, value: number[], callback: (error?: Error) => void) => {
    if (formData.value.scopeType === HEADTEACHER_SCOPE_TYPE.ALL) {
        callback()
        return
    }
    if (Array.isArray(value) && value.length > 0) {
        callback()
        return
    }
    callback(
        new Error(
            formData.value.scopeType === HEADTEACHER_SCOPE_TYPE.DEPT
                ? '请选择负责部门'
                : '请选择负责区域'
        )
    )
}

const formRules = reactive({
    projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
    headteacherUserId: [{ required: true, message: '请选择班主任', trigger: 'change' }],
    scopeType: [{ required: true, message: '请选择负责类型', trigger: 'change' }],
    scopeValueIds: [{ validator: validateScopeValueIds, trigger: 'change' }]
})

watch(
    () => formData.value.scopeType,
    (value, oldValue) => {
        if (value !== oldValue) {
            formData.value.scopeValueIds = []
        }
    }
)

const loadOptions = async () => {
    const [projectList, depts] = await Promise.all([
        ProductCategoryApi.getProductCategorySimpleList(),
        DeptApi.getSimpleDeptList()
    ])
    projectOptions.value = projectList || []
    deptOptions.value = handleTree(depts || [])
}

const open = async (type: 'create' | 'update', id?: number) => {
    dialogVisible.value = true
    dialogTitle.value = type === 'create' ? '新增班主任分配' : '编辑班主任分配'
    formType.value = type
    resetForm()
    formLoading.value = true
    try {
        await loadOptions()
        if (type === 'update' && id) {
            const detail = await HeadteacherApi.getHeadteacherAllocation(id)
            formData.value = {
                id: detail.id,
                projectId: detail.projectId,
                headteacherUserId: detail.headteacherUserId,
                scopeType: detail.scopeType,
                scopeValueIds: detail.scopeValueIds || []
            }
        }
    } finally {
        formLoading.value = false
    }
}

defineExpose({ open })

const submitForm = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return
    formLoading.value = true
    try {
        const payload: HeadteacherApi.HeadteacherAllocationSaveReqVO = {
            ...formData.value,
            scopeValueIds:
                formData.value.scopeType === HEADTEACHER_SCOPE_TYPE.ALL
                    ? []
                    : (formData.value.scopeValueIds || []).map((item) => Number(item))
        }
        if (formType.value === 'create') {
            await HeadteacherApi.createHeadteacherAllocation(payload)
            message.success(t('common.createSuccess'))
        } else {
            await HeadteacherApi.updateHeadteacherAllocation(payload)
            message.success(t('common.updateSuccess'))
        }
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}

const resetForm = () => {
    formData.value = createDefaultFormData()
    formRef.value?.resetFields()
}
</script>
