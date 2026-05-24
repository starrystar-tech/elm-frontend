<template>
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="760px">
        <el-form
            ref="formRef"
            v-loading="formLoading"
            :model="formData"
            :rules="formRules"
            label-width="100px"
        >
            <el-row :gutter="16">
                <el-col :span="12">
                    <el-form-item label="姓名" prop="name">
                        <el-input v-model="formData.name" placeholder="请输入姓名" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="联系电话" prop="mobile">
                        <el-input v-model="formData.mobile" placeholder="请输入联系电话" />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="16">
                <el-col :span="12">
                    <el-form-item label="备用电话">
                        <el-input v-model="formData.mobile2" placeholder="请输入备用电话" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="微信">
                        <el-input v-model="formData.wechat" placeholder="请输入微信号" />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="16">
                <el-col :span="12">
                    <el-form-item label="微信2">
                        <el-input v-model="formData.wechat2" placeholder="请输入第二微信号" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="微信备注名">
                        <el-input v-model="formData.wechatRemark" placeholder="请输入微信备注名" />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="16">
                <el-col :span="12">
                    <el-form-item label="QQ">
                        <el-input v-model="formData.qq" placeholder="请输入QQ" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="邮箱">
                        <el-input v-model="formData.email" placeholder="请输入邮箱" />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="16">
                <el-col :span="12">
                    <el-form-item label="性别">
                        <el-select
                            v-model="formData.gender"
                            clearable
                            placeholder="请选择性别"
                            class="w-1/1"
                        >
                            <el-option label="男" :value="1" />
                            <el-option label="女" :value="2" />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="出生日期">
                        <el-date-picker
                            v-model="formData.birthday"
                            value-format="YYYY-MM-DD"
                            type="date"
                            placeholder="请选择出生日期"
                            class="!w-1/1"
                        />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="16">
                <el-col :span="12">
                    <el-form-item label="学历">
                        <el-select
                            v-model="formData.education"
                            clearable
                            placeholder="请选择学历"
                            class="w-1/1"
                        >
                            <el-option
                                v-for="item in educationOptions"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="地区" prop="areaId">
                        <AreaSelect
                            v-model="formData.areaId"
                            :include-all-node="false"
                            placeholder="请选择地区"
                        />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="16">
                <el-col :span="12">
                    <el-form-item label="咨询项目" prop="consultProjectId">
                        <el-tree-select
                            v-model="formData.consultProjectId"
                            :data="projectOptions"
                            :props="treeProps"
                            node-key="id"
                            check-strictly
                            clearable
                            filterable
                            default-expand-all
                            placeholder="请选择咨询项目"
                            style="width: 100%"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="客户来源">
                        <el-select
                            v-model="formData.clueSourceId"
                            clearable
                            filterable
                            placeholder="请选择客户来源"
                            class="w-1/1"
                        >
                            <el-option
                                v-for="item in clueSourceOptions"
                                :key="item.id"
                                :label="item.name"
                                :value="item.id"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="16">
                <el-col :span="24">
                    <el-form-item label="标签">
                        <el-select
                            v-model="formData.tagIds"
                            multiple
                            filterable
                            clearable
                            placeholder="请选择标签"
                            class="w-1/1"
                        >
                            <el-option
                                v-for="item in tagOptions"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="16">
                <el-col :span="24">
                    <el-form-item label="备注">
                        <el-input
                            v-model="formData.remark"
                            type="textarea"
                            :rows="4"
                            placeholder="请输入备注"
                        />
                    </el-form-item>
                </el-col>
            </el-row>
        </el-form>

        <template #footer>
            <el-button @click="dialogVisible = false">取 消</el-button>
            <el-button type="primary" :loading="formLoading" @click="submitForm">确 定</el-button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import AreaSelect from '@/components/AreaSelect.vue'
import * as ClueApi from '@/api/crm/clue'
import * as ProductCategoryApi from '@/api/crm/product/category'
import * as ClueSourceApi from '@/api/system/clueSource'
import * as TagGroupApi from '@/api/system/tag-group'

interface FormData {
    id?: number
    name: string
    mobile: string
    mobile2?: string
    wechat?: string
    wechat2?: string
    wechatRemark?: string
    qq?: string
    email?: string
    gender?: number
    birthday?: string
    education?: number
    areaId?: number
    consultProjectId?: number
    clueSourceId?: number
    tagIds: number[]
    remark?: string
}

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref<'create' | 'update'>('create')
const formRef = ref()

const projectOptions = ref<ProductCategoryApi.ProductCategoryVO[]>([])
const clueSourceOptions = ref<ClueSourceApi.ClueSourceVO[]>([])
const tagOptions = ref<{ label: string; value: number }[]>([])

const treeProps = {
    value: 'id',
    label: 'name',
    children: 'children'
}

const educationOptions = [
    { label: '初中及以下', value: 1 },
    { label: '高中/中专', value: 2 },
    { label: '大专', value: 3 },
    { label: '本科', value: 4 },
    { label: '硕士及以上', value: 5 }
]

const createDefaultFormData = (): FormData => ({
    id: undefined,
    name: '',
    mobile: '',
    mobile2: '',
    wechat: '',
    wechat2: '',
    wechatRemark: '',
    qq: '',
    email: '',
    gender: undefined,
    birthday: '',
    education: undefined,
    areaId: undefined,
    consultProjectId: undefined,
    clueSourceId: undefined,
    tagIds: [],
    remark: ''
})

const formData = ref<FormData>(createDefaultFormData())

const formRules = reactive({
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    mobile: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
    areaId: [{ required: true, message: '请选择地区', trigger: 'change' }],
    consultProjectId: [{ required: true, message: '请选择咨询项目', trigger: 'change' }]
})

const loadOptions = async () => {
    const [projects, sources, tagGroups] = await Promise.all([
        ProductCategoryApi.getProductCategorySimpleList(),
        ClueSourceApi.getEnabledClueSourceList(),
        TagGroupApi.getTagGroupList()
    ])
    projectOptions.value = projects || []
    clueSourceOptions.value = sources || []
    tagOptions.value = (tagGroups || []).flatMap((group) =>
        (group.tags || []).map((tag) => ({
            label: `${group.name} / ${tag.name}`,
            value: Number(tag.id)
        }))
    )
}

const mapClueToForm = (detail: ClueApi.ClueVO): FormData => ({
    id: detail.id,
    name: detail.name || '',
    mobile: detail.mobile || '',
    mobile2: detail.mobile2 || '',
    wechat: detail.wechat || '',
    wechat2: detail.wechat2 || '',
    wechatRemark: detail.wechatRemark || '',
    qq: detail.qq || '',
    email: detail.email || '',
    gender: detail.gender,
    birthday: detail.birthday || '',
    education: detail.education,
    areaId: detail.areaId,
    consultProjectId: detail.consultProjectId,
    clueSourceId: detail.clueSourceId,
    tagIds: (detail.tagIds || []).map((item) => Number(item)),
    remark: detail.remark || ''
})

const open = async (type: 'create' | 'update', id?: number) => {
    dialogVisible.value = true
    dialogTitle.value = type === 'create' ? '新增名片' : '编辑名片'
    formType.value = type
    resetForm()
    formLoading.value = true
    try {
        await loadOptions()
        if (type === 'update' && id) {
            const detail = await ClueApi.getClue(id)
            formData.value = mapClueToForm(detail)
        }
    } finally {
        formLoading.value = false
    }
}

defineExpose({ open })

const submitForm = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return

    formLoading.value = true
    try {
        if (formType.value === 'create') {
            const payload: ClueApi.ClueCreateReqVO = {
                mobile: formData.value.mobile.trim(),
                mobile2: formData.value.mobile2?.trim() || undefined,
                wechat: formData.value.wechat?.trim() || undefined,
                wechat2: formData.value.wechat2?.trim() || undefined,
                wechatRemark: formData.value.wechatRemark?.trim() || undefined,
                qq: formData.value.qq?.trim() || undefined,
                email: formData.value.email?.trim() || undefined,
                name: formData.value.name.trim() || undefined,
                gender: formData.value.gender,
                birthday: formData.value.birthday || undefined,
                education: formData.value.education,
                areaId: Number(formData.value.areaId),
                consultProjectId: formData.value.consultProjectId
                    ? Number(formData.value.consultProjectId)
                    : undefined,
                clueSourceId: formData.value.clueSourceId
                    ? Number(formData.value.clueSourceId)
                    : undefined,
                tagIds: formData.value.tagIds.length ? formData.value.tagIds : undefined,
                remark: formData.value.remark?.trim() || undefined
            }
            await ClueApi.createClue(payload)
            message.success(t('common.createSuccess'))
        } else {
            const payload: ClueApi.ClueUpdateBasicInfoReqVO = {
                id: Number(formData.value.id),
                name: formData.value.name.trim(),
                mobile: formData.value.mobile.trim(),
                mobile2: formData.value.mobile2?.trim() || undefined,
                wechat: formData.value.wechat?.trim() || undefined,
                wechat2: formData.value.wechat2?.trim() || undefined,
                wechatRemark: formData.value.wechatRemark?.trim() || undefined,
                qq: formData.value.qq?.trim() || undefined,
                gender: formData.value.gender,
                birthday: formData.value.birthday || undefined,
                education: formData.value.education,
                areaId: Number(formData.value.areaId),
                consultProjectId: Number(formData.value.consultProjectId),
                tagIds: formData.value.tagIds.length ? formData.value.tagIds : undefined,
                remark: formData.value.remark?.trim() || undefined
            }
            await ClueApi.updateClueBasicInfo(payload)
            message.success(t('common.updateSuccess'))
        }
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}

const resetForm = () => {
    formData.value = createDefaultFormData()
    formRef.value?.resetFields()
}
</script>
