<template>
    <ClueDetailsHeader :clue="clue" :loading="loading">
        <el-button v-if="canUpdate" type="primary" @click="openForm">编辑</el-button>
    </ClueDetailsHeader>

    <el-col>
        <el-tabs>
            <el-tab-pane label="跟进记录">
                <FollowUpList :biz-id="clueId" :biz-type="BizTypeEnum.CRM_CLUE" />
            </el-tab-pane>
            <el-tab-pane label="基本信息">
                <ClueDetailsInfo :clue="clue" />
            </el-tab-pane>
            <el-tab-pane label="团队成员">
                <PermissionList
                    ref="permissionListRef"
                    :biz-id="clue.id!"
                    :biz-type="BizTypeEnum.CRM_CLUE"
                    :show-action="true"
                />
            </el-tab-pane>
            <el-tab-pane label="操作日志">
                <OperateLogV2 :log-list="logList" />
            </el-tab-pane>
        </el-tabs>
    </el-col>

    <ClueForm ref="formRef" @success="getClue" />
</template>

<script setup lang="ts">
import * as ClueApi from '@/api/crm/clue'
import { getOperateLogPage } from '@/api/crm/operateLog'
import { BizTypeEnum } from '@/api/crm/permission'
import type { OperateLogVO } from '@/api/system/operatelog'
import { hasPermission } from '@/directives/permission/hasPermi'
import ClueForm from '@/views/crm/clue/ClueForm.vue'
import FollowUpList from '@/views/crm/followup/index.vue'
import PermissionList from '@/views/crm/permission/components/PermissionList.vue'
import ClueDetailsHeader from './ClueDetailsHeader.vue'
import ClueDetailsInfo from './ClueDetailsInfo.vue'

defineOptions({ name: 'CrmClueDetail' })

const clueId = ref(0)
const loading = ref(true)
const message = useMessage()
const canUpdate = hasPermission(['crm:clue:basic-info:update'])

const permissionListRef = ref<InstanceType<typeof PermissionList>>()
const formRef = ref<InstanceType<typeof ClueForm>>()
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
