<template>
    <el-drawer
        v-model="drawerVisible"
        direction="rtl"
        size="980px"
        append-to-body
        title="用户详情"
        :close-on-click-modal="false"
        class="system-user-detail-drawer"
    >
        <div class="system-user-detail-drawer__body" v-loading="loading">
            <el-descriptions :column="2" border>
                <el-descriptions-item label="姓名">{{
                    text(userDetail.nickname)
                }}</el-descriptions-item>
                <el-descriptions-item label="成员ID">{{
                    text(userDetail.memberId)
                }}</el-descriptions-item>
                <el-descriptions-item label="用户ID">{{
                    text(userDetail.id)
                }}</el-descriptions-item>
                <el-descriptions-item label="账号">{{
                    text(userDetail.username)
                }}</el-descriptions-item>
                <el-descriptions-item label="账号类型">{{
                    text(userDetail.accountType)
                }}</el-descriptions-item>
                <el-descriptions-item label="用户等级">{{
                    text(userDetail.userLevel)
                }}</el-descriptions-item>
                <el-descriptions-item label="邮箱">{{
                    text(userDetail.email)
                }}</el-descriptions-item>
                <el-descriptions-item label="手机号码">{{
                    text(userDetail.mobile)
                }}</el-descriptions-item>
                <el-descriptions-item label="状态">
                    <DictTag :type="DICT_TYPE.COMMON_STATUS" :value="userDetail.status" />
                </el-descriptions-item>
                <el-descriptions-item label="到期时间">{{
                    text(userDetail.expireTime)
                }}</el-descriptions-item>
                <el-descriptions-item label="管理企业" :span="2">{{
                    text(userDetail.companyName)
                }}</el-descriptions-item>
                <el-descriptions-item label="绑定企业" :span="2">
                    <div v-if="bindItems.length" class="system-user-detail-drawer__bind-list">
                        <div
                            v-for="(item, idx) in bindItems"
                            :key="`${item.name}-${item.corp}-${idx}`"
                        >
                            <span>{{ item.name || '--' }}@</span>
                            <span class="system-user-detail-drawer__corp">
                                {{ item.corp || '--' }}
                            </span>
                        </div>
                    </div>
                    <span v-else>--</span>
                </el-descriptions-item>
                <el-descriptions-item label="呼叫工号">{{
                    text(userDetail.callNo)
                }}</el-descriptions-item>
                <el-descriptions-item label="呼叫分机">{{
                    text(userDetail.callExt)
                }}</el-descriptions-item>
                <el-descriptions-item label="所属部门">{{
                    text(userDetail.deptName)
                }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatCreateTime }}</el-descriptions-item>
                <el-descriptions-item label="校区权限" :span="2">{{
                    text(userDetail.campusNames)
                }}</el-descriptions-item>
                <el-descriptions-item label="管辖地区" :span="2">{{
                    text(userDetail.areaNames)
                }}</el-descriptions-item>
                <el-descriptions-item label="管辖产品" :span="2">{{
                    text(userDetail.categoryNames)
                }}</el-descriptions-item>
                <el-descriptions-item label="部门权限" :span="2">{{
                    text(userDetail.permissionDeptNames)
                }}</el-descriptions-item>
                <el-descriptions-item label="备注" :span="2">{{
                    text(userDetail.remark)
                }}</el-descriptions-item>
            </el-descriptions>
        </div>
        <template #footer>
            <div class="system-user-detail-drawer__footer">
                <el-button type="primary" @click="drawerVisible = false">关闭</el-button>
            </div>
        </template>
    </el-drawer>
</template>

<script setup lang="ts">
import { DICT_TYPE } from '@/utils/dict'
import * as UserApi from '@/api/system/user'
import { DictTag } from '@/components/DictTag'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'SystemUserDetail' })

const drawerVisible = ref(false)
const loading = ref(false)
const userDetail = ref({} as UserApi.UserVO)

const text = (v: unknown) => (v === null || v === undefined || v === '' ? '--' : String(v))

const bindItems = computed(() => {
    const raw = (userDetail.value.wechatBindInfo || '').trim()
    if (!raw) return []
    return raw
        .split('；')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
            const parts = item.split('-')
            if (parts.length < 2) return { name: item, corp: '' }
            return {
                corp: parts[0].trim(),
                name: parts.slice(1).join('-').trim()
            }
        })
})

const formatCreateTime = computed(() => {
    const val = userDetail.value.createTime
    if (!val) return '--'
    return formatDate(new Date(val as any)) || '--'
})

const open = async (id: number) => {
    drawerVisible.value = true
    loading.value = true
    try {
        userDetail.value = await UserApi.getUser(id)
    } finally {
        loading.value = false
    }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.system-user-detail-drawer__body {
    padding: 8px 20px 20px;
}

.system-user-detail-drawer__bind-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.system-user-detail-drawer__corp {
    color: #fa8c16;
}

.system-user-detail-drawer__footer {
    display: flex;
    justify-content: flex-end;
}

:deep(.system-user-detail-drawer .el-drawer__header) {
    margin-bottom: 0;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.system-user-detail-drawer .el-drawer__body) {
    padding: 0;
}

:deep(.system-user-detail-drawer .el-drawer__footer) {
    padding: 16px 24px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
}
</style>
