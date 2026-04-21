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
      default-expand-all
      node-key="id"
      @register="tableRegister"
    />
  </ContentWrap>

  <RewardForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as RewardActivityApi from '@/api/mall/promotion/reward/rewardActivity'
import RewardForm from './RewardForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'PromotionRewardActivity' })

const canCreate = hasPermission(['promotion:reward-activity:create'])
const canUpdate = hasPermission(['promotion:reward-activity:update'])
const canClose = hasPermission(['promotion:reward-activity:close'])
const canDelete = hasPermission(['promotion:reward-activity:delete'])

const message = useMessage()
const formRef = ref<InstanceType<typeof RewardForm>>()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '活动名称',
    component: 'Input',
    componentProps: { placeholder: '请输入活动名称', clearable: true, style: { width: '240px' } }
  },
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
  },
  {
    field: 'createTime',
    label: '活动时间',
    component: 'DatePicker',
    componentProps: {
      type: 'daterange',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
      startPlaceholder: '活动开始日期',
      endPlaceholder: '活动结束日期',
      defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
      style: { width: '240px' }
    }
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<any>({
  getListApi: async (params) => await RewardActivityApi.getRewardActivityPage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleClose = async (id: number) => {
  try {
    await message.confirm('确认关闭该满减活动吗？')
    await RewardActivityApi.closeRewardActivity(id)
    message.success('关闭成功')
    await tableMethods.getList()
  } catch {}
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await RewardActivityApi.deleteRewardActivity(id)
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'name', label: '活动名称' },
  {
    field: 'productScope',
    label: '活动范围',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.PROMOTION_PRODUCT_SCOPE} value={data.row.productScope} />
    }
  },
  { field: 'startTime', label: '活动开始时间', formatter: dateFormatter },
  { field: 'endTime', label: '活动结束时间', formatter: dateFormatter },
  {
    field: 'status',
    label: '状态',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
    }
  },
  { field: 'createTime', label: '创建时间', width: '180', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
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
          {canDelete ? (
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
