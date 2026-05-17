<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :filterable="filterable"
    :disabled="disabled || !corpId"
    :loading="loading"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-option
      v-for="item in options"
      :key="item.userId"
      :label="item.name"
      :value="item.userId"
    >
      <div class="staff-option">
        <el-avatar v-if="item.avatar" :size="24" :src="item.avatar" />
        <div v-else class="staff-fallback">{{ item.name.slice(0, 1) }}</div>
        <span>{{ item.name }}</span>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import * as WeworkContactApi from '@/api/crm/wework/contact'

defineOptions({ name: 'WeworkStaffSelect' })

const props = withDefaults(
  defineProps<{
    modelValue?: string
    corpId?: string
    clearable?: boolean
    filterable?: boolean
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    modelValue: '',
    corpId: '',
    clearable: true,
    filterable: true,
    disabled: false,
    placeholder: '请选择成员'
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const loading = ref(false)
const options = ref<WeworkContactApi.WeworkMemberSimpleVO[]>([])

const loadOptions = async () => {
  if (!props.corpId) {
    options.value = []
    return
  }
  loading.value = true
  try {
    options.value = await WeworkContactApi.getWeworkMemberSimpleList(props.corpId)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.corpId,
  (corpId, previousCorpId) => {
    const changedBetweenValidCorps =
      !!previousCorpId && !!corpId && corpId !== previousCorpId
    if (changedBetweenValidCorps) {
      emit('update:modelValue', '')
    }
    loadOptions()
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.staff-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.staff-fallback {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #d8f0ff;
  color: #176b87;
  font-size: 12px;
  font-weight: 600;
}
</style>
