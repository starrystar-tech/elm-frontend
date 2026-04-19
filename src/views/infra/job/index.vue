<template>
  <ContentWrap>
    <Search :schema="searchSchema" @reset="setSearchParams" @search="setSearchParams" />
    <div class="mb-10px">
      <BaseButton v-if="canCreate" type="primary" @click="openForm('create')">新增</BaseButton>
      <BaseButton
        v-if="canDelete"
        type="danger"
        :disabled="checkedIds.length === 0"
        @click="handleDeleteBatch"
      >
        批量删除
      </BaseButton>
      <BaseButton v-if="canExport" type="success" :loading="exportLoading" @click="handleExport">
        导出
      </BaseButton>
      <BaseButton v-if="canQuery" type="info" @click="handleJobLog()">执行日志</BaseButton>
    </div>
    <Table
      v-model:currentPage="tableObject.currentPage"
      v-model:pageSize="tableObject.pageSize"
      :columns="tableColumns"
      :data="tableObject.tableList"
      :loading="tableObject.loading"
      :pagination="{ total: tableObject.total }"
      selection
      @register="tableRegister"
      @selection-change="handleRowCheckboxChange"
    />
  </ContentWrap>

  <JobForm ref="formRef" @success="tableMethods.getList" />
  <JobDetail ref="detailRef" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { checkPermi } from '@/utils/permission'
import JobForm from './JobForm.vue'
import JobDetail from './JobDetail.vue'
import * as JobApi from '@/api/infra/job'
import { InfraJobStatusEnum } from '@/utils/constants'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { DictTag } from '@/components/DictTag'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'InfraJob' })

const { t } = useI18n()
const message = useMessage()
const { push } = useRouter()

const canCreate = hasPermission(['infra:job:create'])
const canUpdate = hasPermission(['infra:job:update'])
const canDelete = hasPermission(['infra:job:delete'])
const canExport = hasPermission(['infra:job:export'])
const canQuery = hasPermission(['infra:job:query'])
const canTrigger = hasPermission(['infra:job:trigger'])

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '任务名称',
    component: 'Input',
    componentProps: {
      placeholder: '请输入任务名称',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '任务状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择任务状态',
      clearable: true,
      options: getIntDictOptions(DICT_TYPE.INFRA_JOB_STATUS),
      style: { width: '240px' }
    }
  },
  {
    field: 'handlerName',
    label: '处理器的名字',
    component: 'Input',
    componentProps: {
      placeholder: '请输入处理器的名字',
      clearable: true,
      style: { width: '240px' }
    }
  }
])

const formRef = ref<InstanceType<typeof JobForm>>()
const detailRef = ref<InstanceType<typeof JobDetail>>()
const checkedIds = ref<number[]>([])

const { tableObject, tableMethods, register: tableRegister } = useTable<JobApi.JobVO>({
  getListApi: async (params) => await JobApi.getJobPage(params),
  delListApi: async (id) => await JobApi.deleteJob(id as number),
  exportListApi: async (params) => await JobApi.exportJob(params)
})

const exportLoading = computed(() => tableObject.exportLoading)

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const openDetail = (id: number) => {
  detailRef.value?.open(id)
}

const handleRowCheckboxChange = (rows: JobApi.JobVO[]) => {
  checkedIds.value = rows.map((row) => row.id)
}

const handleExport = async () => {
  await tableMethods.exportList('定时任务.xls')
}

const handleDelete = async (id: number) => {
  await tableMethods.delList(id, false)
}

const handleDeleteBatch = async () => {
  try {
    await message.delConfirm()
    await JobApi.deleteJobList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    await tableMethods.getList()
  } catch {}
}

const handleChangeStatus = async (row: JobApi.JobVO) => {
  try {
    const text = row.status === InfraJobStatusEnum.STOP ? '开启' : '关闭'
    await message.confirm(
      '确认要' + text + '定时任务编号为"' + row.id + '"的数据项?',
      t('common.reminder')
    )
    const status =
      row.status === InfraJobStatusEnum.STOP ? InfraJobStatusEnum.NORMAL : InfraJobStatusEnum.STOP
    await JobApi.updateJobStatus(row.id, status)
    message.success(text + '成功')
    await tableMethods.getList()
  } catch {}
}

const handleRun = async (row: JobApi.JobVO) => {
  try {
    await message.confirm('确认要立即执行一次' + row.name + '?', t('common.reminder'))
    await JobApi.runJob(row.id)
    message.success('执行成功')
    await tableMethods.getList()
  } catch {}
}

const handleJobLog = (id?: number) => {
  if (id && id > 0) {
    push('/job/job-log?id=' + id)
  } else {
    push('/job/job-log')
  }
}

const handleCommand = (command: string, row: JobApi.JobVO) => {
  switch (command) {
    case 'handleRun':
      handleRun(row)
      break
    case 'openDetail':
      openDetail(row.id)
      break
    case 'handleJobLog':
      handleJobLog(row.id)
      break
  }
}

const tableColumns = reactive<TableColumn[]>([
  { field: 'id', label: '任务编号' },
  { field: 'name', label: '任务名称' },
  {
    field: 'status',
    label: '任务状态',
    slots: {
      default: (data) => <DictTag type={DICT_TYPE.INFRA_JOB_STATUS} value={data.row.status} />
    }
  },
  { field: 'handlerName', label: '处理器的名字' },
  { field: 'handlerParam', label: '处理器的参数' },
  { field: 'cronExpression', label: 'CRON 表达式' },
  {
    field: 'action',
    label: '操作',
    width: '220px',
    slots: {
      default: (data) => (
        <>
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>
              修改
            </BaseButton>
          ) : null}
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => handleChangeStatus(data.row)}>
              {data.row.status === InfraJobStatusEnum.STOP ? '开启' : '暂停'}
            </BaseButton>
          ) : null}
          {canDelete ? (
            <BaseButton link type="danger" onClick={() => handleDelete(data.row.id)}>
              删除
            </BaseButton>
          ) : null}
          {canTrigger || canQuery ? (
            <ElDropdown onCommand={(command) => handleCommand(command as string, data.row)}>
              {{
                default: () => (
                  <ElButton type="primary" link>
                    <Icon icon="ep:d-arrow-right" />
                    更多
                  </ElButton>
                ),
                dropdown: () => (
                  <ElDropdownMenu>
                    {checkPermi(['infra:job:trigger']) ? (
                      <ElDropdownItem command="handleRun">执行一次</ElDropdownItem>
                    ) : null}
                    {checkPermi(['infra:job:query']) ? (
                      <ElDropdownItem command="openDetail">任务详细</ElDropdownItem>
                    ) : null}
                    {checkPermi(['infra:job:query']) ? (
                      <ElDropdownItem command="handleJobLog">调度日志</ElDropdownItem>
                    ) : null}
                  </ElDropdownMenu>
                )
              }}
            </ElDropdown>
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
