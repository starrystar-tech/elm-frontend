<template>
    <ContentWrap>
        <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
        <div class="mb-10px">
            <BaseButton
                v-hasPermi="['bpm:user-group:create']"
                type="primary"
                @click="openForm('create')"
            >
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
    </ContentWrap>

    <UserGroupForm ref="formRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import * as UserGroupApi from '@/api/bpm/userGroup'
import * as UserApi from '@/api/system/user'
import UserGroupForm from './UserGroupForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import type { UserVO } from '@/api/system/user'

defineOptions({ name: 'BpmUserGroup' })

const message = useMessage()
const { t } = useI18n()

const formRef = ref<InstanceType<typeof UserGroupForm>>()
const userList = ref<UserVO[]>([])

const userMap = computed(() =>
    userList.value.reduce(
        (map, user) => {
            map[user.id] = user.nickname
            return map
        },
        {} as Record<number, string>
    )
)

const searchSchema = reactive<FormSchema[]>([
    {
        field: 'name',
        label: '组名',
        component: 'Input',
        componentProps: { placeholder: '请输入组名', clearable: true, style: { width: '240px' } }
    },
    {
        field: 'status',
        label: '状态',
        component: 'Select',
        componentProps: {
            placeholder: '请选择状态',
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

const {
    tableObject,
    tableMethods,
    register: tableRegister
} = useTable({
    getListApi: async (params) => await UserGroupApi.getUserGroupPage(params)
})

const openForm = (type: string, id?: number) => {
    formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
    try {
        await message.delConfirm()
        await UserGroupApi.deleteUserGroup(id)
        message.success(t('common.delSuccess'))
        await tableMethods.getList()
    } catch {}
}

const setSearchParams = (params: Recordable) => {
    tableMethods.setSearchParams(params)
}

const tableColumns = reactive<TableColumn[]>([
    { field: 'id', label: '编号' },
    { field: 'name', label: '组名' },
    { field: 'description', label: '描述' },
    {
        field: 'userIds',
        label: '成员',
        slots: {
            default: (data) => (
                <span>
                    {(data.row.userIds || [])
                        .map((id: number) => userMap.value[id])
                        .filter(Boolean)
                        .join(' ')}
                </span>
            )
        }
    },
    {
        field: 'status',
        label: '状态',
        slots: {
            default: (data) => <dict-tag type={DICT_TYPE.COMMON_STATUS} value={data.row.status} />
        }
    },
    { field: 'createTime', label: '创建时间', formatter: dateFormatter },
    {
        field: 'action',
        label: '操作',
        slots: {
            default: (data) => (
                <>
                    <BaseButton
                        v-hasPermi={['bpm:user-group:update']}
                        link
                        type="primary"
                        onClick={() => openForm('update', data.row.id)}
                    >
                        编辑
                    </BaseButton>
                    <BaseButton
                        v-hasPermi={['bpm:user-group:delete']}
                        link
                        type="danger"
                        onClick={() => handleDelete(data.row.id)}
                    >
                        删除
                    </BaseButton>
                </>
            )
        }
    }
])

onMounted(async () => {
    await tableMethods.getList()
    userList.value = await UserApi.getSimpleUserList()
})
</script>
