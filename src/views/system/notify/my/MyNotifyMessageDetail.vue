<template>
  <Dialog v-model="dialogVisible" :max-height="500" :scroll="true" title="消息详情">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="提醒分类">
        {{ detailData.categoryName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="客户姓名">
        {{ detailData.customerName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="客户手机号">
        {{ detailData.customerMobile || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="触发时间">
        {{ formatDate(detailData.triggerTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(detailData.createTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="是否已读">
        <el-tag :type="Number(detailData.readStatus) === 1 ? 'success' : 'danger'">
          {{ Number(detailData.readStatus) === 1 ? '已读' : '未读' }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item v-if="Number(detailData.readStatus) === 1" label="阅读时间">
        {{ formatDate(detailData.readTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="内容">
        {{ detailData.displayContent || '-' }}
      </el-descriptions-item>
    </el-descriptions>
  </Dialog>
</template>

<script lang="ts" setup>
import { formatDate } from '@/utils/formatTime'
import * as NotifyMessageApi from '@/api/system/notify/message'

defineOptions({ name: 'MyNotifyMessageDetailDetail' })

const dialogVisible = ref(false)
const detailData = ref({} as NotifyMessageApi.NotifyMessageVO)

const open = async (data: NotifyMessageApi.NotifyMessageVO) => {
  dialogVisible.value = true
  detailData.value = data
}

defineExpose({ open })
</script>
