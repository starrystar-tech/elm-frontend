<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="620px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="来源名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入来源名称" clearable maxlength="64" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="parseInt(dict.value as any)"
            :label="dict.label"
            :value="parseInt(dict.value as any)"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import * as ClueSourceApi from '@/api/system/clueSource'

defineOptions({ name: 'SystemClueSourceForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formRef = ref()

const formData = ref<ClueSourceApi.ClueSourceVO>({
  id: undefined,
  name: '',
  status: CommonStatusEnum.ENABLE
})

const formRules = reactive({
  name: [
    { required: true, message: '来源名称不能为空', trigger: 'blur' },
    { max: 64, message: '来源名称不能超过 64 个字符', trigger: 'blur' }
  ],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
})

const resetForm = () => {
  formData.value = {
    id: undefined,
    name: '',
    status: CommonStatusEnum.ENABLE
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
      formData.value = await ClueSourceApi.getClueSource(id)
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
    const data = formData.value as ClueSourceApi.ClueSourceVO
    if (formType.value === 'create') {
      await ClueSourceApi.createClueSource(data)
      message.success(t('common.createSuccess'))
    } else {
      await ClueSourceApi.updateClueSource(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
