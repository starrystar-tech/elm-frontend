<template>
    <el-select
        :model-value="modelValue"
        :placeholder="placeholder"
        :clearable="clearable"
        :filterable="filterable"
        :loading="loading"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <el-option
            v-for="item in options"
            :key="item.corpId"
            :label="item.label"
            :value="item.corpId"
        />
    </el-select>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as WeappApi from '@/api/system/weapp'

defineOptions({ name: 'WeworkCorpSelect' })

const props = withDefaults(
    defineProps<{
        modelValue?: string
        clearable?: boolean
        filterable?: boolean
        placeholder?: string
    }>(),
    {
        modelValue: '',
        clearable: true,
        filterable: true,
        placeholder: '请选择企业'
    }
)

const emit = defineEmits<{
    'update:modelValue': [value: string]
}>()

const loading = ref(false)
const options = computed(() =>
    corpList.value.map((item) => ({
        corpId: item.corpId,
        label: `${item.companyName || '未命名企业'}`
    }))
)
const corpList = ref<WeappApi.WeappConfigVO[]>([])

const loadOptions = async () => {
    loading.value = true
    try {
        corpList.value = (await WeappApi.getWeappConfigList()).filter(
            (item) => !!item.enabled && !!item.corpId
        )
    } finally {
        loading.value = false
    }
}

onMounted(loadOptions)
</script>
