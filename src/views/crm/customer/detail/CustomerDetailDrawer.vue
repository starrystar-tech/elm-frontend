<template>
    <el-drawer
        v-model="drawerVisible"
        direction="rtl"
        size="1120px"
        title="学员详情"
        append-to-body
        :close-on-click-modal="false"
        class="customer-detail-drawer"
    >
        <CustomerDetailsHeader :clue="clue" :loading="loading">
            <el-button v-hasPermi="['crm:clue:basic-info:update']" @click="openForm">
                编辑
            </el-button>
        </CustomerDetailsHeader>
        <el-col class="px-16px mt-16px">
            <el-tabs v-model="activeTabName">
                <el-tab-pane label="基本信息" name="basicInfo">
                    <CustomerDetailsInfo :clue="clue" />
                </el-tab-pane>
                <el-tab-pane label="预约记录" name="reservations">
                    <ContentWrap>
                        <el-empty description="预约记录暂未接入，当前仅展示学员基础资料。" />
                    </ContentWrap>
                </el-tab-pane>
                <el-tab-pane label="订单列表" name="orders">
                    <ContentWrap>
                        <el-empty description="订单列表暂未接入，后续可按报名链路继续补充。" />
                    </ContentWrap>
                </el-tab-pane>
                <el-tab-pane label="工单记录" name="tickets">
                    <ContentWrap>
                        <el-empty description="工单记录暂未接入。" />
                    </ContentWrap>
                </el-tab-pane>
                <el-tab-pane label="通话记录" name="calls">
                    <ContentWrap>
                        <el-empty description="通话记录暂未接入。" />
                    </ContentWrap>
                </el-tab-pane>
                <el-tab-pane label="短信记录" name="sms">
                    <ContentWrap>
                        <el-empty description="短信记录暂未接入。" />
                    </ContentWrap>
                </el-tab-pane>
            </el-tabs>
        </el-col>
    </el-drawer>

    <CustomerForm ref="formRef" @success="handleFormSuccess" />
</template>

<script lang="ts" setup>
import * as ClueApi from '@/api/crm/clue'
import { ContentWrap } from '@/components/ContentWrap'
import CustomerForm from '@/views/crm/customer/CustomerForm.vue'
import CustomerDetailsHeader from './CustomerDetailsHeader.vue'
import CustomerDetailsInfo from './CustomerDetailsInfo.vue'

defineOptions({ name: 'CustomerDetailDrawer' })

const emit = defineEmits<{
    refresh: []
}>()

const drawerVisible = ref(false)
const clueId = ref(0)
const clue = ref<ClueApi.ClueVO>({} as ClueApi.ClueVO)
const loading = ref(false)
const activeTabName = ref('basicInfo')
const formRef = ref<InstanceType<typeof CustomerForm>>()

const getClue = async () => {
    if (!clueId.value) return
    loading.value = true
    try {
        clue.value = await ClueApi.getClue(clueId.value)
    } finally {
        loading.value = false
    }
}

const openForm = () => {
    formRef.value?.open('update', clueId.value)
}

const handleFormSuccess = async () => {
    await getClue()
    emit('refresh')
}

const open = async (id: number) => {
    clueId.value = id
    activeTabName.value = 'basicInfo'
    drawerVisible.value = true
    await getClue()
}

defineExpose({ open })
</script>
