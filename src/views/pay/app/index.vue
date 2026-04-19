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

  <AppForm ref="formRef" @success="tableMethods.getList" />
  <AlipayChannelForm ref="alipayFormRef" @success="tableMethods.getList" />
  <WeixinChannelForm ref="weixinFormRef" @success="tableMethods.getList" />
  <MockChannelForm ref="mockFormRef" @success="tableMethods.getList" />
  <WalletChannelForm ref="walletFormRef" @success="tableMethods.getList" />
</template>

<script lang="tsx" setup>
import { computed, reactive, ref } from 'vue'
import { ElSwitch } from 'element-plus'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as AppApi from '@/api/pay/app'
import AppForm from './components/AppForm.vue'
import { CommonStatusEnum, PayChannelEnum } from '@/utils/constants'
import AlipayChannelForm from './components/channel/AlipayChannelForm.vue'
import WeixinChannelForm from './components/channel/WeixinChannelForm.vue'
import MockChannelForm from './components/channel/MockChannelForm.vue'
import WalletChannelForm from './components/channel/WalletChannelForm.vue'
import { Search } from '@/components/Search'
import { Table, type TableColumn } from '@/components/Table'
import { ContentWrap } from '@/components/ContentWrap'
import { BaseButton } from '@/components/Button'
import { useTable } from '@/hooks/web/useTable'
import type { FormSchema } from '@/types/form'
import { hasPermission } from '@/directives/permission/hasPermi'

defineOptions({ name: 'PayApp' })

const message = useMessage()
const { t } = useI18n()

const canCreate = hasPermission(['pay:app:create'])
const canUpdate = hasPermission(['pay:app:update'])
const canDelete = hasPermission(['pay:app:delete'])

const alipayChannels = [
  PayChannelEnum.ALIPAY_APP,
  PayChannelEnum.ALIPAY_PC,
  PayChannelEnum.ALIPAY_WAP,
  PayChannelEnum.ALIPAY_QR,
  PayChannelEnum.ALIPAY_BAR
]

const wxChannels = [
  PayChannelEnum.WX_LITE,
  PayChannelEnum.WX_PUB,
  PayChannelEnum.WX_APP,
  PayChannelEnum.WX_NATIVE,
  PayChannelEnum.WX_WAP,
  PayChannelEnum.WX_BAR
]

const searchSchema = reactive<FormSchema[]>([
  {
    field: 'name',
    label: '应用名',
    component: 'Input',
    componentProps: {
      placeholder: '请输入应用名',
      clearable: true,
      style: { width: '240px' }
    }
  },
  {
    field: 'status',
    label: '开启状态',
    component: 'Select',
    componentProps: {
      placeholder: '请选择开启状态',
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

const { tableObject, tableMethods, register: tableRegister } = useTable<AppApi.AppVO>({
  getListApi: async (params) => await AppApi.getAppPage(params)
})

const formRef = ref<InstanceType<typeof AppForm>>()
const alipayFormRef = ref<InstanceType<typeof AlipayChannelForm>>()
const weixinFormRef = ref<InstanceType<typeof WeixinChannelForm>>()
const mockFormRef = ref<InstanceType<typeof MockChannelForm>>()
const walletFormRef = ref<InstanceType<typeof WalletChannelForm>>()

const setSearchParams = (params: Recordable) => {
  tableMethods.setSearchParams(params)
}

const openForm = (type: string, id?: number) => {
  formRef.value?.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await AppApi.deleteApp(id)
    message.success(t('common.delSuccess'))
    await tableMethods.getList()
  } catch {}
}

const handleStatusChange = async (row: AppApi.AppVO) => {
  const text = row.status === CommonStatusEnum.ENABLE ? '启用' : '停用'
  try {
    await message.confirm('确认要"' + text + '""' + row.name + '"应用吗?')
    await AppApi.changeAppStatus({ id: row.id, status: row.status })
    message.success(text + '成功')
  } catch {
    row.status =
      row.status === CommonStatusEnum.ENABLE ? CommonStatusEnum.DISABLE : CommonStatusEnum.ENABLE
  }
}

const isChannelExists = (channels: string[] | undefined, channelCode: string) => {
  if (!channels) {
    return false
  }
  return channels.includes(channelCode)
}

const openChannelForm = (row: Recordable, payCode: string) => {
  if (payCode.indexOf('alipay_') === 0) {
    alipayFormRef.value?.open(row.id, payCode)
    return
  }
  if (payCode.indexOf('wx_') === 0) {
    weixinFormRef.value?.open(row.id, payCode)
    return
  }
  if (payCode.indexOf('mock') === 0) {
    mockFormRef.value?.open(row.id, payCode)
    return
  }
  if (payCode.indexOf('wallet') === 0) {
    walletFormRef.value?.open(row.id, payCode)
  }
}

const createChannelColumns = (channels: Array<{ name: string; code: string }>): TableColumn[] =>
  channels.map((channel) => ({
    field: channel.code,
    label: channel.name,
    minWidth: '100px',
    slots: {
      header: () => <>{channel.name.replace(/^支付宝|^微信/, '')}</>,
      default: (data) => (
        <BaseButton
          circle
          size="small"
          type={isChannelExists(data.row.channelCodes, channel.code) ? 'success' : 'danger'}
          onClick={() => openChannelForm(data.row, channel.code)}
        >
          <Icon icon={isChannelExists(data.row.channelCodes, channel.code) ? 'ep:check' : 'ep:close'} />
        </BaseButton>
      )
    }
  }))

const tableColumns = computed<TableColumn[]>(() => [
  { field: 'appKey', label: '应用标识' },
  { field: 'name', label: '应用名', minWidth: '120px' },
  {
    field: 'status',
    label: '开启状态',
    width: '120px',
    slots: {
      default: (data) => (
        <ElSwitch
          v-model={data.row.status}
          activeValue={0}
          inactiveValue={1}
          onChange={() => handleStatusChange(data.row)}
        />
      )
    }
  },
  {
    field: 'alipayConfig',
    label: '支付宝配置',
    children: createChannelColumns(alipayChannels)
  },
  {
    field: 'wechatConfig',
    label: '微信配置',
    children: createChannelColumns(wxChannels)
  },
  {
    field: 'walletConfig',
    label: '钱包支付配置',
    children: createChannelColumns([PayChannelEnum.WALLET])
  },
  {
    field: 'mockConfig',
    label: '模拟支付配置',
    children: createChannelColumns([PayChannelEnum.MOCK])
  },
  {
    field: 'action',
    label: '操作',
    minWidth: '110px',
    fixed: 'right',
    slots: {
      default: (data) => (
        <>
          {canUpdate ? (
            <BaseButton link type="primary" onClick={() => openForm('update', data.row.id)}>
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
