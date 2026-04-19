<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton type="danger" @click="toggleExpandAll">展开/折叠</BaseButton>
      <BaseButton @click="refreshMenu">刷新菜单缓存</BaseButton>
    </div>
  </ContentWrap>

  <ContentWrap>
    <el-auto-resizer>
      <template #default="{ width }">
        <Table-v2
          v-model:expanded-row-keys="expandedRowKeys"
          :columns="columns"
          :data="list"
          :expand-column-key="columns[0].key"
          :height="1000"
          :width="width"
          fixed
          row-key="id"
        />
      </template>
    </el-auto-resizer>
  </ContentWrap>

  <MenuForm ref="formRef" @success="getList" />
</template>

<script lang="tsx" setup>
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { handleTree } from '@/utils/tree'
import * as MenuApi from '@/api/system/menu'
import { MenuVO } from '@/api/system/menu'
import MenuForm from './MenuForm.vue'
import DictTag from '@/components/DictTag/src/DictTag.vue'
import { Icon } from '@/components/Icon'
import { BaseButton } from '@/components/Button'
import { Search } from '@/components/Search'
import { ContentWrap } from '@/components/ContentWrap'
import { ElButton, TableV2FixedDir, ElSwitch } from 'element-plus'
import type { FormSchema } from '@/types/form'
import { checkPermi } from '@/utils/permission'
import { CommonStatusEnum } from '@/utils/constants'
import { CACHE_KEY, useCache } from '@/hooks/web/useCache'

defineOptions({ name: 'SystemMenu' })

const canCreate = checkPermi(['system:menu:create'])

const columns = [
  {
    key: 'name',
    title: '菜单名称',
    dataKey: 'name',
    width: 250,
    fixed: TableV2FixedDir.LEFT
  },
  {
    key: 'icon',
    title: '图标',
    dataKey: 'icon',
    width: 100,
    align: 'center',
    cellRenderer: ({ cellData: icon }) => <Icon icon={icon} />
  },
  {
    key: 'sort',
    title: '排序',
    dataKey: 'sort',
    width: 60
  },
  {
    key: 'permission',
    title: '权限标识',
    dataKey: 'permission',
    width: 300
  },
  {
    key: 'component',
    title: '组件路径',
    dataKey: 'component',
    width: 500
  },
  {
    key: 'componentName',
    title: '组件名称',
    dataKey: 'componentName',
    width: 200
  },
  {
    key: 'status',
    title: '状态',
    dataKey: 'status',
    width: 60,
    fixed: TableV2FixedDir.RIGHT,
    cellRenderer: ({ rowData }) => {
      if (!checkPermi(['system:menu:update'])) {
        return <DictTag type={DICT_TYPE.COMMON_STATUS} value={rowData.status} />
      }
      return (
        <ElSwitch
          v-model={rowData.status}
          active-value={CommonStatusEnum.ENABLE}
          inactive-value={CommonStatusEnum.DISABLE}
          loading={menuStatusUpdating[rowData.id]}
          class="ml-4px"
          onChange={(val) => handleStatusChanged(rowData, val)}
        />
      )
    }
  },
  {
    key: 'operations',
    title: '操作',
    align: 'center',
    width: 160,
    fixed: TableV2FixedDir.RIGHT,
    cellRenderer: ({ rowData }) => {
      const buttons: JSX.Element[] = []
      if (checkPermi(['system:menu:update'])) {
        buttons.push(
          <ElButton key="edit" link type="primary" onClick={() => openForm('update', rowData.id)}>
            修改
          </ElButton>
        )
      }
      if (checkPermi(['system:menu:create'])) {
        buttons.push(
          <ElButton
            key="create"
            link
            type="primary"
            onClick={() => openForm('create', undefined, rowData.id)}
          >
            新增
          </ElButton>
        )
      }
      if (checkPermi(['system:menu:delete'])) {
        buttons.push(
          <ElButton key="delete" link type="danger" onClick={() => handleDelete(rowData.id)}>
            删除
          </ElButton>
        )
      }
      return buttons.length ? <>{buttons}</> : null
    }
  }
]

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

const { wsCache } = useCache()
const message = useMessage()

const list = ref<any[]>([])
const queryParams = reactive({
  name: undefined,
  status: undefined
})
const isExpandAll = ref(false)
const expandedRowKeys = ref<number[]>([])
const formRef = ref<InstanceType<typeof MenuForm>>()

const getList = async () => {
  const data = await MenuApi.getMenuList(queryParams)
  list.value = handleTree(data)
}

const setSearchParams = async (params: Recordable) => {
  Object.assign(queryParams, params)
  await getList()
}

const openForm = (type: string, id?: number, parentId?: number) => {
  formRef.value?.open(type, id, parentId)
}

const toggleExpandAll = () => {
  expandedRowKeys.value = isExpandAll.value ? [] : list.value.map((item) => item.id)
  isExpandAll.value = !isExpandAll.value
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

const menuStatusUpdating = ref({})
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
