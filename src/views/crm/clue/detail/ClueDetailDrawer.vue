<template>
    <el-drawer
        v-model="drawerVisible"
        :with-header="false"
        direction="rtl"
        size="1120px"
        append-to-body
        class="clue-detail-drawer"
    >
        <div class="clue-detail-drawer__shell" v-loading="loading">
            <div class="clue-detail-drawer__header">
                <div>
                    <div class="clue-detail-drawer__title">名片详情</div>
                </div>
                <el-button circle plain @click="drawerVisible = false">
                    <Icon icon="ep:close" />
                </el-button>
            </div>

            <div class="clue-detail-drawer__body">
                <ClueDetailContent
                    :clue="clue"
                    :clue-id="clueId"
                    :loading="loading"
                    :can-update="canUpdate"
                    :log-list="logList"
                    :editing="editing"
                    :saving="saving"
                    :project-options="projectOptions"
                    :clue-source-options="clueSourceOptions"
                    :tag-options="tagOptions"
                    @edit="openForm"
                    @cancel-edit="cancelEdit"
                    @save="handleSave"
                    @sms="handleSms"
                    @enroll="openEnroll"
                    @transfer="handleTransfer"
                    @tag="handleTag"
                />
            </div>
        </div>
    </el-drawer>

    <ClueEnrollDialog ref="enrollRef" @success="handleEnrollSuccess" />
</template>

<script setup lang="ts">
import * as ClueApi from '@/api/crm/clue'
import * as ProductCategoryApi from '@/api/crm/product/category'
import { getOperateLogPage } from '@/api/crm/operateLog'
import { BizTypeEnum } from '@/api/crm/permission'
import type { OperateLogVO } from '@/api/system/operatelog'
import * as ClueSourceApi from '@/api/system/clueSource'
import * as TagGroupApi from '@/api/system/tag-group'
import { hasPermission } from '@/directives/permission/hasPermi'
import ClueEnrollDialog from './ClueEnrollDialog.vue'
import ClueDetailContent from './ClueDetailContent.vue'

defineOptions({ name: 'ClueDetailDrawer' })

const drawerVisible = ref(false)
const clueId = ref(0)
const loading = ref(false)
const saving = ref(false)
const editing = ref(false)
const clue = ref<ClueApi.ClueVO>({})
const logList = ref<OperateLogVO[]>([])
const canUpdate = hasPermission(['crm:clue:basic-info:update'])
const enrollRef = ref<InstanceType<typeof ClueEnrollDialog>>()
const message = useMessage()
const projectOptions = ref<{ id: number; name: string; children?: any[] }[]>([])
const clueSourceOptions = ref<{ label: string; value: number }[]>([])
const tagOptions = ref<{ label: string; value: number }[]>([])

const loadOptions = async () => {
    const [projects, tagGroups, clueSources] = await Promise.all([
        ProductCategoryApi.getProductCategorySimpleList(),
        TagGroupApi.getTagGroupList(),
        ClueSourceApi.getEnabledClueSourceList()
    ])
    projectOptions.value = (projects || []).map((item) => ({
        ...item,
        id: Number(item.id)
    }))
    tagOptions.value = (tagGroups || []).flatMap((group) =>
        (group.tags || []).map((tag) => ({
            label: `${group.name} / ${tag.name}`,
            value: Number(tag.id)
        }))
    )
    clueSourceOptions.value = (clueSources || []).map((item) => ({
        label: item.name,
        value: Number(item.id)
    }))
}

const getOperateLog = async () => {
    const data = await getOperateLogPage({
        bizType: BizTypeEnum.CRM_CLUE,
        bizId: clueId.value
    })
    logList.value = data.list || []
}

const getClue = async () => {
    if (!clueId.value) return
    loading.value = true
    try {
        clue.value = await ClueApi.getClue(clueId.value)
        await getOperateLog()
    } finally {
        loading.value = false
    }
}

const openForm = () => {
    editing.value = true
}

const cancelEdit = () => {
    editing.value = false
}

const handleSave = async (payload: { formRef: any; formData: any }) => {
    const valid = await payload.formRef?.validate?.()
    if (!valid) return

    saving.value = true
    try {
        const formData = payload.formData
        await ClueApi.updateClueBasicInfo({
            id: Number(clue.value.id),
            name: formData.name?.trim() || '',
            mobile: formData.mobile.trim(),
            mobile2: formData.mobile2?.trim() || undefined,
            wechat: formData.wechat?.trim() || undefined,
            wechat2: formData.wechat2?.trim() || undefined,
            qq: formData.qq?.trim() || undefined,
            idCardNo: formData.idCardNo?.trim() || undefined,
            certificateType: formData.certificateType?.trim() || undefined,
            gender: formData.gender,
            education: formData.education,
            areaId: Number(formData.areaId),
            consultProjectId: Number(formData.consultProjectId),
            clueSourceId: formData.clueSourceId ? Number(formData.clueSourceId) : undefined,
            tagIds: formData.tagIds?.length ? formData.tagIds : undefined,
            remark: formData.remark?.trim() || undefined
        })
        message.success('保存成功')
        editing.value = false
        await getClue()
    } finally {
        saving.value = false
    }
}

const openEnroll = () => {
    enrollRef.value?.open(clue.value)
}

const handleEnrollSuccess = async () => {
    await getClue()
}

const handleSms = () => {
    message.info('短信功能待接入')
}

const handleTransfer = () => {
    message.info('转移功能待接入')
}

const handleTag = () => {
    message.info('标签功能待接入')
}

const open = async (id: number) => {
    clueId.value = id
    drawerVisible.value = true
    editing.value = false
    await loadOptions()
    await getClue()
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.clue-detail-drawer__shell {
    height: 100%;
    display: flex;
    flex-direction: column;
    background:
        radial-gradient(circle at top left, rgba(120, 138, 189, 0.08), transparent 24%),
        linear-gradient(180deg, #fbfcff 0%, #f7f9fc 100%);
}

.clue-detail-drawer__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    color: #2f3a4f;
    background: linear-gradient(180deg, #f7f9fd 0%, #eff3f9 100%);
    border-bottom: 1px solid #ccc;
}

.clue-detail-drawer__title {
    font-size: 20px;
    font-weight: 600;
    line-height: 1.2;
}

.clue-detail-drawer__subtitle {
    margin-top: 6px;
    font-size: 12px;
    color: #7a8699;
}

.clue-detail-drawer__body {
    flex: 1;
    overflow: auto;
    padding: 16px;
}

:deep(.clue-detail-drawer .el-drawer) {
    width: min(1120px, 92vw) !important;
    border-radius: 20px 0 0 20px;
    overflow: hidden;
    box-shadow: -8px 0 32px rgba(15, 23, 42, 0.16);
}

:deep(.clue-detail-drawer .el-drawer__body) {
    padding: 0;
}

@media (max-width: 768px) {
    :deep(.clue-detail-drawer .el-drawer) {
        width: 100vw !important;
        border-radius: 0;
    }

    .clue-detail-drawer__header {
        padding: 18px 16px;
    }

    .clue-detail-drawer__body {
        padding: 12px;
    }
}
</style>
