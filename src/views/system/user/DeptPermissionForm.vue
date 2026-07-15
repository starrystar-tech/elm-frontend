<template>
    <Dialog v-model="dialogVisible" title="设置部门权限" width="860px">
        <el-form v-loading="loading" :model="formData" label-width="130px">
            <el-form-item label="部门">
                <span>{{ currentDept?.name || '--' }}</span>
            </el-form-item>

            <el-divider content-position="left">校区权限</el-divider>
            <el-form-item label="校区">
                <el-select
                    v-model="formData.campusIds"
                    multiple
                    clearable
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="请选择校区"
                >
                    <el-option
                        v-for="item in campusList"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id!"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="同步下级机构">
                <el-radio-group v-model="formData.campusSyncChildren">
                    <el-radio :value="false">否</el-radio>
                    <el-radio :value="true">是</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" plain :loading="saving.campus" @click="submitCampus"
                    >保存校区权限</el-button
                >
            </el-form-item>

            <el-divider content-position="left">地区权限</el-divider>
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
            <el-form-item label="同步下级机构">
                <el-radio-group v-model="formData.areaSyncChildren">
                    <el-radio :value="false">否</el-radio>
                    <el-radio :value="true">是</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" plain :loading="saving.area" @click="submitArea"
                    >保存地区权限</el-button
                >
            </el-form-item>

            <el-divider content-position="left">项目权限</el-divider>
            <el-form-item label="管辖项目">
                <el-select
                    v-model="formData.categoryIds"
                    multiple
                    clearable
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="请选择一级项目分类"
                >
                    <el-option
                        v-for="item in rootCategoryList"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id!"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="同步下级机构">
                <el-radio-group v-model="formData.categorySyncChildren">
                    <el-radio :value="false">否</el-radio>
                    <el-radio :value="true">是</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" plain :loading="saving.category" @click="submitCategory"
                    >保存项目权限</el-button
                >
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="dialogVisible = false">关闭</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { defaultProps } from '@/utils/tree'
import * as CampusApi from '@/api/system/campus'
import * as AreaApi from '@/api/system/area'
import * as ProductCategoryApi from '@/api/crm/product/category'
import * as DeptApi from '@/api/system/dept'
import { normalizeAreaIdsToProvinceCity, pruneAreaTreeToProvinceCity } from '@/utils/areaScope'

defineOptions({ name: 'DeptPermissionForm' })
const emit = defineEmits(['success'])
const message = useMessage()

const dialogVisible = ref(false)
const loading = ref(false)
const currentDept = ref<{ id: number; name: string }>()
const campusList = ref<CampusApi.CampusVO[]>([])
const areaTreeList = ref<any[]>([])
const rawAreaTreeList = ref<any[]>([])
const rootCategoryList = ref<any[]>([])

const saving = ref({
    campus: false,
    area: false,
    category: false
})

const formData = ref({
    deptId: undefined as number | undefined,
    campusIds: [] as number[],
    areaIds: [] as number[],
    categoryIds: [] as number[],
    campusSyncChildren: false,
    areaSyncChildren: false,
    categorySyncChildren: false
})

const open = async (dept: { id: number; name: string }) => {
    dialogVisible.value = true
    loading.value = true
    currentDept.value = dept
    try {
        const [detail, campusData, areaData, categoryData] = await Promise.all([
            DeptApi.getDept(dept.id),
            CampusApi.getSimpleCampusList(),
            AreaApi.getAreaTree(),
            ProductCategoryApi.getProductCategorySimpleList()
        ])
        campusList.value = campusData || []
        rawAreaTreeList.value = areaData || []
        areaTreeList.value = pruneAreaTreeToProvinceCity(rawAreaTreeList.value)
        rootCategoryList.value = (categoryData || []).filter(
            (item: any) => Number(item.level) === 1
        )
        formData.value = {
            deptId: dept.id,
            campusIds: detail.campusIds || [],
            areaIds: normalizeAreaIdsToProvinceCity(detail.areaIds || [], rawAreaTreeList.value),
            categoryIds: detail.categoryIds || [],
            campusSyncChildren: false,
            areaSyncChildren: false,
            categorySyncChildren: false
        }
    } finally {
        loading.value = false
    }
}

const submitCampus = async () => {
    if (!formData.value.deptId) return
    saving.value.campus = true
    try {
        await DeptApi.updateDeptCampusScope({
            deptId: formData.value.deptId,
            campusIds: formData.value.campusIds || [],
            syncChildren: formData.value.campusSyncChildren
        })
        message.success('校区权限设置成功')
        emit('success')
    } finally {
        saving.value.campus = false
    }
}

const submitArea = async () => {
    if (!formData.value.deptId) return
    saving.value.area = true
    try {
        await DeptApi.updateDeptAreaScope({
            deptId: formData.value.deptId,
            areaIds: normalizeAreaIdsToProvinceCity(
                formData.value.areaIds || [],
                rawAreaTreeList.value as any[]
            ),
            syncChildren: formData.value.areaSyncChildren
        })
        message.success('地区权限设置成功')
        emit('success')
    } finally {
        saving.value.area = false
    }
}

const submitCategory = async () => {
    if (!formData.value.deptId) return
    saving.value.category = true
    try {
        await DeptApi.updateDeptCategoryScope({
            deptId: formData.value.deptId,
            categoryIds: formData.value.categoryIds || [],
            syncChildren: formData.value.categorySyncChildren
        })
        message.success('项目权限设置成功')
        emit('success')
    } finally {
        saving.value.category = false
    }
}

defineExpose({ open })
</script>
