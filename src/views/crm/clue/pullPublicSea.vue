<template>
    <ContentWrap>
        <el-tabs v-model="activeTab" class="list-tabs-compact" @tab-change="handleTabChange">
            <el-tab-pane
                v-for="tab in PUBLIC_SEA_TABS"
                :key="tab.value"
                :name="String(tab.value)"
                :label="`${tab.label} (${publicSeaCounts[tab.countField] || 0})`"
            />
        </el-tabs>
        <div class="tab-content-wrap claim-page-wrap">
            <div class="claim-panel">
                <div class="claim-panel-header">
                    <div>
                        <div class="claim-panel-title">公海领取条件</div>
                        <div class="claim-panel-desc">填写条件后，按当前筛选范围领取公海线索</div>
                    </div>
                    <div class="text-13px text-[var(--el-text-color-secondary)]">
                        {{ claimSummaryText }}
                    </div>
                </div>

                <el-form label-position="top" class="claim-search-form">
                    <el-row :gutter="16">
                        <el-col :span="8">
                            <el-form-item label="联系电话">
                                <el-input
                                    v-model="searchForm.mobile"
                                    clearable
                                    placeholder="请输入联系电话"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="客户">
                                <el-input
                                    v-model="searchForm.customer"
                                    clearable
                                    placeholder="请输入客户编号/姓名"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="微信号">
                                <el-input
                                    v-model="searchForm.wechat"
                                    clearable
                                    placeholder="请输入微信号"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="地区">
                                <AreaSelect
                                    v-model="searchForm.areaId"
                                    :include-all-node="false"
                                    placeholder="请选择地区"
                                    style="width: 100%"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="咨询项目">
                                <ProductTypeSelect
                                    v-model="searchForm.consultProjectId"
                                    placeholder="请选择咨询项目"
                                    style="width: 100%"
                                    min-width="100%"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="线索来源">
                                <el-select
                                    v-model="searchForm.clueSourceId"
                                    clearable
                                    filterable
                                    placeholder="请选择线索来源"
                                    style="width: 100%"
                                >
                                    <el-option
                                        v-for="item in clueSourceOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="标签">
                                <el-select
                                    v-model="searchForm.tagId"
                                    clearable
                                    filterable
                                    placeholder="请选择标签"
                                    style="width: 100%"
                                >
                                    <el-option
                                        v-for="item in tagOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="意向度">
                                <el-select
                                    v-model="searchForm.intentLevel"
                                    clearable
                                    placeholder="请选择意向度"
                                    style="width: 100%"
                                >
                                    <el-option
                                        v-for="item in INTENT_LEVEL_OPTIONS"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="反馈状态">
                                <el-select
                                    v-model="searchForm.feedbackStatus"
                                    clearable
                                    placeholder="请选择反馈状态"
                                    style="width: 100%"
                                >
                                    <el-option
                                        v-for="item in FEEDBACK_STATUS_OPTIONS"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item label="回流次数">
                                <div class="range-input-wrap">
                                    <el-input
                                        v-model="searchForm.enterPublicSeaCountRange![0]"
                                        placeholder="回流次数起"
                                    />
                                    <span class="range-separator">-</span>
                                    <el-input
                                        v-model="searchForm.enterPublicSeaCountRange![1]"
                                        placeholder="回流次数止"
                                    />
                                </div>
                            </el-form-item>
                        </el-col>
                        <el-col :span="16">
                            <el-form-item label="进入公海时间">
                                <el-date-picker
                                    v-model="searchForm.enterPublicSeaTimeRange"
                                    type="datetimerange"
                                    value-format="YYYY-MM-DD HH:mm:ss"
                                    start-placeholder="开始时间"
                                    end-placeholder="结束时间"
                                    style="width: 100%"
                                />
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>

                <div class="claim-panel-footer">
                    <div class="flex gap-8px flex-wrap">
                        <BaseButton @click="handleResetSearch">清空条件</BaseButton>
                        <BaseButton
                            v-if="canBatchClaim"
                            type="primary"
                            plain
                            @click="handleBatchClaim('ALL')"
                        >
                            领取全部额度
                        </BaseButton>
                        <BaseButton
                            v-if="canBatchClaim"
                            type="primary"
                            @click="handleBatchClaim('TWENTY')"
                        >
                            领取20条
                        </BaseButton>
                    </div>
                </div>
            </div>
        </div>
    </ContentWrap>
</template>

<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import AreaSelect from '@/components/AreaSelect.vue'
import ProductTypeSelect from '@/components/ProductTypeSelect.vue'
import * as ClueApi from '@/api/crm/clue'
import * as ClueSourceApi from '@/api/system/clueSource'
import * as TagGroupApi from '@/api/system/tag-group'
import { hasPermission } from '@/directives/permission/hasPermi'
import {
    FEEDBACK_STATUS_OPTIONS,
    INTENT_LEVEL_OPTIONS,
    PUBLIC_SEA_TABS,
    type LabelValueOption
} from './listShared'

defineOptions({ name: 'CrmCluePublicSea' })

interface PublicSeaSearchParams {
    customer?: string
    mobile?: string
    wechat?: string
    qq?: string
    areaId?: number
    tagId?: number
    consultProjectId?: number
    clueSourceId?: number
    intentLevel?: number
    feedbackStatus?: number
    minOrderCount?: number
    maxOrderCount?: number
    enterPublicSeaCountRange?: Array<string | number | undefined>
    enterPublicSeaTimeRange?: string[]
}

const message = useMessage()
const canBatchClaim = hasPermission(['crm:clue:public-sea:claim'])
const activeTab = ref('1')
const clueSourceOptions = ref<LabelValueOption[]>([])
const tagOptions = ref<LabelValueOption[]>([])
const appliedSearchParams = ref<PublicSeaSearchParams>({})
const publicSeaCounts = reactive({
    firstConsultCount: 0,
    repurchaseCount: 0
})
const searchForm = reactive<PublicSeaSearchParams>({})
searchForm.enterPublicSeaCountRange = [undefined, undefined]
const claimSummary = reactive<ClueApi.PublicSeaClaimSummaryRespVO>({
    unlimited: false,
    dailyLimit: 0,
    claimedCount: 0,
    remainingCount: 0
})

const claimSummaryText = computed(() => {
    if (claimSummary.unlimited) {
        return `今日已领取 ${claimSummary.claimedCount || 0} 条，当前规则不限额`
    }
    return `今日已领取 ${claimSummary.claimedCount || 0} / ${claimSummary.dailyLimit || 0}，剩余 ${
        claimSummary.remainingCount || 0
    } 条`
})

const getSeaType = () => Number(activeTab.value)

const buildSearchParams = (params: PublicSeaSearchParams) => {
    const { enterPublicSeaTimeRange, enterPublicSeaCountRange, ...rest } = params
    return {
        ...rest,
        seaType: getSeaType(),
        minEnterPublicSeaCount: enterPublicSeaCountRange?.[0]
            ? Number(enterPublicSeaCountRange[0])
            : undefined,
        maxEnterPublicSeaCount: enterPublicSeaCountRange?.[1]
            ? Number(enterPublicSeaCountRange[1])
            : undefined,
        beginEnterPublicSeaTime: enterPublicSeaTimeRange?.[0],
        endEnterPublicSeaTime: enterPublicSeaTimeRange?.[1]
    }
}

const sanitizeParams = <T extends Record<string, any>>(params: T) => {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => {
            if (value === undefined || value === null || value === '') return false
            if (Array.isArray(value) && value.length === 0) return false
            return true
        })
    ) as Partial<T>
}

const buildQueryParams = (params: PublicSeaSearchParams) => {
    const { seaType, ...rest } = buildSearchParams(params)
    return sanitizeParams(rest)
}

const loadPageOptions = async () => {
    const [sources, tagGroups] = await Promise.all([
        ClueSourceApi.getEnabledClueSourceList(),
        TagGroupApi.getTagGroupList()
    ])
    clueSourceOptions.value = (sources || []).map((item) => ({
        label: item.name,
        value: Number(item.id)
    }))
    tagOptions.value = (tagGroups || []).flatMap((group) =>
        (group.tags || []).map((tag) => ({
            label: `${group.name} / ${tag.name}`,
            value: Number(tag.id)
        }))
    )
}

const loadCounts = async (params: PublicSeaSearchParams = {}) => {
    const data = await ClueApi.getPublicSeaCounts(buildQueryParams(params))
    publicSeaCounts.firstConsultCount = Number(data?.firstConsultCount || 0)
    publicSeaCounts.repurchaseCount = Number(data?.repurchaseCount || 0)
}

const loadClaimSummary = async () => {
    const data = await ClueApi.getPublicSeaClaimSummary(getSeaType())
    Object.assign(claimSummary, data || {})
}

const collectSearchParams = (params: PublicSeaSearchParams = {}): PublicSeaSearchParams => {
    const merged: PublicSeaSearchParams = { ...searchForm }
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
            merged[key as keyof PublicSeaSearchParams] = value as never
        }
    })
    return merged
}

const resetSearchForm = () => {
    Object.keys(searchForm).forEach((key) => {
        delete searchForm[key as keyof PublicSeaSearchParams]
    })
}

const handleSearch = () => {
    const merged = collectSearchParams()
    appliedSearchParams.value = { ...merged }
    void Promise.all([loadCounts(merged), loadClaimSummary()])
}

const handleResetSearch = () => {
    resetSearchForm()
    searchForm.enterPublicSeaCountRange = [undefined, undefined]
    appliedSearchParams.value = {}
    void Promise.all([loadCounts({}), loadClaimSummary()])
}

const handleTabChange = async () => {
    resetSearchForm()
    searchForm.enterPublicSeaCountRange = [undefined, undefined]
    appliedSearchParams.value = {}
    await loadClaimSummary()
    await loadCounts({})
}

const handleBatchClaim = async (claimMode: ClueApi.PublicSeaClaimMode) => {
    const currentParams = collectSearchParams({})
    const payload: ClueApi.PublicSeaClaimReqVO = {
        seaType: getSeaType(),
        claimMode,
        ...buildQueryParams(currentParams)
    }
    await ClueApi.claimPublicSea(payload)
    message.success('领取成功')
    await Promise.all([loadCounts(currentParams), loadClaimSummary()])
}

onMounted(async () => {
    await Promise.all([loadPageOptions(), loadCounts({}), loadClaimSummary()])
})
</script>

<style scoped>
.claim-page-wrap {
    padding-top: 8px;
}

.claim-panel {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    padding: 20px 20px 18px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.claim-panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.claim-panel-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.4;
}

.claim-panel-desc {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.claim-search-form {
    margin-bottom: 18px;
}

.range-input-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
}

.range-separator {
    color: var(--el-text-color-secondary);
    flex: 0 0 auto;
}

.claim-panel-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
}
</style>
