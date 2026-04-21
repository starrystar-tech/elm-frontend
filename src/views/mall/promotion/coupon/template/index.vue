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
      @register="tableRegister"
    />
  </ContentWrap>

  <CouponTemplateForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { ElSwitch } from 'element-plus'
import { computed, reactive, ref } from 'vue'
import * as CouponTemplateApi from '@/api/mall/promotion/coupon/couponTemplate'
import { CommonStatusEnum } from '@/utils/constants'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import CouponTemplateForm from './CouponTemplateForm.vue'
import {
  discountFormat,
  remainedCountFormat,
  takeLimitCountFormat,
  totalCountFormat,
  validityTypeFormat
} from '@/views/mall/promotion/coupon/formatter'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'PromotionCouponTemplate' })

const canCreate = hasPermission(['promotion:coupon-template:create'])
const canUpdate = hasPermission(['promotion:coupon-template:update'])
const canDelete = hasPermission(['promotion:coupon-template:delete'])

const message = useMessage()
const formRef = ref()

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '优惠券名称',
    component: 'Input',
    componentProps: { placeholder: '请输入优惠劵名', clearable: true, style: { width: '240px' } }
  },
  {
    field: 'discountType',
    label: '优惠类型',
    component: 'Select',
    componentProps: {
      placeholder: '请选择优惠券类型',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.PROMOTION_DISCOUNT_TYPE),
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '优惠券状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择优惠券状态',
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

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await CouponTemplateApi.getCouponTemplatePage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleStatusChange = async (row: any) => {
  const text = row.status === CommonStatusEnum.ENABLE ? '启用' : '停用'
  try {
    await message.confirm(`确认要"${text}""${row.name}"优惠劵吗?`)
    await CouponTemplateApi.updateCouponTemplateStatus(row.id, row.status)
    message.success(`${text}成功`)
  } catch {
    row.status =
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  }
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await CouponTemplateApi.deleteCouponTemplate(id)
    message.success('删除成功')
    await tableMethods.getList()
  } catch {}
}

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'name', label: '优惠券名称', minWidth: '140' },
  {
    field: 'productScope',
    label: '类型',
    minWidth: '130',
    slots: {
      default: (data) => (
        <DictTag type={DICT_TYPE.PROMOTION_PRODUCT_SCOPE} value={data.row.productScope} />
      )
    }
  },
  {
    field: 'discount',
    label: '优惠',
    minWidth: '110',
    slots: {
      default: (data) => (
        <>
          <DictTag type={DICT_TYPE.PROMOTION_DISCOUNT_TYPE} value={data.row.discountType} />
          <div>{discountFormat(data.row)}</div>
        </>
      )
    }
  },
  {
    field: 'takeType',
    label: '领取方式',
    minWidth: '100',
    slots: {
      default: (data) => (
        <DictTag type={DICT_TYPE.PROMOTION_COUPON_TAKE_TYPE} value={data.row.takeType} />
      )
    }
  },
  { field: 'validityType', label: '使用时间', width: '185', formatter: validityTypeFormat },
  { field: 'totalCount', label: '发放数量', formatter: totalCountFormat },
  { field: 'remainedCount', label: '剩余数量', formatter: remainedCountFormat },
  { field: 'takeLimitCount', label: '领取上限', formatter: takeLimitCountFormat },
  {
    field: 'status',
    label: '状态',
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
  { field: 'createTime', label: '创建时间', width: '180', formatter: dateFormatter },
  {
    field: 'action',
    label: '操作',
    width: '120',
    fixed: 'right',
    slots: {
      default: (data) => (
        <>
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>
              修改
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
