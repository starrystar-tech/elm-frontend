<template>
    <Dialog v-model="dialogVisible" title="报名登记" width="820px" append-to-body>
        <div class="enroll-steps">
            <el-steps :active="currentStep" finish-status="success" align-center>
                <el-step title="基本信息" />
                <el-step title="报名信息" />
                <el-step title="支付信息" />
            </el-steps>
        </div>

        <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-width="100px"
            v-loading="loading"
            class="enroll-form"
        >
            <section v-show="currentStep === 0" class="enroll-section">
                <div class="enroll-grid enroll-grid--basic">
                    <el-form-item label="姓名" prop="clueName">
                        <el-input v-model="formData.clueName" placeholder="请输入姓名" />
                    </el-form-item>
                    <el-form-item label="性别" prop="gender">
                        <el-radio-group v-model="formData.gender">
                            <el-radio :label="1">男</el-radio>
                            <el-radio :label="2">女</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="手机号" prop="mobile">
                        <div class="readonly-value">{{ maskedMobile }}</div>
                    </el-form-item>
                    <el-form-item label="手机号2">
                        <el-input v-model="formData.mobile2" placeholder="请输入手机号2" />
                    </el-form-item>
                    <el-form-item label="地区" prop="areaId">
                        <AreaSelect
                            v-model="formData.areaId"
                            :include-all-node="false"
                            placeholder="请选择地区"
                        />
                    </el-form-item>
                    <el-form-item label="微信">
                        <el-input v-model="formData.wechat" placeholder="请输入微信" />
                    </el-form-item>
                    <el-form-item label="微信2">
                        <el-input v-model="formData.wechat2" placeholder="请输入微信2" />
                    </el-form-item>
                    <el-form-item label="QQ">
                        <el-input v-model="formData.qq" placeholder="请输入QQ" />
                    </el-form-item>
                    <el-form-item label="来源">
                        <div class="readonly-value">{{ formData.sourceName || '-' }}</div>
                    </el-form-item>
                    <el-form-item label="证件类型" prop="certificateType">
                        <el-select
                            v-model="formData.certificateType"
                            class="!w-full"
                            placeholder="请选择"
                        >
                            <el-option label="身份证" value="身份证" />
                            <el-option label="护照" value="护照" />
                            <el-option label="港澳通行证" value="港澳通行证" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="证件号码" prop="idCardNo">
                        <el-input v-model="formData.idCardNo" placeholder="请输入证件号码" />
                    </el-form-item>
                    <el-form-item label="职业">
                        <el-input v-model="formData.occupation" placeholder="请输入职业" />
                    </el-form-item>
                    <el-form-item label="紧急联系号码">
                        <el-input
                            v-model="formData.emergencyMobile"
                            placeholder="请输入紧急联系号码"
                        />
                    </el-form-item>
                    <el-form-item label="紧急联系人">
                        <el-input
                            v-model="formData.emergencyContact"
                            placeholder="请输入紧急联系人"
                        />
                    </el-form-item>
                </div>
            </section>

            <section v-show="currentStep === 1" class="enroll-section">
                <div class="enroll-plan">
                    <div class="enroll-plan__toolbar">
                        <el-form-item label="选择校区" prop="campusId" class="enroll-plan__campus">
                            <CampusSelect
                                v-model="formData.campusId"
                                placeholder="请选择"
                                @change="handleCampusChange"
                            />
                        </el-form-item>
                        <div class="enroll-plan__summary">
                            <span>总计：</span>
                            <strong>{{ totalPayableText }}</strong>
                        </div>
                        <el-button
                            type="success"
                            class="enroll-plan__choose"
                            @click="openProductPicker"
                        >
                            + 选择商品
                        </el-button>
                    </div>

                    <div class="enroll-plan__table-wrap">
                        <el-table :data="selectedProducts" border class="enroll-plan__table">
                            <el-table-column label="商品分类" min-width="160">
                                <template #default="{ row }">
                                    {{ row.categoryName || '--' }}
                                </template>
                            </el-table-column>
                            <el-table-column label="商品" min-width="180">
                                <template #default="{ row }">
                                    {{ row.productName || '--' }}
                                </template>
                            </el-table-column>
                            <el-table-column label="商品价格" min-width="120">
                                <template #default="{ row }">
                                    {{ formatAmount(row.price) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="最低价" min-width="120">
                                <template #default="{ row }">
                                    {{ formatAmount(row.minPrice) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="应付金额" min-width="140">
                                <template #default="{ row }">
                                    <el-input-number
                                        :model-value="row.payableAmount"
                                        :min="0"
                                        :precision="2"
                                        controls-position="right"
                                        class="!w-full"
                                        @update:model-value="updateRowPayable(row.id, $event)"
                                    />
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="90" align="center">
                                <template #default="{ row }">
                                    <el-button
                                        link
                                        type="danger"
                                        class="enroll-plan__delete"
                                        @click="removeProduct(row.id)"
                                    >
                                        删除
                                    </el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </div>
            </section>

            <section v-show="currentStep === 2" class="enroll-section">
                <div class="enroll-section__title">支付信息</div>
                <div class="enroll-grid">
                    <el-form-item label="支付状态" prop="payStatus">
                        <el-radio-group v-model="formData.payStatus">
                            <el-radio :label="'unpaid'">未支付</el-radio>
                            <el-radio :label="'paid'">已支付</el-radio>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item label="支付方式">
                        <el-select
                            v-model="formData.payMethod"
                            class="!w-full"
                            placeholder="请选择支付方式"
                        >
                            <el-option label="微信" value="微信" />
                            <el-option label="支付宝" value="支付宝" />
                            <el-option label="银行卡" value="银行卡" />
                            <el-option label="现金" value="现金" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="实付金额">
                        <el-input-number
                            v-model="formData.paidAmount"
                            :min="0"
                            :precision="2"
                            class="!w-full"
                        />
                    </el-form-item>
                    <el-form-item label="支付时间">
                        <el-date-picker
                            v-model="formData.payTime"
                            type="datetime"
                            value-format="YYYY-MM-DD HH:mm:ss"
                            class="!w-full"
                            placeholder="请选择支付时间"
                        />
                    </el-form-item>
                    <el-form-item label="流水号" class="enroll-grid__full">
                        <el-input v-model="formData.channelPayNo" placeholder="请输入支付流水号" />
                    </el-form-item>
                    <el-form-item label="支付备注" class="enroll-grid__full">
                        <el-input
                            v-model="formData.payRemark"
                            type="textarea"
                            :rows="3"
                            placeholder="请输入支付备注"
                        />
                    </el-form-item>
                </div>
            </section>
        </el-form>

        <template #footer>
            <BaseButton v-if="currentStep > 0" @click="prevStep">上一步</BaseButton>
            <BaseButton v-if="currentStep < 2" type="primary" @click="nextStep">下一步</BaseButton>
            <BaseButton v-else type="primary" :loading="loading" @click="submitForm"
                >确 定</BaseButton
            >
            <BaseButton @click="dialogVisible = false">取 消</BaseButton>
        </template>

        <ProductSelectDialog
            v-model="productPickerVisible"
            :consult-project-id="formData.consultProjectId"
            @select="appendProducts"
        />
    </Dialog>
</template>

<script setup lang="ts">
import AreaSelect from '@/components/AreaSelect.vue'
import { BaseButton } from '@/components/Button'
import * as ClueApi from '@/api/crm/clue'
import * as ProductCategoryApi from '@/api/crm/product/category'
import type { ProductVO } from '@/api/crm/product'
import type { ProductCategoryVO } from '@/api/crm/product/category'
import type { CampusVO } from '@/api/system/campus'
import CampusSelect from '@/views/common/CampusSelect.vue'
import ProductSelectDialog from '@/views/common/ProductSelectDialog.vue'

defineOptions({ name: 'ClueEnrollDialog' })

type EnrollFormData = {
    clueId?: number
    clueName: string
    mobile: string
    mobile2: string
    areaId?: number
    wechat: string
    wechat2: string
    qq: string
    sourceName: string
    ownerName: string
    departmentName: string
    consultProjectId?: number
    clueSourceId?: number
    remark: string
    tagIds: number[]
    gender?: number
    birthday: string
    certificateType: string
    occupation: string
    emergencyMobile: string
    emergencyContact: string
    idCardNo: string
    enrollTime: string
    campusId?: number
    campusName: string
    payableAmount?: number
    enrollRemark: string
    payStatus: 'unpaid' | 'paid'
    payMethod: string
    paidAmount?: number
    payTime: string
    channelPayNo: string
    payRemark: string
}

type EnrollProductItem = {
    id: number
    categoryId: number
    categoryName: string
    productName: string
    price: number
    minPrice: number
    payableAmount: number
}

const emit = defineEmits<{
    success: []
}>()

const dialogVisible = ref(false)
const currentStep = ref(0)
const loading = ref(false)
const formRef = ref()
const message = useMessage()
const optionsLoaded = ref(false)
const projectOptions = ref<ProductCategoryVO[]>([])
const categoryOptions = ref<ProductCategoryVO[]>([])
const productPickerVisible = ref(false)
const selectedProducts = ref<EnrollProductItem[]>([])

const createDefaultFormData = (): EnrollFormData => ({
    clueId: undefined,
    clueName: '',
    mobile: '',
    mobile2: '',
    areaId: undefined,
    wechat: '',
    wechat2: '',
    qq: '',
    sourceName: '',
    ownerName: '',
    departmentName: '',
    consultProjectId: undefined,
    clueSourceId: undefined,
    remark: '',
    tagIds: [],
    gender: undefined,
    birthday: '',
    certificateType: '',
    occupation: '',
    emergencyMobile: '',
    emergencyContact: '',
    idCardNo: '',
    enrollTime: '',
    campusId: undefined,
    campusName: '',
    payableAmount: undefined,
    enrollRemark: '',
    payStatus: 'unpaid',
    payMethod: '',
    paidAmount: undefined,
    payTime: '',
    channelPayNo: '',
    payRemark: ''
})

const formData = ref<EnrollFormData>(createDefaultFormData())

const formRules = reactive({
    clueName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
    areaId: [{ required: true, message: '请选择地区', trigger: 'change' }],
    certificateType: [{ required: true, message: '请选择证件类型', trigger: 'change' }],
    idCardNo: [{ required: true, message: '请输入证件号码', trigger: 'blur' }],
    enrollTime: [{ required: true, message: '请选择报名时间', trigger: 'change' }],
    campusId: [{ required: true, message: '请选择报名分校', trigger: 'change' }]
})

const loadOptions = async () => {
    if (optionsLoaded.value) return
    const categories = await ProductCategoryApi.getProductCategorySimpleList()
    const categoryList = (categories || []) as ProductCategoryVO[]
    projectOptions.value = categoryList.filter((item) => Number(item.parentId) === 0)
    categoryOptions.value = categoryList.filter((item) => Number(item.parentId) > 0)
    optionsLoaded.value = true
}

const totalPayableAmount = computed(() =>
    selectedProducts.value.reduce((sum, item) => sum + Number(item.payableAmount || 0), 0)
)

const totalPayableText = computed(() => `¥${formatAmount(totalPayableAmount.value)}`)

const handleCampusChange = (item?: CampusVO) => {
    formData.value.campusName = item?.name || ''
}

const openProductPicker = () => {
    productPickerVisible.value = true
}

const appendProducts = (products: ProductVO[]) => {
    if (!products?.length) return
    let duplicateCount = 0
    products.forEach((product) => {
        if (!product?.id) return
        if (selectedProducts.value.some((item) => item.id === product.id)) {
            duplicateCount += 1
            return
        }
        const category = categoryOptions.value.find((item) => item.id === product.categoryId)
        selectedProducts.value.push({
            id: product.id,
            categoryId: product.categoryId,
            categoryName: product.categoryName || category?.name || '--',
            productName: product.name,
            price: Number(product.price || 0),
            minPrice: Number(product.minPrice || 0),
            payableAmount: Number(product.price || 0)
        })
    })
    if (duplicateCount > 0) {
        message.warning(`已跳过 ${duplicateCount} 个重复商品`)
    }
    formData.value.payableAmount = totalPayableAmount.value
    productPickerVisible.value = false
}

const updateRowPayable = (productId: number, value?: number) => {
    const target = selectedProducts.value.find((item) => item.id === productId)
    if (!target) return
    target.payableAmount = Number(value || 0)
    formData.value.payableAmount = totalPayableAmount.value
}

const removeProduct = (productId: number) => {
    selectedProducts.value = selectedProducts.value.filter((item) => item.id !== productId)
    formData.value.payableAmount = totalPayableAmount.value
}

const formatAmount = (value?: number) => {
    return Number(value || 0).toFixed(0)
}

const open = async (clue?: ClueApi.ClueVO) => {
    await loadOptions()
    dialogVisible.value = true
    currentStep.value = 0
    selectedProducts.value = []
    formData.value = {
        ...createDefaultFormData(),
        clueId: clue?.id,
        clueName: clue?.name || '',
        mobile: clue?.mobile || '',
        mobile2: clue?.mobile2 || '',
        areaId: clue?.areaId,
        wechat: clue?.wechat || '',
        wechat2: clue?.wechat2 || '',
        qq: clue?.qq || '',
        sourceName: clue?.clueSourceName || '2505成考不限',
        ownerName: clue?.currentOwnerName || '',
        departmentName: clue?.currentDepartmentName || '',
        consultProjectId: clue?.consultProjectId,
        clueSourceId: clue?.clueSourceId,
        remark: clue?.remark || '',
        tagIds: clue?.tagIds || [],
        gender: clue?.gender,
        birthday: clue?.birthday ? clue.birthday.replace(/-/g, '/') : '',
        certificateType: clue?.certificateType || '身份证',
        occupation: clue?.occupation || '',
        emergencyMobile: clue?.emergencyMobile || '',
        emergencyContact: clue?.emergencyContact || '',
        idCardNo: clue?.idCardNo || '',
        campusId: undefined,
        campusName: '',
        enrollTime: '',
        payStatus: 'unpaid'
    }
    nextTick(() => formRef.value?.clearValidate())
}

const maskedMobile = computed(() => {
    const mobile = formData.value.mobile || ''
    if (mobile.length < 7) return mobile || '--'
    return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`
})

const validateFields = async (props: string[]) => {
    await Promise.all(props.map((item) => formRef.value.validateField(item)))
}

const nextStep = async () => {
    if (currentStep.value === 0) {
        await validateFields(['clueName', 'gender', 'areaId', 'certificateType', 'idCardNo'])
        currentStep.value = 1
        return
    }
    if (currentStep.value === 1) {
        await validateFields(['enrollTime', 'campusId'])
        if (!selectedProducts.value.length) {
            message.warning('请先选择商品')
            return
        }
        currentStep.value = 2
    }
}

const prevStep = () => {
    currentStep.value = Math.max(currentStep.value - 1, 0)
}

const submitForm = async () => {
    await formRef.value.validate()
    loading.value = true
    try {
        if (formData.value.clueId) {
            await ClueApi.updateClueBasicInfo({
                id: formData.value.clueId,
                name: formData.value.clueName,
                mobile: formData.value.mobile,
                mobile2: formData.value.mobile2,
                wechat: formData.value.wechat,
                wechat2: formData.value.wechat2,
                qq: formData.value.qq,
                gender: formData.value.gender,
                areaId: formData.value.areaId!,
                consultProjectId: formData.value.consultProjectId || 0,
                clueSourceId: formData.value.clueSourceId || 0,
                remark: formData.value.remark,
                tagIds: formData.value.tagIds,
                idCardNo: formData.value.idCardNo,
                certificateType: formData.value.certificateType,
                occupation: formData.value.occupation,
                emergencyMobile: formData.value.emergencyMobile,
                emergencyContact: formData.value.emergencyContact
            })
        } else {
            await new Promise((resolve) => setTimeout(resolve, 400))
        }
        message.success('报名流程已按原型结构提交（待接真实创建订单接口）')
        dialogVisible.value = false
        emit('success')
    } finally {
        loading.value = false
    }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.enroll-steps {
    margin-bottom: 16px;
}

.enroll-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.enroll-section {
    border: 1px solid #ebeef5;
    border-radius: 12px;
    padding: 18px 18px 6px;
    background: linear-gradient(180deg, #fff 0%, #fcfcff 100%);
}

.enroll-section__title {
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eef1f8;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
}

.enroll-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 18px;
}

.enroll-grid--basic {
    column-gap: 28px;
}

.enroll-grid__full {
    grid-column: 1 / -1;
}

.readonly-value {
    min-height: 32px;
    display: flex;
    align-items: center;
    color: #303133;
    font-size: 14px;
}

.enroll-plan {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.enroll-plan__toolbar {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.enroll-plan__campus {
    margin-bottom: 0;
    min-width: 280px;
}

.enroll-plan__summary {
    margin-left: auto;
    display: flex;
    align-items: baseline;
    gap: 6px;
    color: #606266;
    font-size: 14px;
}

.enroll-plan__summary strong {
    color: #ff4d4f;
    font-size: 18px;
    font-weight: 700;
}

.enroll-plan__choose {
    min-width: 112px;
}

.enroll-plan__table-wrap {
    position: relative;
}

.enroll-plan__table :deep(.el-input-number) {
    width: 100%;
}

.enroll-plan__empty {
    padding: 18px 0 2px;
    text-align: center;
    color: #909399;
    font-size: 13px;
}

.enroll-plan__delete {
    color: #ff4d4f;
}

@media (max-width: 768px) {
    .enroll-grid {
        grid-template-columns: 1fr;
    }

    .enroll-grid__full {
        grid-column: auto;
    }

    .enroll-plan__toolbar {
        align-items: stretch;
    }

    .enroll-plan__campus,
    .enroll-plan__summary,
    .enroll-plan__choose {
        width: 100%;
        margin-left: 0;
    }
}
</style>
