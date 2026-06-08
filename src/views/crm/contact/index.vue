<template>
    <ContentWrap>
        <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
        <el-tabs v-model="activeName" @tab-click="handleTabClick" class="list-tabs-compact">
            <el-tab-pane label="我负责的" name="1" />
            <el-tab-pane label="我参与的" name="2" />
            <el-tab-pane label="下属负责的" name="3" />
        </el-tabs>
        <div class="mb-10px">
            <BaseButton v-if="canCreate" type="primary" @click="openForm('create')"
                >新增</BaseButton
            >
            <BaseButton
                v-if="canExport"
                type="primary" plain
                :loading="exportLoading"
                @click="handleExport"
            >
                导出
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
    </ContentWrap>

    <ContactForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { ElLink, type TabsPaneContext } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import * as ContactApi from '@/api/crm/contact'
import ContactForm from './ContactForm.vue'
import { DICT_TYPE } from '@/utils/dict'
import * as CustomerApi from '@/api/crm/customer'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import { renderCopyMobileCell } from '@/views/crm/clue/mobileCopy'

defineOptions({ name: 'CrmContact' })

const message = useMessage()
const canCreate = hasPermission(['crm:contact:create'])
const canUpdate = hasPermission(['crm:contact:update'])
const canDelete = hasPermission(['crm:contact:delete'])
const canExport = hasPermission(['crm:contact:export'])

const activeName = ref('1')
const customerList = ref<CustomerApi.CustomerVO[]>([])

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'customerId',
        label: '客户',
        component: 'Select',
        componentProps: {
            placeholder: '请选择客户',
            clearable: true,
            options: [],
            style: { width: '240px' }
        }
    },
    {
        field: 'name',
        label: '姓名',
        component: 'Input',
        componentProps: { placeholder: '请输入姓名', clearable: true, style: { width: '240px' } }
    },
    {
        field: 'mobile',
        label: '手机号',
        component: 'Input',
        componentProps: { placeholder: '请输入手机号', clearable: true, style: { width: '240px' } }
    },
    {
        field: 'telephone',
        label: '电话',
        component: 'Input',
        componentProps: { placeholder: '请输入电话', clearable: true, style: { width: '240px' } }
    },
    {
        field: 'wechat',
        label: '微信',
        component: 'Input',
        componentProps: { placeholder: '请输入微信', clearable: true, style: { width: '240px' } }
    },
    {
        field: 'email',
        label: '电子邮箱',
        component: 'Input',
        componentProps: {
            placeholder: '请输入电子邮箱',
            clearable: true,
            style: { width: '240px' }
        }
    }
])

const formRef = ref<InstanceType<typeof ContactForm>>()
const { push } = useRouter()

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ContactApi.ContactVO>({
    getListApi: async (params) =>
        await ContactApi.getContactPage({
            ...params,
            sceneType: activeName.value
        }),
    delListApi: async (id) => await ContactApi.deleteContact(id as number),
    exportListApi: async (params) =>
        await ContactApi.exportContact({
            ...params,
            sceneType: activeName.value
        })
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams({
        ...params,
        sceneType: activeName.value
    })
}

const handleTabClick = (tab: TabsPaneContext) => {
    activeName.value = String(tab.paneName)
    tableMethods.setSearchParams({
        ...(tableObject.params || {}),
        sceneType: activeName.value
    })
}

const openForm = (type: string, id?: number) => {
    formRef.value?.open(type, id)
}

const openDetail = (id: number) => {
    push({ name: 'CrmContactDetail', params: { id } })
}

const openCustomerDetail = (id: number) => {
    push({ name: 'CrmCustomerDetail', params: { id } })
}

const handleDelete = async (id: number) => {
    await tableMethods.delList(id, false)
}

const handleExport = async () => {
    await tableMethods.exportList('联系人.xls')
}

const tableColumns = reactive<TableColumn[]>([
    {
        field: 'name',
        label: '联系人姓名',
        width: '160px',
        fixed: 'left',
        slots: {
            default: (data) => (
                <ElLink underline={false} type="primary" onClick={() => openDetail(data.row.id)}>
                    {data.row.name}
                </ElLink>
            )
        }
    },
    {
        field: 'customerName',
        label: '客户名称',
        width: '120px',
        fixed: 'left',
        slots: {
            default: (data) => (
                <ElLink
                    underline={false}
                    type="primary"
                    onClick={() => openCustomerDetail(data.row.customerId)}
                >
                    {data.row.customerName}
                </ElLink>
            )
        }
    },
    {
        field: 'mobile',
        label: '手机',
        width: '170px',
        slots: {
            default: (data) =>
                renderCopyMobileCell({
                    row: { id: data.row.id },
                    mobile: data.row.mobile,
                    directCopyWhenMissingClueId: true,
                    success: message.success,
                    warning: message.warning
                })
        }
    },
    { field: 'telephone', label: '电话', width: '130px' },
    { field: 'email', label: '邮箱', width: '180px' },
    { field: 'post', label: '职位', width: '120px' },
    { field: 'detailAddress', label: '地址', width: '180px' },
    {
        field: 'master',
        label: '关键决策人',
        width: '100px',
        slots: {
            default: (data) => (
                <DictTag type={DICT_TYPE.INFRA_BOOLEAN_STRING} value={data.row.master} />
            )
        }
    },
    {
        field: 'parentName',
        label: '直属上级',
        width: '160px',
        slots: {
            default: (data) =>
                data.row.parentId ? (
                    <ElLink
                        underline={false}
                        type="primary"
                        onClick={() => openDetail(data.row.parentId)}
                    >
                        {data.row.parentName}
                    </ElLink>
                ) : (
                    <>{data.row.parentName}</>
                )
        }
    },
    { field: 'contactNextTime', label: '下次联系时间', width: '180px', formatter: dateFormatter },
    {
        field: 'sex',
        label: '性别',
        slots: {
            default: (data) => <DictTag type={DICT_TYPE.SYSTEM_USER_SEX} value={data.row.sex} />
        }
    },
    { field: 'remark', label: '备注' },
    { field: 'contactLastTime', label: '最后跟进时间', width: '180px', formatter: dateFormatter },
    { field: 'ownerUserName', label: '负责人', width: '120px' },
    { field: 'ownerUserDeptName', label: '所属部门', width: '100px' },
    { field: 'updateTime', label: '更新时间', width: '180px', formatter: dateFormatter },
    { field: 'createTime', label: '创建时间', width: '180px', formatter: dateFormatter },
    { field: 'creatorName', label: '创建人', width: '120px' },
    {
        field: 'action',
        label: '操作',
        width: '200px',
        fixed: 'right',
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

onMounted(async () => {
    customerList.value = await CustomerApi.getCustomerSimpleList()
    searchSchema[0].componentProps = {
        ...(searchSchema[0].componentProps || {}),
        options: customerList.value.map((item) => ({ label: item.name, value: item.id }))
    }
    tableMethods.setSearchParams({ sceneType: activeName.value })
})
</script>
