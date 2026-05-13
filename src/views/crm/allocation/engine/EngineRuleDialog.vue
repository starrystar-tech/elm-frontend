<template>
  <Dialog v-model="dialogVisible" :title="title" width="560px">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
      <el-form-item label="来源" prop="sourceCode">
        <SourceSelect v-model="formData.sourceCode" placeholder="请选择来源" style="width: 100%" />
      </el-form-item>
      <el-form-item label="项目" prop="projectCode">
        <ProjectSelect v-model="formData.projectCode" placeholder="请选择项目" style="width: 100%" />
      </el-form-item>
      <el-form-item label="地区" prop="regionId">
        <AreaSelect v-model="formData.regionId" :data="areaTree" placeholder="请选择地区" style="width: 100%" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
      <el-button @click="dialogVisible = false">取消</el-button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import SourceSelect from '@/views/common/components/SourceSelect.vue'
import ProjectSelect from '@/views/common/components/ProjectSelect.vue'
import AreaSelect from '@/views/common/components/AreaSelect.vue'

const props = defineProps<{
  modelValue: boolean
  title: string
  areaTree: any[]
  value?: Recordable
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', value: Recordable): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const formRef = ref()
const formData = reactive<Recordable>({
  sourceCode: '',
  projectCode: '',
  regionId: undefined
})

const formRules = {
  sourceCode: [{ required: true, message: '来源不能为空', trigger: 'change' }],
  projectCode: [{ required: true, message: '项目不能为空', trigger: 'change' }],
  regionId: [{ required: true, message: '地区不能为空', trigger: 'change' }]
}

const resetFormData = () => {
  Object.assign(formData, {
    sourceCode: props.value?.sourceCode || '',
    projectCode: props.value?.projectCode || '',
    regionId: props.value?.regionId
  })
}

const handleSubmit = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  emit('confirm', { ...formData })
  dialogVisible.value = false
}

watch(
  () => [props.modelValue, props.value],
  ([visible]) => {
    if (!visible) return
    resetFormData()
  },
  { immediate: true, deep: true }
)
</script>

