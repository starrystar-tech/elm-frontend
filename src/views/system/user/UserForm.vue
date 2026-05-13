<template>
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="900px">
        <el-form
            ref="formRef"
            v-loading="formLoading"
            :model="formData"
            :rules="formRules"
            label-width="100px"
        >
            <el-row>
                <el-col :span="12">
                    <el-form-item label="姓名" prop="nickname">
                        <el-input v-model="formData.nickname" placeholder="请输入姓名" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="成员ID" prop="memberId">
                        <el-input v-model="formData.memberId" placeholder="请输入成员ID" />
                    </el-form-item>
                </el-col>
            </el-row>

            <!-- <el-row>
                <el-col :span="12">
                    <el-form-item label="账号类型" prop="accountType">
                        <el-select v-model="formData.accountType" placeholder="请选择账号类型">
                            <el-option label="付费账号" value="paid" />
                            <el-option label="免费账号" value="free" />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12" />
            </el-row> -->

            <el-row>
                <el-col :span="12">
                    <el-form-item label="登录邮箱" prop="email">
                        <el-input
                            v-model="formData.email"
                            maxlength="50"
                            placeholder="请输入邮箱"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="到期时间" prop="expireTime">
                        <el-date-picker
                            v-model="formData.expireTime"
                            type="datetime"
                            value-format="YYYY-MM-DD HH:mm:ss"
                            placeholder="请选择到期时间"
                            style="width: 100%"
                        />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row>
                <el-col :span="12">
                    <el-form-item label="管理企业" prop="manageCompanyIds">
                        <el-select
                            v-model="formData.manageCompanyIds"
                            multiple
                            clearable
                            placeholder="请选择管理企业"
                        >
                            <el-option
                                v-for="item in weappList"
                                :key="item.id"
                                :label="item.companyName || item.appName || item.corpId"
                                :value="item.id!"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="状态" prop="status">
                        <el-radio-group v-model="formData.status">
                            <el-radio :value="0">启用</el-radio>
                            <el-radio :value="1">禁用</el-radio>
                        </el-radio-group>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row>
                <el-col :span="12">
                    <el-form-item label="呼叫工号" prop="callNo">
                        <el-input v-model="formData.callNo" placeholder="请输入呼叫工号" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="呼叫分机" prop="callExt">
                        <el-input v-model="formData.callExt" placeholder="请输入呼叫分机" />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-divider content-position="left">基础信息</el-divider>

            <el-row>
                <el-col :span="12">
                    <el-form-item label="归属部门" prop="deptId">
                        <el-tree-select
                            v-model="formData.deptId"
                            :data="deptList"
                            :props="defaultProps"
                            check-strictly
                            node-key="id"
                            placeholder="请选择归属部门"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="岗位">
                        <el-select v-model="formData.postIds" multiple placeholder="请选择岗位">
                            <el-option
                                v-for="item in postList"
                                :key="item.id"
                                :label="item.name"
                                :value="item.id!"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row>
                <el-col :span="12">
                    <el-form-item label="手机号码" prop="mobile">
                        <el-input
                            v-model="formData.mobile"
                            maxlength="11"
                            placeholder="请输入手机号码"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="用户性别">
                        <el-select v-model="formData.sex" placeholder="请选择">
                            <el-option
                                v-for="dict in getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX)"
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
                    <el-form-item v-if="formData.id === undefined" label="用户名称" prop="username">
                        <el-input v-model="formData.username" placeholder="请输入用户名称" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item v-if="formData.id === undefined" label="用户密码" prop="password">
                        <el-input
                            v-model="formData.password"
                            placeholder="请输入用户密码"
                            show-password
                            type="password"
                        />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row>
                <el-col :span="12">
                    <el-form-item label="用户等级">
                        <UserLevelSelect
                            v-model="formData.userLevel"
                            placeholder="请选择用户等级"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="复制次数">
                        <el-input-number
                            v-model="formData.mobileCopyLimitTimes"
                            :min="0"
                            :controls="false"
                            style="width: 100%"
                        />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row>
                <el-col :span="24">
                    <el-form-item label="备注">
                        <el-input
                            v-model="formData.remark"
                            placeholder="请输入内容"
                            type="textarea"
                        />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row>
                <el-col :span="12">
                    <el-form-item label="校区权限">
                        <el-select
                            v-model="formData.campusIds"
                            multiple
                            clearable
                            collapse-tags
                            collapse-tags-tooltip
                            placeholder="请选择校区"
                        >
                            <el-option
                                v-for="item in campusList"
                                :key="item.id"
                                :label="item.name"
                                :value="item.id!"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="管辖地区">
                        <el-tree-select
                            v-model="formData.areaIds"
                            :data="areaTreeList"
                            :props="defaultProps"
                            multiple
                            show-checkbox
                            check-strictly
                            node-key="id"
                            value-key="id"
                            placeholder="请选择管辖地区"
                        />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row>
                <el-col :span="12">
                    <el-form-item label="管辖产品">
                        <el-select
                            v-model="formData.categoryIds"
                            multiple
                            clearable
                            collapse-tags
                            collapse-tags-tooltip
                            placeholder="请选择一级产品分类"
                        >
                            <el-option
                                v-for="item in rootCategoryList"
                                :key="item.id"
                                :label="item.name"
                                :value="item.id!"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12" />
            </el-row>

            <el-divider content-position="left">企微绑定</el-divider>

            <el-row>
                <el-col :span="24">
                    <el-form-item label="绑定账号">
                        <div style="width: 100%">
                            <el-button type="primary" plain @click="openWecomSelector">
                                选择企微账号
                            </el-button>
                            <el-table
                                :data="formData.wecomBindList"
                                border
                                style="margin-top: 12px"
                                empty-text="暂无绑定账号"
                            >
                                <el-table-column label="企微公司" min-width="180">
                                    <template #default="{ row }">
                                        {{ getCorpName(row.corpId) }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="企微账号" min-width="180">
                                    <template #default="{ row }">
                                        {{ row.staffName || row.staffUserId }}
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    label="账号ID"
                                    min-width="180"
                                    prop="staffUserId"
                                />
                                <el-table-column label="操作" width="100" fixed="right">
                                    <template #default="{ $index }">
                                        <el-button
                                            link
                                            type="danger"
                                            @click="removeWecomBindRow($index)"
                                        >
                                            删除
                                        </el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                    </el-form-item>
                </el-col>
            </el-row>
        </el-form>

        <template #footer>
            <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="dialogVisible = false">取 消</el-button>
        </template>
    </Dialog>

    <WeworkAccountSelector
        v-model="wecomSelectorVisible"
        :members="wecomMemberList"
        :selected="formData.wecomBindList"
        :occupied-keys="occupiedWecomKeys"
        @confirm="handleWecomSelectorConfirm"
    />
</template>

<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions, getStrDictOptions } from '@/utils/dict'
import { CommonStatusEnum } from '@/utils/constants'
import { defaultProps, handleTree } from '@/utils/tree'
import * as PostApi from '@/api/system/post'
import * as DeptApi from '@/api/system/dept'
import * as UserApi from '@/api/system/user'
import * as WeappApi from '@/api/system/weapp'
import * as WeworkContactApi from '@/api/crm/wework/contact'
import * as CampusApi from '@/api/system/campus'
import * as AreaApi from '@/api/system/area'
import * as ProductCategoryApi from '@/api/crm/product/category'
import WeworkAccountSelector from './components/WeworkAccountSelector.vue'
import UserLevelSelect from '@/views/common/components/UserLevelSelect.vue'
import { FormRules } from 'element-plus'
import { normalizeAreaIds } from '@/utils/areaScope'

defineOptions({ name: 'SystemUserForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')

const formData = ref({
    nickname: '',
    memberId: '',
    accountType: 'free',
    roleIds: [] as number[],
    deptId: undefined as number | undefined,
    postIds: [] as number[],
    mobile: '',
    email: '',
    id: undefined as number | undefined,
    username: '',
    password: '',
    sex: undefined as number | undefined,
    userLevel: undefined as string | undefined,
    remark: '',
    status: CommonStatusEnum.ENABLE,
    expireTime: undefined as string | undefined,
    callNo: '',
    callExt: '',
    mobileCopyLimitTimes: undefined as number | undefined,
    manageCompanyIds: [] as number[],
    campusIds: [] as number[],
    areaIds: [] as number[],
    categoryIds: [] as number[],
    wecomBindList: [] as UserApi.UserWecomBindVO[]
})

const formRules = reactive<FormRules>({
    username: [{ required: true, message: '用户名称不能为空', trigger: 'blur' }],
    nickname: [{ required: true, message: '用户昵称不能为空', trigger: 'blur' }],
    password: [{ required: true, message: '用户密码不能为空', trigger: 'blur' }],
    email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }],
    mobile: [
        {
            pattern:
                /^(?:(?:\+|00)86)?1(?:3[\d]|4[5-79]|5[0-35-9]|6[5-7]|7[0-8]|8[\d]|9[189])\d{8}$/,
            message: '请输入正确的手机号码',
            trigger: 'blur'
        }
    ]
})

const formRef = ref()
const deptList = ref<Tree[]>([])
const postList = ref([] as PostApi.PostVO[])
const weappList = ref([] as WeappApi.WeappConfigVO[])
const campusList = ref([] as CampusApi.CampusVO[])
const areaTreeList = ref<Tree[]>([])
const rootCategoryList = ref<any[]>([])
const wecomMemberList = ref([] as WeworkContactApi.WeworkMemberSimpleVO[])
const occupiedWecomKeys = ref<string[]>([])

const corpOptions = computed(() => {
    const map = new Map<string, { corpId: string; corpName: string }>()
    wecomMemberList.value.forEach((item) => {
        if (!item.corpId || map.has(item.corpId)) return
        map.set(item.corpId, {
            corpId: item.corpId,
            corpName: item.corpName || item.corpId
        })
    })
    return Array.from(map.values())
})

const getCorpName = (corpId?: string) => {
    if (!corpId) return ''
    const fromWeapp = weappList.value.find((item) => item.corpId === corpId)
    if (fromWeapp) return fromWeapp.companyName || fromWeapp.appName || fromWeapp.corpId
    return corpOptions.value.find((item) => item.corpId === corpId)?.corpName || corpId
}

const wecomSelectorVisible = ref(false)

const openWecomSelector = () => {
    wecomSelectorVisible.value = true
}

const handleWecomSelectorConfirm = (rows: UserApi.UserWecomBindVO[]) => {
    formData.value.wecomBindList = rows
}

const removeWecomBindRow = (index: number) => {
    formData.value.wecomBindList.splice(index, 1)
}

const open = async (type: string, id?: number) => {
    dialogVisible.value = true
    dialogTitle.value = type === 'update' ? '编辑用户' : t('action.' + type)
    formType.value = type
    resetForm()

    const [deptData, postData, weappData, wecomMembers, campusData, areaData, categoryData] =
        await Promise.all([
            DeptApi.getSimpleDeptList(),
            PostApi.getSimplePostList(),
            WeappApi.getWeappConfigList(),
            WeworkContactApi.getWeworkMemberSimpleList(),
            CampusApi.getSimpleCampusList(),
            AreaApi.getAreaTree(),
            ProductCategoryApi.getProductCategorySimpleList()
        ])
    deptList.value = handleTree(deptData)
    postList.value = postData
    weappList.value = weappData || []
    campusList.value = campusData || []
    areaTreeList.value = areaData || []
    rootCategoryList.value = (categoryData || []).filter((item: any) => Number(item.level) === 1)
    wecomMemberList.value = (wecomMembers || []).map((item: any) => ({
        corpId: item.corpId,
        corpName: item.corpName || item.corpId,
        staffUserId: item.staffUserId || item.userId,
        staffName: item.staffName || item.name
    }))
    occupiedWecomKeys.value = await UserApi.getWecomBindOccupied(id)

    if (id) {
        formLoading.value = true
        try {
            const detail = await UserApi.getUser(id)
            formData.value = {
                ...formData.value,
                ...detail,
                postIds: detail.postIds || [],
                roleIds: detail.roleIds || [],
                manageCompanyIds: detail.manageCompanyIds || [],
                campusIds: detail.campusIds || [],
                areaIds: detail.areaIds || [],
                categoryIds: detail.categoryIds || [],
                wecomBindList: detail.wecomBindList || [],
                accountType: detail.accountType || 'free',
                memberId: detail.memberId || '',
                callNo: detail.callNo || '',
                callExt: detail.callExt || '',
                mobileCopyLimitTimes: detail.mobileCopyLimitTimes
            }
        } finally {
            formLoading.value = false
        }
    }
}
defineExpose({ open })

const emit = defineEmits(['success'])
const submitForm = async () => {
    if (!formRef) return
    const valid = await formRef.value.validate()
    if (!valid) return

    formLoading.value = true
    try {
        const data: UserApi.UserVO = {
            ...formData.value,
            areaIds: normalizeAreaIds(formData.value.areaIds || [], areaTreeList.value as any[]),
            wecomBindList: formData.value.wecomBindList.filter(
                (item) => item.corpId && item.staffUserId
            )
        }
        if (formType.value === 'create') {
            await UserApi.createUser(data)
            message.success(t('common.createSuccess'))
        } else {
            const { password, ...updateData } = data as UserApi.UserVO & { password?: string }
            await UserApi.updateUser(updateData as UserApi.UserVO)
            message.success(t('common.updateSuccess'))
        }
        dialogVisible.value = false
        emit('success')
    } finally {
        formLoading.value = false
    }
}

const resetForm = () => {
    formData.value = {
        nickname: '',
        memberId: '',
        accountType: 'free',
        roleIds: [],
        deptId: undefined,
        postIds: [],
        mobile: '',
        email: '',
        id: undefined,
        username: '',
        password: '',
        sex: undefined,
        userLevel: undefined,
        remark: '',
        status: CommonStatusEnum.ENABLE,
        expireTime: undefined,
        callNo: '',
        callExt: '',
        mobileCopyLimitTimes: undefined,
        manageCompanyIds: [],
        campusIds: [],
        areaIds: [],
        categoryIds: [],
        wecomBindList: []
    }
    formRef.value?.resetFields()
}
</script>
