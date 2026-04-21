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
      :stripe="true"
      :show-overflow-tooltip="true"
      @register="tableRegister"
    />
  </ContentWrap>

  <SeckillConfigForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { ElSwitch } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { SeckillConfigApi, SeckillConfigVO } from '@/api/mall/promotion/seckill/seckillConfig.ts'
import SeckillConfigForm from './SeckillConfigForm.vue'
import { CommonStatusEnum } from '@/utils/constants'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'SeckillConfig' })

const canCreate = hasPermission(['promotion:seckill-config:create'])
const canUpdate = hasPermission(['promotion:seckill-config:update'])
const canDelete = hasPermission(['promotion:seckill-config:delete'])

const message = useMessage()
const formRef = ref()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '秒杀时段名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入秒杀时段名称',
      clearable: true,
      style: { width: '240px' }
    }
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
  }
])

const { tableObject, tableMethods, register: tableRegister } = useTable<SeckillConfigVO>({
  getListApi: async (params) => await SeckillConfigApi.getSeckillConfigPage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await SeckillConfigApi.deleteSeckillConfig(id)
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const handleStatusChange = async (row: SeckillConfigVO) => {
  try {
    const text = row.status === CommonStatusEnum.ENABLE ? '启用' : '停用'
    await message.confirm(`确认要${text}"${row.name}"活动吗?`)
    await SeckillConfigApi.updateSeckillConfigStatus(row.id, row.status)
    await tableMethods.getList()
  } catch {
    row.status =
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  }
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'name', label: '秒杀时段名称', align: 'center' },
  { field: 'startTime', label: '开始时间点', align: 'center' },
  { field: 'endTime', label: '结束时间点', align: 'center' },
  {
    field: 'sliderPicUrls',
    label: '秒杀轮播图',
    align: 'center',
    slots: {
      default: (data) =>
        data.row.sliderPicUrls?.map((url: string, index: number) => (
          <el-image
            class="h-40px max-w-40px"
            key={index}
            src={url}
            preview-src-list={data.row.sliderPicUrls}
            initial-index={index}
            preview-teleported
          />
        ))
    }
  },
  {
    field: 'status',
    label: '活动状态',
    align: 'center',
    slots: {
      default: (data) => (
        <ElSwitch
          modelValue={data.row.status}
          activeValue={0}
          inactiveValue={1}
          onChange={(value: number) => {
            data.row.status = value
            handleStatusChange(data.row)
          }}
        />
      )
    }
  },
  { field: 'createTime', label: '创建时间', align: 'center', width: '180px', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    align: 'center',
    slots: {
      default: (data) => (
        <>
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>
              编辑
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
