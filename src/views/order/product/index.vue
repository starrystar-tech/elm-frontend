<template>
    <ContentWrap>
        <Search :schema="searchSchema" @search="setSearchParams" @reset="setSearchParams" />
        <div class="action-btn-wrap">
            <BaseButton v-if="canCreate" type="primary" @click="openForm('create')"
                >新增商品</BaseButton
            >
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

    <ProductForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue'
import { ElImage, ElLink, ElMessageBox } from 'element-plus'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import { DICT_TYPE } from '@/utils/dict'
import { defaultProps, handleTree } from '@/utils/tree'
import { dateFormatter } from '@/utils/formatTime'
import { fenToYuan } from '@/utils'
import * as ProductApi from '@/api/crm/product'
import * as ProductCategoryApi from '@/api/crm/product/category'
import ProductForm from './ProductForm.vue'
import { CRM_PRODUCT_CHANNEL_DICT, formatSettlementValue, getShelfTypeLabel } from './constants'

defineOptions({ name: 'OrderProduct' })

const canCreate = hasPermission(['crm:product:create'])
const canUpdate = hasPermission(['crm:product:update'])
const formRef = ref<InstanceType<typeof ProductForm>>()
const categoryOptions = ref<any[]>([])
const { push } = useRouter()
const message = useMessage()

const loadCategories = async () => {
    const resp = await ProductCategoryApi.getProductCategoryList({})
    const rawList = resp?.list || resp || []
    categoryOptions.value =
        Array.isArray(rawList) && rawList.some((item: any) => item.children)
            ? rawList
            : handleTree(rawList, 'id', 'parentId')
}

const searchSchema = computed<FormSchema[]>(() => [
    {
        field: 'name',
        label: '商品',
        component: 'Input',
        componentProps: {
            placeholder: '请输入商品名称',
            clearable: true,
            style: { width: '240px' }
        }
    },
    {
        field: 'categoryId',
        label: '商品分类',
        component: 'TreeSelect',
        componentProps: {
            data: categoryOptions.value,
            props: defaultProps,
            checkStrictly: true,
            defaultExpandAll: true,
            clearable: true,
            placeholder: '请选择商品分类',
            style: { width: '240px' }
        }
    },
    {
        field: 'status',
        label: '上架状态',
        component: 'Select',
        componentProps: {
            options: [
                { label: '待上架', value: 0 },
                { label: '已上架', value: 1 },
                { label: '已下架', value: 2 }
            ],
            clearable: true,
            placeholder: '请选择上架状态',
            style: { width: '220px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ProductApi.ProductRespVO>({
    getListApi: async (params) => await ProductApi.getProductPage(params)
})

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(params)
}

const openForm = (type: 'create' | 'update', id?: number) => {
    formRef.value?.open(type, id)
}

const openDetail = (id: number) => {
    push({ name: 'OrderProductDetail', params: { id } })
}

const toggleStatus = async (row: ProductApi.ProductRespVO) => {
    const nextStatus = row.status === 1 ? 2 : 1
    const actionText = nextStatus === 1 ? '上架' : '下架'
    await ElMessageBox.confirm(`确认${actionText}商品“${row.name}”吗？`, '提示', {
        type: 'warning'
    })
    await ProductApi.updateProductStatus({ id: row.id, status: nextStatus })
    message.success(`${actionText}成功`)
    await tableMethods.getList()
}

const tableColumns = computed<TableColumn[]>(() => [
    {
        field: 'coverUrl',
        label: '封面',
        width: '92px',
        slots: {
            default: (data) => (
                <ElImage
                    src={
                        data.row.coverUrl ||
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52"><rect width="100%" height="100%" rx="8" fill="%23f3f4f6"/><text x="50%" y="54%" font-size="11" text-anchor="middle" fill="%239ca3af">IMG</text></svg>'
                    }
                    fit="cover"
                    style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '8px',
                        border: '1px solid var(--el-border-color)'
                    }}
                    previewSrcList={data.row.coverUrl ? [data.row.coverUrl] : []}
                    previewTeleported
                />
            )
        }
    },
    {
        field: 'name',
        label: '商品名称',
        minWidth: '180px',
        fixed: 'left',
        slots: {
            default: (data) => (
                <ElLink underline={false} type="primary" onClick={() => openDetail(data.row.id)}>
                    {data.row.name}
                </ElLink>
            )
        }
    },
    { field: 'categoryPath', label: '商品分类', minWidth: '180px' },
    {
        field: 'status',
        label: '上架状态',
        width: '110px',
        slots: {
            default: (data) => (
                <DictTag type={DICT_TYPE.CRM_PRODUCT_STATUS} value={data.row.status} />
            )
        }
    },
    {
        field: 'price',
        label: '售价(元)',
        width: '110px',
        formatter: (_row, _column, cellValue) =>
            cellValue !== undefined ? fenToYuan(cellValue) : '-'
    },
    {
        field: 'servicePeriodDays',
        label: '服务期',
        width: '90px',
        formatter: (_r, _c, v) => `${v || 0}天`
    },
    {
        field: 'minPrice',
        label: '最低价(元)',
        width: '120px',
        formatter: (_row, _column, cellValue) =>
            cellValue !== undefined && cellValue !== null ? fenToYuan(cellValue) : '-'
    },
    {
        field: 'costPrice',
        label: '成本价(元)',
        width: '120px',
        formatter: (_row, _column, cellValue) =>
            cellValue !== undefined && cellValue !== null ? fenToYuan(cellValue) : '-'
    },
    { field: 'settlementTypeName', label: '结算方式', minWidth: '130px' },
    {
        field: 'settlementValue',
        label: '结算金额/比例',
        minWidth: '140px',
        slots: {
            default: (data) =>
                formatSettlementValue(data.row.settlementType, data.row.settlementValue)
        }
    },
    {
        field: 'channelCodeList',
        label: '上架渠道',
        minWidth: '180px',
        slots: {
            default: (data) => (
                <DictTag type={CRM_PRODUCT_CHANNEL_DICT} value={data.row.channelCodeList || []} />
            )
        }
    },
    {
        field: 'shelfType',
        label: '上架方式',
        minWidth: '120px',
        formatter: (_r, _c, v) => getShelfTypeLabel(v)
    },
    { field: 'creator', label: '创建人', width: '110px' },
    { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        width: '180px',
        fixed: 'right',
        slots: {
            default: (data) => (
                <>
                    <BaseButton link type="primary" onClick={() => openDetail(data.row.id)}>
                        详情
                    </BaseButton>
                    {canUpdate ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => openForm('update', data.row.id)}
                        >
                            编辑
                        </BaseButton>
                    ) : null}
                    {canUpdate ? (
                        <BaseButton
                            link
                            type={data.row.status === 1 ? 'warning' : 'success'}
                            onClick={() => toggleStatus(data.row)}
                        >
                            {data.row.status === 1 ? '下架' : '上架'}
                        </BaseButton>
                    ) : null}
                </>
            )
        }
    }
])

onMounted(async () => {
    await loadCategories()
    await tableMethods.getList()
})
</script>
