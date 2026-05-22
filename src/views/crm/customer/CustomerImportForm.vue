<template>
    <Dialog v-model="dialogVisible" title="学员导入" width="480px">
        <el-empty description="学员导入能力暂未接入 clue 导入链路，请先使用线索导入任务。" />
        <div class="mt-12px text-center text-12px text-[#909399]">
            当前页面已停用旧客户导入逻辑，避免继续写入 customer 数据。
        </div>
        <template #footer>
            <el-button type="primary" @click="dialogVisible = false">我知道了</el-button>
        </template>
    </Dialog>
</template>

<script lang="ts" setup>
defineOptions({ name: 'CrmCustomerImportForm' })

const dialogVisible = ref(false)

const open = async () => {
    dialogVisible.value = true
}

defineExpose({ open })
</script>
