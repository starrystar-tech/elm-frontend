<template>
    <Dialog v-model="dialogVisible" :title="dialogTitle + '签约公司'" width="720px">
        <el-form
            ref="formRef"
            v-loading="formLoading"
            :model="formData"
            :rules="formRules"
            label-width="150px"
        >
            <el-form-item label="公司全称" prop="companyFullName">
                <el-input
                    v-model="formData.companyFullName"
                    placeholder="请输入公司全称"
                    clearable
                />
            </el-form-item>
            <el-form-item label="公司简称" prop="companyShortName">
                <el-input
                    v-model="formData.companyShortName"
                    placeholder="请输入公司简称"
                    clearable
                />
            </el-form-item>
            <el-form-item label="统一社会信用代码" prop="unifiedSocialCreditCode">
                <el-input
                    v-model="formData.unifiedSocialCreditCode"
                    placeholder="请输入统一社会信用代码"
                    clearable
                />
            </el-form-item>
            <el-form-item label="法定代表人" prop="legalRepresentative">
                <el-input
                    v-model="formData.legalRepresentative"
                    placeholder="请输入法定代表人"
                    clearable
                />
            </el-form-item>
            <el-form-item label="联系电话" prop="contactPhone">
                <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" clearable />
            </el-form-item>
            <el-form-item label="法大大企业ID" prop="openCorpId">
                <el-input v-model="formData.openCorpId" placeholder="请输入 openCorpId" clearable />
            </el-form-item>
            <el-form-item label="注册地址" prop="registeredAddress">
                <el-input
                    v-model="formData.registeredAddress"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入注册地址"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="dialogVisible = false">取 消</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import * as SignCompanyApi from '@/api/system/contract/signCompany'

defineOptions({ name: 'CompanyForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref<'create' | 'update'>('create')
const formRef = ref()

const initFormData = (): Partial<SignCompanyApi.ContractSignCompanyVO> => ({
    id: undefined,
    companyFullName: '',
    companyShortName: '',
    unifiedSocialCreditCode: '',
    legalRepresentative: '',
    registeredAddress: '',
    contactPhone: '',
    openCorpId: ''
})

const formData = ref<Partial<SignCompanyApi.ContractSignCompanyVO>>(initFormData())

const formRules = reactive({
    companyFullName: [{ required: true, message: '公司全称不能为空', trigger: 'blur' }],
    companyShortName: [{ required: true, message: '公司简称不能为空', trigger: 'blur' }],
    unifiedSocialCreditCode: [
        { required: true, message: '统一社会信用代码不能为空', trigger: 'blur' }
    ]
})

const resetForm = () => {
    formData.value = initFormData()
    formRef.value?.resetFields()
}

const open = async (type: 'create' | 'update', id?: number) => {
    dialogVisible.value = true
    dialogTitle.value = t('action.' + type)
    formType.value = type
    resetForm()
    if (type === 'update' && id) {
        formLoading.value = true
        try {
            formData.value = await SignCompanyApi.getContractSignCompany(id)
        } finally {
            formLoading.value = false
        }
    }
}

const emit = defineEmits(['success'])

const submitForm = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return
    formLoading.value = true
    try {
        if (formType.value === 'create') {
            await SignCompanyApi.createContractSignCompany(formData.value)
            message.success(t('common.createSuccess'))
        } else {
            await SignCompanyApi.updateContractSignCompany(formData.value)
            message.success(t('common.updateSuccess'))
        }
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}

defineExpose({ open })
</script>
