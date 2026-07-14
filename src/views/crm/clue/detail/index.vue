<template>
    <ClueDetailContent
        :clue="clue"
        :clue-id="clueId"
        :loading="loading"
        :can-update="canUpdate"
        :can-enroll-action="canEnrollAction"
        :can-sms-action="canSmsSend"
        :can-tag-action="canTagUpdate"
        :can-release-action="canRelease"
        :log-list="logList"
        @edit="openForm"
        @sms="handleSms"
    />

    <ClueForm ref="formRef" @success="getClue" />
    <ClueSmsDialog ref="smsDialogRef" />
</template>

<script setup lang="ts">
import * as ClueApi from '@/api/crm/clue'
import { getOperateLogPage } from '@/api/crm/operateLog'
import { BizTypeEnum } from '@/api/crm/permission'
import type { OperateLogVO } from '@/api/system/operatelog'
import { hasPermission } from '@/directives/permission/hasPermi'
import ClueForm from '@/views/crm/clue/ClueForm.vue'
import ClueSmsDialog from '@/views/crm/clue/ClueSmsDialog.vue'
import ClueDetailContent from './ClueDetailContent.vue'

defineOptions({ name: 'CrmClueDetail' })

const clueId = ref(0)
const loading = ref(true)
const message = useMessage()
const canUpdate = hasPermission(['crm:clue:basic-info:update'])
const canEnrollAction = hasPermission(['crm:clue:enroll:update'])
const canSmsSend = hasPermission(['crm:clue:sms:send'])
const canTagUpdate = hasPermission(['crm:clue:tag:update'])
const canMyClueRelease = hasPermission(['crm:my-clue:release'])
const canClueManagementRelease = hasPermission(['crm:clue-management:release'])
const canRelease = computed(() => canMyClueRelease || canClueManagementRelease)

const formRef = ref<InstanceType<typeof ClueForm>>()
const smsDialogRef = ref<InstanceType<typeof ClueSmsDialog>>()
const clue = ref<ClueApi.ClueVO>({})
const logList = ref<OperateLogVO[]>([])

const getOperateLog = async () => {
    const data = await getOperateLogPage({
        bizType: BizTypeEnum.CRM_CLUE,
        bizId: clueId.value
    })
    logList.value = data.list || []
}

const getClue = async () => {
    loading.value = true
    try {
        clue.value = await ClueApi.getClue(clueId.value)
        await getOperateLog()
    } finally {
        loading.value = false
    }
}

const openForm = () => {
    formRef.value?.open('update', clueId.value)
}

const handleSms = () => {
    smsDialogRef.value?.open([clueId.value])
}

const { params } = useRoute()

onMounted(async () => {
    if (!params.id) {
        message.warning('参数错误，线索不能为空！')
        return
    }
    clueId.value = Number(params.id)
    await getClue()
})
</script>
