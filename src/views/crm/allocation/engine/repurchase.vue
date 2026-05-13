<template>
    <el-form
        ref="repurchaseFormRef"
        v-loading="repurchaseLoading"
        :model="repurchaseForm"
        :rules="repurchaseRules"
        label-width="160px"
    >
        <el-card shadow="never">
            <template #header>
                <div class="flex items-center justify-between">
                    <CardTitle title="复购公海规则设置" />
                    <el-button
                        type="primary"
                        v-hasPermi="['crm:customer-pool-config:update']"
                        @click="saveRepurchaseConfig"
                    >
                        保存
                    </el-button>
                </div>
            </template>

            <el-form-item label="是否启用" prop="enabled">
                <el-switch
                    v-model="repurchaseForm.enabled"
                    inline-prompt
                    active-text="启用"
                    inactive-text="不启用"
                    @change="changeRepurchaseEnable"
                />
            </el-form-item>
            <template v-if="repurchaseForm.enabled">
                <el-form-item label="优先新数据分配" prop="priorityNewDataAllocation">
                    <el-radio-group v-model="repurchaseForm.priorityNewDataAllocation">
                        <el-radio :value="false">否</el-radio>
                        <el-radio :value="true">是</el-radio>
                    </el-radio-group>
                </el-form-item>
            </template>
            <template v-if="repurchaseForm.enabled">
                <el-form-item label="生效时间范围" prop="timeRangeType">
                    <el-radio-group
                        v-model="repurchaseForm.timeRangeType"
                        @change="changeRepurchaseTimeRangeType"
                    >
                        <el-radio value="unlimited">不限</el-radio>
                        <el-radio value="custom">自定义</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="repurchaseForm.timeRangeType === 'custom'" label="生效时间">
                    <el-time-picker
                        v-model="repurchaseForm.startTime"
                        value-format="HH:mm:ss"
                        placeholder="开始时间"
                    />
                    <span class="mx-2">至</span>
                    <el-time-picker
                        v-model="repurchaseForm.endTime"
                        value-format="HH:mm:ss"
                        placeholder="结束时间"
                    />
                </el-form-item>

                <el-form-item label="报名商品范围" prop="productScopeType">
                    <el-radio-group
                        v-model="repurchaseForm.productScopeType"
                        @change="changeRepurchaseProductScopeType"
                    >
                        <el-radio value="unlimited">不限</el-radio>
                        <el-radio value="custom">自定义</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="repurchaseForm.productScopeType === 'custom'" label="报名商品">
                    <el-select
                        v-model="repurchaseForm.productIdList"
                        multiple
                        clearable
                        collapse-tags
                        collapse-tags-tooltip
                        placeholder="请选择商品"
                    >
                        <el-option
                            v-for="item in productList"
                            :key="item.id"
                            :label="item.name"
                            :value="item.id!"
                        />
                    </el-select>
                </el-form-item>

                <el-form-item label="成单时间范围" prop="dealTimeRangeType">
                    <el-radio-group v-model="repurchaseForm.dealTimeRangeType">
                        <el-radio value="unlimited">不限</el-radio>
                        <el-radio value="custom">自定义</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="repurchaseForm.dealTimeRangeType === 'custom'" label="成单时间">
                    <el-date-picker
                        v-model="repurchaseForm.dealStartDate"
                        type="date"
                        value-format="YYYY-MM-DD"
                        placeholder="开始日期"
                    />
                    <span class="mx-2">至</span>
                    <el-date-picker
                        v-model="repurchaseForm.dealEndDate"
                        type="date"
                        value-format="YYYY-MM-DD"
                        placeholder="结束日期"
                    />
                </el-form-item>

                <el-form-item label="报名次数">
                    <el-input-number v-model="repurchaseForm.signCountMin" :min="0" />
                    <span class="mx-2">至</span>
                    <el-input-number v-model="repurchaseForm.signCountMax" :min="0" />
                </el-form-item>

                <el-form-item label="报名时间范围" prop="signTimeRangeType">
                    <el-radio-group v-model="repurchaseForm.signTimeRangeType">
                        <el-radio value="unlimited">不限</el-radio>
                        <el-radio value="custom">自定义</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item v-if="repurchaseForm.signTimeRangeType === 'custom'" label="报名时间">
                    <el-date-picker
                        v-model="repurchaseForm.signStartDate"
                        type="date"
                        value-format="YYYY-MM-DD"
                        placeholder="开始日期"
                    />
                    <span class="mx-2">至</span>
                    <el-date-picker
                        v-model="repurchaseForm.signEndDate"
                        type="date"
                        value-format="YYYY-MM-DD"
                        placeholder="结束日期"
                    />
                </el-form-item>

                <el-form-item label="付款金额类型" prop="paymentAmountType">
                    <el-radio-group v-model="repurchaseForm.paymentAmountType">
                        <el-radio value="once">一次性</el-radio>
                        <el-radio value="proportion">按比例</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item
                    v-if="repurchaseForm.paymentAmountType === 'proportion'"
                    label="付款比例"
                >
                    <el-input-number
                        v-model="repurchaseForm.paymentPercentMin"
                        :min="0"
                        :max="100"
                    />
                    <span class="mx-2">至</span>
                    <el-input-number
                        v-model="repurchaseForm.paymentPercentMax"
                        :min="0"
                        :max="100"
                    />
                </el-form-item>
                <el-form-item v-else label="付款金额">
                    <el-input-number v-model="repurchaseForm.paymentAmountMin" :min="0" />
                    <span class="mx-2">至</span>
                    <el-input-number v-model="repurchaseForm.paymentAmountMax" :min="0" />
                </el-form-item>

                <el-form-item label="提交报名后天数">
                    <el-input-number v-model="repurchaseForm.submitAfterDays" :min="0" />
                </el-form-item>
            </template>
        </el-card>
    </el-form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { CardTitle } from '@/components/Card'
import * as RepurchasePoolApi from '@/api/crm/customer/repurchasePoolConfig'
import * as ProductApi from '@/api/crm/product'

const message = useMessage()
const { t } = useI18n()

const repurchaseLoading = ref(false)
const repurchaseFormRef = ref()
const productList = ref<any[]>([])

const repurchaseForm = reactive<RepurchasePoolApi.CustomerRepurchasePoolConfigVO>({
    enabled: false,
    priorityNewDataAllocation: false,
    timeRangeType: 'unlimited',
    productScopeType: 'unlimited',
    productIdList: [],
    dealTimeRangeType: 'unlimited',
    signTimeRangeType: 'unlimited',
    paymentAmountType: 'once'
})

const repurchaseRules = reactive({
    enabled: [{ required: true, message: '是否启用不能为空', trigger: 'change' }],
    priorityNewDataAllocation: [
        { required: true, message: '是否优先新数据分配不能为空', trigger: 'change' }
    ],
    timeRangeType: [{ required: true, message: '生效时间类型不能为空', trigger: 'change' }],
    productScopeType: [{ required: true, message: '报名商品范围类型不能为空', trigger: 'change' }],
    dealTimeRangeType: [{ required: true, message: '成单时间范围类型不能为空', trigger: 'change' }],
    signTimeRangeType: [{ required: true, message: '报名时间范围类型不能为空', trigger: 'change' }],
    paymentAmountType: [{ required: true, message: '付款金额类型不能为空', trigger: 'change' }]
})

const getRepurchaseConfig = async () => {
    repurchaseLoading.value = true
    try {
        const data = await RepurchasePoolApi.getCustomerRepurchasePoolConfig()
        if (data) Object.assign(repurchaseForm, data)
        if (!productList.value.length) productList.value = await ProductApi.getProductSimpleList()
    } finally {
        repurchaseLoading.value = false
    }
}

const changeRepurchaseEnable = () => {
    if (!repurchaseForm.enabled) {
        repurchaseForm.priorityNewDataAllocation = false
        repurchaseForm.timeRangeType = 'unlimited'
        repurchaseForm.startTime = undefined
        repurchaseForm.endTime = undefined
        repurchaseForm.productScopeType = 'unlimited'
        repurchaseForm.productIdList = []
        repurchaseForm.dealTimeRangeType = 'unlimited'
        repurchaseForm.dealStartDate = undefined
        repurchaseForm.dealEndDate = undefined
        repurchaseForm.signCountMin = undefined
        repurchaseForm.signCountMax = undefined
        repurchaseForm.signTimeRangeType = 'unlimited'
        repurchaseForm.signStartDate = undefined
        repurchaseForm.signEndDate = undefined
        repurchaseForm.paymentAmountType = 'once'
        repurchaseForm.paymentPercentMin = undefined
        repurchaseForm.paymentPercentMax = undefined
        repurchaseForm.paymentAmountMin = undefined
        repurchaseForm.paymentAmountMax = undefined
        repurchaseForm.submitAfterDays = undefined
    }
}

const changeRepurchaseTimeRangeType = () => {
    if (repurchaseForm.timeRangeType !== 'custom') {
        repurchaseForm.startTime = undefined
        repurchaseForm.endTime = undefined
    }
}

const changeRepurchaseProductScopeType = () => {
    if (repurchaseForm.productScopeType !== 'custom') {
        repurchaseForm.productIdList = []
    }
}

const saveRepurchaseConfig = async () => {
    const valid = await repurchaseFormRef.value?.validate()
    if (!valid) return
    repurchaseLoading.value = true
    try {
        await RepurchasePoolApi.saveCustomerRepurchasePoolConfig(repurchaseForm)
        message.success(t('common.updateSuccess'))
        // await getRepurchaseConfig()
    } finally {
        repurchaseLoading.value = false
    }
}

onMounted(() => {
    getRepurchaseConfig()
})
</script>
