<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">添加虚拟评论</BaseButton>
    </div>
    <Table
      v-model:currentPage="tableObject.currentPage"
      v-model:pageSize="tableObject.pageSize"
      :columns="tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{ total: tableObject.total }"
      :stripe="true"
      :show-overflow-tooltip="false"
      @register="tableRegister"
    />
  </ContentWrap>

  <CommentForm ref="formRef" @success="tableMethods.getList" />
  <ReplyForm ref="replyFormRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { reactive, ref } from 'vue'
import { ElImage, ElSwitch, ElTag } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as CommentApi from '@/api/mall/product/comment'
import CommentForm from './CommentForm.vue'
import ReplyForm from './ReplyForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'ProductComment' })

const canCreate = hasPermission(['product:comment:create'])
const canUpdate = hasPermission(['product:comment:update'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'replyStatus',
    label: '回复状态',
    component: 'Select',
    componentProps: {
      options: [
        { label: '已回复', value: true },
        { label: '未回复', value: false }
      ],
      style: { width: '240px' }
    }
  },
  {
    field: 'spuName',
    label: '商品名称',
    component: 'Input',
    componentProps: { placeholder: '请输入商品名称', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'userNickname',
    label: '用户名称',
    component: 'Input',
    componentProps: { placeholder: '请输入用户名称', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'orderId',
    label: '订单编号',
    component: 'Input',
    componentProps: { placeholder: '请输入订单编号', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'createTime',
    label: '评论时间',
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

const normalizeList = (list: CommentApi.CommentVO[]) => {
  list.forEach((item) => {
    if (!item.visible) {
      item.visible = false
    }
  })
  return list
}

const formRef = ref<InstanceType<typeof CommentForm>>()
const replyFormRef = ref<InstanceType<typeof ReplyForm>>()

const { tableObject, tableMethods, register: tableRegister } = useTable<CommentApi.CommentVO>({
  getListApi: async (params) => {
    const data = await CommentApi.getCommentPage(params)
    return {
      ...data,
      list: normalizeList(data.list)
    }
  }
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleReply = (id: number) => {
  replyFormRef.value?.open(id)
}

const handleVisibleChange = async (row: CommentApi.CommentVO) => {
  if (tableObject.loading) {
    return
  }
  const message = useMessage()
  const changedValue = row.visible
  try {
    await message.confirm(changedValue ? '是否显示评论？' : '是否隐藏评论？')
    await CommentApi.updateCommentVisible({ id: row.id, visible: changedValue })
    await tableMethods.getList()
  } catch {
    row.visible = !changedValue
  }
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '评论编号', align: 'center', minWidth: '80px' },
  {
    field: 'spuInfo',
    label: '商品信息',
    align: 'center',
    minWidth: '400px',
    slots: {
      default: (data) => (
        <div class="row flex items-center gap-x-4px">
          {data.row.skuPicUrl ? (
            <ElImage
              src={data.row.skuPicUrl}
              preview-src-list={[data.row.skuPicUrl]}
              class="h-40px w-40px shrink-0"
              preview-teleported
            />
          ) : null}
          <div>{data.row.spuName}</div>
          {data.row.skuProperties?.map((property) => (
            <ElTag key={property.propertyId} class="mr-10px">
              {property.propertyName}: {property.valueName}
            </ElTag>
          ))}
        </div>
      )
    }
  },
  { field: 'userNickname', label: '用户名称', align: 'center', width: '100px' },
  { field: 'descriptionScores', label: '商品评分', align: 'center', width: '90px' },
  { field: 'benefitScores', label: '服务评分', align: 'center', width: '90px' },
  {
    field: 'content',
    label: '评论内容',
    align: 'center',
    minWidth: '210px',
    slots: {
      default: (data) => (
        <>
          <p>{data.row.content}</p>
          <div class="flex justify-center gap-x-4px">
            {data.row.picUrls?.map((picUrl, index) => (
              <ElImage
                key={`${picUrl}-${index}`}
                src={picUrl}
                preview-src-list={data.row.picUrls}
                initial-index={index}
                class="h-40px w-40px"
                preview-teleported
              />
            ))}
          </div>
        </>
      )
    }
  },
  {
    field: 'replyContent',
    label: '回复内容',
    align: 'center',
    minWidth: '250px',
    showOverflowTooltip: true
  },
  { field: 'createTime', label: '评论时间', align: 'center', width: '180px', formatter: dateFormatter },
  {
    field: 'visible',
    label: '是否展示',
    align: 'center',
    width: '80px',
    slots: {
      default: (data) => (
        <ElSwitch
          v-model={data.row.visible}
          active-value={true}
          inactive-value={false}
          disabled={!canUpdate}
          onChange={() => handleVisibleChange(data.row)}
        />
      )
    }
  },
  {
    field: 'action',
    label: '操作',
    align: 'center',
    minWidth: '60px',
    fixed: 'right',
    slots: {
      default: (data) =>
        canUpdate ? (
          <BaseButton link type="primary" onClick={() => handleReply(data.row.id)}>
            回复
          </BaseButton>
        ) : null
    }
  }
])

onMounted(() => {
  tableMethods.getList()
})
</script>
