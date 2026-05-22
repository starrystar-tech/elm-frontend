<template>
    <CustomerDetailsHeader :clue="clue" :loading="loading">
        <el-button v-hasPermi="['crm:clue:update']" type="primary" @click="openForm"
            >编辑</el-button
        >
        <el-button type="default" @click="goBack">返回</el-button>
    </CustomerDetailsHeader>

    <el-col>
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

    <CustomerForm ref="formRef" @success="getClue" />
</template>

<script lang="ts" setup>
import * as ClueApi from '@/api/crm/clue'
import CustomerForm from '@/views/crm/customer/CustomerForm.vue'
import CustomerDetailsInfo from './CustomerDetailsInfo.vue'
import CustomerDetailsHeader from './CustomerDetailsHeader.vue'
import { useTagsViewStore } from '@/store/modules/tagsView'
import { ContentWrap } from '@/components/ContentWrap'

defineOptions({ name: 'CrmCustomerDetail' })

const clueId = ref(0)
const clue = ref<ClueApi.ClueVO>({} as ClueApi.ClueVO)
const loading = ref(true)
const activeTabName = ref('basicInfo')
const formRef = ref<InstanceType<typeof CustomerForm>>()
const message = useMessage()
const { delView } = useTagsViewStore()
const { push, currentRoute } = useRouter()
const { params } = useRoute()

const getClue = async () => {
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

const goBack = () => {
    delView(unref(currentRoute))
    push({ name: 'CrmCustomer' })
}

onMounted(async () => {
    if (!params.id) {
        message.warning('参数错误，学员不能为空！')
        goBack()
        return
    }
    clueId.value = Number(params.id)
    await getClue()
})
</script>
