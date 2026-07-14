<template>
    <el-select
        v-model="model"
        class="province-select"
        filterable
        clearable
        :disabled="disabled"
        :placeholder="placeholder"
    >
        <el-option
            v-for="item in provinceOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
        />
    </el-select>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import * as AreaApi from '@/api/system/area'

defineOptions({ name: 'ProvinceSelect' })

const props = withDefaults(
    defineProps<{
        modelValue?: string
        placeholder?: string
        disabled?: boolean
    }>(),
    {
        placeholder: '请选择省份',
        disabled: false
    }
)

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const provinceOptions = ref<{ label: string; value: string }[]>([])

const model = computed({
    get: () => props.modelValue || '',
    set: (value: string) => emit('update:modelValue', value || '')
})

const resolveProvinceNodes = (nodes: any[] = []) => {
    const rootNode = nodes.find((item) =>
        ['中国', '全国', '全球'].includes(String(item?.name || '').trim())
    )
    if (rootNode?.children?.length) {
        return rootNode.children
    }
    return nodes
}

const loadProvinces = async () => {
    const areaTree = await AreaApi.getAreaTree()
    const provinceNodes = resolveProvinceNodes(Array.isArray(areaTree) ? areaTree : [])
    provinceOptions.value = provinceNodes
        .map((item) => String(item?.name || '').trim())
        .filter(Boolean)
        .filter((name, index, list) => list.indexOf(name) === index)
        .map((name) => ({ label: name, value: name }))
}

onMounted(loadProvinces)
</script>

<style scoped>
.province-select {
    width: 100%;
}
</style>
