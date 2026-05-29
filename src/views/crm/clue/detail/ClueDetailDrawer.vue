<template>
    <el-drawer
        v-model="drawerVisible"
        :with-header="false"
        direction="rtl"
        size="1120px"
        append-to-body
        :close-on-click-modal="false"
        class="clue-detail-drawer"
    >
        <div class="clue-detail-drawer__shell">
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
                    :wework-contacts="weworkContacts"
                    @edit="openForm"
                    @cancel-edit="cancelEdit"
                    @save="handleSave"
                    @sms="handleSms"
                    @enroll="openEnroll"
                    @transfer="handleTransfer"
                    @tag="handleTag"
                    @close="drawerVisible = false"
                />
            </div>
        </div>
    </el-drawer>

    <ClueEnrollDialog ref="enrollRef" @success="handleEnrollSuccess" />
    <CrmTransferForm
        ref="transferRef"
        :biz-type="BizTypeEnum.CRM_CLUE"
        @success="handleTransferSuccess"
    />
    <Dialog v-model="tagDialogVisible" title="加标签" width="520px">
        <el-form label-width="80px">
            <el-form-item label="标签" required>
                <el-select
                    v-model="tagForm.tagIds"
                    multiple
                    filterable
                    clearable
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
        </el-form>
        <template #footer>
            <el-button @click="tagDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitTag">确定</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import * as ClueApi from '@/api/crm/clue'
import * as CustomerDetailApi from '@/api/crm/customerDetail'
import * as ProductCategoryApi from '@/api/crm/product/category'
import { getOperateLogPage } from '@/api/crm/operateLog'
import { BizTypeEnum } from '@/api/crm/permission'
import type { OperateLogVO } from '@/api/system/operatelog'
import * as ClueSourceApi from '@/api/system/clueSource'
import * as TagGroupApi from '@/api/system/tag-group'
import { hasPermission } from '@/directives/permission/hasPermi'
import CrmTransferForm from '@/views/crm/permission/components/TransferForm.vue'
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
const transferRef = ref<InstanceType<typeof CrmTransferForm>>()
const message = useMessage()
const projectOptions = ref<{ id: number; name: string; children?: any[] }[]>([])
const clueSourceOptions = ref<{ label: string; value: number }[]>([])
const tagOptions = ref<{ label: string; value: number }[]>([])
const weworkContacts = ref<CustomerDetailApi.CustomerWeworkContactItem[]>([])
const tagDialogVisible = ref(false)
const tagForm = reactive({ tagIds: [] as number[] })

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
        const [clueResp, weworkResp] = await Promise.all([
            ClueApi.getClue(clueId.value),
            CustomerDetailApi.getCustomerWeworkInfo(clueId.value)
        ])
        clue.value = clueResp
        weworkContacts.value = weworkResp?.contacts || []
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
            avatar: formData.avatar?.trim() || undefined,
            idCardNo: formData.idCardNo?.trim() || undefined,
            certificateType: formData.certificateType?.trim() || undefined,
            gender: formData.gender,
            education: formData.education,
            intentLevel: formData.intentLevel,
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
    if (!clue.value.id) return
    transferRef.value?.open(Number(clue.value.id))
}

const handleTag = () => {
    tagForm.tagIds = (clue.value.tagIds || []).map((item) => Number(item))
    tagDialogVisible.value = true
}

const handleTransferSuccess = async () => {
    message.success('转移成功')
    await getClue()
}

const submitTag = async () => {
    if (!clue.value.id || !tagForm.tagIds.length) {
        message.warning('请选择标签')
        return
    }
    await ClueApi.batchAppendClueTags({
        clueIds: [Number(clue.value.id)],
        tagIds: tagForm.tagIds
    })
    message.success('加标签成功')
    tagDialogVisible.value = false
    await getClue()
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
}

.clue-detail-drawer__body {
    flex: 1;
    padding: 0px 0px 0;
    overflow: auto;
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

    .clue-detail-drawer__body {
        padding: 16px 16px 0;
    }
}
</style>
