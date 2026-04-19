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

  <BannerForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { reactive, ref } from 'vue'
import { ElImage } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as BannerApi from '@/api/mall/market/banner'
import BannerForm from './BannerForm.vue'
import { createImageViewer } from '@/components/ImageViewer'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'Banner' })

const canCreate = hasPermission(['promotion:banner:create'])
const canUpdate = hasPermission(['promotion:banner:update'])
const canDelete = hasPermission(['promotion:banner:delete'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'title',
    label: 'Banner标题',
    component: 'Input',
    componentProps: { placeholder: '请输入Banner标题', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'status',
    label: '活动状态',
    component: 'Select',
    componentProps: {
      placeholder: '全部',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
      style: { width: '240px' }
    }
  },
  {
    field: 'createTime',
    label: '创建时间',
    component: 'DatePicker',
    componentProps: {
      type: 'daterange',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
      startPlaceholder: '开始日期',
      endPlaceholder: '结束日期',
      defaultTime: [new Date('1 00:00:00'), new Date('1 23:59:59')],
      style: { width: '240px' }
    }
  }
])

const imagePreview = (imgUrl: string) => {
  createImageViewer({ urlList: [imgUrl] })
}

const formRef = ref<InstanceType<typeof BannerForm>>()

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await BannerApi.getBannerPage(params),
  delListApi: async (id) => await BannerApi.deleteBanner(id as number)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'title', label: 'Banner标题', align: 'center' },
  {
    field: 'picUrl',
    label: '图片',
    align: 'center',
    minWidth: '80px',
    slots: {
      default: (data) => (
        <ElImage
          src={data.row.picUrl}
          class="h-30px w-30px"
          onClick={() => imagePreview(data.row.picUrl)}
        />
      )
    }
  },
  {
    field: 'status',
    label: '状态',
    align: 'center',
    slots: { default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} /> }
  },
  {
    field: 'position',
    label: '定位',
    align: 'center',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.PROMOTION_BANNER_POSITION} value={data.row.position} />
    }
  },
  { field: 'url', label: '跳转地址', align: 'center' },
  { field: 'createTime', label: '创建时间', align: 'center', width: '180px', formatter: dateFormatter },
  { field: 'sort', label: '排序', align: 'center' },
  { field: 'memo', label: '描述', align: 'center' },
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
