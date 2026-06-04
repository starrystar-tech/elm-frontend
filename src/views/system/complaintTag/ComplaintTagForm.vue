<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="标签名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入标签名称" clearable maxlength="64" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number
          v-model="formData.sort"
          :min="0"
          :max="9999"
          controls-position="right"
          style="width: 100%"
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
import * as ComplaintTagApi from '@/api/system/complaintTag'

defineOptions({ name: 'SystemComplaintTagForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formRef = ref()

const formData = ref<ComplaintTagApi.ComplaintTagVO>({
  id: undefined,
  name: '',
  sort: 0
})

const formRules = reactive({
  name: [
    { required: true, message: '标签名称不能为空', trigger: 'blur' },
    { max: 64, message: '标签名称不能超过 64 个字符', trigger: 'blur' }
  ],
  sort: [{ required: true, message: '排序不能为空', trigger: 'change' }]
})

const resetForm = () => {
  formData.value = {
    id: undefined,
    name: '',
    sort: 0
  }
  formRef.value?.resetFields()
}

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()

  if (id) {
    formLoading.value = true
    try {
      formData.value = await ComplaintTagApi.getComplaintTag(id)
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
    const data = formData.value as ComplaintTagApi.ComplaintTagVO
    if (formType.value === 'create') {
      await ComplaintTagApi.createComplaintTag(data)
      message.success(t('common.createSuccess'))
    } else {
      await ComplaintTagApi.updateComplaintTag(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
