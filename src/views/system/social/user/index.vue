<template>
  <ContentWrap>
    <Search
      :schema="searchSchema"
      label-width="120px"
      @reset="setSearchParams"
      @search="setSearchParams"
    />
    <Table
      v-model:currentPage="tableObject.currentPage"
      v-model:pageSize="tableObject.pageSize"
      :columns="tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{ total: tableObject.total }"
      stripe
      show-overflow-tooltip
      @register="tableRegister"
    />
  </ContentWrap>

  <SocialUserDetail ref="detailRef" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { ElImage } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as SocialUserApi from '@/api/system/social/user'
import SocialUserDetail from './SocialUserDetail.vue'
import { createImageViewer } from '@/components/ImageViewer'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'SocialUser' })

const canQuery = hasPermission(['system:social-user:query'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'type',
    label: '社交平台',
    component: 'Select',
    componentProps: {
      placeholder: '请选择社交平台',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.SYSTEM_SOCIAL_TYPE),
      style: { width: '240px' }
    }
  },
  {
    field: 'nickname',
    label: '用户昵称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入用户昵称',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'openid',
    label: '社交 openid',
    component: 'Input',
    componentProps: {
      placeholder: '请输入社交 openid',
      clearable: true,
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

const detailRef = ref<InstanceType<typeof SocialUserDetail>>()
const openDetail = (id: number) => {
  detailRef.value?.open(id)
}

const imagePreview = (imgUrl: string) => {
  createImageViewer({
    urlList: [imgUrl]
  })
}

const { tableObject, tableMethods, register: tableRegister } = useTable<SocialUserApi.SocialUserVO>({
  getListApi: async (params) => await SocialUserApi.getSocialUserPage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const tableColumns = reactive<TableColumn[]>([
  {
    field: 'type',
    label: '社交平台',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.SYSTEM_SOCIAL_TYPE} value={data.row.type} />
    }
  },
  { field: 'openid', label: '社交 openid' },
  { field: 'nickname', label: '用户昵称' },
  {
    field: 'avatar',
    label: '用户头像',
    slots: {
      default: (data) => (
        <ElImage
          src={data.row.avatar}
          class="h-30px w-30px"
          onClick={() => imagePreview(data.row.avatar)}
        />
      )
    }
  },
  {
    field: 'createTime',
    label: '创建时间',
    formatter: dateFormatter,
    width: '180px'
  },
  {
    field: 'updateTime',
    label: '更新时间',
    formatter: dateFormatter,
    width: '180px'
  },
  {
    field: 'action',
    label: '操作',
    width: '100px',
    fixed: 'right',
    slots: {
      default: (data) =>
        canQuery ? (
          <BaseButton link type="primary" onClick={() => openDetail(data.row.id)}>
            详情
          </BaseButton>
        ) : null
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
