<template>
    <Dialog v-model="dialogVisible" :title="title" width="960px">
        <el-form ref="formRef" :model="localForm" :rules="rules" label-width="160px">
            <el-form-item label="引擎名称" prop="engineName">
                <el-input v-model="localForm.engineName" placeholder="请输入引擎名称" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
                <el-radio-group v-model="localForm.status">
                    <el-radio :value="0">启用</el-radio>
                    <el-radio :value="1">停用</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="分配时间范围类型" prop="timeRangeType">
                <el-radio-group
                    v-model="localForm.timeRangeType"
                    @change="changeEngineTimeRangeType"
                >
                    <el-radio value="unlimited">不限</el-radio>
                    <el-radio value="custom">自定义</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item v-if="localForm.timeRangeType === 'custom'" label="分配时间">
                <el-time-picker
                    v-model="localForm.startTime"
                    value-format="HH:mm:ss"
                    placeholder="开始时间"
                />
                <span class="mx-2">至</span>
                <el-time-picker
                    v-model="localForm.endTime"
                    value-format="HH:mm:ss"
                    placeholder="结束时间"
                />
            </el-form-item>
            <el-form-item label="呼叫组" prop="callGroupIdList">
                <CallGroupSelect
                    v-model="localForm.callGroupIdList"
                    multiple
                    placeholder="请选择呼叫组"
                />
            </el-form-item>
            <el-form-item label="适用等级" prop="applicableLevelList">
                <UserLevelSelect
                    v-model="localForm.applicableLevelList"
                    multiple
                    placeholder="请选择等级"
                    style="width: 100%"
                />
            </el-form-item>
            <el-form-item label="是否配置权重上限" prop="enableWeightLimit">
                <el-radio-group
                    v-model="localForm.enableWeightLimit"
                    @change="changeEnableWeightLimit"
                >
                    <el-radio :value="false">否</el-radio>
                    <el-radio :value="true">是</el-radio>
                </el-radio-group>
            </el-form-item>

            <template v-if="localForm.enableWeightLimit">
                <el-form-item
                    v-for="(item, index) in localForm.weightLimits"
                    :key="index"
                    :label="`权重上限 ${index + 1}`"
                >
                    <el-select v-model="item.userLevel" placeholder="用户等级" style="width: 180px">
                        <el-option
                            v-for="dict in userLevelOptions"
                            :key="dict.value"
                            :label="dict.label"
                            :value="dict.value"
                        />
                    </el-select>
                    <el-input-number v-model="item.weight" :min="0" class="mx-2" />
                    <el-input-number v-model="item.allocationLimit" :min="0" />
                    <el-button class="ml-2" @click="removeWeightLimit(index)">删除</el-button>
                </el-form-item>
                <el-form-item>
                    <el-button @click="addWeightLimit">新增权重上限</el-button>
                </el-form-item>
            </template>

            <el-form-item label="规则">
                <el-button type="primary" plain @click="openRuleDialog()">新增规则</el-button>
                <el-table :data="localForm.rules" border class="mt-15px">
                    <el-table-column label="来源" prop="sourceCode" />
                    <el-table-column label="项目" prop="projectName">
                        <template #default="{ row }">
                            {{ formatProjectName(row) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="地区" prop="regionId">
                        <template #default="{ row }">
                            {{ formatRegionName(row.regionId) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="140">
                        <template #default="{ $index, row }">
                            <el-button link type="primary" @click="openRuleDialog(row, $index)"
                                >编辑</el-button
                            >
                            <el-button link type="danger" @click="removeRule($index)"
                                >删除</el-button
                            >
                        </template>
                    </el-table-column>
                </el-table>
            </el-form-item>
            <el-form-item label="备注">
                <el-input
                    v-model="localForm.remark"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入备注"
                />
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button type="primary" :loading="loading" @click="handleSubmit">保存</el-button>
            <el-button @click="dialogVisible = false">取消</el-button>
        </template>
    </Dialog>

    <EngineRuleDialog
        v-model="ruleDialogVisible"
        :title="ruleDialogTitle"
        :area-tree="areaTree"
        :value="editingRule"
        @confirm="confirmRule"
    />
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import CallGroupSelect from '@/components/CallGroupSelect.vue'
import UserLevelSelect from '@/components/UserLevelSelect.vue'
import EngineRuleDialog from './EngineRuleDialog.vue'
import { findPath } from '@/utils/tree'
import * as ProductCategoryApi from '@/api/crm/product/category'

const props = defineProps<{
    modelValue: boolean
    title: string
    loading: boolean
    formData: Recordable
    rules: Recordable
    userLevelOptions: any[]
    areaTree: any[]
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'submit', payload: Recordable): void
}>()

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value)
})

const formRef = ref()
const localForm = ref<Recordable>({})
const ruleDialogVisible = ref(false)
const ruleDialogTitle = ref('新增规则')
const editingRule = ref<Recordable | undefined>(undefined)
const editingRuleIndex = ref<number>(-1)
const projectNameMap = ref<Record<string, string>>({})

const formatRegionName = (regionId?: number) => {
    if (!regionId) return '--'
    const path = findPath(
        props.areaTree || [],
        (node: any) => Number(node?.id) === Number(regionId)
    ) as any[] | null
    const names = Array.isArray(path)
        ? path
              .filter((item) => Number(item?.id) !== -1)
              .map((item) => item?.name)
              .filter(Boolean)
        : []
    return names.length ? names.join(' / ') : String(regionId)
}

const formatProjectName = (row: Recordable) => {
    if (row?.projectName) {
        return row.projectName
    }
    if (row?.projectCode && projectNameMap.value[row.projectCode]) {
        return projectNameMap.value[row.projectCode]
    }
    return row?.projectCode || '--'
}

const resetLocalForm = () => {
    localForm.value = JSON.parse(JSON.stringify(props.formData || {}))
    localForm.value.rules = localForm.value.rules || []
}

const changeEngineTimeRangeType = () => {
    if (localForm.value.timeRangeType !== 'custom') {
        localForm.value.startTime = undefined
        localForm.value.endTime = undefined
    }
}

const changeEnableWeightLimit = () => {
    if (!localForm.value.enableWeightLimit) {
        localForm.value.weightLimits = []
    }
}

const addWeightLimit = () => {
    localForm.value.weightLimits?.push({ userLevel: '', weight: 0, allocationLimit: 0 })
}

const removeWeightLimit = (index: number) => {
    localForm.value.weightLimits?.splice(index, 1)
}

const openRuleDialog = (row?: Recordable, index = -1) => {
    editingRuleIndex.value = index
    editingRule.value = row ? { ...row } : undefined
    ruleDialogTitle.value = row ? '编辑规则' : '新增规则'
    ruleDialogVisible.value = true
}

const confirmRule = (rule: Recordable) => {
    if (!Array.isArray(localForm.value.rules)) {
        localForm.value.rules = []
    }
    if (editingRuleIndex.value >= 0) {
        localForm.value.rules.splice(editingRuleIndex.value, 1, rule)
    } else {
        localForm.value.rules.push(rule)
    }
}

const removeRule = (index: number) => {
    localForm.value.rules?.splice(index, 1)
}

const handleSubmit = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return
    emit('submit', localForm.value)
}

const loadProjectNameMap = async () => {
    const list = (await ProductCategoryApi.getProductCategorySimpleList()) || []
    projectNameMap.value = Object.fromEntries(
        (list as ProductCategoryApi.ProductCategoryVO[])
            .filter((item) => Number(item.parentId) === 0)
            .map((item) => [item.code, item.name])
    )
}

watch(
    () => [props.modelValue, props.formData],
    ([visible]) => {
        if (!visible) return
        resetLocalForm()
    },
    { immediate: true, deep: true }
)

onMounted(() => {
    loadProjectNameMap()
})
</script>
