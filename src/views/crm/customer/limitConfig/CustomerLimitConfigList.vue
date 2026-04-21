<template>
    <div class="m-10px">
        <BaseButton plain @click="tableMethods.getList">
            <Icon icon="ep:refresh" class="mr-5px" />
            刷新
        </BaseButton>
        <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">
            <Icon icon="ep:plus" class="mr-5px" />
            新增
        </BaseButton>
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
    <CustomerLimitConfigForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import * as CustomerLimitConfigApi from '@/api/crm/customer/limitConfig'
import CustomerLimitConfigForm from './CustomerLimitConfigForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import { LimitConfType } from '@/api/crm/customer/limitConfig'
import { Table, type TableColumn } from '@/components/Table'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'CustomerLimitConfigList' })

const message = useMessage()
const { t } = useI18n()
const canCreate = hasPermission(['crm:customer-limit-config:create'])
const canUpdate = hasPermission(['crm:customer-limit-config:update'])
const canDelete = hasPermission(['crm:customer-limit-config:delete'])

const { confType } = defineProps<{ confType: LimitConfType }>()

const formRef = ref<InstanceType<typeof CustomerLimitConfigForm>>()

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable({
    getListApi: async (params) =>
        await CustomerLimitConfigApi.getCustomerLimitConfigPage({
            ...params,
            type: confType
        })
})

const openForm = (type: string, id?: number) => {
    formRef.value?.open(type, confType, id)
}

const handleDelete = async (id: number) => {
    try {
        await message.delConfirm()
        await CustomerLimitConfigApi.deleteCustomerLimitConfig(id)
        message.success(t('common.delSuccess'))
        await tableMethods.getList()
    } catch {}
}

const tableColumns = reactive<TableColumn[]>([
    { field: 'id', label: '编号', align: 'center' },
    {
        field: 'users',
        label: '规则适用人群',
        align: 'center',
        slots: {
            default: (data) => (
                <>{data.row?.users?.map((user: any) => user.nickname).join('，') || '-'}</>
            )
        }
    },
    {
        field: 'depts',
        label: '规则适用部门',
        align: 'center',
        slots: {
            default: (data) => (
                <>{data.row?.depts?.map((dept: any) => dept.name).join('，') || '-'}</>
            )
        }
    },
    {
        field: 'maxCount',
        label:
            confType === LimitConfType.CUSTOMER_QUANTITY_LIMIT
                ? '拥有客户数上限'
                : '锁定客户数上限',
        align: 'center'
    },
    ...(confType === LimitConfType.CUSTOMER_QUANTITY_LIMIT
        ? [
              {
                  field: 'dealCountEnabled',
                  label: '成交客户是否占用拥有客户数',
                  align: 'center',
                  minWidth: 160,
                  slots: {
                      default: (data) => (
                          <DictTag
                              type={DICT_TYPE.INFRA_BOOLEAN_STRING}
                              value={data.row.dealCountEnabled}
                          />
                      )
                  }
              } as TableColumn
          ]
        : []),
    {
        field: 'createTime',
        label: '创建时间',
        align: 'center',
        width: '180px',
        formatter: dateFormatter
    },
    {
        field: 'action',
        label: '操作',
        align: 'center',
        minWidth: 120,
        slots: {
            default: (data) => (
                <>
                    {canUpdate ? (
                        <BaseButton
                            link
                            type="primary"
                            onClick={() => openForm('update', data.row.id)}
                        >
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
