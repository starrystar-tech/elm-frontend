<template>
    <ContentWrap>
        <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />

        <div class="action-btn-wrap">
            <BaseButton v-if="canCreate" type="primary" @click="openForm('create')"
                >新增</BaseButton
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

    <ClueSourceForm ref="formRef" @success="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { dateFormatter } from '@/utils/formatTime'
import * as ClueSourceApi from '@/api/system/clueSource'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'
import ClueSourceForm from './ClueSourceForm.vue'

defineOptions({ name: 'SystemClueSource' })

const canCreate = hasPermission(['crm:clue-source:create'])
const canUpdate = hasPermission(['crm:clue-source:update'])
const canDelete = hasPermission(['crm:clue-source:delete'])

const message = useMessage()
const formRef = ref<InstanceType<typeof ClueSourceForm>>()

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'name',
        label: '来源名称',
        component: 'Input',
        componentProps: {
            clearable: true,
            placeholder: '请输入来源名称',
            style: { width: '220px' }
        }
    },
    {
        field: 'status',
        label: '状态',
        component: 'Select',
        componentProps: {
            clearable: true,
            placeholder: '请选择状态',
            options: getIntDictOptions(DICT_TYPE.COMMON_STATUS),
            style: { width: '220px' }
        }
    }
])

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable<ClueSourceApi.ClueSourceVO>({
    getListApi: async (params) => await ClueSourceApi.getClueSourcePage(params),
    delListApi: async (id) => await ClueSourceApi.deleteClueSource(id as number)
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

const handleUpdateStatus = async (row: ClueSourceApi.ClueSourceVO) => {
    const text = row.status === CommonStatusEnum.ENABLE ? '停用' : '启用'
    try {
        await message.confirm(`确认要${text}【${row.name}】吗？`)
        await ClueSourceApi.updateClueSource({
            id: row.id,
            name: row.name,
            sort: row.sort ?? 0,
            status:
                row.status === CommonStatusEnum.ENABLE
                    ? CommonStatusEnum.DISABLE
                    : CommonStatusEnum.ENABLE
        })
        message.success(text + '成功')
        await tableMethods.getList()
    } catch {}
}

const tableColumns = reactive<TableColumn[]>([
    { field: 'id', label: '编号', width: '90px' },
    { field: 'name', label: '来源名称', minWidth: '200px' },
    { field: 'sort', label: '排序', width: '90px' },
    {
        field: 'status',
        label: '状态',
        width: '100px',
        slots: {
            default: (data) => <DictTag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
        }
    },
    {
        field: 'updater',
        label: '更新人',
        width: '130px',
        slots: {
            default: (data) => data.row.updaterName || data.row.updater || '-'
        }
    },
    {
        field: 'updateTime',
        label: '更新时间',
        width: '180px',
        formatter: dateFormatter
    },
    {
        field: 'action',
        label: '操作',
        width: '220px',
        fixed: 'right',
        slots: {
            default: (data) => {
                const row = data.row as ClueSourceApi.ClueSourceVO
                return (
                    <>
                        {canUpdate ? (
                            <BaseButton
                                link
                                type="primary"
                                onClick={() => openForm('update', row.id)}
                            >
                                编辑
                            </BaseButton>
                        ) : null}
                        {canUpdate ? (
                            <BaseButton link type="primary" onClick={() => handleUpdateStatus(row)}>
                                {row.status === CommonStatusEnum.ENABLE ? '停用' : '启用'}
                            </BaseButton>
                        ) : null}
                        {canDelete ? (
                            <BaseButton link type="danger" onClick={() => handleDelete(row.id!)}>
                                删除
                            </BaseButton>
                        ) : null}
                    </>
                )
            }
        }
    }
])

onMounted(() => {
    tableMethods.getList()
})
</script>

<style scoped>
.action-btn-wrap {
    margin-bottom: 10px;
}
</style>
