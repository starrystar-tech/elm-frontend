<template>
    <el-select
        v-model="innerValue"
        filterable
        remote
        reserve-keyword
        clearable
        :remote-method="handleSearch"
        :loading="loading"
        :placeholder="placeholder"
        style="width: 100%"
        @change="handleChange"
    >
        <el-option
            v-for="item in options"
            :key="item.id"
            :label="formatLabel(item)"
            :value="item.id"
        />
    </el-select>
</template>

<script setup lang="ts">
import * as ClueApi from '@/api/crm/clue'

defineOptions({ name: 'ClueSelect' })

const props = defineProps<{
    modelValue?: number
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | undefined): void
}>()

const innerValue = ref<number | undefined>(props.modelValue)
const options = ref<ClueApi.ClueVO[]>([])
const loading = ref(false)

watch(
    () => props.modelValue,
    async (value) => {
        innerValue.value = value
        if (value && !options.value.find((item) => item.id === value)) {
            const detail = await ClueApi.getClue(value)
            if (detail?.id) {
                options.value = [detail, ...options.value]
            }
        }
    },
    { immediate: true }
)

const loadOptions = async (keyword?: string) => {
    loading.value = true
    try {
        const { list = [] } = await ClueApi.getCluePage({
            pageNo: 1,
            pageSize: 20,
            customer: keyword,
            mobile: keyword
        })
        options.value = list || []
    } finally {
        loading.value = false
    }
}

const handleSearch = async (keyword: string) => {
    await loadOptions(keyword?.trim())
}

const handleChange = (value: number | undefined) => {
    emit('update:modelValue', value)
}

const formatLabel = (item: ClueApi.ClueVO) => {
    const parts = [item.name, item.mobile, item.customerId].filter(Boolean)
    return parts.length ? parts.join(' / ') : `线索#${item.id}`
}

onMounted(() => {
    loadOptions()
})

const placeholder = computed(() => props.placeholder || '请选择客户')
</script>
