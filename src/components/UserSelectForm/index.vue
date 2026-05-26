<template>
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="920" append-to-body>
        <div class="user-select-layout" v-loading="formLoading">
            <div class="user-select-column">
                <div class="user-select-panel">
                    <div class="user-select-panel-header">
                        <el-input v-model="keyword" clearable placeholder="搜索部门或人员">
                            <template #prefix>
                                <Icon icon="ep:search" />
                            </template>
                        </el-input>
                    </div>
                    <div class="user-select-panel-body">
                        <el-tree
                            :key="treeRenderKey"
                            ref="treeRef"
                            :data="displayDeptTree"
                            :expand-on-click-node="false"
                            :props="treeProps"
                            default-expand-all
                            :default-expanded-keys="expandedKeys"
                            node-key="nodeKey"
                            @node-click="handleNodeClick"
                        >
                            <template #default="{ data }">
                                <div
                                    class="tree-node"
                                    :class="{
                                        'is-user': data.nodeType === 'user',
                                        'is-selected':
                                            data.nodeType === 'user' &&
                                            data.userId &&
                                            selectedUserIdList.includes(data.userId)
                                    }"
                                >
                                    <span class="tree-node-name">{{ data.name }}</span>
                                    <span v-if="data.nodeType === 'user'" class="tree-node-desc">{{
                                        data.nickname
                                    }}</span>
                                </div>
                            </template>
                        </el-tree>
                    </div>
                </div>
            </div>
            <div class="user-select-column">
                <div class="user-select-panel selected-panel">
                    <div class="user-select-panel-header selected-header">
                        <span>已选择成员</span>
                        <span class="selected-count">{{ selectedUsers.length }} 人</span>
                    </div>
                    <div class="user-select-panel-body">
                        <div v-if="selectedUsers.length" class="selected-user-list">
                            <div
                                v-for="user in selectedUsers"
                                :key="user.id"
                                class="selected-user-item"
                            >
                                <span class="selected-user-name">{{ user.nickname }}</span>
                                <span
                                    class="selected-user-remove"
                                    @click.stop="removeSelectedUser(user.id)"
                                    >×</span
                                >
                            </div>
                        </div>
                        <el-empty v-else description="请从左侧选择用户" />
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <el-button
                :disabled="formLoading"
                type="primary"
                @click="submitForm"
            >
                确 定
            </el-button>
            <el-button @click="dialogVisible = false">取 消</el-button>
        </template>
    </Dialog>
</template>
<script lang="ts" setup>
import { ElTree } from 'element-plus'
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'UserSelectForm' })

type UserSelectOptions = {
    multiple?: boolean
    title?: string
}

type UserTreeNode = {
    id?: number
    parentId?: number
    name: string
    nickname?: string
    nodeType: 'dept' | 'user'
    nodeKey: string
    userId?: number
    children?: UserTreeNode[]
}

const emit = defineEmits<{
    confirm: [id: any, userList: any[]]
}>()
const treeRef = ref<InstanceType<typeof ElTree>>()
const deptSourceList = ref<any[]>([])
const deptTree = ref<UserTreeNode[]>([])
const userList = ref<UserApi.UserVO[]>([])
const selectedUserIdList = ref<number[]>([])
const dialogVisible = ref(false)
const formLoading = ref(false)
const activityId = ref()
const dialogTitle = ref('人员选择')
const multiple = ref(true)
const keyword = ref('')

const treeProps = {
    label: 'name',
    children: 'children'
}

const normalizeSearchText = (value?: string) =>
    String(value || '')
        .replace(/\s+/g, '')
        .toLowerCase()

const displayDeptTree = computed(() => {
    const normalized = normalizeSearchText(keyword.value)
    if (!normalized) return deptTree.value

    const filterNodes = (nodes: UserTreeNode[]): UserTreeNode[] => {
        return nodes.reduce<UserTreeNode[]>((result, node) => {
            const children = filterNodes(node.children || [])
            const selfMatched = [node.name, node.nickname]
                .filter(Boolean)
                .some((text) => normalizeSearchText(String(text)).includes(normalized))

            if (node.nodeType === 'dept') {
                if (selfMatched) {
                    result.push(node)
                    return result
                }
                if (children.length) {
                    result.push({
                        ...node,
                        children
                    })
                }
                return result
            }

            if (selfMatched) {
                result.push({
                    ...node,
                    children: []
                })
            }
            return result
        }, [])
    }

    return filterNodes(deptTree.value)
})

const selectedUsers = computed(() =>
    userList.value.filter((user: any) => selectedUserIdList.value.includes(user.id))
)

const expandedKeys = computed(() => {
    const keys: string[] = []
    const collect = (nodes: UserTreeNode[]) => {
        nodes.forEach((node) => {
            if (node.nodeType === 'dept') {
                keys.push(node.nodeKey)
            }
            if (node.children?.length) {
                collect(node.children)
            }
        })
    }
    collect(displayDeptTree.value)
    return keys
})

const treeRenderKey = computed(() => `${keyword.value}-${expandedKeys.value.join(',')}`)

const buildDeptUserTree = (deptData: any[], users: UserApi.UserVO[]) => {
    const deptNodeMap = new Map<number, UserTreeNode>()
    const roots: UserTreeNode[] = []

    deptData.forEach((dept) => {
        deptNodeMap.set(dept.id, {
            id: dept.id,
            parentId: dept.parentId,
            name: dept.name,
            nodeType: 'dept',
            nodeKey: `dept-${dept.id}`,
            children: []
        })
    })

    deptNodeMap.forEach((node) => {
        const parentId = Number(node.parentId || 0)
        const parent = deptNodeMap.get(parentId)
        if (parent) {
            parent.children = parent.children || []
            parent.children.push(node)
        } else {
            roots.push(node)
        }
    })

    users.forEach((user) => {
        const deptNode = deptNodeMap.get(Number(user.deptId))
        const userNode: UserTreeNode = {
            id: user.id,
            parentId: user.deptId,
            name: user.nickname,
            nickname: user.username,
            nodeType: 'user',
            nodeKey: `user-${user.id}`,
            userId: user.id,
            children: []
        }
        if (deptNode) {
            deptNode.children = deptNode.children || []
            deptNode.children.push(userNode)
            return
        }
        roots.push(userNode)
    })

    const sortNodes = (nodes: UserTreeNode[]) => {
        nodes.sort((a, b) => {
            if (a.nodeType !== b.nodeType) {
                return a.nodeType === 'dept' ? -1 : 1
            }
            return String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN')
        })
        nodes.forEach((node) => {
            if (node.children?.length) {
                sortNodes(node.children)
            }
        })
    }

    sortNodes(roots)
    return roots
}

const open = async (id: number, selectedList?: any[], options?: UserSelectOptions) => {
    activityId.value = id
    resetForm()
    dialogTitle.value = options?.title || '人员选择'
    multiple.value = options?.multiple ?? false

    const deptData = await DeptApi.getSimpleDeptList()
    deptSourceList.value = deptData
    userList.value = await UserApi.getSimpleUserList()
    deptTree.value = buildDeptUserTree(deptData, userList.value)
    selectedUserIdList.value = (selectedList?.map((item: any) => item.id) || []).slice(
        0,
        multiple.value ? undefined : 1
    )
    dialogVisible.value = true
}

const setSelectedUsers = (ids: number[]) => {
    if (!multiple.value) {
        selectedUserIdList.value = ids.length ? [ids[ids.length - 1]] : []
        return
    }
    selectedUserIdList.value = ids
}

const removeSelectedUser = (userId: number) => {
    setSelectedUsers(selectedUserIdList.value.filter((id) => id !== userId))
}

const handleNodeClick = (row: UserTreeNode) => {
    if (row.nodeType === 'user' && row.userId) {
        const current = new Set(selectedUserIdList.value)
        if (multiple.value) {
            if (current.has(row.userId)) current.delete(row.userId)
            else current.add(row.userId)
            setSelectedUsers(Array.from(current))
        } else {
            setSelectedUsers([row.userId])
        }
    }
}

const submitForm = async () => {
    formLoading.value = true
    try {
        const emitUserList = selectedUserIdList.value.length
            ? await Promise.all(selectedUserIdList.value.map((id) => UserApi.getUser(id)))
            : []
        dialogVisible.value = false
        emit('confirm', activityId.value, emitUserList)
    } finally {
        formLoading.value = false
    }
}

const resetForm = () => {
    deptSourceList.value = []
    deptTree.value = []
    userList.value = []
    selectedUserIdList.value = []
    keyword.value = ''
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
.user-select-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
    min-height: 520px;
    align-items: stretch;
}

.user-select-column {
    min-width: 0;
    display: flex;
}

.user-select-panel {
    width: 100%;
    display: flex;
    flex-direction: column;
    height: 520px;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
}

.user-select-panel-header {
    min-height: 61px;
    padding: 12px;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    align-items: center;
}

.user-select-panel-body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 8px 0;
}

.user-select-panel-header :deep(.el-input__wrapper) {
    border-radius: 8px;
}

.user-select-panel-body :deep(.el-tree) {
    padding-left: 4px;
}

.user-select-panel-body :deep(.el-tree-node__content) {
    height: 34px;
    border-radius: 4px;
}

.tree-node {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    border-radius: 6px;
}

.tree-node.is-user {
    cursor: pointer;
}

.tree-node.is-user:hover {
    background: var(--el-fill-color-light);
}

.tree-node.is-selected {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
}

.tree-node-name {
    flex: 1;
}

.tree-node-desc {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.selected-panel {
    width: 100%;
}

.selected-panel :deep(.el-empty) {
    flex: 1;
}

.selected-header {
    justify-content: space-between;
    font-weight: 500;
    color: #666;
}

.selected-count {
    color: #999;
    font-size: 12px;
}

.selected-user-list {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 0 12px;
}

.selected-user-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    font-size: 14px;
    border-bottom: 1px solid #f0f0f0;
}

.selected-user-name {
    color: #333;
}

.selected-user-remove {
    color: #999;
    cursor: pointer;
    padding: 4px;
    font-size: 16px;
    line-height: 1;
}

.selected-user-remove:hover {
    color: #ff4d4f;
}

@media (max-width: 900px) {
    .user-select-layout {
        grid-template-columns: 1fr;
    }
}
</style>
