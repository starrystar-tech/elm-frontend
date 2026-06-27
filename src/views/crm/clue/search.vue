<template>
    <ContentWrap>
        <div class="customer-search-page">
            <div class="customer-search-page__toolbar action-btn-wrap">
                <el-input
                    v-model="keyword"
                    clearable
                    placeholder="请输入姓名、手机号或客户编号"
                    @keyup.enter="handleSearch"
                >
                    <template #suffix>
                        <Icon
                            class="cursor-pointer text-[var(--el-text-color-secondary)]"
                            icon="ep:search"
                            @click="handleSearch"
                        />
                    </template>
                </el-input>
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
        </div>
    </ContentWrap>
    <ClueDetailDrawer ref="detailRef" @refresh="tableMethods.getList" />
</template>

<script setup lang="tsx">
import { ElLink } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ContentWrap } from '@/components/ContentWrap'
import { Table, type TableColumn } from '@/components/Table'
import { useTable } from '@/hooks/web/useTable'
import * as ClueApi from '@/api/crm/clue'
import ClueDetailDrawer from './detail/ClueDetailDrawer.vue'

defineOptions({ name: 'CrmClueSearch' })

const route = useRoute()
const router = useRouter()

const routeKeyword = computed(() => String(route.query.keyword || '').trim())
const keyword = ref(routeKeyword.value)

const {
    tableRegister,
    tableObject,
    methods: tableMethods
} = useTable<ClueApi.ClueSearchPageRespVO>({
    getListApi: async (params) =>
        await ClueApi.getClueSearchPage({
            ...(params as ClueApi.ClueSearchPageReqVO),
            keyword: routeKeyword.value
        })
})

const detailRef = ref<InstanceType<typeof ClueDetailDrawer>>()

const openDetail = (id?: number) => {
    if (!id) return
    detailRef.value?.open(Number(id))
}

const tableColumns = ref<TableColumn[]>([
    {
        field: 'customerId',
        label: '客户编号',
        minWidth: 160,
        slots: {
            default: (data) => (
                <ElLink type="primary" underline={false} onClick={() => openDetail(data.row.id)}>
                    {data.row.customerId || '--'}
                </ElLink>
            )
        }
    },
    {
        field: 'name',
        label: '姓名',
        minWidth: 120,
        slots: {
            default: (data) => (
                <ElLink type="primary" underline={false} onClick={() => openDetail(data.row.id)}>
                    {data.row.name || '--'}
                </ElLink>
            )
        }
    },
    { field: 'currentOwnerName', label: '归属人', minWidth: 120 },
    { field: 'currentDepartmentName', label: '所在部门', minWidth: 140 },
    { field: 'consultProjectName', label: '咨询项目', minWidth: 160 },
    {
        field: 'tagNames',
        label: '标签',
        minWidth: 180,
        slots: {
            default: (data) => (
                <span>{data.row.tagNames?.length ? data.row.tagNames.join('、') : '--'}</span>
            )
        }
    }
])

const handleSearch = async () => {
    const value = keyword.value.trim()
    if (value === routeKeyword.value) {
        if (!value) {
            tableObject.tableList = []
            tableObject.total = 0
            return
        }
        if (tableObject.currentPage !== 1) {
            tableObject.currentPage = 1
            return
        }
        await tableMethods.getList()
        return
    }
    await router.replace({
        path: '/crm/clue/search',
        query: value ? { keyword: value } : {}
    })
}

watch(
    routeKeyword,
    async (value) => {
        keyword.value = value
        if (!value) {
            tableObject.tableList = []
            tableObject.total = 0
            tableObject.loading = false
            return
        }
        if (tableObject.currentPage !== 1) {
            tableObject.currentPage = 1
            return
        }
        await tableMethods.getList()
    },
    { immediate: true }
)
</script>

<style scoped lang="scss">
.customer-search-page {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.customer-search-page__toolbar {
    width: min(420px, 100%);
}
</style>
