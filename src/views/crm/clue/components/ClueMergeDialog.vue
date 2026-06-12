<template>
    <Dialog v-model="dialogVisible" title="名片合并" width="1280px" append-to-body>
        <div class="clue-merge-dialog" v-loading="loading">
            <div class="clue-merge-dialog__tip">
                请先确认两张名片信息，选择一张作为合并后保留名片。确认后，另一张名片将被合并并删除。
            </div>

            <div class="clue-merge-dialog__search">
                <div class="clue-merge-dialog__search-item">
                    <el-input
                        v-model="leftKeyword"
                        clearable
                        placeholder="请输入客户编号或手机号"
                        @keyup.enter="searchAndLoadClue('left')"
                    >
                        <template #append>
                            <el-button
                                :loading="searchLoading.left"
                                @click="searchAndLoadClue('left')"
                            >
                                搜索
                            </el-button>
                        </template>
                    </el-input>
                </div>
                <div class="clue-merge-dialog__search-item">
                    <el-input
                        v-model="rightKeyword"
                        clearable
                        placeholder="请输入客户编号或手机号"
                        @keyup.enter="searchAndLoadClue('right')"
                    >
                        <template #append>
                            <el-button
                                :loading="searchLoading.right"
                                @click="searchAndLoadClue('right')"
                            >
                                搜索
                            </el-button>
                        </template>
                    </el-input>
                </div>
            </div>

            <div class="clue-merge-dialog__body">
                <div class="clue-merge-dialog__column">
                    <div class="clue-merge-card">
                        <div class="clue-merge-card__header">
                            <div>
                                <div class="clue-merge-card__title">名片A</div>
                            </div>
                            <el-radio
                                :model-value="keepClueId"
                                :label="leftClue?.id"
                                @change="handleKeepChange(leftClue?.id)"
                            >
                                合并后保留此名片
                            </el-radio>
                        </div>

                        <el-form label-width="94px" class="clue-merge-form">
                            <el-form-item label="客户编号">
                                <el-input
                                    v-model="leftForm.customerId"
                                    placeholder="请输入客户编号"
                                />
                            </el-form-item>
                            <el-form-item label="姓名">
                                <el-input v-model="leftForm.name" placeholder="请输入姓名" />
                            </el-form-item>
                            <el-form-item label="手机号">
                                <el-input v-model="leftForm.mobile" placeholder="请输入手机号" />
                            </el-form-item>
                            <el-form-item label="手机号2">
                                <el-input v-model="leftForm.mobile2" placeholder="请输入手机号2" />
                            </el-form-item>
                            <el-form-item label="微信号">
                                <el-input v-model="leftForm.wechat" placeholder="请输入微信号" />
                            </el-form-item>
                            <el-form-item label="微信号2">
                                <el-input v-model="leftForm.wechat2" placeholder="请输入微信号2" />
                            </el-form-item>
                            <el-form-item label="微信备注名">
                                <el-input
                                    v-model="leftForm.wechatRemark"
                                    placeholder="请输入微信备注名"
                                />
                            </el-form-item>
                            <el-form-item label="QQ">
                                <el-input v-model="leftForm.qq" placeholder="请输入QQ" />
                            </el-form-item>
                            <el-form-item label="性别">
                                <el-select v-model="leftForm.gender" clearable placeholder="请选择">
                                    <el-option
                                        v-for="item in genderOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="学历">
                                <el-select
                                    v-model="leftForm.education"
                                    clearable
                                    placeholder="请选择"
                                >
                                    <el-option
                                        v-for="item in educationOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="咨询项目">
                                <ProductTypeSelect v-model="leftForm.consultProjectId" />
                            </el-form-item>
                            <el-form-item label="地区">
                                <AreaSelect v-model="leftForm.areaId" :include-all-node="true" />
                            </el-form-item>
                            <el-form-item label="客户标签">
                                <el-select
                                    v-model="leftForm.tagIds"
                                    multiple
                                    clearable
                                    filterable
                                    collapse-tags
                                    collapse-tags-tooltip
                                    placeholder="请选择标签"
                                >
                                    <el-option
                                        v-for="item in tagOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="创建时间">
                                <div class="clue-merge-card__text">{{
                                    formatDisplayTime(leftClue?.createTime)
                                }}</div>
                            </el-form-item>
                        </el-form>
                    </div>
                </div>

                <div class="clue-merge-dialog__column">
                    <div class="clue-merge-card">
                        <div class="clue-merge-card__header">
                            <div>
                                <div class="clue-merge-card__title">名片B</div>
                            </div>
                            <el-radio
                                :model-value="keepClueId"
                                :label="rightClue?.id"
                                @change="handleKeepChange(rightClue?.id)"
                            >
                                合并后保留此名片
                            </el-radio>
                        </div>

                        <el-form label-width="94px" class="clue-merge-form">
                            <el-form-item label="客户编号">
                                <el-input
                                    v-model="rightForm.customerId"
                                    placeholder="请输入客户编号"
                                />
                            </el-form-item>
                            <el-form-item label="姓名">
                                <el-input v-model="rightForm.name" placeholder="请输入姓名" />
                            </el-form-item>
                            <el-form-item label="手机号">
                                <el-input v-model="rightForm.mobile" placeholder="请输入手机号" />
                            </el-form-item>
                            <el-form-item label="手机号2">
                                <el-input v-model="rightForm.mobile2" placeholder="请输入手机号2" />
                            </el-form-item>
                            <el-form-item label="微信号">
                                <el-input v-model="rightForm.wechat" placeholder="请输入微信号" />
                            </el-form-item>
                            <el-form-item label="微信号2">
                                <el-input v-model="rightForm.wechat2" placeholder="请输入微信号2" />
                            </el-form-item>
                            <el-form-item label="微信备注名">
                                <el-input
                                    v-model="rightForm.wechatRemark"
                                    placeholder="请输入微信备注名"
                                />
                            </el-form-item>
                            <el-form-item label="QQ">
                                <el-input v-model="rightForm.qq" placeholder="请输入QQ" />
                            </el-form-item>
                            <el-form-item label="性别">
                                <el-select
                                    v-model="rightForm.gender"
                                    clearable
                                    placeholder="请选择"
                                >
                                    <el-option
                                        v-for="item in genderOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="学历">
                                <el-select
                                    v-model="rightForm.education"
                                    clearable
                                    placeholder="请选择"
                                >
                                    <el-option
                                        v-for="item in educationOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="咨询项目">
                                <ProductTypeSelect v-model="rightForm.consultProjectId" />
                            </el-form-item>
                            <el-form-item label="地区">
                                <AreaSelect v-model="rightForm.areaId" :include-all-node="true" />
                            </el-form-item>
                            <el-form-item label="客户标签">
                                <el-select
                                    v-model="rightForm.tagIds"
                                    multiple
                                    clearable
                                    filterable
                                    collapse-tags
                                    collapse-tags-tooltip
                                    placeholder="请选择标签"
                                >
                                    <el-option
                                        v-for="item in tagOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="创建时间">
                                <div class="clue-merge-card__text">{{
                                    formatDisplayTime(rightClue?.createTime)
                                }}</div>
                            </el-form-item>
                        </el-form>
                    </div>
                </div>
            </div>

            <el-form label-width="88px" class="clue-merge-dialog__remark">
                <el-form-item label="合并备注">
                    <el-input
                        v-model="remark"
                        type="textarea"
                        :rows="3"
                        maxlength="500"
                        show-word-limit
                        placeholder="请输入合并备注"
                    />
                </el-form-item>
            </el-form>
        </div>

        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="submitLoading" @click="handleConfirm"
                >确定合并</el-button
            >
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import AreaSelect from '@/components/AreaSelect.vue'
import * as ClueApi from '@/api/crm/clue'
import * as TagGroupApi from '@/api/system/tag-group'
import ProductTypeSelect from '@/components/ProductTypeSelect.vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { formatDate, resolveTimestamp } from '@/utils/formatTime'

defineOptions({ name: 'ClueMergeDialog' })

type MergeSide = 'left' | 'right'

interface MergeFormState extends ClueApi.ClueMergeDataReqVO {}

const props = defineProps<{
    modelValue: boolean
    clues: ClueApi.ClueVO[]
    initialKeepClueId?: number
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (
        e: 'confirm',
        value: {
            keepClueId: number
            mergedClueId: number
            remark?: string
            mergedData: ClueApi.ClueMergeDataReqVO
        }
    ): void
}>()

const message = useMessage()
const loading = ref(false)
const submitLoading = ref(false)
const leftClue = ref<ClueApi.ClueVO>()
const rightClue = ref<ClueApi.ClueVO>()
const leftKeyword = ref('')
const rightKeyword = ref('')
const keepClueId = ref<number>()
const remark = ref('')
const searchLoading = reactive<Record<MergeSide, boolean>>({
    left: false,
    right: false
})

const leftForm = reactive<MergeFormState>(createEmptyForm())
const rightForm = reactive<MergeFormState>(createEmptyForm())
const tagOptions = ref<{ label: string; value: number }[]>([])
const genderOptions = [
    { label: '男', value: 1 },
    { label: '女', value: 2 }
]
const educationOptions = getIntDictOptions(DICT_TYPE.CRM_CLUE_EDUCATION)

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value: boolean) => emit('update:modelValue', value)
})

function createEmptyForm(): MergeFormState {
    return {
        customerId: '',
        name: '',
        mobile: '',
        mobile2: '',
        wechat: '',
        wechat2: '',
        wechatRemark: '',
        qq: '',
        gender: undefined,
        education: undefined,
        areaId: undefined,
        consultProjectId: undefined,
        tagIds: []
    }
}

function normalizeForm(form: MergeFormState) {
    return {
        customerId: form.customerId?.trim() || undefined,
        name: form.name?.trim() || undefined,
        mobile: form.mobile?.trim() || undefined,
        mobile2: form.mobile2?.trim() || undefined,
        wechat: form.wechat?.trim() || undefined,
        wechat2: form.wechat2?.trim() || undefined,
        wechatRemark: form.wechatRemark?.trim() || undefined,
        qq: form.qq?.trim() || undefined,
        gender: form.gender,
        education: form.education,
        areaId: form.areaId ? Number(form.areaId) : undefined,
        consultProjectId: form.consultProjectId ? Number(form.consultProjectId) : undefined,
        tagIds: Array.isArray(form.tagIds) ? form.tagIds.map((item) => Number(item)) : undefined
    } satisfies ClueApi.ClueMergeDataReqVO
}

function assignForm(target: MergeFormState, clue?: ClueApi.ClueVO) {
    Object.assign(target, createEmptyForm(), {
        customerId: clue?.customerId || '',
        name: clue?.name || '',
        mobile: clue?.mobile || '',
        mobile2: clue?.mobile2 || '',
        wechat: clue?.wechat || '',
        wechat2: clue?.wechat2 || '',
        wechatRemark: clue?.wechatRemark || '',
        qq: clue?.qq || '',
        gender: clue?.gender,
        education: clue?.education,
        areaId: clue?.areaId,
        consultProjectId: clue?.consultProjectId,
        tagIds: [...(clue?.tagIds || [])]
    })
}

function fillSearchKeyword() {
    leftKeyword.value = leftClue.value?.customerId || leftClue.value?.mobile || ''
    rightKeyword.value = rightClue.value?.customerId || rightClue.value?.mobile || ''
}

async function loadTagOptions() {
    const groups = await TagGroupApi.getTagGroupList()
    tagOptions.value = (groups || []).flatMap((group) =>
        (group.tags || []).map((tag) => ({
            label: `${group.name} / ${tag.name}`,
            value: Number(tag.id)
        }))
    )
}

async function loadClueDetail(side: MergeSide, clueId?: number) {
    if (!clueId) return
    const clue = await ClueApi.getClue(Number(clueId))
    if (side === 'left') {
        leftClue.value = clue
        assignForm(leftForm, clue)
    } else {
        rightClue.value = clue
        assignForm(rightForm, clue)
    }
    fillSearchKeyword()
}

async function initializeDialog() {
    if (props.clues.length < 2) return
    loading.value = true
    try {
        await loadTagOptions()
        await Promise.all([
            loadClueDetail('left', Number(props.clues[0]?.id)),
            loadClueDetail('right', Number(props.clues[1]?.id))
        ])
        keepClueId.value = props.initialKeepClueId || Number(props.clues[0]?.id)
        remark.value = ''
    } finally {
        loading.value = false
    }
}

async function searchAndLoadClue(side: MergeSide) {
    const keyword = (side === 'left' ? leftKeyword.value : rightKeyword.value).trim()
    if (!keyword) {
        message.warning('请输入客户编号或手机号')
        return
    }
    searchLoading[side] = true
    try {
        const result = await ClueApi.getMergeSearchClue(keyword)
        const currentOtherId = side === 'left' ? rightClue.value?.id : leftClue.value?.id
        if (currentOtherId && Number(currentOtherId) === Number(result.id)) {
            message.warning('两侧不能选择同一张名片')
            return
        }
        await loadClueDetail(side, Number(result.id))
        if (!keepClueId.value) {
            keepClueId.value = Number(result.id)
        }
    } finally {
        searchLoading[side] = false
    }
}

function handleKeepChange(value?: number) {
    keepClueId.value = value ? Number(value) : undefined
}

function formatDisplayTime(value?: string) {
    const parsed = resolveTimestamp(value)
    return parsed ? formatDate(parsed.toDate()) : '--'
}

async function handleConfirm() {
    const leftId = Number(leftClue.value?.id)
    const rightId = Number(rightClue.value?.id)
    const keepId = Number(keepClueId.value)
    if (!leftId || !rightId) {
        message.warning('请先选择两张名片')
        return
    }
    if (!keepId || ![leftId, rightId].includes(keepId)) {
        message.warning('请选择保留名片')
        return
    }
    const mergedId = keepId === leftId ? rightId : leftId
    const mergedData = keepId === leftId ? normalizeForm(leftForm) : normalizeForm(rightForm)
    if (!mergedData.mobile) {
        message.warning('保留名片手机号不能为空')
        return
    }
    submitLoading.value = true
    try {
        emit('confirm', {
            keepClueId: keepId,
            mergedClueId: mergedId,
            remark: remark.value?.trim() || undefined,
            mergedData
        })
    } finally {
        submitLoading.value = false
    }
}

watch(
    () => dialogVisible.value,
    (visible) => {
        if (!visible) return
        initializeDialog()
    }
)
</script>

<style scoped lang="scss">
.clue-merge-dialog {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.clue-merge-dialog__tip {
    padding: 12px 14px;
    border: 1px solid #f2d58a;
    border-radius: 10px;
    background: #fff7e6;
    color: #8c5a11;
    font-size: 13px;
    line-height: 20px;
}

.clue-merge-dialog__search {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.clue-merge-dialog__search-item {
    display: flex;
    align-items: center;
    gap: 12px;
}

.clue-merge-dialog__body {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.clue-merge-dialog__column {
    min-width: 0;
}

.clue-merge-card {
    height: 100%;
    padding: 16px;
    border: 1px solid #ebeef5;
    border-radius: 14px;
    background: linear-gradient(180deg, #fffdf8 0%, #ffffff 120px);
}

.clue-merge-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
}

.clue-merge-card__title {
    color: #303133;
    font-size: 16px;
    font-weight: 700;
    line-height: 24px;
}

.clue-merge-form {
    :deep(.el-form-item) {
        margin-bottom: 14px;
    }

    :deep(.el-input),
    :deep(.el-select),
    :deep(.el-tree-select) {
        width: 100%;
    }
}

.clue-merge-card__text {
    min-height: 32px;
    color: #606266;
    line-height: 32px;
}

.clue-merge-dialog__remark {
    padding: 8px 0 0;
}

@media (max-width: 1200px) {
    .clue-merge-dialog__search,
    .clue-merge-dialog__body {
        grid-template-columns: 1fr;
    }
}
</style>
