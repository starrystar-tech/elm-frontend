<template>
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="860px">
        <el-form
            ref="formRef"
            v-loading="formLoading"
            :model="formData"
            :rules="formRules"
            label-width="100px"
        >
            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="手机号" prop="mobile">
                        <el-input v-model="formData.mobile" placeholder="请输入手机号" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="姓名" prop="name">
                        <el-input v-model="formData.name" placeholder="请输入姓名" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="来源" prop="clueSourceId">
                        <el-select
                            v-model="formData.clueSourceId"
                            clearable
                            filterable
                            placeholder="请选择"
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
                <el-col :span="12">
                    <el-form-item label="地区" prop="areaId">
                        <AreaSelect
                            v-model="formData.areaId"
                            :include-all-node="false"
                            placeholder="请选择地区"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="咨询项目" prop="consultProjectId">
                        <ProductCategorySelect
                            v-model="formData.consultProjectId"
                            placeholder="请选择咨询项目"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="手机号2">
                        <el-input v-model="formData.mobile2" placeholder="请输入手机号2" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="意向度">
                        <ClueIntentLevel v-model="formData.intentLevel" mode="select" />
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="微信号">
                        <el-input v-model="formData.wechat" placeholder="请输入微信号" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="微信号2">
                        <el-input v-model="formData.wechat2" placeholder="请输入微信号2" />
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="QQ">
                        <el-input v-model="formData.qq" placeholder="请输入QQ" />
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="性别">
                        <el-select
                            v-model="formData.gender"
                            clearable
                            placeholder="请选择"
                            class="w-1/1"
                        >
                            <el-option label="男" :value="1" />
                            <el-option label="女" :value="2" />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="学历">
                        <el-select
                            v-model="formData.education"
                            clearable
                            placeholder="请选择"
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
                    <el-form-item label="证件类型">
                        <el-select
                            v-model="formData.certificateType"
                            clearable
                            placeholder="请选择"
                            class="w-1/1"
                        >
                            <el-option label="身份证" value="身份证" />
                            <el-option label="护照" value="护照" />
                            <el-option label="港澳通行证" value="港澳通行证" />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="证件号码">
                        <el-input v-model="formData.idCardNo" placeholder="请输入证件号码" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="标签">
                        <el-select
                            v-model="formData.tagIds"
                            multiple
                            filterable
                            clearable
                            placeholder="请点击选择标签"
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
                <el-col :span="24">
                    <el-form-item label="咨询备注" prop="remark">
                        <el-input
                            v-model="formData.remark"
                            type="textarea"
                            :rows="4"
                            placeholder="请输入咨询备注"
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
import ClueIntentLevel from '@/components/ClueIntentLevel'
import ProductCategorySelect from '@/components/ProductCategorySelect.vue'
import * as ClueApi from '@/api/crm/clue'
import * as ClueSourceApi from '@/api/system/clueSource'
import * as TagGroupApi from '@/api/system/tag-group'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'

interface FormData {
    mobile: string
    mobile2?: string
    wechat?: string
    wechat2?: string
    qq?: string
    name: string
    certificateType?: string
    idCardNo?: string
    gender?: number
    education?: number
    intentLevel?: number
    areaId?: number
    consultProjectId?: number
    clueSourceId?: number
    tagIds: number[]
    remark: string
    id?: number
}

const { t } = useI18n()
const message = useMessage()
const emit = defineEmits(['success'])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref<'create' | 'update'>('create')
const formRef = ref()

const clueSourceOptions = ref<ClueSourceApi.ClueSourceVO[]>([])
const tagOptions = ref<{ label: string; value: number }[]>([])

const educationOptions = getIntDictOptions(DICT_TYPE.CRM_CLUE_EDUCATION)

const createDefaultFormData = (): FormData => ({
    mobile: '',
    mobile2: '',
    wechat: '',
    wechat2: '',
    qq: '',
    name: '',
    certificateType: '',
    idCardNo: '',
    gender: undefined,
    education: undefined,
    intentLevel: undefined,
    areaId: undefined,
    consultProjectId: undefined,
    clueSourceId: undefined,
    tagIds: [],
    remark: '',
    id: undefined
})

const formData = ref<FormData>(createDefaultFormData())

const formRules = reactive({
    mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    clueSourceId: [{ required: true, message: '请选择来源', trigger: 'change' }],
    areaId: [{ required: true, message: '请选择地区', trigger: 'change' }],
    consultProjectId: [{ required: true, message: '请选择咨询项目', trigger: 'change' }]
})

const loadOptions = async () => {
    const [sources, tagGroups] = await Promise.all([
        ClueSourceApi.getEnabledClueSourceList(),
        TagGroupApi.getTagGroupList()
    ])
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
    mobile: detail.mobile || '',
    mobile2: detail.mobile2 || '',
    wechat: detail.wechat || '',
    wechat2: detail.wechat2 || '',
    qq: detail.qq || '',
    name: detail.name || '',
    certificateType: detail.certificateType || '',
    idCardNo: detail.idCardNo || '',
    gender: detail.gender,
    education: detail.education,
    intentLevel: detail.intentLevel,
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
                qq: formData.value.qq?.trim() || undefined,
                name: formData.value.name.trim() || undefined,
                certificateType: formData.value.certificateType?.trim() || undefined,
                idCardNo: formData.value.idCardNo?.trim() || undefined,
                gender: formData.value.gender,
                education: formData.value.education,
                intentLevel: formData.value.intentLevel,
                areaId: Number(formData.value.areaId),
                consultProjectId: formData.value.consultProjectId
                    ? Number(formData.value.consultProjectId)
                    : undefined,
                clueSourceId: formData.value.clueSourceId
                    ? Number(formData.value.clueSourceId)
                    : undefined,
                tagIds: formData.value.tagIds.length ? formData.value.tagIds : undefined,
                remark: formData.value.remark.trim() || undefined
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
                qq: formData.value.qq?.trim() || undefined,
                certificateType: formData.value.certificateType?.trim() || undefined,
                idCardNo: formData.value.idCardNo?.trim() || undefined,
                gender: formData.value.gender,
                education: formData.value.education,
                intentLevel: formData.value.intentLevel,
                areaId: Number(formData.value.areaId),
                consultProjectId: Number(formData.value.consultProjectId),
                clueSourceId: formData.value.clueSourceId
                    ? Number(formData.value.clueSourceId)
                    : undefined,
                tagIds: formData.value.tagIds.length ? formData.value.tagIds : undefined,
                remark: formData.value.remark.trim() || undefined
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
