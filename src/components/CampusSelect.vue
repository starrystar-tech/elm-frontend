<template>
    <el-select
        v-model="innerValue"
        filterable
        clearable
        :placeholder="placeholder"
        style="width: 100%"
        @change="handleChange"
    >
        <el-option v-for="item in options" :key="item.id" :label="item.name" :value="item.id" />
    </el-select>
</template>

<script setup lang="ts">
import * as CampusApi from '@/api/system/campus'

defineOptions({ name: 'CampusSelect' })

const props = defineProps<{
    modelValue?: number
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | undefined): void
    (e: 'change', value: CampusApi.CampusVO | undefined): void
}>()

const innerValue = ref<number | undefined>(props.modelValue)
const options = ref<CampusApi.CampusVO[]>([])

watch(
    () => props.modelValue,
    (value) => {
        innerValue.value = value
    },
    { immediate: true }
)

const loadOptions = async () => {
    options.value = (await CampusApi.getSimpleCampusList()) || []
}

const handleChange = (value: number | undefined) => {
    emit('update:modelValue', value)
    emit('change', options.value.find((item) => item.id === value))
}

onMounted(() => {
    loadOptions()
})

const placeholder = computed(() => props.placeholder || '请选择校区')
</script>
