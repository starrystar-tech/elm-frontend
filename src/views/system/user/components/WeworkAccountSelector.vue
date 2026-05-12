<template>
    <el-dialog v-model="visibleRef" title="选择企微账号" width="980px">
        <el-row :gutter="16">
            <el-col :span="10">
                <div class="selector-panel">
                    <div class="selector-panel__title">企业</div>
                    <el-input
                        v-model="corpKeyword"
                        clearable
                        placeholder="搜索企业"
                        style="margin-bottom: 12px"
                    />
                    <el-scrollbar class="selector-scroll">
                        <ul class="selector-corp-list">
                            <li
                                v-for="item in filteredCorpNodes"
                                :key="item.corpId"
                                class="selector-corp-item"
                                :class="{ 'is-active': item.corpId === corpId }"
                                @click="handleCorpChange(item)"
                            >
                                <span class="selector-corp-item__name">{{ item.label }}</span>
                                <span class="selector-corp-item__count">{{ item.count }}</span>
                            </li>
                        </ul>
                    </el-scrollbar>
                </div>
            </el-col>
            <el-col :span="14">
                <div class="selector-panel">
                    <div class="selector-panel__title">
                        企微账号
                        <span class="selector-panel__sub">已选 {{ selectedRows.length }} 项</span>
                    </div>
                    <el-input
                        v-model="staffKeyword"
                        clearable
                        placeholder="搜索企微账号"
                        style="margin-bottom: 12px"
                    />
                    <el-scrollbar class="selector-scroll">
                        <el-checkbox-group v-model="checkedKeys" class="selector-check-group">
                            <el-checkbox
                                v-for="staff in filteredStaffList"
                                :key="buildStaffKey(staff.corpId, staff.staffUserId)"
                                :label="buildStaffKey(staff.corpId, staff.staffUserId)"
                                class="selector-check-item"
                                :disabled="isOccupied(staff.corpId, staff.staffUserId)"
                            >
                                <div class="selector-staff-item">
                                    <div class="selector-staff-item__name">
                                        {{ staff.staffName || staff.staffUserId }}
                                    </div>
                                    <div class="selector-staff-item__meta">
                                        {{ staff.staffUserId }}
                                    </div>
                                </div>
                            </el-checkbox>
                        </el-checkbox-group>
                    </el-scrollbar>
                    <div class="selector-selected-box">
                        <div class="selector-selected-box__title">已选择账号</div>
                        <div v-if="selectedRows.length" class="selector-selected-tags">
                            <el-tag
                                v-for="item in selectedRows"
                                :key="buildStaffKey(item.corpId, item.staffUserId)"
                                closable
                                @close="removeSelected(item)"
                            >
                                {{ item.staffName }}
                            </el-tag>
                        </div>
                        <el-empty v-else description="暂无选择" :image-size="60" />
                    </div>
                </div>
            </el-col>
        </el-row>

        <template #footer>
            <el-button @click="visibleRef = false">取 消</el-button>
            <el-button type="primary" @click="confirm">确 定</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import * as UserApi from '@/api/system/user'
import * as WeworkContactApi from '@/api/crm/wework/contact'

const props = defineProps<{
    modelValue: boolean
    members: WeworkContactApi.WeworkMemberSimpleVO[]
    selected: UserApi.UserWecomBindVO[]
    occupiedKeys?: string[]
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', val: boolean): void
    (e: 'confirm', rows: UserApi.UserWecomBindVO[]): void
}>()

const visibleRef = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const corpId = ref('')
const corpKeyword = ref('')
const staffKeyword = ref('')
const checkedKeys = ref<string[]>([])

const corpOptions = computed(() => {
    const map = new Map<string, { corpId: string; corpName: string }>()
    props.members.forEach((item) => {
        if (!item.corpId || map.has(item.corpId)) return
        map.set(item.corpId, {
            corpId: item.corpId,
            corpName: item.corpName || item.corpId
        })
    })
    return Array.from(map.values())
})

const buildStaffKey = (c: string, s: string) => `${c}__${s}`

const filteredCorpNodes = computed(() => {
    const keyword = corpKeyword.value.trim().toLowerCase()
    return corpOptions.value
        .filter((item) => !keyword || item.corpName.toLowerCase().includes(keyword))
        .map((item) => ({
            corpId: item.corpId,
            label: item.corpName,
            count: props.members.filter((staff) => staff.corpId === item.corpId).length
        }))
})

watch(filteredCorpNodes, (list) => {
    if (!list.length) {
        corpId.value = ''
        return
    }
    if (!list.some((item) => item.corpId === corpId.value)) {
        corpId.value = list[0].corpId
    }
})

const staffList = computed(() => {
    if (!corpId.value) return []
    return props.members.filter((item) => item.corpId === corpId.value)
})

const filteredStaffList = computed(() => {
    const keyword = staffKeyword.value.trim().toLowerCase()
    return staffList.value.filter((item) => {
        if (!keyword) return true
        return (
            (item.staffName || '').toLowerCase().includes(keyword) ||
            (item.staffUserId || '').toLowerCase().includes(keyword)
        )
    })
})

const occupiedKeySet = computed(() => new Set(props.occupiedKeys || []))

const isOccupied = (corpId: string, staffUserId: string) =>
    occupiedKeySet.value.has(buildStaffKey(corpId, staffUserId))

const selectedRows = computed(() => {
    const set = new Set(checkedKeys.value)
    return props.members
        .filter((item) => set.has(buildStaffKey(item.corpId, item.staffUserId)))
        .map((item) => ({
            corpId: item.corpId,
            staffUserId: item.staffUserId,
            staffName: item.staffName || item.name || item.staffUserId
        }))
})

watch(
    () => props.modelValue,
    (val) => {
        if (!val) return
        corpKeyword.value = ''
        staffKeyword.value = ''
        corpId.value = corpOptions.value[0]?.corpId || ''
        checkedKeys.value = props.selected.map((item) =>
            buildStaffKey(item.corpId, item.staffUserId)
        )
    }
)

const handleCorpChange = (node: { corpId: string }) => {
    corpId.value = node?.corpId || ''
}

const removeSelected = (item: UserApi.UserWecomBindVO) => {
    const key = buildStaffKey(item.corpId, item.staffUserId)
    checkedKeys.value = checkedKeys.value.filter((x) => x !== key)
}

const confirm = () => {
    emit('confirm', selectedRows.value)
    visibleRef.value = false
}
</script>

<style scoped>
.selector-panel {
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    padding: 12px;
    height: 520px;
    display: flex;
    flex-direction: column;
}

.selector-panel__title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.selector-panel__sub {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-weight: 400;
}

.selector-scroll {
    flex: 1;
    min-height: 0;
}

.selector-corp-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.selector-corp-item {
    width: 100%;
    min-height: 48px;
    padding: 0 12px;
    margin-bottom: 8px;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.selector-corp-item:hover,
.selector-corp-item.is-active {
    background: var(--el-color-primary-light-9);
}

.selector-corp-item__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.selector-corp-item__count {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.selector-check-group {
    width: 100%;
    height: 300px;
    overflow-y: auto;
}

.selector-check-item {
    width: 100%;
    margin-right: 0;
    margin-bottom: 8px;
}

.selector-staff-item {
    min-height: 44px;
    line-height: 1.2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
}

.selector-staff-item__name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.selector-staff-item__meta {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.selector-selected-box {
    border-top: 1px dashed var(--el-border-color);
    margin-top: 10px;
    padding-top: 10px;
}

.selector-selected-box__title {
    font-size: 13px;
    margin-bottom: 8px;
}

.selector-selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
</style>
