<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
    </div>
    <Table
      v-model:currentPage="tableObject.currentPage"
      v-model:pageSize="tableObject.pageSize"
      :columns="tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{ total: tableObject.total }"
      :show-overflow-tooltip="true"
      :stripe="true"
      @register="tableRegister"
    />
  </ContentWrap>

  <PointActivityForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import PointActivityForm from './PointActivityForm.vue'
import { fenToYuanFormat } from '@/utils/formatter'
import { PointActivityApi } from '@/api/mall/promotion/point'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'PointActivity' })

const canCreate = hasPermission(['promotion:point-activity:create'])
const canUpdate = hasPermission(['promotion:point-activity:update'])
const canClose = hasPermission(['promotion:point-activity:close'])
const canDelete = hasPermission(['promotion:point-activity:delete'])

const message = useMessage()
const formRef = ref()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'status',
    label: '活动状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择活动状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
      style: { width: '240px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await PointActivityApi.getPointActivityPage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleClose = async (id: number) => {
  try {
    await message.confirm('确认关闭该积分商城活动吗？')
    await PointActivityApi.closePointActivity(id)
    message.success('关闭成功')
    await tableMethods.getList()
  } catch {}
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await PointActivityApi.deletePointActivity(id)
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'id', label: '活动编号', minWidth: '80' },
  {
    field: 'picUrl',
    label: '商品图片',
    minWidth: '80',
    slots: {
      default: (data) => (
        <el-image
          preview-src-list={[data.row.picUrl]}
          src={data.row.picUrl}
          class="h-40px w-40px"
          preview-teleported
        />
      )
    }
  },
  { field: 'spuName', label: '商品标题', minWidth: '300' },
  { field: 'marketPrice', label: '原价', minWidth: '100', formatter: fenToYuanFormat },
  {
    field: 'status',
    label: '活动状态',
    minWidth: '100',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'stock', label: '库存', minWidth: '80' },
  { field: 'totalStock', label: '总库存', minWidth: '80' },
  {
    field: 'redeemedQuantity',
    label: '已兑换数量',
    minWidth: '100',
    slots: {
      default: (data) => <span>{(data.row.totalStock || 0) - (data.row.stock || 0)}</span>
    }
  },
  { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '150px',
    fixed: 'right',
    slots: {
      default: (data) => (
        <>
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>
              编辑
            </BaseButton>
          ) : null}
          {canClose && data.row.status === 0 ? (
            <BaseButton link type="danger" onClick={() => handleClose(data.row.id)}>
              关闭
            </BaseButton>
          ) : null}
          {canDelete && data.row.status !== 0 ? (
            <BaseButton link type="danger" onClick={() => handleDelete(data.row.id)}>
              删除
            </BaseButton>
          ) : null}
        </>
      )
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
