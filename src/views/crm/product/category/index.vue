<template>
    <ContentWrap>
        <Search :schema="searchSchema" @reset="getList" @search="setSearchParams" />
        <div class="mb-10px">
            <BaseButton
                type="primary"
                :disabled="!canCreate"
                @click="openForm('create', undefined, 0)"
            >
                新增一级资源名称
            </BaseButton>
        </div>
        <Table
            :columns="tableColumns"
            :data="list"
            :loading="loading"
            row-key="id"
            default-expand-all
        />
    </ContentWrap>

    <ProductCategoryForm ref="formRef" @success="getList" />
    <Dialog v-model="moveVisible" title="移动分类" width="520px">
        <el-form label-width="90px">
            <el-form-item label="当前分类">
                <el-input :model-value="moveRow?.name || '-'" disabled />
            </el-form-item>
            <el-form-item label="目标父类">
                <el-select
                    v-model="targetParentId"
                    style="width: 100%"
                    placeholder="请选择目标父分类"
                >
                    <el-option :value="0" label="顶级分类" />
                    <el-option
                        v-for="item in simpleList"
                        :key="item.id"
                        :value="item.id"
                        :label="item.name"
                        :disabled="item.id === moveRow?.id"
                    />
                </el-select>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button type="primary" @click="handleConfirmMove">确 定</el-button>
            <el-button @click="moveVisible = false">取 消</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { CommonStatusEnum } from '@/utils/constants'
import * as ProductCategoryApi from '@/api/crm/product/category'
import ProductCategoryForm from './ProductCategoryForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'CrmProductCategory' })

const message = useMessage()
const { t } = useI18n()

const canCreate = hasPermission(['system:product-category:create'])
const canUpdate = hasPermission(['system:product-category:update'])
const canDelete = hasPermission(['system:product-category:delete'])

const searchParams = reactive<Recordable>({ name: undefined })
const loading = ref(true)
const list = ref<any[]>([])
const simpleList = ref<any[]>([])
const formRef = ref<InstanceType<typeof ProductCategoryForm>>()
const moveVisible = ref(false)
const moveRow = ref<any>()
const targetParentId = ref<number>(0)

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'name',
        label: '名称',
        component: 'Input',
        componentProps: { placeholder: '请输入名称', clearable: true, style: { width: '240px' } }
    },
    {
        field: 'status',
        label: '状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择状态',
            clearable: true,
            options: [
                { label: '启用', value: 0 },
                { label: '禁用', value: 1 }
            ],
            style: { width: '240px' }
        }
    }
])

const setSearchParams = (params: Recordable) => {
    Object.assign(searchParams, params)
    getList()
}

const getList = async () => {
    loading.value = true
    try {
        const [data, simple] = await Promise.all([
            ProductCategoryApi.getProductCategoryList(searchParams),
            ProductCategoryApi.getProductCategorySimpleList()
        ])
        list.value = data?.list || data || []
        simpleList.value = simple || []
    } finally {
        loading.value = false
    }
}

const openForm = (type: string, id?: number, parentId?: number) => {
    formRef.value?.open(type, id, parentId)
}

const handleDelete = async (id: number) => {
    try {
        await message.delConfirm()
        await ProductCategoryApi.deleteProductCategory(id)
        message.success(t('common.delSuccess'))
        await getList()
    } catch {}
}

const handleStatusChange = async (row: any, value: number) => {
    try {
        await ProductCategoryApi.updateProductCategoryStatus({ id: row.id, status: value })
        row.status = value
        message.success('状态更新成功')
    } catch {
        row.status =
            row.status === CommonStatusEnum.ENABLE
                ? CommonStatusEnum.DISABLE
                : CommonStatusEnum.ENABLE
    }
}

const handleSort = async (id: number, direction: 'UP' | 'DOWN') => {
    await ProductCategoryApi.sortProductCategory({ id, direction })
    await getList()
}

const openMoveDialog = (row: any) => {
    moveRow.value = row
    targetParentId.value = row.parentId ?? 0
    moveVisible.value = true
}

const handleConfirmMove = async () => {
    if (!moveRow.value) return
    await ProductCategoryApi.moveProductCategory({
        id: moveRow.value.id,
        targetParentId: targetParentId.value
    })
    message.success('移动成功')
    moveVisible.value = false
    await getList()
}

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'name', label: '分类名称', minWidth: '220px' },
    {
        field: 'status',
        label: '状态',
        width: '100px',
        slots: {
            default: (data) => (
                <el-switch
                    modelValue={data.row.status}
                    activeValue={CommonStatusEnum.ENABLE}
                    inactiveValue={CommonStatusEnum.DISABLE}
                    onChange={(value: number) => handleStatusChange(data.row, value)}
                />
            )
        }
    },
    { field: 'code', label: '编码', width: '120px' },
    { field: 'description', label: '描述' },
    { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '240px',
        slots: {
            default: (data) => (
                <div class="flex items-center gap-6px">
                    {canCreate ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => openForm('create', undefined, data.row.id)}
                        >
                            <Icon icon="ep:plus" />
                        </BaseButton>
                    ) : null}
                    {canUpdate ? (
                        <BaseButton link type="primary" onClick={() => openMoveDialog(data.row)}>
                            <Icon icon="ep:rank" />
                        </BaseButton>
                    ) : null}
                    {canUpdate ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => handleSort(data.row.id, 'UP')}
                        >
                            <Icon icon="ep:top" />
                        </BaseButton>
                    ) : null}
                    {canUpdate ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => handleSort(data.row.id, 'DOWN')}
                        >
                            <Icon icon="ep:bottom" />
                        </BaseButton>
                    ) : null}
                    {canUpdate ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => openForm('update', data.row.id)}
                        >
                            编辑
                        </BaseButton>
                    ) : null}
                    {canDelete ? (
                        <BaseButton link type="danger" onClick={() => handleDelete(data.row.id)}>
                            删除
                        </BaseButton>
                    ) : null}
                </div>
            )
        }
    }
])

onMounted(() => {
    getList()
})
</script>
