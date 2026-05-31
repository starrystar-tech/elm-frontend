<template>
    <el-select
        v-model="innerValue"
        filterable
        clearable
        :placeholder="placeholder"
        style="width: 100%"
        @change="handleChange"
    >
        <el-option
            v-for="item in options"
            :key="item.id"
            :label="item.nickname || item.username"
            :value="item.id"
        />
    </el-select>
</template>

<script setup lang="ts">
import * as HeadteacherApi from '@/api/crm/allocation/headteacher'

defineOptions({ name: 'HeadteacherSelect' })

const props = defineProps<{
    modelValue?: number
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | undefined): void
}>()

const innerValue = ref<number | undefined>(props.modelValue)
const options = ref<HeadteacherApi.HeadteacherUserSimpleVO[]>([])

watch(
    () => props.modelValue,
    (value) => {
        innerValue.value = value
    },
    { immediate: true }
)

const loadOptions = async () => {
    options.value = (await HeadteacherApi.getHeadteacherSimpleList()) || []
}

const handleChange = (value: number | undefined) => {
    emit('update:modelValue', value)
}

onMounted(() => {
    loadOptions()
})

const placeholder = computed(() => props.placeholder || '请选择班主任')
</script>
