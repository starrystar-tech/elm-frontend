<template>
    <ContentWrap>
        <div class="mb-12px flex justify-between items-center p-20px">
            <div class="text-16px font-600">企微自建应用</div>
            <BaseButton v-if="canCreate" type="primary" @click="openForm('create')"
                >新增应用</BaseButton
            >
        </div>

        <el-row :gutter="16" v-loading="loading" class="p-20px">
            <el-col
                :xs="24"
                :sm="12"
                :md="8"
                :lg="6"
                v-for="item in list"
                :key="item.id"
                class="mb-16px"
            >
                <el-card shadow="hover" class="app-card">
                    <div class="flex justify-between items-start mb-10px">
                        <el-tag :type="item.enabled ? 'success' : 'info'">{{
                            item.enabled ? '已上线' : '已下线'
                        }}</el-tag>
                        <div>
                            <BaseButton
                                v-if="canUpdate"
                                link
                                type="primary"
                                @click="openForm('update', item)"
                                >编辑</BaseButton
                            >
                            <BaseButton
                                v-if="canDelete"
                                link
                                type="danger"
                                @click="handleDelete(item.id!)"
                                >删除</BaseButton
                            >
                        </div>
                    </div>
                    <div class="flex items-center gap-12px">
                        <el-avatar :size="48" shape="square" :src="item.appLogo">
                            {{ (item.appName || '应用').slice(0, 1) }}
                        </el-avatar>
                        <div class="app-meta">
                            <div class="font-600 text-15px">{{ item.appName || '未命名应用' }}</div>
                            <div class="text-12px text-[var(--el-text-color-secondary)] mt-4px"
                                >企业：{{ item.companyName || '-' }}</div
                            >
                            <div class="text-12px text-[var(--el-text-color-secondary)] mt-4px"
                                >CorpId：{{ item.corpId || '-' }}</div
                            >
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-empty v-if="!loading && list.length === 0" description="暂无自建应用" />
    </ContentWrap>

    <WeworkForm ref="formRef" @success="loadList" />
</template>

<script setup lang="ts">
import * as WeappApi from '@/api/system/weapp'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { hasPermission } from '@/directives/permission/hasPermi'
import WeworkForm from './WeworkForm.vue'

defineOptions({ name: 'SystemWeworkConfig' })

const message = useMessage()
const canCreate = hasPermission(['system:weapp-config:create'])
const canUpdate = hasPermission(['system:weapp-config:update'])
const canDelete = hasPermission(['system:weapp-config:delete'])

const loading = ref(false)
const list = ref<WeappApi.WeappConfigVO[]>([])
const formRef = ref<InstanceType<typeof WeworkForm>>()

const loadList = async () => {
    loading.value = true
    try {
        list.value = await WeappApi.getWeappConfigList()
    } finally {
        loading.value = false
    }
}

const openForm = (type: string, row?: WeappApi.WeappConfigVO) => {
    formRef.value?.open(type, row)
}

const handleDelete = async (id: number) => {
    await message.delConfirm()
    await WeappApi.deleteWeappConfig(id)
    message.success('删除成功')
    await loadList()
}

onMounted(() => {
    loadList()
})
</script>

<style scoped>
.app-card {
    border-radius: 10px;
}

.app-meta {
    min-width: 0;
}
</style>
