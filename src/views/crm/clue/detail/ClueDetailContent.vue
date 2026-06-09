<template>
    <div class="clue-card-query">
        <DetailHeroCard :avatar="clue.avatar" :avatar-text="avatarText" :title="clue.name || '--'">
            <template #titleExtra>
                <ClueIntentLevel
                    :model-value="clue.intentLevel"
                    mode="tag"
                    class="clue-hero__intent"
                />
            </template>
            <template #subline>
                <span
                    >归属：{{ clue.currentOwnerName || customerBasicInfo?.ownerName || '--' }}</span
                >
                <span
                    >部门：{{
                        clue.currentDepartmentName || customerBasicInfo?.departmentName || '--'
                    }}</span
                >
                <span>名片编号：{{ clue.customerId || clue.id || '--' }}</span>
            </template>
            <template #actions>
                <el-button plain @click="emit('sms')">短信</el-button>
                <el-button plain @click="emit('enroll')">报名</el-button>
                <el-button plain @click="emit('transfer')">转移</el-button>
                <el-button plain @click="emit('tag')">加标签</el-button>
            </template>
        </DetailHeroCard>

        <div class="clue-columns">
            <div class="clue-column">
                <section class="clue-section" v-loading="loading">
                    <div class="clue-section__title">
                        <span>基本信息</span>
                        <div v-if="canUpdate" class="clue-section__actions">
                            <template v-if="!editing">
                                <el-button link type="primary" @click="emit('edit')"
                                    >编辑</el-button
                                >
                            </template>
                            <template v-else>
                                <el-button link @click="emit('cancel-edit')">取消</el-button>
                                <el-button
                                    link
                                    type="primary"
                                    :loading="saving"
                                    @click="
                                        emit('save', {
                                            formRef: editFormRef,
                                            formData: { ...editForm }
                                        })
                                    "
                                >
                                    保存
                                </el-button>
                            </template>
                        </div>
                    </div>
                    <el-form
                        v-if="editing"
                        ref="editFormRef"
                        :model="editForm"
                        :rules="editRules"
                        label-position="top"
                        class="clue-edit-form"
                    >
                        <div class="clue-info-grid clue-info-grid--edit">
                            <el-form-item label="手机号" prop="mobile">
                                <el-input v-model="editForm.mobile" placeholder="请输入手机号" />
                            </el-form-item>
                            <el-form-item label="姓名" prop="name">
                                <el-input v-model="editForm.name" placeholder="请输入姓名" />
                            </el-form-item>
                            <el-form-item label="来源" prop="clueSourceId">
                                <el-select
                                    v-model="editForm.clueSourceId"
                                    clearable
                                    filterable
                                    placeholder="请选择"
                                    class="w-1/1"
                                >
                                    <el-option
                                        v-for="item in clueSourceOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="地区" prop="areaId">
                                <AreaSelect
                                    v-model="editForm.areaId"
                                    :include-all-node="false"
                                    placeholder="请选择地区"
                                />
                            </el-form-item>
                            <el-form-item label="咨询项目" prop="consultProjectId">
                                <ProductCategorySelect
                                    v-model="editForm.consultProjectId"
                                    placeholder="请选择"
                                />
                            </el-form-item>
                            <el-form-item label="手机号2">
                                <el-input v-model="editForm.mobile2" placeholder="请输入手机号2" />
                            </el-form-item>
                            <el-form-item label="意向度">
                                <ClueIntentLevel
                                    v-model="editForm.intentLevel"
                                    mode="select"
                                    class="w-1/1"
                                />
                            </el-form-item>
                            <el-form-item label="微信号">
                                <el-input v-model="editForm.wechat" placeholder="请输入微信号" />
                            </el-form-item>
                            <el-form-item label="微信号2">
                                <el-input v-model="editForm.wechat2" placeholder="请输入微信号2" />
                            </el-form-item>
                            <el-form-item label="QQ">
                                <el-input v-model="editForm.qq" placeholder="请输入QQ" />
                            </el-form-item>
                            <el-form-item label="证件类型">
                                <el-select
                                    v-model="editForm.certificateType"
                                    clearable
                                    placeholder="请选择"
                                    class="w-1/1"
                                >
                                    <el-option label="身份证" value="身份证" />
                                    <el-option label="护照" value="护照" />
                                    <el-option label="港澳通行证" value="港澳通行证" />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="证件号码">
                                <el-input
                                    v-model="editForm.idCardNo"
                                    placeholder="请输入证件号码"
                                />
                            </el-form-item>
                            <el-form-item label="性别">
                                <el-select
                                    v-model="editForm.gender"
                                    clearable
                                    placeholder="请选择"
                                    class="w-1/1"
                                >
                                    <el-option label="男" :value="1" />
                                    <el-option label="女" :value="2" />
                                </el-select>
                            </el-form-item>
                            <el-form-item label="学历">
                                <el-select
                                    v-model="editForm.education"
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
                            <el-form-item label="标签">
                                <el-select
                                    v-model="editForm.tagIds"
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
                            <el-form-item label="咨询备注" class="clue-edit-form__full">
                                <el-input
                                    v-model="editForm.remark"
                                    type="textarea"
                                    :rows="4"
                                    placeholder="请输入咨询备注"
                                />
                            </el-form-item>
                            <el-form-item label="头像" class="clue-edit-form__avatar">
                                <UploadImg
                                    v-model="editForm.avatar"
                                    :limit="1"
                                    height="80px"
                                    width="80px"
                                    :is-show-tip="false"
                                />
                            </el-form-item>
                        </div>
                    </el-form>
                    <div v-else class="clue-info-grid">
                        <div
                            v-for="item in basicInfoItems"
                            :key="item.label"
                            class="clue-info-item"
                        >
                            <label>{{ item.label }}</label>
                            <div v-if="item.label === '手机号'">
                                <MobileCopyInline :clue-id="clue.id" :mobile="clue.mobile" />
                            </div>
                            <div v-else-if="item.label === '手机号2'">
                                <MobileCopyInline :mobile="clue.mobile2" direct-copy />
                            </div>
                            <div v-else>{{ item.value }}</div>
                        </div>
                    </div>
                </section>

                <section class="clue-section">
                    <el-tabs v-model="recordTab" class="clue-record-tabs">
                        <el-tab-pane label="预约记录" name="appointments">
                            <el-table
                                :data="appointments || []"
                                border
                                v-if="appointments.length > 0"
                            >
                                <el-table-column
                                    prop="appointmentTypeName"
                                    label="操作类型"
                                    min-width="100"
                                />
                                <el-table-column
                                    prop="appointmentTime"
                                    label="预约时间"
                                    min-width="160"
                                >
                                    <template #default="{ row }">
                                        {{ formatDateTime(row.appointmentTime) }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="campusName" label="校区" min-width="120" />
                                <el-table-column label="咨询项目" min-width="180">
                                    <template #default="{ row }">
                                        {{
                                            row.projectName ||
                                            row.productCategoryName ||
                                            row.productName ||
                                            '--'
                                        }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="预约价格" min-width="120">
                                    <template #default="{ row }">
                                        {{
                                            row.appointmentPrice !== undefined &&
                                            row.appointmentPrice !== null
                                                ? row.appointmentPrice
                                                : '--'
                                        }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="记录人" min-width="120">
                                    <template #default="{ row }">
                                        {{ row.creatorName || row.creator || '--' }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="createTime" label="创建时间" min-width="160">
                                    <template #default="{ row }">
                                        {{ formatDateTime(row.createTime) }}
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    prop="consultContent"
                                    label="备注"
                                    min-width="220"
                                />
                            </el-table>
                            <el-empty
                                v-if="!appointments?.length"
                                description="暂无预约记录"
                                :image-size="60"
                            />
                        </el-tab-pane>
                        <el-tab-pane label="报名记录" name="orders">
                            <el-table
                                :data="orderRecords || []"
                                border
                                v-if="orderRecords.length > 0"
                            >
                                <el-table-column prop="orderNo" label="订单编号" min-width="160" />
                                <el-table-column prop="createTime" label="创建时间" min-width="160">
                                    <template #default="{ row }">
                                        {{ formatDateTime(row.createTime) }}
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    prop="mainProductName"
                                    label="商品名称"
                                    min-width="180"
                                />
                                <el-table-column prop="campusName" label="校区" min-width="120" />
                                <el-table-column
                                    prop="payableAmount"
                                    label="应付金额"
                                    min-width="100"
                                />
                                <el-table-column
                                    prop="paidAmount"
                                    label="已付金额"
                                    min-width="100"
                                />
                                <el-table-column
                                    prop="ownerUserName"
                                    label="归属人"
                                    min-width="100"
                                />
                            </el-table>
                            <el-empty
                                v-if="!orderRecords?.length"
                                description="暂无报名记录"
                                :image-size="60"
                            />
                        </el-tab-pane>
                        <el-tab-pane label="工单记录" name="tickets">
                            <el-table
                                :data="ticketRecords || []"
                                border
                                v-if="ticketRecords.length > 0"
                            >
                                <el-table-column prop="ticketNo" label="工单号" min-width="160" />
                                <el-table-column
                                    prop="customerName"
                                    label="客户姓名"
                                    min-width="120"
                                />
                                <el-table-column prop="orderNo" label="订单编号" min-width="160" />
                                <el-table-column
                                    prop="handlerUserName"
                                    label="处理人"
                                    min-width="100"
                                />
                                <el-table-column label="状态" min-width="100">
                                    <template #default="{ row }">
                                        {{ getAftersalesStatusLabel(row.status) || '--' }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="reason" label="申请原因" min-width="180" />
                                <el-table-column label="创建时间" min-width="160">
                                    <template #default="{ row }">
                                        {{ formatDateTime(row.createTime) }}
                                    </template>
                                </el-table-column>
                            </el-table>
                            <el-empty
                                v-if="!ticketRecords?.length"
                                description="暂无工单记录"
                                :image-size="60"
                            />
                        </el-tab-pane>
                        <el-tab-pane label="客户轨迹" name="tracks">
                            <el-timeline class="clue-timeline">
                                <el-timeline-item
                                    v-for="item in parsedTrackList"
                                    :key="item.id"
                                    :hide-timestamp="true"
                                    type="primary"
                                    hollow
                                >
                                    <div class="timeline-card">
                                        <div class="timeline-card__header">
                                            <span class="timeline-card__title">{{
                                                item.typeName || '轨迹'
                                            }}</span>
                                            <span class="timeline-card__meta">
                                                操作: {{ item.operator || '--' }} |
                                                {{ formatDateTime(item.createTime) }}
                                            </span>
                                        </div>
                                        <div class="timeline-card__body">
                                            <template v-if="item.lines.length">
                                                <p
                                                    v-for="(line, index) in item.lines"
                                                    :key="`${item.id}-${index}`"
                                                >
                                                    {{ line }}
                                                </p>
                                            </template>
                                            <p v-else>{{ item.content || '--' }}</p>
                                        </div>
                                    </div>
                                </el-timeline-item>
                            </el-timeline>
                            <el-empty
                                v-if="!trackList?.length"
                                description="暂无客户轨迹"
                                :image-size="60"
                            />
                        </el-tab-pane>
                    </el-tabs>
                </section>
            </div>

            <div class="clue-column clue-column--side">
                <section class="clue-section">
                    <div class="clue-section__title">
                        <span>咨询信息</span>
                        <el-button
                            type="primary"
                            link
                            :loading="consultSaving"
                            @click="submitConsult"
                        >
                            保存
                        </el-button>
                    </div>
                    <el-form
                        ref="consultFormRef"
                        :model="consultForm"
                        :rules="consultRules"
                        label-position="right"
                        class="consult-form"
                    >
                        <el-form-item label="是否有效" prop="consultResult">
                            <el-radio-group v-model="consultForm.consultResult">
                                <el-radio
                                    v-for="item in consultResultOptions"
                                    :key="item.value"
                                    :value="item.value"
                                >
                                    {{ item.label }}
                                </el-radio>
                            </el-radio-group>
                        </el-form-item>
                        <el-form-item label="操作类型" prop="consultType">
                            <el-radio-group v-model="consultForm.consultType">
                                <el-radio
                                    v-for="item in consultTypeOptions"
                                    :key="item.value"
                                    :value="item.value"
                                >
                                    {{ item.label }}
                                </el-radio>
                            </el-radio-group>
                        </el-form-item>
                        <el-row :gutter="20" v-if="consultForm.consultType === 1">
                            <el-col :span="16">
                                <el-form-item label="下次回访时间" prop="nextFollowTime">
                                    <el-date-picker
                                        v-model="consultForm.nextFollowTime"
                                        type="datetime"
                                        value-format="YYYY-MM-DD HH:mm:ss"
                                        placeholder="请选择下次回访时间"
                                        style="width: 100%"
                                    />
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item label="是否提醒">
                                    <el-switch v-model="consultForm.needRemind" />
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item v-if="consultForm.consultType === 2" label="校区">
                                    <el-select
                                        v-model="consultForm.campusId"
                                        clearable
                                        filterable
                                        placeholder="请选择校区"
                                        class="w-1/1"
                                    >
                                        <el-option
                                            v-for="item in campusOptions"
                                            :key="item.id"
                                            :label="item.name"
                                            :value="item.id"
                                        />
                                    </el-select>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item v-if="consultForm.consultType === 2" label="咨询项目">
                                    <ProductCategorySelect
                                        v-model="consultForm.projectId"
                                        placeholder="请选择咨询项目"
                                        @update:model-value="handleConsultProjectChange"
                                    />
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item v-if="consultForm.consultType === 2" label="商品分类">
                                    <ProductCategorySelect
                                        v-model="consultForm.productCategoryId"
                                        :parent-id="consultForm.projectId"
                                        @update:model-value="handleConsultCategoryChange"
                                    />
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item
                                    v-if="consultForm.consultType === 2"
                                    label="商品选择"
                                    prop="productId"
                                >
                                    <el-input
                                        :model-value="selectedConsultProductName"
                                        readonly
                                        placeholder="请选择商品"
                                        @click="productPickerVisible = true"
                                    />
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-row :gutter="20" v-if="consultForm.consultType === 2">
                            <el-col :span="12">
                                <el-form-item label="预约时间">
                                    <el-date-picker
                                        v-model="consultForm.appointmentTime"
                                        type="datetime"
                                        value-format="YYYY-MM-DD HH:mm:ss"
                                        placeholder="请选择预约时间"
                                        style="width: 100%"
                                    />
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item label="是否提醒">
                                    <el-switch v-model="consultForm.needRemind" />
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-form-item v-if="consultForm.consultType === 2" label="预约价格">
                            <el-input-number
                                v-model="consultForm.appointmentPrice"
                                :min="0"
                                :step="1"
                                controls-position="right"
                                style="width: 100%"
                            />
                        </el-form-item>
                        <el-form-item
                            :label="consultForm.consultType === 2 ? '预约备注' : '回访备注'"
                            prop="consultContent"
                            class="is-full"
                        >
                            <el-input
                                v-model="consultForm.consultContent"
                                type="textarea"
                                :rows="4"
                                :placeholder="
                                    consultForm.consultType === 2
                                        ? '请输入预约备注'
                                        : '请输入回访备注'
                                "
                            />
                        </el-form-item>
                    </el-form>
                </section>

                <section class="clue-section">
                    <div class="clue-section__title">
                        <span>企微信息</span>
                    </div>
                    <div v-if="weworkCustomerCard" class="wework-customer-list">
                        <div class="wework-customer-card">
                            <div>
                                <el-avatar :size="45" :src="weworkCustomerCard.avatar">
                                    {{
                                        (
                                            weworkCustomerCard.customerName ||
                                            weworkCustomerCard.customerNickname ||
                                            '客'
                                        ).slice(0, 1)
                                    }}
                                </el-avatar>
                            </div>
                            <div class="wework-customer-card__meta">
                                <div class="wework-customer-card__name-row">
                                    <div class="wework-customer-card__main">
                                        <strong>
                                            {{
                                                weworkCustomerCard.customerName ||
                                                weworkCustomerCard.customerNickname ||
                                                '--'
                                            }}
                                        </strong>
                                        <span
                                            v-if="weworkCustomerCard.customerNickname"
                                            class="wework-customer-card__nickname"
                                        >
                                            {{ weworkCustomerCard.customerNickname }}
                                        </span>
                                        <span class="wework-customer-card__detail">
                                            微信昵称
                                            {{ weworkCustomerCard.customerNickname || '--' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="weworkStaffCards.length" class="wework-relation-grid">
                        <div
                            v-for="relation in weworkStaffCards"
                            :key="relation.relationId"
                            class="wework-relation-card"
                        >
                            <div class="wework-relation-card__user">
                                <el-avatar :size="60" shape="square" :src="relation.staffAvatar">
                                    {{ (relation.staffName || '员').slice(0, 1) }}
                                </el-avatar>
                                <div class="wework-relation-card__user-meta">
                                    <div class="wework-relation-card__name-row">
                                        <strong>{{ relation.staffName || '--' }}</strong>
                                        <span class="wework-relation-card__corp">
                                            @{{ relation.corpName || '--' }}
                                        </span>
                                    </div>
                                    <div class="wework-relation-card__remark">
                                        <span
                                            v-if="relation.mobile"
                                            class="wework-relation-card__remark-item"
                                        >
                                            备注手机号
                                            <MobileCopyInline
                                                :mobile="relation.mobile"
                                                direct-copy
                                            />
                                        </span>
                                        <span class="wework-relation-card__remark-item">
                                            添加方式 {{ formatAddWay(relation.addWay) }}
                                        </span>
                                        <span class="wework-relation-card__remark-item">
                                            添加时间 {{ formatDateTime(relation.addTime) }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <el-empty v-else description="暂无企微关联信息" :image-size="72" />
                </section>
            </div>
        </div>

        <ProductSelectDialog
            v-model="productPickerVisible"
            :consult-project-id="consultForm.projectId"
            @select="handleConsultProductSelect"
        />
    </div>
</template>

<script setup lang="ts">
import AreaSelect from '@/components/AreaSelect.vue'
import { UploadImg } from '@/components/UploadFile'
import type * as AftersalesApi from '@/api/crm/aftersales'
import * as ClueApi from '@/api/crm/clue'
import type * as CustomerDetailApi from '@/api/crm/customerDetail'
import type * as OrderApi from '@/api/crm/order'
import type { ProductVO } from '@/api/crm/product'
import type * as CampusApi from '@/api/system/campus'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'
import { resolveTimestamp } from '@/utils/formatTime'
import { getAftersalesStatusLabel } from '@/views/aftersales/config'
import ProductSelectDialog from '@/components/ProductSelectDialog.vue'
import ProductCategorySelect from '@/components/ProductCategorySelect.vue'
import ClueIntentLevel from '@/components/ClueIntentLevel'
import MobileCopyInline from '@/views/crm/clue/MobileCopyInline.vue'
import DetailHeroCard from '@/views/crm/components/DetailHeroCard.vue'

const props = defineProps<{
    clue: ClueApi.ClueVO
    clueId: number
    loading: boolean
    canUpdate: boolean
    logList: any[]
    editing: boolean
    saving: boolean
    consultSaving: boolean
    campusOptions: CampusApi.CampusVO[]
    clueSourceOptions: { label: string; value: number }[]
    tagOptions: { label: string; value: number }[]
    weworkContacts?: CustomerDetailApi.CustomerWeworkContactItem[]
    customerBasicInfo?: CustomerDetailApi.CustomerBasicInfoRespVO
    appointments?: CustomerDetailApi.CustomerAppointmentRespVO[]
    orderRecords?: OrderApi.OrderPageRespVO[]
    ticketRecords?: AftersalesApi.AftersalesRespVO[]
    trackList?: CustomerDetailApi.CustomerTrackRespVO[]
}>()

const emit = defineEmits<{
    edit: []
    'cancel-edit': []
    save: [payload: { formRef: any; formData: any }]
    'save-consult': [payload: CustomerDetailApi.CustomerConsultRecordCreateReqVO]
    sms: []
    enroll: []
    transfer: []
    tag: []
    close: []
}>()

const avatarText = computed(() => (props.clue.name || '线').slice(0, 1))
const editFormRef = ref()
const consultFormRef = ref()
const recordTab = ref('appointments')
const productPickerVisible = ref(false)

const educationOptions = getIntDictOptions(DICT_TYPE.CRM_CLUE_EDUCATION)
const consultResultOptions = getIntDictOptions(DICT_TYPE.CRM_CLUE_CONSULT_RESULT)
const consultTypeOptions = getIntDictOptions(DICT_TYPE.CRM_CLUE_CONSULT_TYPE)

const regionText = computed(() => {
    const names = [props.clue.province, props.clue.city, props.clue.district].filter(Boolean)
    return names.length ? names.join(' / ') : props.clue.areaName || '--'
})

const weworkCustomerCard = computed(() => props.weworkContacts?.[0])

const weworkStaffCards = computed(() =>
    (props.weworkContacts || []).flatMap((contact) =>
        (contact.relations || []).map((relation) => ({
            ...relation,
            corpName: contact.corpName
        }))
    )
)

const selectedConsultProductName = computed(() => consultForm.productName || '')

const editForm = reactive({
    id: undefined as number | undefined,
    mobile: '',
    mobile2: '',
    wechat: '',
    wechat2: '',
    qq: '',
    avatar: '',
    certificateType: '',
    idCardNo: '',
    name: '',
    gender: undefined as number | undefined,
    education: undefined as number | undefined,
    intentLevel: undefined as number | undefined,
    areaId: undefined as number | undefined,
    consultProjectId: undefined as number | undefined,
    clueSourceId: undefined as number | undefined,
    tagIds: [] as number[],
    remark: ''
})

const consultForm = reactive({
    consultType: 1,
    consultResult: 1,
    campusId: undefined as number | undefined,
    projectId: props.clue.consultProjectId,
    productCategoryId: undefined as number | undefined,
    productId: undefined as number | undefined,
    productName: '',
    appointmentPrice: undefined as number | undefined,
    appointmentTime: '',
    nextFollowTime: props.clue.contactNextTime || '',
    needRemind: Boolean(props.clue.followUpStatus),
    consultContent: props.clue.contactLastContent || ''
})

const editRules = reactive({
    mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    clueSourceId: [{ required: true, message: '请选择来源', trigger: 'change' }],
    areaId: [{ required: true, message: '请选择地区', trigger: 'change' }],
    consultProjectId: [{ required: true, message: '请选择咨询项目', trigger: 'change' }]
})

const consultRules = reactive({
    consultType: [{ required: true, message: '请选择操作类型', trigger: 'change' }],
    consultResult: [
        {
            validator: (_rule: any, value: number | undefined, callback: any) => {
                if (consultForm.consultType === 1 && !value) {
                    callback(new Error('请选择是否有效'))
                    return
                }
                callback()
            },
            trigger: 'change'
        }
    ],
    nextFollowTime: [{ required: true, message: '请选择下次回访时间', trigger: 'change' }],
    productId: [
        {
            validator: (_rule: any, value: number | undefined, callback: any) => {
                if (consultForm.consultType === 2 && !value) {
                    callback(new Error('请选择商品'))
                    return
                }
                callback()
            },
            trigger: 'change'
        }
    ],
    consultContent: [
        {
            validator: (_rule: any, value: string | undefined, callback: any) => {
                if (consultForm.consultType === 2 && !String(value || '').trim()) {
                    callback(new Error('请输入预约备注'))
                    return
                }
                callback()
            },
            trigger: 'blur'
        }
    ]
})

const formatAddWay = (value?: string) =>
    value ? getDictLabel(DICT_TYPE.WEWORK_FOLLOW_USER_ADD_WAY, value) || value : '--'

const formatDateTime = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '' || Number(value) === 0) {
        return '--'
    }
    return resolveTimestamp(value)?.format('YYYY-MM-DD HH:mm:ss') || String(value)
}

const formatConsultValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return ''
    return String(value)
}

const buildConsultTrackLines = (content?: string) => {
    if (!content || !content.trim().startsWith('{')) {
        return content ? [content] : []
    }
    try {
        const parsed = JSON.parse(content)
        const campusName =
            props.campusOptions.find((item) => Number(item.id) === Number(parsed.campusId))?.name ||
            ''
        const consultResultLabel = getDictLabel(
            DICT_TYPE.CRM_CLUE_CONSULT_RESULT,
            Number(parsed.consultResult)
        )
        const consultTypeLabel = getDictLabel(
            DICT_TYPE.CRM_CLUE_CONSULT_TYPE,
            Number(parsed.consultType)
        )
        const lines = [
            consultResultLabel ? `是否有效：${consultResultLabel}` : '',
            consultTypeLabel ? `操作类型：${consultTypeLabel}` : '',
            campusName ? `校区：${campusName}` : '',
            formatConsultValue(parsed.projectId) ? `咨询项目ID：${parsed.projectId}` : '',
            formatConsultValue(parsed.productCategoryId)
                ? `商品分类ID：${parsed.productCategoryId}`
                : '',
            formatConsultValue(parsed.productId) ? `商品ID：${parsed.productId}` : '',
            formatConsultValue(parsed.appointmentPrice)
                ? `预约价格：${parsed.appointmentPrice}`
                : '',
            parsed.appointmentTime ? `预约时间：${formatDateTime(parsed.appointmentTime)}` : '',
            parsed.nextFollowTime ? `下次回访时间：${formatDateTime(parsed.nextFollowTime)}` : '',
            parsed.needRemind !== null && parsed.needRemind !== undefined
                ? `是否提醒：${parsed.needRemind ? '是' : '否'}`
                : '',
            parsed.consultContent ? `备注：${parsed.consultContent}` : ''
        ].filter(Boolean)
        return lines.length ? lines : [content]
    } catch {
        return [content]
    }
}

const syncEditForm = () => {
    editForm.id = props.clue.id
    editForm.mobile = props.clue.mobile || ''
    editForm.mobile2 = props.clue.mobile2 || ''
    editForm.wechat = props.clue.wechat || ''
    editForm.wechat2 = props.clue.wechat2 || ''
    editForm.qq = props.clue.qq || ''
    editForm.avatar = props.clue.avatar || ''
    editForm.certificateType = props.clue.certificateType || ''
    editForm.idCardNo = props.clue.idCardNo || ''
    editForm.name = props.clue.name || ''
    editForm.gender = props.clue.gender
    editForm.education = props.clue.education
    editForm.intentLevel = props.clue.intentLevel
    editForm.areaId = props.clue.areaId
    editForm.consultProjectId = props.clue.consultProjectId
    editForm.clueSourceId = props.clue.clueSourceId
    editForm.tagIds = (props.clue.tagIds || []).map((item) => Number(item))
    editForm.remark = props.clue.remark || ''
}

const syncConsultForm = () => {
    consultForm.consultType = 1
    consultForm.consultResult = 1
    consultForm.campusId = undefined
    consultForm.projectId = props.clue.consultProjectId
    consultForm.productCategoryId = undefined
    consultForm.productId = undefined
    consultForm.productName = ''
    consultForm.appointmentPrice = undefined
    consultForm.appointmentTime = ''
    consultForm.nextFollowTime = props.clue.contactNextTime || ''
    consultForm.needRemind = Boolean(props.clue.followUpStatus)
    consultForm.consultContent = props.clue.contactLastContent || ''
}

watch(
    () => props.clue,
    () => {
        syncEditForm()
        syncConsultForm()
    },
    { immediate: true, deep: true }
)

watch(
    () => props.editing,
    (value) => {
        if (value) {
            syncEditForm()
            nextTick(() => editFormRef.value?.clearValidate?.())
        }
    }
)

const tagText = computed(() => {
    if (props.clue.tagNames?.length) return props.clue.tagNames.join('、')
    if (!props.clue.tagIds?.length || !props.tagOptions.length) return '--'
    const optionMap = new Map(props.tagOptions.map((item) => [Number(item.value), item.label]))
    const labels = props.clue.tagIds
        .map((item) => optionMap.get(Number(item)))
        .filter((item): item is string => !!item)
    return labels.length ? labels.join('、') : '--'
})

const customerTagText = computed(() => {
    const tags = props.customerBasicInfo?.tags || []
    return tags.length ? tags.map((item) => item.name).join('、') : tagText.value
})

const complaintTagText = computed(() => {
    return props.clue.complaintTagNames?.length ? props.clue.complaintTagNames.join('、') : '--'
})

const parsedTrackList = computed(() =>
    (props.trackList || []).map((item) => ({
        ...item,
        lines: item.contentLines?.length
            ? item.contentLines
            : item.type === 4 || item.typeName === '咨询信息'
              ? buildConsultTrackLines(item.content)
              : item.content
                ? [item.content]
                : []
    }))
)

const basicInfoItems = computed(() => [
    { label: '客户ID', value: props.clue.customerId || '--' },
    { label: '手机号', value: props.clue.mobile || '--' },
    { label: '姓名', value: props.clue.name || '--' },
    { label: '来源', value: props.clue.clueSourceName || '--' },
    { label: '地区', value: regionText.value },
    { label: '咨询项目', value: props.clue.consultProjectName || '--' },
    { label: '手机号2', value: props.clue.mobile2 || '--' },
    { label: '意向度', value: props.clue.intentLevelName || '--' },
    { label: '报名次数', value: props.clue.orderCount ?? '--' },
    { label: '微信号', value: props.clue.wechat || '--' },
    { label: '微信号2', value: props.clue.wechat2 || '--' },
    { label: 'QQ', value: props.clue.qq || '--' },
    { label: '证件类型', value: props.clue.certificateType || '--' },
    { label: '证件号码', value: props.clue.idCardNo || '--' },
    { label: '性别', value: props.clue.genderName || '--' },
    { label: '学历', value: props.clue.educationName || '--' },

    { label: '标签', value: customerTagText.value },
    { label: '投诉标签', value: complaintTagText.value },
    { label: '咨询备注', value: props.clue.remark || '--' }
])

const submitConsult = async () => {
    const valid = await consultFormRef.value?.validate?.()
    if (!valid) return
    emit('save-consult', {
        clueId: Number(props.clue.id),
        consultResult: consultForm.consultType === 1 ? consultForm.consultResult : undefined,
        consultType: consultForm.consultType,
        campusId: consultForm.consultType === 2 ? consultForm.campusId : undefined,
        projectId: consultForm.consultType === 2 ? consultForm.projectId : consultForm.projectId,
        productCategoryId: consultForm.productCategoryId,
        productId: consultForm.productId,
        appointmentPrice: consultForm.consultType === 2 ? consultForm.appointmentPrice : undefined,
        appointmentTime:
            consultForm.consultType === 2 ? consultForm.appointmentTime || undefined : undefined,
        nextFollowTime: consultForm.nextFollowTime || undefined,
        needRemind: consultForm.needRemind,
        consultContent: consultForm.consultContent.trim()
    })
}

const handleConsultCategoryChange = () => {
    consultForm.productId = undefined
    consultForm.productName = ''
}

const handleConsultProjectChange = () => {
    consultForm.productCategoryId = undefined
    consultForm.productId = undefined
    consultForm.productName = ''
}

const handleConsultProductSelect = (products: ProductVO[]) => {
    const product = products?.[0]
    if (!product) return
    consultForm.productId = Number(product.id)
    consultForm.productName = product.name || ''
    consultForm.productCategoryId = Number(product.categoryId) || consultForm.productCategoryId
}
</script>

<style scoped lang="scss">
@import './style.scss';
</style>
