<template>
    <Dialog v-model="dialogVisible" title="编辑学员" width="520px">
        <el-form
            ref="formRef"
            v-loading="formLoading"
            :model="formData"
            :rules="formRules"
            label-width="100px"
        >
            <el-form-item label="户籍省份">
                <ProvinceSelect
                    v-model="formData.householdProvince"
                    placeholder="请选择户籍省份"
                />
            </el-form-item>
            <el-form-item label="报考省份">
                <ProvinceSelect
                    v-model="formData.applyProvince"
                    placeholder="请选择报考省份"
                />
            </el-form-item>
            <el-form-item label="服务状态">
                <el-select
                    v-model="formData.serviceStatus"
                    clearable
                    placeholder="请选择服务状态"
                    class="w-1/1"
                >
                    <el-option
                        v-for="item in StudentCenterApi.STUDENT_SERVICE_STATUS_OPTIONS"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="开课状态">
                <el-select
                    v-model="formData.courseStatus"
                    clearable
                    placeholder="请选择开课状态"
                    class="w-1/1"
                >
                    <el-option
                        v-for="item in StudentCenterApi.STUDENT_COURSE_STATUS_OPTIONS"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="学员备注" prop="studentRemark">
                <el-input
                    v-model="formData.studentRemark"
                    type="textarea"
                    :rows="4"
                    maxlength="512"
                    show-word-limit
                    placeholder="请输入学员备注"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="formLoading" @click="submitForm">确定</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import * as StudentCenterApi from '@/api/crm/studentCenter'
import ProvinceSelect from '@/components/ProvinceSelect.vue'

defineOptions({ name: 'StudentEditForm' })

const emit = defineEmits<{
    success: []
}>()

const message = useMessage()
const dialogVisible = ref(false)
const formLoading = ref(false)
const formRef = ref()
const formData = reactive<StudentCenterApi.StudentCenterUpdateReqVO>({
    id: 0,
    householdProvince: '',
    applyProvince: '',
    serviceStatus: undefined,
    courseStatus: undefined,
    studentRemark: ''
})

const formRules = reactive({
    studentRemark: [{ max: 512, message: '学员备注长度不能超过512个字符', trigger: 'blur' }]
})

const open = (row: StudentCenterApi.StudentCenterPageRespVO) => {
    formData.id = Number(row.orderId)
    formData.householdProvince = row.householdProvince || ''
    formData.applyProvince = row.applyProvince || ''
    formData.serviceStatus =
        row.serviceStatus === null || row.serviceStatus === undefined
            ? undefined
            : Number(row.serviceStatus)
    formData.courseStatus =
        row.courseStatus === null || row.courseStatus === undefined
            ? undefined
            : Number(row.courseStatus)
    formData.studentRemark = row.studentRemark || ''
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate?.())
}

const submitForm = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return
    formLoading.value = true
    try {
        await StudentCenterApi.updateStudent({
            id: formData.id,
            householdProvince: formData.householdProvince?.trim() || '',
            applyProvince: formData.applyProvince?.trim() || '',
            serviceStatus: formData.serviceStatus,
            courseStatus: formData.courseStatus,
            studentRemark: formData.studentRemark?.trim() || ''
        })
        message.success('保存成功')
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}

defineExpose({ open })
</script>
