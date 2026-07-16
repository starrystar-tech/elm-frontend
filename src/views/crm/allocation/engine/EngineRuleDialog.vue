<template>
    <Dialog v-model="dialogVisible" :title="title" width="560px" append-to-body>
        <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
            <el-form-item label="来源" prop="sourceCode">
                <SourceSelect
                    v-model="formData.sourceCode"
                    placeholder="请选择来源"
                    style="width: 100%"
                />
            </el-form-item>
            <el-form-item label="项目" prop="projectCode">
                <ProjectSelect
                    v-model="formData.projectCode"
                    placeholder="请选择项目"
                    style="width: 100%"
                />
            </el-form-item>
            <el-form-item label="地区" prop="regionIds">
                <el-cascader
                    v-model="formData.regionIds"
                    :options="areaOptions"
                    :props="areaCascaderProps"
                    collapse-tags
                    collapse-tags-tooltip
                    show-checked-strategy="parent"
                    placeholder="请选择地区"
                    clearable
                    style="width: 100%"
                />
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
import SourceSelect from '@/components/SourceSelect.vue'
import ProjectSelect from '@/components/ProjectSelect.vue'
import { normalizeAreaIdsToProvinceCity, pruneAreaTreeToProvinceCity } from '@/utils/areaScope'

const props = defineProps<{
    modelValue: boolean
    title: string
    areaTree: any[]
    value?: Recordable
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm', value: Recordable[]): void
}>()

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value)
})

const formRef = ref()
const formData = reactive<Recordable>({
    sourceCode: '',
    projectCode: '',
    regionIds: []
})

const normalizedAreaTree = computed(() =>
    pruneAreaTreeToProvinceCity((props.areaTree || []).filter((item) => Number(item?.id) !== -1))
)

const areaOptions = computed(() => [{ id: -1, name: '全国', children: [] }, ...normalizedAreaTree.value])

const areaCascaderProps = {
    value: 'id',
    label: 'name',
    children: 'children',
    multiple: true,
    checkStrictly: true,
    emitPath: false
}

const formRules = {
    sourceCode: [{ required: true, message: '请选择来源', trigger: 'change' }],
    projectCode: [{ required: true, message: '请选择项目', trigger: 'change' }]
}

const resetFormData = () => {
    const rawRegionIds = Array.isArray(props.value?.regionIds)
        ? props.value.regionIds
        : props.value?.regionId
          ? [props.value.regionId]
          : []
    const regionIds = normalizeAreaIdsToProvinceCity(rawRegionIds, props.areaTree || [])
    Object.assign(formData, {
        sourceCode: props.value?.sourceCode || '',
        projectCode: props.value?.projectCode || '',
        regionIds
    })
}

const handleSubmit = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return
    const regionIds = normalizeAreaIdsToProvinceCity(
        (formData.regionIds || []) as number[],
        props.areaTree || []
    )
    emit(
        'confirm',
        regionIds.length
            ? regionIds.map((regionId: number) => ({
                  sourceCode: formData.sourceCode,
                  projectCode: formData.projectCode,
                  regionId
              }))
            : [
                  {
                      sourceCode: formData.sourceCode,
                      projectCode: formData.projectCode,
                      regionId: undefined
                  }
              ]
    )
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
