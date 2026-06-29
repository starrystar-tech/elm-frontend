<template>
    <ContentWrap>
        <el-tabs v-model="activeTabName" class="customer-tabs">
            <el-tab-pane :label="`我的学员 (${myStudentTotalCount})`" name="mine">
                <MyOrderCustomer v-if="activeTabName === 'mine'" />
            </el-tab-pane>
            <el-tab-pane :label="`全部 (${allStudentTotalCount})`" name="all">
                <CustomerManagement v-if="activeTabName === 'all'" />
            </el-tab-pane>
        </el-tabs>
    </ContentWrap>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import * as ClueApi from '@/api/crm/clue'
import CustomerManagement from './management.vue'
import MyOrderCustomer from './myOrderCustomer.vue'

defineOptions({ name: 'CrmMyCustomer' })

const activeTabName = ref('mine')
const myStudentTotalCount = ref(0)
const allStudentTotalCount = ref(0)

const loadTabCounts = async () => {
    const [myCounts, managementCounts] = await Promise.all([
        ClueApi.getMyClueCounts(),
        ClueApi.getClueManagementCounts()
    ])
    myStudentTotalCount.value = Number(myCounts?.totalCount || 0)
    allStudentTotalCount.value = Number(managementCounts?.totalCount || 0)
}

onMounted(() => {
    loadTabCounts()
})
</script>

<style scoped lang="scss">
.customer-tabs {
    :deep(.el-tabs__header) {
        margin-bottom: 12px;
    }
}
</style>
