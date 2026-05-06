<template>
    <ContentWrap>
        <div class="px-15px pt-20px flex items-center justify-between">
            <div class="flex items-center">
                <BaseButton type="success" @click="openForm('create')">新增</BaseButton>
                <span class="ml-16px text-14px text-[var(--el-text-color-secondary)]">
                    权重修改，将会次日生效，为避免影响您的使用，请提前修改！
                </span>
            </div>
        </div>

        <Table :columns="tableColumns" :data="list" :loading="loading" row-key="id" />
    </ContentWrap>

    <Dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
        <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px">
            <el-form-item label="级别" prop="level">
                <el-input
                    v-model="formData.level"
                    clearable
                    maxlength="10"
                    placeholder="请输入级别，如 A"
                />
            </el-form-item>
            <el-form-item label="权重" prop="weight">
                <el-input-number
                    v-model="formData.weight"
                    :min="0"
                    :max="10000"
                    :precision="0"
                    style="width: 100%"
                    controls-position="right"
                    placeholder="请输入权重"
                />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
                <el-input
                    v-model="formData.remark"
                    clearable
                    maxlength="100"
                    show-word-limit
                    type="textarea"
                    :rows="3"
                    placeholder="请输入备注"
                />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button type="primary" @click="handleSubmit">确 定</el-button>
            <el-button @click="dialogVisible = false">取 消</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="tsx">
import { computed, reactive, ref } from 'vue'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { Table, type TableColumn } from '@/components/Table'

defineOptions({ name: 'CrmAllocationWeight' })

type WeightRow = {
    id: number
    level: string
    weight: number
    remark: string
}

const message = useMessage()
const loading = ref(false)

const list = ref<WeightRow[]>([
    { id: 1, level: 'A', weight: 20, remark: '重量级' },
    { id: 2, level: 'B', weight: 15, remark: '' },
    { id: 3, level: 'C', weight: 10, remark: '' },
    { id: 4, level: 'D', weight: 0, remark: '' }
])

const dialogVisible = ref(false)
const formType = ref<'create' | 'update'>('create')
const editingId = ref<number | null>(null)
const formRef = ref()
const formData = reactive({
    level: '',
    weight: undefined as number | undefined,
    remark: ''
})

const dialogTitle = computed(() =>
    formType.value === 'create' ? '新增咨询师等级权重' : '修改咨询师等级权重'
)

const formRules = reactive({
    level: [{ required: true, message: '级别不能为空', trigger: 'blur' }],
    weight: [{ required: true, message: '权重不能为空', trigger: 'change' }]
})

const resetForm = () => {
    formData.level = ''
    formData.weight = undefined
    formData.remark = ''
    editingId.value = null
    formRef.value?.resetFields()
}

const openForm = (type: 'create' | 'update', row?: WeightRow) => {
    formType.value = type
    dialogVisible.value = true
    resetForm()
    if (row) {
        editingId.value = row.id
        formData.level = row.level
        formData.weight = row.weight
        formData.remark = row.remark
    }
}

const handleSubmit = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return

    if (formType.value === 'create') {
        const nextId = Math.max(...list.value.map((item) => item.id), 0) + 1
        list.value.push({
            id: nextId,
            level: formData.level.trim(),
            weight: Number(formData.weight),
            remark: formData.remark.trim()
        })
        message.success('新增成功')
    } else if (editingId.value !== null) {
        const target = list.value.find((item) => item.id === editingId.value)
        if (target) {
            target.level = formData.level.trim()
            target.weight = Number(formData.weight)
            target.remark = formData.remark.trim()
            message.success('修改成功')
        }
    }
    dialogVisible.value = false
}

const handleDelete = async (id: number) => {
    try {
        await message.delConfirm()
        list.value = list.value.filter((item) => item.id !== id)
        message.success('删除成功')
    } catch {}
}

const tableColumns = computed<TableColumn[]>(() => [
    { field: 'id', label: 'ID', width: '80px' },
    { field: 'level', label: '级别', width: '120px' },
    { field: 'weight', label: '权重', width: '120px' },
    {
        field: 'remark',
        label: '备注',
        minWidth: '220px',
        slots: { default: (data) => <>{data.row.remark || '-'}</> }
    },
    {
        field: 'action',
        label: '操作',
        width: '160px',
        slots: {
            default: (data) => (
                <>
                    <BaseButton
                        link
                        type="primary"
                        onClick={() => openForm('update', data.row as WeightRow)}
                    >
                        修改
                    </BaseButton>
                    <BaseButton link type="danger" onClick={() => handleDelete(data.row.id)}>
                        删除
                    </BaseButton>
                </>
            )
        }
    }
])
</script>
