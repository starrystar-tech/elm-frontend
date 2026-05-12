<template>
    <div class="system-user-dept-tree">
        <div class="system-user-dept-tree__header">
            <el-input
                v-model="deptName"
                class="system-user-dept-tree__search"
                clearable
                placeholder="请输入部门名称"
            >
                <template #prefix>
                    <Icon icon="ep:search" />
                </template>
            </el-input>
        </div>
        <div class="system-user-dept-tree__divider"></div>
        <div class="system-user-dept-tree__body">
            <el-tree
                ref="treeRef"
                :data="deptList"
                :expand-on-click-node="false"
                :filter-node-method="filterNode"
                :props="defaultProps"
                default-expand-all
                highlight-current
                node-key="id"
                @node-click="handleNodeClick"
            >
                <template #default="{ data }">
                    <div class="system-user-dept-tree__node" :title="data.name">
                        <span class="system-user-dept-tree__node-label">{{ data.name }}</span>
                    </div>
                </template>
            </el-tree>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ElTree } from 'element-plus'
import * as DeptApi from '@/api/system/dept'
import { defaultProps, handleTree } from '@/utils/tree'

defineOptions({ name: 'SystemUserDeptTree' })

const deptName = ref('')
const deptList = ref<Tree[]>([]) // 树形结构
const treeRef = ref<InstanceType<typeof ElTree>>()

/** 获得部门树 */
const getTree = async () => {
    const res = await DeptApi.getSimpleDeptList()
    deptList.value = []
    deptList.value.push(...handleTree(res))
}

/** 基于名字过滤 */
const filterNode = (name: string, data: Tree) => {
    if (!name) return true
    return data.name.includes(name)
}

/** 处理部门被点击 */
let currentNode: any = {}
const handleNodeClick = async (row: { [key: string]: any }, treeNode: any) => {
    // 判断选中状态
    if (currentNode && currentNode.id === row.id) {
        treeNode.checked = !treeNode.checked
    } else {
        treeNode.checked = true
    }
    if (treeNode.checked) {
        // 选中
        currentNode = row
        emits('node-click', row)
    } else {
        // 取消选中
        treeRef.value!.setCurrentKey(undefined)
        emits('node-click', undefined)
        currentNode = null
    }
}
const emits = defineEmits(['node-click'])

/** 监听deptName */
watch(deptName, (val) => {
    treeRef.value!.filter(val)
})

/** 初始化 */
onMounted(async () => {
    await getTree()
})
</script>

<style lang="scss" scoped>
.system-user-dept-tree {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.system-user-dept-tree__header {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 10px 5px 0 5px;
}

.system-user-dept-tree__title {
    font-size: 15px;
    font-weight: 600;
    color: #1f2a37;
    line-height: 1.2;
}

.system-user-dept-tree__search {
    :deep(.el-input__wrapper) {
        border-radius: 8px;
        box-shadow: 0 0 0 1px #e8edf5 inset;
    }
}

.system-user-dept-tree__divider {
    height: 1px;
    margin: 14px 2px 10px;
    background: #eef2f7;
}

.system-user-dept-tree__body {
    flex: 1;
    overflow: auto;
}

.system-user-dept-tree__node {
    width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    padding-right: 8px;
}

.system-user-dept-tree__node-label {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.system-user-dept-tree {
    :deep(.el-tree) {
        --el-tree-node-hover-bg-color: #f7f9fc;
        background: transparent;
        color: #344054;
    }

    :deep(.el-tree-node__content) {
        height: 36px;
        border-radius: 8px;
        margin-bottom: 4px;
        padding-right: 6px;
    }

    :deep(.el-tree-node:focus > .el-tree-node__content) {
        background-color: #eef4ff;
    }

    :deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
        background: #eef4ff;
        color: var(--el-color-primary);
        font-weight: 600;
    }

    :deep(.el-tree-node__expand-icon) {
        color: #98a2b3;
    }
}
</style>
