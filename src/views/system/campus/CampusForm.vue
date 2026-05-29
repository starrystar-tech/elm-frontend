<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="680px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="校区名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入校区名称" clearable />
      </el-form-item>
      <el-form-item label="是否默认" prop="isDefault">
        <el-switch v-model="formData.isDefault" active-text="是" inactive-text="否" />
      </el-form-item>
      <el-form-item label="分配班主任" prop="hasTeacher">
        <el-switch v-model="formData.hasTeacher" active-text="是" inactive-text="否" />
      </el-form-item>
      <el-form-item label="签约公司" prop="contractSignCompanyId">
        <el-select
          v-model="formData.contractSignCompanyId"
          clearable
          filterable
          placeholder="请选择签约公司"
          style="width: 100%"
        >
          <el-option
            v-for="item in signCompanyOptions"
            :key="item.id"
            :label="item.companyShortName || item.companyFullName"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status" clearable placeholder="请选择状态" style="width: 100%">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="parseInt(dict.value as any)"
            :label="dict.label"
            :value="parseInt(dict.value as any)"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          placeholder="请输入备注"
          type="textarea"
          :rows="3"
          clearable
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import * as CampusApi from '@/api/system/campus'
import * as SignCompanyApi from '@/api/system/contract/signCompany'

defineOptions({ name: 'SystemCampusForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formRef = ref()
const signCompanyOptions = ref<SignCompanyApi.ContractSignCompanySimpleVO[]>([])

const formData = ref<CampusApi.CampusVO>({
  id: undefined,
  name: '',
  isDefault: false,
  hasTeacher: true,
  contractSignCompanyId: undefined,
  remark: '',
  status: CommonStatusEnum.ENABLE
})

const formRules = reactive({
  name: [{ required: true, message: '校区名称不能为空', trigger: 'blur' }],
  isDefault: [{ required: true, message: '请选择是否默认校区', trigger: 'change' }],
  hasTeacher: [{ required: true, message: '请选择是否分配班主任', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})

const resetForm = () => {
  formData.value = {
    id: undefined,
    name: '',
    isDefault: false,
    hasTeacher: true,
    contractSignCompanyId: undefined,
    remark: '',
    status: CommonStatusEnum.ENABLE
  }
  formRef.value?.resetFields()
}

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  signCompanyOptions.value = await SignCompanyApi.getSimpleContractSignCompanyList()

  if (id) {
    formLoading.value = true
    try {
      formData.value = await CampusApi.getCampus(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const emit = defineEmits(['success'])
const submitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  formLoading.value = true
  try {
    const data = formData.value as CampusApi.CampusVO
    if (formType.value === 'create') {
      await CampusApi.createCampus(data)
      message.success(t('common.createSuccess'))
    } else {
      await CampusApi.updateCampus(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
