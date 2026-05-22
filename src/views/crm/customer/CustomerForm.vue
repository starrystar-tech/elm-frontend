<template>
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="760px">
        <el-form
            ref="formRef"
            v-loading="formLoading"
            :model="formData"
            :rules="formRules"
            label-width="100px"
        >
            <el-row>
                <el-col :span="12">
                    <el-form-item label="学员姓名" prop="name">
                        <el-input v-model="formData.name" placeholder="请输入学员姓名" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="来源" prop="source">
                        <el-select v-model="formData.source" placeholder="请选择来源" class="w-1/1">
                            <el-option
                                v-for="dict in getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_SOURCE)"
                                :key="dict.value"
                                :label="dict.label"
                                :value="dict.value"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <el-form-item label="手机号" prop="mobile">
                        <el-input v-model="formData.mobile" placeholder="请输入手机号" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="班主任" prop="ownerUserId">
                        <el-select
                            v-model="formData.ownerUserId"
                            :disabled="formType !== 'create'"
                            class="w-1/1"
                        >
                            <el-option
                                v-for="item in userOptions"
                                :key="item.id"
                                :label="item.nickname || item.username"
                                :value="item.id"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <el-form-item label="电话" prop="telephone">
                        <el-input v-model="formData.telephone" placeholder="请输入电话" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="邮箱" prop="email">
                        <el-input v-model="formData.email" placeholder="请输入邮箱" />
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <el-form-item label="微信" prop="wechat">
                        <el-input v-model="formData.wechat" placeholder="请输入微信" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="QQ" prop="qq">
                        <el-input v-model="formData.qq" placeholder="请输入 QQ" />
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <el-form-item label="客户行业" prop="industryId">
                        <el-select
                            v-model="formData.industryId"
                            placeholder="请选择客户行业"
                            class="w-1/1"
                        >
                            <el-option
                                v-for="dict in getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_INDUSTRY)"
                                :key="dict.value"
                                :label="dict.label"
                                :value="dict.value"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="客户级别" prop="level">
                        <el-select
                            v-model="formData.level"
                            placeholder="请选择客户级别"
                            class="w-1/1"
                        >
                            <el-option
                                v-for="dict in getIntDictOptions(DICT_TYPE.CRM_CUSTOMER_LEVEL)"
                                :key="dict.value"
                                :label="dict.label"
                                :value="dict.value"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <el-form-item label="地址" prop="areaId">
                        <el-cascader
                            v-model="formData.areaId"
                            :options="areaList"
                            :props="defaultProps"
                            class="w-1/1"
                            clearable
                            filterable
                            placeholder="请选择城市"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="详细地址" prop="detailAddress">
                        <el-input v-model="formData.detailAddress" placeholder="请输入详细地址" />
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <el-form-item label="下次联系时间" prop="contactNextTime">
                        <el-date-picker
                            v-model="formData.contactNextTime"
                            placeholder="选择下次联系时间"
                            type="datetime"
                            value-format="x"
                            class="!w-1/1"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="备注" prop="remark">
                        <el-input
                            type="textarea"
                            v-model="formData.remark"
                            placeholder="请输入备注"
                        />
                    </el-form-item>
                </el-col>
            </el-row>
        </el-form>
        <template #footer>
            <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="dialogVisible = false">取 消</el-button>
        </template>
    </Dialog>
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import * as ClueApi from '@/api/crm/clue'
import * as AreaApi from '@/api/system/area'
import * as UserApi from '@/api/system/user'
import { defaultProps } from '@/utils/tree'
import { useUserStore } from '@/store/modules/user'

const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref<'create' | 'update'>('create')
const areaList = ref([])
const userOptions = ref<UserApi.UserVO[]>([])
const formRef = ref()
const formData = ref<ClueApi.ClueVO>({
    id: undefined,
    name: undefined,
    contactNextTime: undefined,
    ownerUserId: 0,
    mobile: undefined,
    telephone: undefined,
    qq: undefined,
    wechat: undefined,
    email: undefined,
    areaId: undefined,
    detailAddress: undefined,
    industryId: undefined,
    level: undefined,
    source: undefined,
    remark: undefined
})

const formRules = reactive({
    name: [{ required: true, message: '学员姓名不能为空', trigger: 'blur' }],
    ownerUserId: [{ required: true, message: '班主任不能为空', trigger: 'change' }]
})

const resetForm = () => {
    formData.value = {
        id: undefined,
        name: undefined,
        contactNextTime: undefined,
        ownerUserId: 0,
        mobile: undefined,
        telephone: undefined,
        qq: undefined,
        wechat: undefined,
        email: undefined,
        areaId: undefined,
        detailAddress: undefined,
        industryId: undefined,
        level: undefined,
        source: undefined,
        remark: undefined
    }
    formRef.value?.resetFields()
}

const loadOptions = async () => {
    const [areas, users] = await Promise.all([AreaApi.getAreaTree(), UserApi.getSimpleUserList()])
    areaList.value = areas || []
    userOptions.value = users || []
}

const open = async (type: 'create' | 'update', id?: number) => {
    dialogVisible.value = true
    dialogTitle.value = type === 'create' ? '新增学员' : '编辑学员'
    formType.value = type
    resetForm()
    await loadOptions()
    if (id) {
        formLoading.value = true
        try {
            const detail = await ClueApi.getClue(id)
            formData.value = {
                ...detail,
                ownerUserId: detail.ownerUserId || detail.currentOwnerId || 0
            }
        } finally {
            formLoading.value = false
        }
    }
    if (type === 'create') {
        formData.value.ownerUserId = useUserStore().getUser.id
    }
}

defineExpose({ open })

const emit = defineEmits(['success'])

const submitForm = async () => {
    const valid = await formRef.value?.validate()
    if (!valid) return
    formLoading.value = true
    try {
        const data = formData.value as ClueApi.ClueVO
        if (formType.value === 'create') {
            await ClueApi.createClue(data)
            message.success('新增成功')
        } else {
            await ClueApi.updateClue(data)
            message.success('修改成功')
        }
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}
</script>
