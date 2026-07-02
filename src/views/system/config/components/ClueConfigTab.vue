<template>
    <div class="panel-wrap" v-loading="loading">
        <section class="config-section">
            <h4 class="section-title">客户刷新</h4>
            <div class="section-body">
                <div v-for="item in recycleRules" :key="item.ruleCode" class="line-item">
                    <el-switch v-model="item.enabled" active-text="" inactive-text="" />
                    <span>{{ item.ruleName }}</span>
                    <el-input-number v-model="item.days" :min="1" :max="365" :controls="false" />
                    <span>{{ item.tailText }}</span>
                </div>
                <div class="line-item">
                    <span>累计外呼时长达到</span>
                    <el-input-number
                        v-model="autoReturnVisitCallDurationSeconds"
                        :min="0"
                        :max="86400"
                        :controls="false"
                    />
                    <span>秒，自动进入已回访</span>
                </div>
            </div>
        </section>

        <el-divider />

        <section class="config-section">
            <h4 class="section-title">领取客户</h4>
            <div class="section-body">
                <div v-for="item in claimRules" :key="item.ruleCode" class="line-item">
                    <el-switch v-model="item.enabled" active-text="" inactive-text="" />
                    <span>{{ item.ruleName }}，</span>
                    <el-input-number v-model="item.days" :min="1" :max="365" :controls="false" />
                    <span>{{ item.tailText }}</span>
                </div>
            </div>
        </section>

        <div class="action-wrap">
            <el-button type="primary" :loading="saving" :disabled="!canUpdate" @click="handleSave"
                >保存</el-button
            >
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { hasPermission } from '@/directives/permission/hasPermi'
import * as ClueFlowConfigApi from '@/api/system/clue-flow-config'

defineOptions({ name: 'ClueConfigTab' })

interface RuleViewItem {
    ruleCode: string
    ruleName: string
    enabled: boolean
    days: number
    tailText: string
    sort: number
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
    ABANDON_CLAIM_LIMIT: {
        ruleName: '放弃客户后',
        tailText: '天内不可再领取',
        sort: 60
    }
}

const RECYCLE_RULE_CODES = [
    'FIRST_CONSULT_TO_WAIT_VISIT',
    'WAIT_VISIT_TO_FIRST_POOL',
    'VISITED_TO_FIRST_POOL',
    'REPURCHASE_TO_REPURCHASE_POOL',
    'PUBLIC_POOL_TO_FIRST_POOL'
]
const CLAIM_RULE_CODES = ['ABANDON_CLAIM_LIMIT']
const ALL_RULE_CODES = [...RECYCLE_RULE_CODES, ...CLAIM_RULE_CODES]

const message = useMessage()
const canUpdate = hasPermission(['system:clue-flow-config:update'])

const loading = ref(false)
const saving = ref(false)
const rules = ref<RuleViewItem[]>([])
const autoReturnVisitCallDurationSeconds = ref(0)

const recycleRules = computed(() => {
    return rules.value.filter((item) => RECYCLE_RULE_CODES.includes(item.ruleCode))
})

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
            days: 1,
            tailText: meta.tailText,
            sort: meta.sort
        }
    })
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
            days: Number(remoteRule?.days || 1),
            tailText: meta.tailText,
            sort: remoteRule?.sort ?? meta.sort
        }
    })
}

const loadConfig = async () => {
    loading.value = true
    try {
        const data = await ClueFlowConfigApi.getClueFlowConfig()
        rules.value = normalizeRules(data?.rules || [])
        autoReturnVisitCallDurationSeconds.value = Number(
            data?.autoReturnVisitCallDurationSeconds || 0
        )
    } finally {
        loading.value = false
    }
}

const handleSave = async () => {
    saving.value = true
    try {
        const payload: ClueFlowConfigApi.ClueFlowConfigSaveReqVO = {
            autoReturnVisitCallDurationSeconds: autoReturnVisitCallDurationSeconds.value,
            rules: rules.value
                .map((item) => ({
                    ruleCode: item.ruleCode,
                    enabled: item.enabled,
                    days: item.days
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
    gap: 10px;
    font-size: 14px;
}
.line-item {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}
.action-wrap {
    margin-top: 8px;
    padding-left: 14px;
}
</style>
