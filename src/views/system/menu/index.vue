<template>
    <ContentWrap>
        <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
        <div class="action-btn-wrap">
            <BaseButton v-if="canCreate" type="primary" @click="openForm('create')"
                >新增</BaseButton
            >
            <BaseButton @click="toggleExpandAll">展开/折叠</BaseButton>
            <BaseButton @click="refreshMenu">刷新菜单缓存</BaseButton>
        </div>

        <Table
            :columns="tableColumns"
            :data="list"
            :loading="loading"
            row-key="id"
            :tree-props="{ children: 'children' }"
            :default-expand-all="isExpandAll"
            @register="tableRegister"
        />
    </ContentWrap>

    <MenuForm ref="formRef" @success="getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { handleTree } from '@/utils/tree'
import * as MenuApi from '@/api/system/menu'
import type { MenuVO } from '@/api/system/menu'
import MenuForm from './MenuForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { Icon } from '@/components/Icon'
import { ElSwitch } from 'element-plus'
import type { FormSchema } from '@/types/form'
import { checkPermi } from '@/utils/permission'
import { CommonStatusEnum } from '@/utils/constants'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

defineOptions({ name: 'SystemMenu' })

const canCreate = checkPermi(['system:menu:create'])
const { wsCache } = useCache()
const message = useMessage()

const list = ref<MenuVO[]>([])
const loading = ref(false)
const isExpandAll = ref(false)
const queryParams = reactive({
    name: undefined,
    status: undefined
})
const formRef = ref<InstanceType<typeof MenuForm>>()
const tableRef = ref<any>()

const tableColumns = reactive<TableColumn[]>([
    { field: 'name', label: '菜单名称', minWidth: '220px' },
    {
        field: 'icon',
        label: '图标',
        width: '120px',
        slots: {
            default: ({ row }) => {
                const menu = row as MenuVO
                return menu.icon ? <Icon icon={menu.icon} /> : '-'
            }
        }
    },
    { field: 'sort', label: '排序', width: '90px' },
    { field: 'permission', label: '权限标识', minWidth: '260px' },
    { field: 'component', label: '组件路径', minWidth: '280px' },
    { field: 'componentName', label: '组件名称', minWidth: '180px' },
    {
        field: 'status',
        label: '状态',
        width: '120px',
        slots: {
            default: ({ row }) => {
                const menu = row as MenuVO
                if (!checkPermi(['system:menu:update'])) {
                    return <DictTag type={DICT_TYPE.COMMON_STATUS} value={menu.status} />
                }
                return (
                    <ElSwitch
                        v-model={menu.status}
                        active-value={CommonStatusEnum.ENABLE}
                        inactive-value={CommonStatusEnum.DISABLE}
                        loading={!!menuStatusUpdating.value[menu.id]}
                        onChange={(val) => handleStatusChanged(menu, val as number)}
                    />
                )
            }
        }
    },
    {
        field: 'action',
        label: '操作',
        width: '200px',
        fixed: 'right',
        slots: {
            default: ({ row }) => {
                const menu = row as MenuVO
                return (
                    <>
                        {checkPermi(['system:menu:update']) ? (
                            <BaseButton
                                link
                                type="primary"
                                onClick={() => openForm('update', menu.id)}
                            >
                                修改
                            </BaseButton>
                        ) : null}
                        {checkPermi(['system:menu:create']) ? (
                            <BaseButton
                                link
                                type="primary"
                                onClick={() => openForm('create', undefined, menu.id)}
                            >
                                新增
                            </BaseButton>
                        ) : null}
                        {checkPermi(['system:menu:delete']) ? (
                            <BaseButton link type="danger" onClick={() => handleDelete(menu.id)}>
                                删除
                            </BaseButton>
                        ) : null}
                    </>
                )
            }
        }
    }
])

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'name',
        label: '菜单名称',
        component: 'Input',
        componentProps: {
            placeholder: '请输入菜单名称',
            clearable: true,
            style: { width: '240px' }
        }
    },
    {
        field: 'status',
        label: '状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择菜单状态',
            clearable: true,
            options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
            style: { width: '240px' }
        }
    }
])

const collectTreeNodes = (nodes: any[] = []) => {
    const result: any[] = []
    const loop = (items: any[]) => {
        items.forEach((item) => {
            result.push(item)
            if (item.children?.length) {
                loop(item.children)
            }
        })
    }
    loop(nodes)
    return result
}

const getList = async () => {
    loading.value = true
    try {
        const data = await MenuApi.getMenuList(queryParams)
        const source = Array.isArray(data) ? data : data?.list || []
        list.value = handleTree(source)
    } finally {
        loading.value = false
    }
}

const setSearchParams = async (params: Recordable) => {
    queryParams.name = params?.name || undefined
    queryParams.status = params?.status
    await getList()
}

const openForm = (type: string, id?: number, parentId?: number) => {
    formRef.value?.open(type, id, parentId)
}

const tableRegister = (table: any) => {
    tableRef.value = table
}

const toggleExpandAll = () => {
    isExpandAll.value = !isExpandAll.value
    const nodes = collectTreeNodes(list.value)
    nodes.forEach((node) => tableRef.value?.toggleRowExpansion?.(node, isExpandAll.value))
}

const refreshMenu = async () => {
    try {
        await message.confirm('即将更新缓存刷新浏览器！', '刷新菜单缓存')
        wsCache.delete(CACHE_KEY.USER)
        wsCache.delete(CACHE_KEY.ROLE_ROUTERS)
        location.reload()
    } catch {}
}

const handleDelete = async (id: number) => {
    try {
        await message.delConfirm()
        await MenuApi.deleteMenu(id)
        message.success('删除成功')
        await getList()
    } catch {}
}

const menuStatusUpdating = ref<Recordable>({})
const handleStatusChanged = async (menu: MenuVO, val: number) => {
    menuStatusUpdating.value[menu.id] = true
    try {
        menu.status = val
        await MenuApi.updateMenu(menu)
    } finally {
        menuStatusUpdating.value[menu.id] = false
    }
}

onMounted(() => {
    getList()
})
</script>
