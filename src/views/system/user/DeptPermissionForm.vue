<template>
  <Dialog v-model="dialogVisible" title="设置部门权限" width="860px">
    <el-form v-loading="loading" :model="formData" label-width="96px">
      <el-form-item label="部门">
        <span>{{ currentDept?.name || '--' }}</span>
      </el-form-item>
      <el-form-item label="校区权限">
        <el-select v-model="formData.campusIds" multiple clearable collapse-tags collapse-tags-tooltip>
          <el-option v-for="item in campusList" :key="item.id" :label="item.name" :value="item.id!" />
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
          <el-option v-for="item in rootCategoryList" :key="item.id" :label="item.name" :value="item.id!" />
        </el-select>
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
import * as CampusApi from '@/api/system/campus'
import * as AreaApi from '@/api/system/area'
import * as ProductCategoryApi from '@/api/crm/product/category'
import * as DeptApi from '@/api/system/dept'
import { normalizeAreaIds } from '@/utils/areaScope'

defineOptions({ name: 'DeptPermissionForm' })
const emit = defineEmits(['success'])
const message = useMessage()

const dialogVisible = ref(false)
const loading = ref(false)
const currentDept = ref<{ id: number; name: string }>()
const campusList = ref<CampusApi.CampusVO[]>([])
const areaTreeList = ref<any[]>([])
const rootCategoryList = ref<any[]>([])

const formData = ref({
  deptId: undefined as number | undefined,
  campusIds: [] as number[],
  areaIds: [] as number[],
  categoryIds: [] as number[]
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
    areaTreeList.value = areaData || []
    rootCategoryList.value = (categoryData || []).filter((item: any) => Number(item.level) === 1)
    formData.value = {
      deptId: dept.id,
      campusIds: detail.campusIds || [],
      areaIds: detail.areaIds || [],
      categoryIds: detail.categoryIds || []
    }
  } finally {
    loading.value = false
  }
}

const submit = async () => {
  if (!formData.value.deptId) return
  loading.value = true
  try {
    await Promise.all([
      DeptApi.updateDeptCampusScope({
        deptId: formData.value.deptId,
        campusIds: formData.value.campusIds || []
      }),
      DeptApi.updateDeptAreaScope({
        deptId: formData.value.deptId,
        areaIds: normalizeAreaIds(formData.value.areaIds || [], areaTreeList.value as any[])
      }),
      DeptApi.updateDeptCategoryScope({
        deptId: formData.value.deptId,
        categoryIds: formData.value.categoryIds || []
      })
    ])
    message.success('设置成功')
    dialogVisible.value = false
    emit('success')
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>
