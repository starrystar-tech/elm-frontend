<template>
    <div class="panel-wrap" v-loading="loading">
        <div class="tag-toolbar">
            <BaseButton v-if="canCreate" type="primary" @click="openForm('create')"
                >添加标签组</BaseButton
            >
        </div>
        <div class="tag-group-list" v-if="tagGroups.length">
            <div v-for="group in tagGroups" :key="group.id" class="tag-group-item">
                <div class="tag-group-header">
                    <div class="tag-group-title">
                        <Icon icon="ep:collection-tag" class="mr-6px" />
                        <span>{{ group.name }}</span>
                    </div>
                    <div class="tag-group-actions">
                        <BaseButton
                            v-if="canUpdate"
                            link
                            type="primary"
                            @click="openForm('update', group)"
                            >编辑</BaseButton
                        >
                        <BaseButton
                            v-if="canDelete"
                            link
                            type="danger"
                            @click="handleDelete(group.id!)"
                            >删除</BaseButton
                        >
                    </div>
                </div>
                <div class="tag-group-tags">
                    <el-tag
                        v-for="tag in group.tags || []"
                        :key="tag.id || tag.name"
                        class="tag-chip"
                        >{{ tag.name }}</el-tag
                    >
                </div>
            </div>
        </div>
        <el-empty v-else description="暂无标签组" />

        <Dialog v-model="dialogVisible" :title="dialogTitle" width="720px">
            <el-form
                ref="formRef"
                v-loading="formLoading"
                :model="formData"
                :rules="formRules"
                label-width="100px"
            >
                <el-form-item label="标签组名称" prop="name">
                    <el-input v-model="formData.name" clearable placeholder="请输入标签组名称" />
                </el-form-item>
                <el-form-item label="排序" prop="sort">
                    <el-input-number
                        v-model="formData.sort"
                        :min="0"
                        :max="9999"
                        style="width: 200px"
                    />
                </el-form-item>
                <!-- <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="2" clearable placeholder="请输入备注" />
        </el-form-item> -->
                <el-form-item label="标签项" prop="tags">
                    <div class="tag-input-list">
                        <div
                            v-for="(item, index) in formData.tags"
                            :key="index"
                            class="tag-input-row"
                        >
                            <el-input v-model="item.name" clearable placeholder="请输入标签项" />
                            <el-button link type="primary" class="op-btn" @click="addTagRow">
                                <Icon icon="ep:circle-plus" />
                            </el-button>
                            <el-button
                                link
                                type="danger"
                                class="op-btn"
                                :disabled="formData.tags.length <= 1"
                                @click="removeTagRow(index)"
                            >
                                <Icon icon="ep:remove-filled" />
                            </el-button>
                        </div>
                    </div>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button :disabled="formLoading" type="primary" @click="submitForm"
                    >确 定</el-button
                >
                <el-button @click="dialogVisible = false">取 消</el-button>
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BaseButton } from '@/components/Button'
import { hasPermission } from '@/directives/permission/hasPermi'
import * as SystemTagGroupApi from '@/api/system/tag-group'

defineOptions({ name: 'TagConfigTab' })

const message = useMessage()
const canCreate = hasPermission(['system:tag-group:create'])
const canUpdate = hasPermission(['system:tag-group:update'])
const canDelete = hasPermission(['system:tag-group:delete'])

const loading = ref(false)
const formLoading = ref(false)
const tagGroups = ref<SystemTagGroupApi.SystemTagGroupVO[]>([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formType = ref<'create' | 'update'>('create')
const formRef = ref()

const formData = ref({
    id: undefined as number | undefined,
    name: '',
    sort: 0,
    remark: '',
    tags: [{ name: '' }]
})

const formRules = {
    name: [{ required: true, message: '请输入标签组名称', trigger: 'blur' }],
    sort: [{ required: true, message: '请输入排序', trigger: 'change' }],
    tags: [
        {
            validator: (
                _rule: any,
                value: Array<{ name: string }>,
                callback: (error?: Error) => void
            ) => {
                const validCount = (value || []).filter((item) => !!item.name?.trim()).length
                if (validCount === 0) {
                    callback(new Error('请至少填写一个标签项'))
                    return
                }
                callback()
            },
            trigger: 'blur'
        }
    ]
}

const resetForm = () => {
    formData.value = {
        id: undefined,
        name: '',
        sort: 0,
        remark: '',
        tags: [{ name: '' }]
    }
}

const addTagRow = () => {
    formData.value.tags.push({ name: '' })
}

const removeTagRow = (index: number) => {
    if (formData.value.tags.length <= 1) return
    formData.value.tags.splice(index, 1)
}

const buildTags = (tags: Array<{ name: string }>) => {
    const names = (tags || []).map((item) => item.name?.trim()).filter((item) => !!item)

    return names.map((name, index) => {
        return {
            name,
            sort: (index + 1) * 10
        }
    })
}

const loadList = async () => {
    loading.value = true
    try {
        const list = await SystemTagGroupApi.getTagGroupList()
        tagGroups.value = list || []
    } finally {
        loading.value = false
    }
}

const openForm = async (type: 'create' | 'update', row?: SystemTagGroupApi.SystemTagGroupVO) => {
    dialogVisible.value = true
    dialogTitle.value = type === 'create' ? '新增标签组' : '编辑标签组'
    formType.value = type
    resetForm()
    formRef.value?.clearValidate?.()

    if (type === 'update' && row?.id) {
        formLoading.value = true
        try {
            const detail = await SystemTagGroupApi.getTagGroup(row.id)
            formData.value = {
                id: detail.id,
                name: detail.name,
                sort: detail.sort,
                remark: detail.remark || '',
                tags: (detail.tags || [])
                    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
                    .map((item) => ({ name: item.name })) || [{ name: '' }]
            }
            if (formData.value.tags.length === 0) formData.value.tags = [{ name: '' }]
        } finally {
            formLoading.value = false
        }
    }
}

const submitForm = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return

    formLoading.value = true
    try {
        const data: SystemTagGroupApi.SystemTagGroupVO = {
            id: formData.value.id,
            name: formData.value.name,
            sort: formData.value.sort,
            remark: formData.value.remark,
            tags: buildTags(formData.value.tags)
        }

        if (formType.value === 'create') {
            await SystemTagGroupApi.createTagGroup(data)
            message.success('创建成功')
        } else {
            await SystemTagGroupApi.updateTagGroup(data)
            message.success('更新成功')
        }
        dialogVisible.value = false
        await loadList()
    } finally {
        formLoading.value = false
    }
}

const handleDelete = async (id: number) => {
    await message.delConfirm()
    await SystemTagGroupApi.deleteTagGroup(id)
    message.success('删除成功')
    await loadList()
}

onMounted(() => {
    loadList()
})
</script>

<style scoped>
.panel-wrap {
    padding: 0px 6px 8px 6px;
}
.tag-toolbar {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 16px;
}
.tag-group-list {
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    overflow: hidden;
}
.tag-group-item {
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}
.tag-group-item:last-child {
    border-bottom: none;
}
.tag-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}
.tag-group-title {
    display: flex;
    align-items: center;
    font-weight: 600;
}
.tag-group-actions {
    display: flex;
    align-items: center;
}
.tag-group-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.tag-chip {
    margin: 0;
    background: #f5f5f5;
    border-color: #f5f5f5;
    color: #666;
}

.tag-input-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.tag-input-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
}

.op-btn {
    font-size: 18px;
}
</style>
