<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
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
</template>

<script lang="tsx" setup>
import { computed, onActivated, onMounted, reactive, ref } from 'vue'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter, formatPast2 } from '@/utils/formatTime'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import { CategoryApi, type CategoryVO } from '@/api/bpm/category'
import * as UserApi from '@/api/system/user'
import type { UserVO } from '@/api/system/user'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'

defineOptions({ name: 'BpmProcessInstanceManager' })

const router = useRouter()
const message = useMessage()
const { t } = useI18n()

const categoryList = ref<CategoryVO[]>([])
const userList = ref<UserVO[]>([])

const userOptions = computed(() =>
  userList.value.map((user) => ({
    label: user.nickname,
    value: user.id
  }))
)

const categoryOptions = computed(() =>
  categoryList.value.map((category) => ({
    label: category.name,
    value: category.code
  }))
)

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'startUserId',
    label: '发起人',
    component: 'Select',
    componentProps: {
      placeholder: '请选择发起人',
      clearable: true,
      options: [],
      style: { width: '240px' }
    }
  },
  {
    field: 'name',
    label: '流程名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入流程名称',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'processDefinitionId',
    label: '所属流程',
    component: 'Input',
    componentProps: {
      placeholder: '请输入流程定义的编号',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'category',
    label: '流程分类',
    component: 'Select',
    componentProps: {
      placeholder: '请选择流程分类',
      clearable: true,
      options: [],
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '流程状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择流程状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS),
      style: { width: '240px' }
    }
  },
  {
    field: 'createTime',
    label: '发起时间',
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

const syncSearchSchema = () => {
  const startUserSchema = searchSchema.find((item) => item.field === 'startUserId')
  const categorySchema = searchSchema.find((item) => item.field === 'category')
  if (startUserSchema?.componentProps) {
    startUserSchema.componentProps.options = userOptions.value
  }
  if (categorySchema?.componentProps) {
    categorySchema.componentProps.options = categoryOptions.value
  }
}

const { tableObject, tableMethods, register: tableRegister } = useTable({
  getListApi: async (params) => await ProcessInstanceApi.getProcessInstanceManagerPage(params)
})

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const handleDetail = (row: Recordable) => {
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: {
      id: row.id
    }
  })
}

const handleCancel = async (row: Recordable) => {
  const { value } = await ElMessageBox.prompt('请输入取消原因', '取消流程', {
    confirmButtonText: t('common.ok'),
    cancelButtonText: t('common.cancel'),
    inputPattern: /^[\s\S]*.*\S[\s\S]*$/,
    inputErrorMessage: '取消原因不能为空'
  })
  await ProcessInstanceApi.cancelProcessInstanceByAdmin(row.id, value)
  message.success('取消成功')
  await tableMethods.getList()
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'name', label: '流程名称', minWidth: '200px', fixed: 'left' },
  { field: 'categoryName', label: '流程分类', minWidth: '100', fixed: 'left' },
  { field: 'startUser.nickname', label: '流程发起人', width: '120' },
  { field: 'startUser.deptName', label: '发起部门', width: '120' },
  {
    field: 'status',
    label: '流程状态',
    width: '120',
    slots: {
      default: (data) => (
        <dict-tag type={DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS} value={data.row.status} />
      )
    }
  },
  { field: 'startTime', label: '发起时间', width: '180', formatter: dateFormatter },
  { field: 'endTime', label: '结束时间', width: '180', formatter: dateFormatter },
  {
    field: 'durationInMillis',
    label: '耗时',
    width: '169',
    slots: {
      default: (data) => (
        <span>
          {data.row.durationInMillis > 0 ? formatPast2(data.row.durationInMillis) : '-'}
        </span>
      )
    }
  },
  {
    field: 'tasks',
    label: '当前审批任务',
    minWidth: '120px',
    slots: {
      default: (data) => (
        <>
          {(data.row.tasks || []).map((task: Recordable) => (
            <el-button key={task.id} type="primary" link>
              <span>{task.name}</span>
            </el-button>
          ))}
        </>
      )
    }
  },
  { field: 'id', label: '流程编号', minWidth: '320px' },
  {
    field: 'action',
    label: '操作',
    fixed: 'right',
    width: '180',
    slots: {
      default: (data) => (
        <>
          <el-button
            link
            type="primary"
            v-hasPermi={['bpm:process-instance:cancel']}
            onClick={() => handleDetail(data.row)}
          >
            详情
          </el-button>
          {data.row.status === 1 ? (
            <el-button
              link
              type="primary"
              v-hasPermi={['bpm:process-instance:query']}
              onClick={() => handleCancel(data.row)}
            >
              取消
            </el-button>
          ) : undefined}
        </>
      )
    }
  }
])

onActivated(() => {
  tableMethods.getList()
})

onMounted(async () => {
  await tableMethods.getList()
  categoryList.value = await CategoryApi.getCategorySimpleList()
  userList.value = await UserApi.getSimpleUserList()
  syncSearchSchema()
})
</script>
