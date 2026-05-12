<template>
    <div class="dept-selector">
        <div class="dept-selector__value" @click="visible = true">
            <span v-if="!selectedLabels.length" class="dept-selector__placeholder">{{
                placeholder
            }}</span>
            <div v-else class="dept-selector__tags">
                <el-tag
                    v-for="item in selectedLabels"
                    :key="item.id"
                    size="small"
                    type="info"
                    closable
                    disable-transitions
                    @close.stop="remove(item.id)"
                >
                    {{ item.name }}
                </el-tag>
            </div>
            <el-icon class="dept-selector__arrow"><ArrowDown /></el-icon>
        </div>

        <Dialog v-model="visible" title="选择部门" width="560px">
            <el-tree
                ref="treeRef"
                :data="deptList"
                :props="defaultProps"
                node-key="id"
                show-checkbox
                check-strictly
                default-expand-all
                style="max-height: 420px; overflow: auto"
            />
            <template #footer>
                <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" @click="confirm">确定</el-button>
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import { defaultProps, handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'

defineOptions({ name: 'DeptSelector' })

const props = defineProps<{
    modelValue?: number | number[]
    multiple?: boolean
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: number | number[] | undefined): void
}>()

const visible = ref(false)
const treeRef = ref()
const deptList = ref<Tree[]>([])
const loaded = ref(false)
const modelIds = computed<number[]>(() => {
    if (props.multiple) return Array.isArray(props.modelValue) ? props.modelValue : []
    if (props.modelValue === 0 || props.modelValue) return [props.modelValue as number]
    return []
})

const selectedLabels = computed(() => {
    const map = new Map<number, string>()
    const walk = (list: any[]) => {
        list.forEach((item) => {
            map.set(item.id, item.name)
            if (item.children?.length) walk(item.children)
        })
    }
    walk(deptList.value as any[])
    return modelIds.value.map((id) => ({ id, name: map.get(id) || String(id) }))
})

const loadDept = async () => {
  if (loaded.value) return
  const res = await DeptApi.getSimpleDeptList()
  const tree = handleTree(res)
  deptList.value = [{ id: 0, name: '顶级部门', children: tree } as any]
  loaded.value = true
}

const remove = (id: number) => {
    if (props.multiple) {
        emit(
            'update:modelValue',
            modelIds.value.filter((itemId) => itemId !== id)
        )
        return
    }
    if (props.modelValue === id) {
        emit('update:modelValue', undefined as number | undefined)
    }
}

const confirm = () => {
    const ids = treeRef.value?.getCheckedKeys() || []
    if (props.multiple) {
        emit('update:modelValue', ids as number[])
    } else {
        emit('update:modelValue', ids[0] as number | undefined)
    }
    visible.value = false
}

watch(
  () => visible.value,
  async (val) => {
    if (val) {
      await loadDept()
      treeRef.value?.setCheckedKeys(modelIds.value)
    }
  }
)

watch(
  () => props.modelValue,
  async (val) => {
    const hasValue = Array.isArray(val) ? val.length > 0 : val === 0 || !!val
    if (hasValue && !loaded.value) {
      await loadDept()
    }
  },
  { immediate: true }
)

const placeholder = computed(() => props.placeholder || '请选择部门')
</script>

<style scoped>
.dept-selector__value {
    min-height: 32px;
    padding: 4px 30px 4px 8px;
    border: 1px solid var(--el-border-color, #dcdfe6);
    border-radius: 4px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    position: relative;
    cursor: pointer;
    background: var(--el-bg-color, #fff);
    transition: border-color 0.2s;
}

.dept-selector__value:hover {
    border-color: var(--el-border-color-hover, #c0c4cc);
}

.dept-selector__value:focus-within,
.dept-selector__value:active {
    border-color: var(--el-color-primary);
}

.dept-selector__placeholder {
    color: var(--el-text-color-placeholder);
    font-size: 13px;
}

.dept-selector__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    align-items: center;
}

.dept-selector__arrow {
    position: absolute;
    right: 8px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
}
</style>
