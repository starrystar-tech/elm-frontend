<template>
    <Dialog v-model="dialogVisible" title="设置权限" width="860px">
        <el-form v-loading="loading" :model="formData" label-width="96px">
            <el-form-item label="用户">
                <span>{{ currentUser?.nickname || '--' }}</span>
            </el-form-item>
            <el-form-item label="管理公司">
                <el-select
                    v-model="formData.manageCompanyIds"
                    multiple
                    clearable
                    collapse-tags
                    collapse-tags-tooltip
                >
                    <el-option
                        v-for="item in weappList"
                        :key="item.id"
                        :label="item.companyName || item.appName || item.corpId"
                        :value="item.id!"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="校区权限">
                <el-select
                    v-model="formData.campusIds"
                    multiple
                    clearable
                    collapse-tags
                    collapse-tags-tooltip
                >
                    <el-option
                        v-for="item in campusList"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id!"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="管辖地区">
                <el-tree-select
                    v-model="formData.areaIds"
                    :data="areaTreeList"
                    :props="defaultProps"
                    multiple
                    show-checkbox
                    check-strictly
                    node-key="id"
                    value-key="id"
                />
            </el-form-item>
            <el-form-item label="管辖产品">
                <el-select
                    v-model="formData.categoryIds"
                    multiple
                    clearable
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="请选择一级产品分类"
                >
                    <el-option
                        v-for="item in rootCategoryList"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id!"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="部门权限">
                <DeptSelector
                    v-model="formData.permissionDeptIds"
                    multiple
                    style="width: 100%"
                    placeholder="请选择部门权限"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="loading" @click="submit">确定</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { defaultProps } from '@/utils/tree'
import * as UserApi from '@/api/system/user'
import * as CampusApi from '@/api/system/campus'
import * as AreaApi from '@/api/system/area'
import * as ProductCategoryApi from '@/api/crm/product/category'
import * as WeappApi from '@/api/system/weapp'
import { normalizeAreaIds } from '@/utils/areaScope'
import DeptSelector from '@/views/system/dept/components/DeptSelector.vue'

defineOptions({ name: 'UserPermissionForm' })
const emit = defineEmits(['success'])
const message = useMessage()

const dialogVisible = ref(false)
const loading = ref(false)
const currentUser = ref<UserApi.UserVO>()
const campusList = ref<CampusApi.CampusVO[]>([])
const weappList = ref<WeappApi.WeappConfigVO[]>([])
const areaTreeList = ref<any[]>([])
const rootCategoryList = ref<any[]>([])

const formData = ref({
    id: undefined as number | undefined,
    manageCompanyIds: [] as number[],
    campusIds: [] as number[],
    areaIds: [] as number[],
    categoryIds: [] as number[],
    permissionDeptIds: [] as number[]
})

const open = async (row: UserApi.UserVO) => {
    dialogVisible.value = true
    loading.value = true
    currentUser.value = row
    try {
        const [detail, campusData, areaData, categoryData, weappData] = await Promise.all([
            UserApi.getUser(row.id),
            CampusApi.getSimpleCampusList(),
            AreaApi.getAreaTree(),
            ProductCategoryApi.getProductCategorySimpleList(),
            WeappApi.getWeappConfigList()
        ])
        campusList.value = campusData || []
        weappList.value = weappData || []
        areaTreeList.value = areaData || []
        rootCategoryList.value = (categoryData || []).filter(
            (item: any) => Number(item.level) === 1
        )
        formData.value = {
            id: detail.id,
            manageCompanyIds: detail.manageCompanyIds || [],
            campusIds: detail.campusIds || [],
            areaIds: detail.areaIds || [],
            categoryIds: detail.categoryIds || [],
            permissionDeptIds: detail.permissionDeptIds || []
        }
    } finally {
        loading.value = false
    }
}

const submit = async () => {
    if (!formData.value.id) return
    loading.value = true
    try {
        await UserApi.updateUserPermission({
            ...formData.value,
            areaIds: normalizeAreaIds(formData.value.areaIds || [], areaTreeList.value as any[])
        } as any)
        message.success('设置成功')
        dialogVisible.value = false
        emit('success')
    } finally {
        loading.value = false
    }
}

defineExpose({ open })
</script>
