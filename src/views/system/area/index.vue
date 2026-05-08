<template>
  <ContentWrap>
    <div class="mb-10px">
      <BaseButton type="primary" @click="openForm()">IP 查询</BaseButton>
    </div>
  </ContentWrap>

  <ContentWrap>
    <Table :columns="columns" :data="list" :loading="loading" row-key="id" default-expand-all />
  </ContentWrap>

  <AreaForm ref="formRef" />
</template>
<script setup lang="tsx">
import { BaseButton } from '@/components/Button'
import { Table, type TableColumn } from '@/components/Table'
import AreaForm from './AreaForm.vue'
import * as AreaApi from '@/api/system/area'

defineOptions({ name: 'SystemArea' })

const columns: TableColumn[] = [
  {
    field: 'id',
    label: '编号',
    width: 240,
    key: 'id' // 树形展开对应的 key
  },
  {
    field: 'name',
    label: '地名'
  }
]
const loading = ref(true)
const list = ref<any[]>([])

/** 获得数据列表 */
const getList = async () => {
  loading.value = true
  try {
    list.value = await AreaApi.getAreaTree()
  } finally {
    loading.value = false
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = () => {
  formRef.value.open()
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
