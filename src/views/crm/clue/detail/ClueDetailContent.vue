<template>
    <div class="clue-card-query">
        <div class="clue-hero" v-loading="loading">
            <div class="clue-hero__main">
                <div class="clue-avatar">{{ avatarText }}</div>
                <div class="clue-hero__meta">
                    <div class="clue-hero__name-row">
                        <h3>{{ clue.name || '--' }}</h3>
                        <el-tag effect="dark" round class="clue-hero__intent">
                            {{ clue.intentLevelName || '--' }}
                        </el-tag>
                    </div>
                    <p>
                        {{ clue.mobile || '--' }}
                        <span v-if="clue.mobile2"> / {{ clue.mobile2 }} </span>
                    </p>
                    <div class="clue-hero__subline">
                        <span>归属：{{ clue.currentOwnerName || '--' }}</span>
                        <span>部门：{{ clue.currentDepartmentName || '--' }}</span>
                        <span>名片编号：{{ clue.customerId || clue.id || '--' }}</span>
                    </div>
                </div>
            </div>
            <div class="clue-hero__actions">
                <el-button plain @click="emit('sms')">短信</el-button>
                <el-button plain @click="emit('enroll')">报名</el-button>
                <el-button plain @click="emit('transfer')">转移</el-button>
                <el-button plain @click="emit('tag')">加标签</el-button>
            </div>
        </div>

        <div class="clue-columns">
            <div class="clue-column">
                <section class="clue-section">
                    <div class="clue-section__title">
                        <span>基本信息</span>
                        <div v-if="canUpdate" class="clue-section__actions">
                            <template v-if="!editing">
                                <el-button link type="primary" @click="emit('edit')"
                                    >编辑</el-button
                                >
                            </template>
                            <template v-else>
                                <el-button link @click="emit('cancel-edit')">取消</el-button>
                                <el-button
                                    link
                                    type="primary"
                                    :loading="saving"
                                    @click="
                                        emit('save', {
                                            formRef: editFormRef,
                                            formData: { ...editForm }
                                        })
                                    "
                                >
                                    保存
                                </el-button>
                            </template>
                        </div>
                    </div>
                    <el-form
                        v-if="editing"
                        ref="editFormRef"
                        :model="editForm"
                        :rules="editRules"
                        label-position="top"
                        class="clue-edit-form"
                    >
                        <div class="clue-info-grid clue-info-grid--edit">
                            <el-form-item label="手机号" prop="mobile">
                                <el-input v-model="editForm.mobile" placeholder="请输入手机号" />
                            </el-form-item>
                            <el-form-item label="手机号2">
                                <el-input v-model="editForm.mobile2" placeholder="请输入手机号2" />
                            </el-form-item>
                            <el-form-item label="微信号">
                                <el-input v-model="editForm.wechat" placeholder="请输入微信号" />
                            </el-form-item>
                            <el-form-item label="微信号2">
                                <el-input v-model="editForm.wechat2" placeholder="请输入微信号2" />
                            </el-form-item>
                            <el-form-item label="QQ">
                                <el-input v-model="editForm.qq" placeholder="请输入QQ" />
                            </el-form-item>
                            <el-form-item label="证件类型">
                                <el-select
                                    v-model="editForm.certificateType"
                                    clearable
                                    placeholder="请选择"
                                    class="w-1/1"
                                >
                                    <el-option label="身份证" value="身份证" />
                                    <el-option label="护照" value="护照" />
                                    <el-option label="港澳通行证" value="港澳通行证" />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="证件号码">
                                <el-input
                                    v-model="editForm.idCardNo"
                                    placeholder="请输入证件号码"
                                />
                            </el-form-item>
                            <el-form-item label="姓名">
                                <el-input v-model="editForm.name" placeholder="请输入姓名" />
                            </el-form-item>
                            <el-form-item label="性别">
                                <el-select
                                    v-model="editForm.gender"
                                    clearable
                                    placeholder="请选择"
                                    class="w-1/1"
                                >
                                    <el-option label="男" :value="1" />
                                    <el-option label="女" :value="2" />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="学历">
                                <el-select
                                    v-model="editForm.education"
                                    clearable
                                    placeholder="请选择"
                                    class="w-1/1"
                                >
                                    <el-option
                                        v-for="item in educationOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="来源" prop="clueSourceId">
                                <el-select
                                    v-model="editForm.clueSourceId"
                                    clearable
                                    filterable
                                    placeholder="请选择"
                                    class="w-1/1"
                                >
                                    <el-option
                                        v-for="item in clueSourceOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="地区" prop="areaId">
                                <AreaSelect
                                    v-model="editForm.areaId"
                                    :include-all-node="false"
                                    placeholder="请选择地区"
                                />
                            </el-form-item>
                            <el-form-item label="咨询项目" prop="consultProjectId">
                                <el-tree-select
                                    v-model="editForm.consultProjectId"
                                    :data="projectOptions"
                                    :props="treeProps"
                                    node-key="id"
                                    check-strictly
                                    clearable
                                    filterable
                                    default-expand-all
                                    placeholder="请选择"
                                    style="width: 100%"
                                />
                            </el-form-item>
                            <el-form-item label="标签">
                                <el-select
                                    v-model="editForm.tagIds"
                                    multiple
                                    filterable
                                    clearable
                                    placeholder="请点击选择标签"
                                    class="w-1/1"
                                >
                                    <el-option
                                        v-for="item in tagOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item
                                label="咨询备注"
                                prop="remark"
                                class="clue-edit-form__full"
                            >
                                <el-input
                                    v-model="editForm.remark"
                                    type="textarea"
                                    :rows="4"
                                    placeholder="请输入咨询备注"
                                />
                            </el-form-item>
                        </div>
                    </el-form>
                    <div v-else class="clue-info-grid">
                        <div
                            v-for="item in basicInfoItems"
                            :key="item.label"
                            class="clue-info-item"
                        >
                            <label>{{ item.label }}</label>
                            <div>{{ item.value }}</div>
                        </div>
                    </div>
                </section>

                <section class="clue-section">
                    <div class="clue-section__title">
                        <span>客户轨迹</span>
                        <div class="clue-section__filters">
                            <el-select model-value="" placeholder="请选择类型" style="width: 140px">
                                <el-option label="全部" value="" />
                            </el-select>
                            <el-input
                                model-value=""
                                placeholder="开始时间 ~ 结束时间"
                                style="width: 220px"
                            />
                        </div>
                    </div>
                    <div class="timeline-list">
                        <div v-for="item in mockTimeline" :key="item.id" class="timeline-item">
                            <div class="timeline-dot"></div>
                            <div class="timeline-card">
                                <div class="timeline-card__header">
                                    <span class="timeline-card__title">{{ item.title }}</span>
                                    <span class="timeline-card__meta">
                                        操作: {{ item.operator }} | {{ item.time }}
                                    </span>
                                </div>
                                <div class="timeline-card__body">
                                    <p v-for="line in item.lines" :key="line">{{ line }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div class="clue-column clue-column--side">
                <section class="clue-section">
                    <div class="clue-section__title">
                        <span>咨询概览</span>
                    </div>
                    <div class="summary-cards">
                        <div v-for="item in mockSummary" :key="item.label" class="summary-card">
                            <div class="summary-card__label">{{ item.label }}</div>
                            <div class="summary-card__value">{{ item.value }}</div>
                            <div class="summary-card__desc">{{ item.desc }}</div>
                        </div>
                    </div>
                </section>

                <section class="clue-section">
                    <div class="clue-section__title">
                        <span>最近跟进</span>
                    </div>
                    <div class="follow-cards">
                        <div v-for="item in mockFollowUps" :key="item.id" class="follow-card">
                            <div class="follow-card__header">
                                <strong>{{ item.title }}</strong>
                                <span>{{ item.time }}</span>
                            </div>
                            <p>{{ item.content }}</p>
                        </div>
                    </div>
                </section>

                <section class="clue-section">
                    <div class="clue-section__title">
                        <span>团队成员</span>
                    </div>
                    <div class="member-list">
                        <div v-for="item in mockMembers" :key="item.name" class="member-item">
                            <div class="member-item__avatar">{{ item.name.slice(0, 1) }}</div>
                            <div class="member-item__meta">
                                <div>{{ item.name }}</div>
                                <span>{{ item.role }}</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import AreaSelect from '@/components/AreaSelect.vue'
import * as ClueApi from '@/api/crm/clue'
import type { OperateLogVO } from '@/api/system/operatelog'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

const props = defineProps<{
    clue: ClueApi.ClueVO
    clueId: number
    loading: boolean
    canUpdate: boolean
    logList: OperateLogVO[]
    editing: boolean
    saving: boolean
    projectOptions: { id: number; name: string; children?: any[] }[]
    clueSourceOptions: { label: string; value: number }[]
    tagOptions: { label: string; value: number }[]
}>()

const emit = defineEmits<{
    edit: []
    'cancel-edit': []
    save: [payload: { formRef: any; formData: any }]
    sms: []
    enroll: []
    transfer: []
    tag: []
}>()

const mockSummary = [
    { label: '咨询项目', value: '自考本科', desc: '最近一次咨询项目' },
    { label: '客户来源', value: '企微客户同步', desc: '首条来源记录' },
    { label: '报名次数', value: '2', desc: '含历史报名记录' },
    { label: '反馈状态', value: '有效', desc: '最近一次电销反馈' }
]

const mockTimeline = [
    {
        id: 1,
        title: '上传附件',
        operator: '张三',
        time: '2026-05-20 11:08:36',
        lines: ['客户资料.pdf']
    },
    {
        id: 2,
        title: '咨询记录',
        operator: '管理员',
        time: '2026-05-18 17:19:11',
        lines: ['是否有效：有效', '下次回访时间：2026-05-28 11:08', '回访备注：客户关注报名周期']
    },
    {
        id: 3,
        title: '分配更改',
        operator: '销售主管',
        time: '2026-05-11 12:00:00',
        lines: [
            '归属部门：销售一部 -> 运营一部',
            '归属人：李四 -> 李组长',
            '库类型：待回访 -> 已回访'
        ]
    }
]

const mockFollowUps = [
    {
        id: 1,
        title: '电话回访',
        time: '今天 10:20',
        content: '已确认客户正在比较课程价格，约明天下午继续沟通。'
    },
    {
        id: 2,
        title: '企微沟通',
        time: '昨天 18:40',
        content: '发送了专业介绍和费用说明，客户已读未回。'
    }
]

const mockMembers = [
    { name: '李组长', role: '当前归属人' },
    { name: '王顾问', role: '跟进协作人' },
    { name: '赵主管', role: '部门主管' }
]

const avatarText = computed(() => (props.clue.name || '线').slice(0, 1))
const editFormRef = ref()

const treeProps = {
    value: 'id',
    label: 'name',
    children: 'children'
}

const educationOptions = getIntDictOptions(DICT_TYPE.CRM_CLUE_EDUCATION)

const regionText = computed(() => {
    const names = [props.clue.province, props.clue.city, props.clue.district].filter(Boolean)
    return names.length ? names.join(' / ') : props.clue.areaName || '--'
})

const editForm = reactive({
    id: undefined as number | undefined,
    mobile: '',
    mobile2: '',
    wechat: '',
    wechat2: '',
    qq: '',
    certificateType: '',
    idCardNo: '',
    name: '',
    gender: undefined as number | undefined,
    education: undefined as number | undefined,
    areaId: undefined as number | undefined,
    consultProjectId: undefined as number | undefined,
    clueSourceId: undefined as number | undefined,
    clueSourceName: '',
    tagIds: [] as number[],
    remark: ''
})

const editRules = reactive({
    mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    clueSourceId: [{ required: true, message: '请选择来源', trigger: 'change' }],
    areaId: [{ required: true, message: '请选择地区', trigger: 'change' }],
    consultProjectId: [{ required: true, message: '请选择咨询项目', trigger: 'change' }]
})

const syncEditForm = () => {
    editForm.id = props.clue.id
    editForm.mobile = props.clue.mobile || ''
    editForm.mobile2 = props.clue.mobile2 || ''
    editForm.wechat = props.clue.wechat || ''
    editForm.wechat2 = props.clue.wechat2 || ''
    editForm.qq = props.clue.qq || ''
    editForm.certificateType = props.clue.certificateType || ''
    editForm.idCardNo = props.clue.idCardNo || ''
    editForm.name = props.clue.name || ''
    editForm.gender = props.clue.gender
    editForm.education = props.clue.education
    editForm.areaId = props.clue.areaId
    editForm.consultProjectId = props.clue.consultProjectId
    editForm.clueSourceId = props.clue.clueSourceId
    editForm.clueSourceName = props.clue.clueSourceName || '--'
    editForm.tagIds = (props.clue.tagIds || []).map((item) => Number(item))
    editForm.remark = props.clue.remark || ''
}

watch(
    () => props.clue,
    () => {
        syncEditForm()
    },
    { immediate: true, deep: true }
)

watch(
    () => props.editing,
    (value) => {
        if (value) {
            syncEditForm()
            nextTick(() => editFormRef.value?.clearValidate?.())
        }
    }
)

const tagText = computed(() => {
    if (props.clue.tagNames?.length) {
        return props.clue.tagNames.join('、')
    }
    if (!props.clue.tagIds?.length || !props.tagOptions.length) {
        return '--'
    }
    const optionMap = new Map(props.tagOptions.map((item) => [Number(item.value), item.label]))
    const labels = props.clue.tagIds
        .map((item) => optionMap.get(Number(item)))
        .filter((item): item is string => !!item)
    return labels.length ? labels.join('、') : '--'
})

const basicInfoItems = computed(() => [
    { label: '客户ID', value: props.clue.customerId || '--' },
    { label: '手机号', value: props.clue.mobile || '--' },
    { label: '手机号2', value: props.clue.mobile2 || '--' },
    { label: '微信号', value: props.clue.wechat || '--' },
    { label: '微信号2', value: props.clue.wechat2 || '--' },
    { label: 'QQ', value: props.clue.qq || '--' },
    { label: '证件类型', value: props.clue.certificateType || '--' },
    { label: '证件号码', value: props.clue.idCardNo || '--' },
    { label: '姓名', value: props.clue.name || '--' },
    { label: '性别', value: props.clue.genderName || '--' },
    { label: '学历', value: props.clue.educationName || '--' },
    { label: '来源', value: props.clue.clueSourceName || mockSummary[1].value },
    { label: '地区', value: regionText.value },
    { label: '咨询项目', value: props.clue.consultProjectName || mockSummary[0].value },
    { label: '标签', value: tagText.value },
    { label: '咨询备注', value: props.clue.remark || '--' }
])
</script>

<style scoped lang="scss">
.clue-card-query {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.clue-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 18px;
    border-radius: 14px;
    color: #fff;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.24);
}

.clue-hero__main {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
}

.clue-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.24);
    border: 3px solid rgba(255, 255, 255, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 700;
    flex-shrink: 0;
}

.clue-hero__meta h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
}

.clue-hero__name-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.clue-hero__meta p,
.clue-hero__subline {
    margin: 6px 0 0;
    font-size: 13px;
    opacity: 0.95;
}

.clue-hero__subline {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.clue-hero__actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
}

.clue-hero__actions :deep(.el-button--default) {
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.22);
}

.clue-hero__intent {
    border: none;
}

.clue-columns {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(340px, 0.75fr);
    gap: 14px;
    align-items: start;
}

.clue-column {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
}

.clue-section {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 12px;
    padding: 18px;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}

.clue-section__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 2px solid #edf2ff;
    position: relative;
    font-size: 15px;
    font-weight: 600;
    color: #333;
}

.clue-section__title::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -2px;
    width: 42px;
    height: 2px;
    background: #764ba2;
}

.clue-section__actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.clue-section__filters {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.clue-info-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 18px;
}

.clue-info-grid--edit {
    align-items: start;
}

.clue-info-item {
    min-width: 0;
}

.clue-info-item label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    color: #909399;
}

.clue-info-item div {
    min-height: 22px;
    color: #303133;
    line-height: 1.65;
    word-break: break-all;
}

.clue-edit-form :deep(.el-form-item) {
    margin-bottom: 0;
}

.clue-edit-form__full {
    grid-column: 1 / -1;
}

.timeline-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.timeline-item {
    display: flex;
    gap: 12px;
    align-items: stretch;
}

.timeline-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-top: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 0 0 5px rgba(118, 75, 162, 0.08);
    flex-shrink: 0;
}

.timeline-card {
    flex: 1;
    border-radius: 10px;
    background: #fafbff;
    border: 1px solid #eef1f8;
    padding: 14px 16px;
}

.timeline-card__header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
}

.timeline-card__title {
    font-weight: 600;
    color: #303133;
}

.timeline-card__meta {
    font-size: 12px;
    color: #909399;
}

.timeline-card__body p {
    margin: 0 0 6px;
    color: #606266;
    line-height: 1.7;
}

.summary-cards,
.follow-cards,
.member-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.summary-card {
    border-radius: 10px;
    padding: 14px;
    background: linear-gradient(180deg, #fafbff 0%, #f4f6ff 100%);
    border: 1px solid #edf1ff;
}

.summary-card__label {
    font-size: 12px;
    color: #909399;
}

.summary-card__value {
    margin-top: 6px;
    font-size: 20px;
    font-weight: 700;
    color: #303133;
}

.summary-card__desc {
    margin-top: 4px;
    font-size: 12px;
    color: #606266;
}

.follow-card {
    border-radius: 10px;
    border: 1px solid #eef0f5;
    background: #fcfcfd;
    padding: 14px;
}

.follow-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
    color: #303133;
}

.follow-card__header span,
.member-item__meta span {
    font-size: 12px;
    color: #909399;
}

.follow-card p {
    margin: 0;
    color: #606266;
    line-height: 1.7;
}

.member-item {
    display: flex;
    align-items: center;
    gap: 12px;
}

.member-item__avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, #7a89ff 0%, #8a5fd0 100%);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    flex-shrink: 0;
}

.member-item__meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

@media (max-width: 960px) {
    .clue-columns {
        grid-template-columns: 1fr;
    }

    .clue-info-grid {
        grid-template-columns: 1fr;
    }

    .clue-hero {
        flex-direction: column;
        align-items: stretch;
    }

    .clue-hero__actions {
        justify-content: flex-start;
        flex-wrap: wrap;
    }

    .timeline-card__header {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
