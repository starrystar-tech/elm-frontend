<template>
    <div class="panel-wrap" v-loading="loading">
        <section class="config-section">
            <h4 class="section-title">客户刷新</h4>
            <div class="section-body">
                <div v-for="item in recycleDayRules" :key="item.ruleCode" class="line-item">
                    <el-switch v-model="item.enabled" active-text="" inactive-text="" />
                    <span class="line-item__label">{{ item.ruleName }}</span>
                    <el-input-number
                        v-model="item.days"
                        :min="1"
                        :max="365"
                        :controls="false"
                        class="line-item__number"
                    />
                    <span class="line-item__tail">{{ item.tailText }}</span>
                </div>

                <div v-if="enrolledRecycleRule" class="line-item line-item--match-rule">
                    <el-switch
                        v-model="enrolledRecycleRule.enabled"
                        active-text=""
                        inactive-text=""
                    />
                    <div class="line-item__content">
                        <span>已报名客户，匹配条件则自动进入复购公海</span>
                        <el-button link type="primary" @click="handleOpenConditionDialog">
                            匹配规则
                        </el-button>
                    </div>
                </div>

                <div class="line-item">
                    <span class="line-item__label">单次外呼时长达到</span>
                    <el-input-number
                        v-model="autoReturnVisitCallDurationSeconds"
                        :min="0"
                        :max="86400"
                        :controls="false"
                        class="line-item__number"
                    />
                    <span class="line-item__tail">秒，自动进入已回访</span>
                </div>
            </div>
        </section>

        <el-divider />

        <section class="config-section">
            <h4 class="section-title">领取客户</h4>
            <div class="section-body">
                <div v-for="item in claimRules" :key="item.ruleCode" class="line-item">
                    <el-switch v-model="item.enabled" active-text="" inactive-text="" />
                    <span class="line-item__label">{{ item.ruleName }}后，</span>
                    <el-input-number
                        v-model="item.days"
                        :min="1"
                        :max="365"
                        :controls="false"
                        class="line-item__number"
                    />
                    <span class="line-item__tail">{{ item.tailText }}</span>
                </div>
            </div>
        </section>

        <div class="action-wrap">
            <el-button type="primary" :loading="saving" :disabled="!canUpdate" @click="handleSave">
                保存配置
            </el-button>
        </div>

        <Dialog
            v-model="conditionDialogVisible"
            title="复购回收"
            width="800px"
            :fullscreen="false"
            append-to-body
        >
            <section class="config-section config-section--dialog">
                <h4 class="section-title">线索条件</h4>
                <el-form label-width="92px" class="condition-form">
                    <el-row :gutter="24">
                        <el-col :span="12">
                            <el-form-item label="报名分校" class="condition-form-item">
                                <el-select
                                    v-model="conditionForm.campusIds"
                                    multiple
                                    clearable
                                    filterable
                                    collapse-tags
                                    collapse-tags-tooltip
                                    placeholder="请选择报名分校"
                                >
                                    <el-option
                                        v-for="item in campusOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                        </el-col>

                        <el-col :span="12">
                            <el-form-item label="报名项目" class="condition-form-item">
                                <el-select
                                    v-model="conditionForm.projectIds"
                                    multiple
                                    clearable
                                    filterable
                                    collapse-tags
                                    collapse-tags-tooltip
                                    placeholder="请选择报名项目"
                                >
                                    <el-option
                                        v-for="item in projectOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                        </el-col>

                        <el-col :span="24">
                            <el-form-item class="condition-form-item">
                                <template #label>
                                    <span><span class="required-mark">*</span>报名时间</span>
                                </template>
                                <el-date-picker
                                    v-model="conditionForm.signDateRange"
                                    type="daterange"
                                    value-format="YYYY-MM-DD"
                                    range-separator="至"
                                    start-placeholder="开始日期"
                                    end-placeholder="结束日期"
                                />
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
            </section>
            <template #footer>
                <el-button @click="conditionDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSaveConditionDialog">确定</el-button>
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { hasPermission } from '@/directives/permission/hasPermi'
import * as CampusApi from '@/api/system/campus'
import * as ProductCategoryApi from '@/api/crm/product/category'
import * as ClueFlowConfigApi from '@/api/system/clue-flow-config'

defineOptions({ name: 'ClueConfigTab' })

interface RuleViewItem {
    ruleCode: string
    ruleName: string
    enabled: boolean
    days: number
    tailText: string
    sort: number
    condition?: ClueFlowConfigApi.ClueFlowRuleConditionSaveReqVO
}

interface SelectOption {
    label: string
    value: number
}

interface ConditionForm {
    campusIds: number[]
    projectIds: number[]
    signDateRange: string[]
}

const RULE_META_MAP: Record<string, { ruleName: string; tailText: string; sort: number }> = {
    FIRST_CONSULT_TO_WAIT_VISIT: {
        ruleName: '首咨客户',
        tailText: '天未回访，自动进入待回访',
        sort: 10
    },
    WAIT_VISIT_TO_FIRST_POOL: {
        ruleName: '待回访',
        tailText: '天未回访，自动进入首咨公海',
        sort: 20
    },
    VISITED_TO_FIRST_POOL: {
        ruleName: '回访客户',
        tailText: '天未再回访，自动进入首咨公海',
        sort: 30
    },
    REPURCHASE_TO_REPURCHASE_POOL: {
        ruleName: '复购客户',
        tailText: '天未成交，自动进入复购公海',
        sort: 40
    },
    PUBLIC_POOL_TO_FIRST_POOL: {
        ruleName: '公海客户',
        tailText: '天未回访，自动进入首咨公海',
        sort: 50
    },
    ENROLLED_TO_REPURCHASE_POOL: {
        ruleName: '已报名客户',
        tailText: '匹配条件则自动进入复购公海',
        sort: 55
    },
    ABANDON_CLAIM_LIMIT: {
        ruleName: '放弃客户',
        tailText: '天内不可再领取',
        sort: 60
    }
}

const ENROLLED_RULE_CODE = 'ENROLLED_TO_REPURCHASE_POOL'
const RECYCLE_DAY_RULE_CODES = [
    'FIRST_CONSULT_TO_WAIT_VISIT',
    'WAIT_VISIT_TO_FIRST_POOL',
    'VISITED_TO_FIRST_POOL',
    'REPURCHASE_TO_REPURCHASE_POOL',
    'PUBLIC_POOL_TO_FIRST_POOL'
]
const CLAIM_RULE_CODES = ['ABANDON_CLAIM_LIMIT']
const ALL_RULE_CODES = [...RECYCLE_DAY_RULE_CODES, ENROLLED_RULE_CODE, ...CLAIM_RULE_CODES]

const message = useMessage()
const canUpdate = hasPermission(['system:clue-flow-config:update'])

const loading = ref(false)
const saving = ref(false)
const rules = ref<RuleViewItem[]>([])
const autoReturnVisitCallDurationSeconds = ref(0)
const campusOptions = ref<SelectOption[]>([])
const projectOptions = ref<SelectOption[]>([])

const conditionDialogVisible = ref(false)
const conditionForm = ref<ConditionForm>({
    campusIds: [],
    projectIds: [],
    signDateRange: []
})

const recycleDayRules = computed(() =>
    rules.value.filter((item) => RECYCLE_DAY_RULE_CODES.includes(item.ruleCode))
)

const enrolledRecycleRule = computed(() =>
    rules.value.find((item) => item.ruleCode === ENROLLED_RULE_CODE)
)

const claimRules = computed(() => {
    return rules.value.filter((item) => CLAIM_RULE_CODES.includes(item.ruleCode))
})

const buildDefaultRules = () => {
    return ALL_RULE_CODES.map((code) => {
        const meta = RULE_META_MAP[code]
        return {
            ruleCode: code,
            ruleName: meta.ruleName,
            enabled: false,
            days: code === ENROLLED_RULE_CODE ? 0 : 1,
            tailText: meta.tailText,
            sort: meta.sort,
            condition: undefined
        }
    })
}

const normalizeDateValue = (
    value?: ClueFlowConfigApi.ClueFlowDateValue
): string | undefined => {
    if (!value) {
        return undefined
    }
    if (typeof value === 'string') {
        return value
    }
    if (Array.isArray(value) && value.length >= 3) {
        const [year, month, day] = value.map((item) => Number(item))
        if (year > 0 && month > 0 && day > 0) {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        }
    }
    return undefined
}

const normalizeCondition = (
    condition?:
        | ClueFlowConfigApi.ClueFlowRuleConditionVO
        | ClueFlowConfigApi.ClueFlowRuleConditionSaveReqVO
        | null
): ClueFlowConfigApi.ClueFlowRuleConditionSaveReqVO | undefined => {
    if (!condition) {
        return undefined
    }
    const campusIds = (condition.campusIds || [])
        .map((item) => Number(item))
        .filter((item) => item > 0)
    const projectIds = (condition.projectIds || [])
        .map((item) => Number(item))
        .filter((item) => item > 0)
    const signStartDate = normalizeDateValue(condition.signStartDate)
    const signEndDate = normalizeDateValue(condition.signEndDate)
    if (!campusIds.length && !projectIds.length && !signStartDate && !signEndDate) {
        return undefined
    }
    return {
        campusIds,
        projectIds,
        signStartDate,
        signEndDate
    }
}

const normalizeRules = (serverRules: ClueFlowConfigApi.ClueFlowRuleVO[] = []) => {
    const map = new Map(serverRules.map((item) => [item.ruleCode, item]))
    return ALL_RULE_CODES.map((code) => {
        const meta = RULE_META_MAP[code]
        const remoteRule = map.get(code)
        return {
            ruleCode: code,
            ruleName: meta.ruleName,
            enabled: Boolean(remoteRule?.enabled),
            days: code === ENROLLED_RULE_CODE ? 0 : Number(remoteRule?.days || 1),
            tailText: meta.tailText,
            sort: remoteRule?.sort ?? meta.sort,
            condition: normalizeCondition(remoteRule?.condition)
        }
    })
}

const mergeOptions = (
    baseOptions: SelectOption[],
    extraOptions: ClueFlowConfigApi.ClueFlowRuleConditionOptionVO[] = []
) => {
    const optionMap = new Map<number, SelectOption>()
    baseOptions.forEach((item) => optionMap.set(Number(item.value), item))
    extraOptions.forEach((item) => {
        const value = Number(item.id)
        if (value > 0 && !optionMap.has(value)) {
            optionMap.set(value, { label: item.name || String(item.id), value })
        }
    })
    return Array.from(optionMap.values())
}

const collectConditionOptions = (
    serverRules: ClueFlowConfigApi.ClueFlowRuleVO[],
    field: 'campuses' | 'projects'
) => {
    return serverRules.flatMap((item) => item.condition?.[field] || [])
}

const buildCampusOptions = (campuses: CampusApi.CampusVO[] = []) => {
    return campuses
        .filter((item) => item.id !== undefined)
        .map((item) => ({
            label: item.name,
            value: Number(item.id)
        }))
}

const buildProjectOptions = (projects: ProductCategoryApi.ProductCategoryVO[] = []) => {
    const rootProjects = projects.filter(
        (item) => Number(item.parentId) === 0 && item.id !== undefined
    )
    const source = rootProjects.length
        ? rootProjects
        : projects.filter((item) => item.id !== undefined)
    return source.map((item) => ({
        label: item.name,
        value: Number(item.id)
    }))
}

const loadConfig = async () => {
    loading.value = true
    try {
        const [configData, campusData, projectData] = await Promise.all([
            ClueFlowConfigApi.getClueFlowConfig(),
            CampusApi.getSimpleCampusList(),
            ProductCategoryApi.getProductCategorySimpleList()
        ])
        const serverRules = configData?.rules || []
        rules.value = normalizeRules(serverRules)
        autoReturnVisitCallDurationSeconds.value = Number(
            configData?.autoReturnVisitCallDurationSeconds || 0
        )
        campusOptions.value = mergeOptions(
            buildCampusOptions(campusData || []),
            collectConditionOptions(serverRules, 'campuses')
        )
        projectOptions.value = mergeOptions(
            buildProjectOptions(projectData || []),
            collectConditionOptions(serverRules, 'projects')
        )
    } finally {
        loading.value = false
    }
}

const buildConditionForm = (
    condition?: ClueFlowConfigApi.ClueFlowRuleConditionSaveReqVO
): ConditionForm => ({
    campusIds: [...(condition?.campusIds || [])],
    projectIds: [...(condition?.projectIds || [])],
    signDateRange:
        condition?.signStartDate && condition?.signEndDate
            ? [condition.signStartDate, condition.signEndDate]
            : []
})

const buildConditionPayload = (
    form: ConditionForm
): ClueFlowConfigApi.ClueFlowRuleConditionSaveReqVO => ({
    campusIds: [...form.campusIds],
    projectIds: [...form.projectIds],
    signStartDate: form.signDateRange[0] || undefined,
    signEndDate: form.signDateRange[1] || undefined
})

const validateConditionForm = (form: ConditionForm) => {
    if (form.signDateRange.length !== 2 || !form.signDateRange[0] || !form.signDateRange[1]) {
        message.warning('请选择完整的报名时间范围')
        return false
    }
    if (new Date(form.signDateRange[1]).getTime() < new Date(form.signDateRange[0]).getTime()) {
        message.warning('报名结束日期不能早于开始日期')
        return false
    }
    return true
}

const handleOpenConditionDialog = () => {
    conditionForm.value = buildConditionForm(enrolledRecycleRule.value?.condition)
    conditionDialogVisible.value = true
}

const handleSaveConditionDialog = () => {
    if (!validateConditionForm(conditionForm.value)) {
        return
    }
    if (enrolledRecycleRule.value) {
        enrolledRecycleRule.value.condition = buildConditionPayload(conditionForm.value)
    }
    conditionDialogVisible.value = false
}

const handleSave = async () => {
    const enrolledRule = enrolledRecycleRule.value
    if (
        enrolledRule?.enabled &&
        (!enrolledRule.condition ||
            !validateConditionForm(buildConditionForm(enrolledRule.condition)))
    ) {
        return
    }

    saving.value = true
    try {
        const payload: ClueFlowConfigApi.ClueFlowConfigSaveReqVO = {
            autoReturnVisitCallDurationSeconds: autoReturnVisitCallDurationSeconds.value,
            rules: rules.value
                .map((item) => ({
                    ruleCode: item.ruleCode,
                    enabled: item.enabled,
                    days: item.ruleCode === ENROLLED_RULE_CODE ? 0 : item.days,
                    condition: item.ruleCode === ENROLLED_RULE_CODE ? item.condition : undefined
                }))
                .sort(
                    (a, b) =>
                        (RULE_META_MAP[a.ruleCode]?.sort || 0) -
                        (RULE_META_MAP[b.ruleCode]?.sort || 0)
                )
        }
        await ClueFlowConfigApi.updateClueFlowConfig(payload)
        message.success('保存成功')
        await loadConfig()
    } finally {
        saving.value = false
    }
}

onMounted(async () => {
    rules.value = buildDefaultRules()
    await loadConfig()
})
</script>

<style scoped>
.panel-wrap {
    padding: 8px 6px;
}

.config-section {
    margin-bottom: 20px;
}

.config-section--dialog {
    margin-bottom: 0;
}

.section-title {
    margin: 0 0 18px;
    font-size: 15px;
    font-weight: 600;
    position: relative;
    padding-left: 14px;
}

.section-title::before {
    content: '';
    position: absolute;
    left: 0;
    top: 3px;
    width: 4px;
    height: 16px;
    background: var(--el-color-primary);
    border-radius: 2px;
}

.section-body {
    margin-left: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 14px;
}

.line-item {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.line-item--match-rule {
    align-items: flex-start;
}

.line-item__label,
.line-item__tail {
    line-height: 32px;
}

.line-item__number {
    width: 90px;
}

.line-item__content {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    min-height: 32px;
}

.action-wrap {
    margin-top: 8px;
    padding-left: 14px;
}

.condition-form {
    margin-left: 14px;
}

.condition-form-item {
    margin-bottom: 18px;
}

.condition-form-item :deep(.el-form-item__content) {
    width: 100%;
}

.condition-form-item :deep(.el-select),
.condition-form-item :deep(.el-date-editor) {
    width: 100%;
}

.required-mark {
    margin-right: 4px;
    color: var(--el-color-danger);
}
</style>
