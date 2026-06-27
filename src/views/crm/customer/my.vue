<template>
    <ContentWrap>
        <el-tabs v-model="activeTabName" class="customer-tabs">
            <el-tab-pane label="我的学员" name="mine">
                <MyOrderCustomer v-if="activeTabName === 'mine'" />
            </el-tab-pane>
            <el-tab-pane label="全部" name="all">
                <CustomerManagement v-if="activeTabName === 'all'" />
            </el-tab-pane>
        </el-tabs>
    </ContentWrap>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import CustomerManagement from './management.vue'
import MyOrderCustomer from './myOrderCustomer.vue'

defineOptions({ name: 'CrmMyCustomer' })

const activeTabName = ref('mine')
</script>

<style scoped lang="scss">
.customer-tabs {
    :deep(.el-tabs__header) {
        margin-bottom: 12px;
    }
}
</style>
