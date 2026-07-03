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
                <span>归属：{{ ownerText }}</span>
                <span
                    >部门：{{
                        clue.currentDepartmentName || customerBasicInfo?.departmentName || '--'
                    }}</span
                >
                <span>客户编号：{{ clue.customerId || clue.id || '--' }}</span>
            </template>
            <template #actions>
                <template v-if="!readonlyMode">
                    <el-button plain :loading="outboundDialing" @click="handleOutboundCall">
                        外呼
                    </el-button>
                    <el-button plain @click="emit('sms')">短信</el-button>
                    <el-button v-if="!hideEnrollAction" plain @click="emit('enroll')">报名</el-button>
                    <el-button plain @click="emit('release')">释放</el-button>
                </template>
                <el-button v-if="showTagAction" plain @click="emit('tag')">加标签</el-button>
            </template>
        </DetailHeroCard>

        <div class="clue-columns">
            <div class="clue-column">
                <section class="clue-section" v-loading="loading">
                    <div class="clue-section__title">
                        <span>基本信息</span>
                        <div v-if="canUpdate && showEditAction" class="clue-section__actions">
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
                                <ProductTypeSelect
                                    v-model="editForm.consultProjectId"
                                    placeholder="请选择"
                                    missing-label="所选商品已下架"
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
                            <el-form-item label="微信备注名">
                                <el-input
                                    v-model="editForm.wechatRemark"
                                    placeholder="请输入微信备注名"
                                />
                            </el-form-item>
                            <el-form-item label="QQ">
                                <el-input v-model="editForm.qq" placeholder="请输入QQ" />
                            </el-form-item>
                            <el-form-item label="证件类型" prop="certificateType">
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
                            <el-form-item label="证件号码" prop="idCardNo">
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
                            <el-form-item label="投诉标签">
                                <el-select
                                    v-model="editForm.complaintTagIds"
                                    multiple
                                    filterable
                                    clearable
                                    placeholder="请选择投诉标签"
                                    class="w-1/1"
                                >
                                    <el-option
                                        v-for="item in complaintTagOptions"
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
                                <MobileCopyInline
                                    :clue-id="clue.id"
                                    :mobile="clue.mobile2"
                                    mobile-field="mobile2"
                                />
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
                                v-if="(appointments?.length || 0) > 0"
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
                                <el-table-column label="咨询项目" min-width="160">
                                    <template #default="{ row }">
                                        {{ row.projectName || '--' }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="商品分类" min-width="160">
                                    <template #default="{ row }">
                                        {{ row.productCategoryName || '--' }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="商品名称" min-width="180">
                                    <template #default="{ row }">
                                        {{ row.productName || '--' }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="预约价格" min-width="120">
                                    <template #default="{ row }">
                                        {{ formatAmount(row.appointmentPrice) }}
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
                            <div v-if="appointments?.length" class="record-pagination">
                                <el-pagination
                                    layout="prev, pager, next"
                                    :total="appointmentTotal"
                                    :current-page="appointmentPageNo"
                                    :page-size="appointmentPageSize"
                                    :page-sizes="[10, 20, 50, 100]"
                                    @current-change="
                                        emit('change-appointment-page', {
                                            pageNo: $event,
                                            pageSize: appointmentPageSize || 10
                                        })
                                    "
                                    @size-change="
                                        emit('change-appointment-page', { pageNo: 1, pageSize: $event })
                                    "
                                />
                            </div>
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
                                v-if="(orderRecords?.length || 0) > 0"
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
                                <el-table-column label="分期状态" min-width="100">
                                    <template #default="{ row }">
                                        {{ installmentStatusLabel(row.installmentStatus) }}
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    prop="finalPaymentChannel"
                                    label="尾款渠道"
                                    min-width="140"
                                    show-overflow-tooltip
                                >
                                    <template #default="{ row }">
                                        {{ row.finalPaymentChannel || '--' }}
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    prop="payableAmount"
                                    label="应付金额"
                                    min-width="100"
                                >
                                    <template #default="{ row }">
                                        {{ formatAmount(row.payableAmount) }}
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    prop="paidAmount"
                                    label="已付金额"
                                    min-width="100"
                                >
                                    <template #default="{ row }">
                                        {{ formatAmount(row.paidAmount) }}
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    prop="ownerUserName"
                                    label="归属人"
                                    min-width="100"
                                />
                            </el-table>
                            <div v-if="orderRecords?.length" class="record-pagination">
                                <el-pagination
                                    layout="prev, pager, next"
                                    :total="orderTotal"
                                    :current-page="orderPageNo"
                                    :page-size="orderPageSize"
                                    :page-sizes="[10, 20, 50, 100]"
                                    @current-change="
                                        emit('change-order-page', {
                                            pageNo: $event,
                                            pageSize: orderPageSize || 10
                                        })
                                    "
                                    @size-change="
                                        emit('change-order-page', { pageNo: 1, pageSize: $event })
                                    "
                                />
                            </div>
                            <el-empty
                                v-if="!orderRecords?.length"
                                description="暂无报名记录"
                                :image-size="60"
                            />
                        </el-tab-pane>
                        <el-tab-pane label="合同信息" name="contracts">
                            <ContractRecords :clue-id="clue.id || clueId" />
                        </el-tab-pane>
                        <el-tab-pane label="工单记录" name="tickets">
                            <el-table
                                :data="ticketRecords || []"
                                border
                                v-if="(ticketRecords?.length || 0) > 0"
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
                            <div v-if="ticketRecords?.length" class="record-pagination">
                                <el-pagination
                                    layout="prev, pager, next"
                                    :total="ticketTotal"
                                    :current-page="ticketPageNo"
                                    :page-size="ticketPageSize"
                                    :page-sizes="[10, 20, 50, 100]"
                                    @current-change="
                                        emit('change-ticket-page', {
                                            pageNo: $event,
                                            pageSize: ticketPageSize || 10
                                        })
                                    "
                                    @size-change="
                                        emit('change-ticket-page', { pageNo: 1, pageSize: $event })
                                    "
                                />
                            </div>
                            <el-empty
                                v-if="!ticketRecords?.length"
                                description="暂无工单记录"
                                :image-size="60"
                            />
                        </el-tab-pane>
                        <el-tab-pane label="客户轨迹" name="tracks">
                            <el-timeline v-if="parsedTrackList.length" class="clue-timeline">
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
                                            <template v-if="item.displayLines.length">
                                                <p
                                                    v-for="(line, index) in item.displayLines"
                                                    :key="`${item.id}-${index}`"
                                                >
                                                    <span v-if="line.type === 'mobile'" class="track-mobile-line">
                                                        <span>{{ line.label }}：</span>
                                                        <span class="track-mobile-line__value">
                                                            {{
                                                                isTrackMobileVisible(item.id, index)
                                                                    ? line.value
                                                                    : maskTrackMobile(line.value)
                                                            }}
                                                        </span>
                                                        <el-button
                                                            link
                                                            class="track-mobile-line__toggle"
                                                            :aria-label="
                                                                isTrackMobileVisible(item.id, index)
                                                                    ? '隐藏手机号'
                                                                    : '显示手机号'
                                                            "
                                                            @click="toggleTrackMobileVisible(item.id, index)"
                                                        >
                                                            <el-icon>
                                                                <Hide v-if="isTrackMobileVisible(item.id, index)" />
                                                                <View v-else />
                                                            </el-icon>
                                                        </el-button>
                                                    </span>
                                                    <template v-else>{{ line.text }}</template>
                                                </p>
                                            </template>
                                            <p v-else>{{ item.content || '--' }}</p>
                                        </div>
                                    </div>
                                </el-timeline-item>
                            </el-timeline>
                            <div v-if="parsedTrackList.length" class="record-pagination">
                                <el-pagination
                                    layout="prev, pager, next"
                                    :total="trackTotal"
                                    :current-page="trackPageNo"
                                    :page-size="trackPageSize"
                                    :page-sizes="[10, 20, 50, 100]"
                                    @current-change="
                                        emit('change-track-page', {
                                            pageNo: $event,
                                            pageSize: trackPageSize || 10
                                        })
                                    "
                                    @size-change="
                                        emit('change-track-page', { pageNo: 1, pageSize: $event })
                                    "
                                />
                            </div>
                            <el-empty
                                v-if="!trackList?.length"
                                description="暂无客户轨迹"
                                :image-size="60"
                            />
                        </el-tab-pane>
                        <el-tab-pane label="短信记录" name="sms">
                            <el-table :data="smsRecords || []" border v-if="(smsRecords?.length || 0) > 0">
                                <el-table-column prop="createTime" label="创建时间" min-width="160">
                                    <template #default="{ row }">
                                        {{ formatDateTime(row.createTime) }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="手机号" min-width="170">
                                    <template #default="{ row }">
                                        <SmsLogMobileCopyInline
                                            :mobile="row.mobile"
                                            :clue-id="clue.id || clueId"
                                            :primary-mobile="clue.mobile"
                                            :secondary-mobile="clue.mobile2"
                                        />
                                    </template>
                                </el-table-column>
                                <el-table-column label="发送状态" min-width="120">
                                    <template #default="{ row }">
                                        {{ getSmsSendStatusLabel(row.sendStatus) }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="接收状态" min-width="120">
                                    <template #default="{ row }">
                                        {{ getSmsReceiveStatusLabel(row.receiveStatus) }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="短信渠道" min-width="140">
                                    <template #default="{ row }">
                                        {{ getSmsChannelLabel(row.channelCode) }}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="templateId" label="模板编号" min-width="100" />
                                <el-table-column
                                    prop="templateContent"
                                    label="短信内容"
                                    min-width="260"
                                    show-overflow-tooltip
                                />
                            </el-table>
                            <div v-if="smsRecords?.length" class="record-pagination">
                                <el-pagination
                                    layout="prev, pager, next"
                                    :total="smsTotal"
                                    :current-page="smsPageNo"
                                    :page-size="smsPageSize"
                                    :page-sizes="[10, 20, 50, 100]"
                                    @current-change="
                                        emit('change-sms-page', {
                                            pageNo: $event,
                                            pageSize: smsPageSize || 10
                                        })
                                    "
                                    @size-change="
                                        emit('change-sms-page', { pageNo: 1, pageSize: $event })
                                    "
                                />
                            </div>
                            <el-empty
                                v-if="!smsRecords?.length"
                                description="暂无短信记录"
                                :image-size="60"
                            />
                        </el-tab-pane>
                        <el-tab-pane label="外呼记录" name="calls">
                            <el-table
                                :data="outboundCallRecords || []"
                                border
                                v-if="(outboundCallRecords?.length || 0) > 0"
                            >
                                <el-table-column prop="recordNo" label="记录编号" min-width="180" />
                                <el-table-column label="被叫号码" min-width="170">
                                    <template #default="{ row }">
                                        <OutboundCallMobileCopyInline
                                            :record-id="row.id"
                                            :clue-id="row.clueId"
                                            :mobile="row.calleeMobile"
                                        />
                                    </template>
                                </el-table-column>
                                <el-table-column
                                    prop="userNickname"
                                    label="主叫"
                                    min-width="120"
                                />
                                <el-table-column prop="createTime" label="发起时间" min-width="160">
                                    <template #default="{ row }">
                                        {{ formatDateTime(row.createTime) }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="状态" min-width="100">
                                    <template #default="{ row }">
                                        {{ row.statusDesc || '--' }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="通话时长" min-width="100">
                                    <template #default="{ row }">
                                        {{ formatCallDuration(row.durationSeconds) }}
                                    </template>
                                </el-table-column>
                                <el-table-column label="录音" min-width="340">
                                    <template #default="{ row }">
                                        <AudioPlayer
                                            v-if="row.recordingFileUrl"
                                            :src="row.recordingFileUrl"
                                            :duration="row.durationSeconds"
                                            :record-id="row.id"
                                        />
                                        <template v-else>--</template>
                                    </template>
                                </el-table-column>
                            </el-table>
                            <div v-if="outboundCallRecords?.length" class="record-pagination">
                                <el-pagination
                                    layout="prev, pager, next"
                                    :total="outboundCallTotal"
                                    :current-page="outboundCallPageNo"
                                    :page-size="outboundCallPageSize"
                                    :page-sizes="[10, 20, 50, 100]"
                                    @current-change="
                                        emit('change-outbound-call-page', {
                                            pageNo: $event,
                                            pageSize: outboundCallPageSize || 10
                                        })
                                    "
                                    @size-change="
                                        emit('change-outbound-call-page', { pageNo: 1, pageSize: $event })
                                    "
                                />
                            </div>
                            <el-empty
                                v-if="!outboundCallRecords?.length"
                                description="暂无外呼记录"
                                :image-size="60"
                            />
                        </el-tab-pane>
                    </el-tabs>
                </section>
            </div>

            <div class="clue-column clue-column--side">
                <section v-if="!readonlyMode" class="clue-section">
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
                        <el-form-item
                            v-if="showConsultType"
                            label="操作类型"
                            prop="consultType"
                        >
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
                        <el-form-item
                            v-if="showInvalidFields"
                            label="无效类型"
                            prop="invalidType"
                        >
                            <el-select
                                v-model="consultForm.invalidType"
                                clearable
                                filterable
                                placeholder="请选择无效类型"
                                class="w-1/1"
                            >
                                <el-option
                                    v-for="item in invalidTypeOptions"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value"
                                />
                            </el-select>
                        </el-form-item>
                        <el-form-item
                            v-if="showInvalidFields"
                            label="无效原因"
                            prop="invalidReason"
                            class="is-full"
                        >
                            <el-input
                                v-model="consultForm.invalidReason"
                                type="textarea"
                                :rows="4"
                                placeholder="请输入无效原因"
                            />
                        </el-form-item>
                        <el-form-item
                            v-if="showNotConnectedFields"
                            label="未接通原因"
                            prop="notConnectedReason"
                        >
                            <el-select
                                v-model="consultForm.notConnectedReason"
                                clearable
                                filterable
                                placeholder="请选择未接通原因"
                                class="w-1/1"
                            >
                                <el-option
                                    v-for="item in notConnectedReasonOptions"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value"
                                />
                            </el-select>
                        </el-form-item>
                        <el-row :gutter="20" v-if="showFollowUpFields">
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
                                <el-form-item v-if="showAppointmentFields" label="校区">
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
                                            :value="Number(item.id)"
                                        />
                                    </el-select>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item v-if="showAppointmentFields" label="咨询项目">
                                    <ProductTypeSelect
                                        v-model="consultForm.projectId"
                                        placeholder="请选择咨询项目"
                                        missing-label="所选商品已下架"
                                        @update:model-value="handleConsultProjectChange"
                                    />
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item v-if="showAppointmentFields" label="商品分类">
                                    <ProductTypeSelect
                                        v-model="consultForm.productCategoryId"
                                        :parent-id="consultForm.projectId"
                                        missing-label="所选商品已下架"
                                        @update:model-value="handleConsultCategoryChange"
                                    />
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item
                                    v-if="showAppointmentFields"
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
                        <el-row :gutter="20" v-if="showAppointmentFields">
                            <el-col :span="12">
                                <el-form-item label="预约时间" prop="appointmentTime">
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
                        <el-form-item v-if="showAppointmentFields" label="预约价格">
                            <el-input-number
                                v-model="consultForm.appointmentPrice"
                                :min="0"
                                :precision="2"
                                :step="0.01"
                                controls-position="right"
                                style="width: 100%"
                            />
                        </el-form-item>
                        <el-form-item
                            :label="
                                showAppointmentFields
                                    ? '预约备注'
                                    : showInvalidFields
                                      ? '无效备注'
                                      : showNotConnectedFields
                                        ? '未接通备注'
                                        : '回访备注'
                            "
                            prop="consultContent"
                            class="is-full"
                        >
                            <el-input
                                v-model="consultForm.consultContent"
                                type="textarea"
                                :rows="4"
                                :placeholder="
                                    showAppointmentFields
                                        ? '请输入预约备注'
                                        : showInvalidFields
                                          ? '请输入无效备注'
                                          : showNotConnectedFields
                                            ? '请输入未接通备注'
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
import { Hide, View } from '@element-plus/icons-vue'
import AreaSelect from '@/components/AreaSelect.vue'
import { UploadImg } from '@/components/UploadFile'
import type * as AftersalesApi from '@/api/crm/aftersales'
import * as ClueApi from '@/api/crm/clue'
import type * as CustomerDetailApi from '@/api/crm/customerDetail'
import type * as OrderApi from '@/api/crm/order'
import type { ProductVO } from '@/api/crm/product'
import type { ProductCategoryVO } from '@/api/crm/product/category'
import type * as OutboundCallRecordApi from '@/api/system/call/record'
import type * as CampusApi from '@/api/system/campus'
import * as DeptApi from '@/api/system/dept'
import type * as SmsLogApi from '@/api/system/sms/smsLog'
import * as UserApi from '@/api/system/user'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'
import { resolveTimestamp } from '@/utils/formatTime'
import { isValidChineseIdCard } from '@/utils/idCard'
import { yuanToFen } from '@/utils'
import { getAftersalesStatusLabel } from '@/views/aftersales/config'
import ProductSelectDialog from '@/components/ProductSelectDialog.vue'
import ProductTypeSelect from '@/components/ProductTypeSelect.vue'
import ClueIntentLevel from '@/components/ClueIntentLevel'
import MobileCopyInline from '@/views/crm/clue/MobileCopyInline.vue'
import SmsLogMobileCopyInline from '@/views/crm/clue/SmsLogMobileCopyInline.vue'
import { buildAreaLabel, buildOwnerDisplayName } from '@/views/crm/clue/listShared'
import DetailHeroCard from '@/views/crm/components/DetailHeroCard.vue'
import { useOutboundDial } from '@/hooks/web/useOutboundDial'
import AudioPlayer from '@/components/AudioPlayer/index.vue'
import OutboundCallMobileCopyInline from '@/views/crm/call/OutboundCallMobileCopyInline.vue'
import { formatAmount, getOptionLabel, INSTALLMENT_STATUS_OPTIONS } from '@/views/order/utils'
import ContractRecords from '@/views/crm/customer/detail/ContractRecords.vue'

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
    productCategoryOptions?: ProductCategoryVO[]
    clueSourceOptions: { label: string; value: number }[]
    tagOptions: { label: string; value: number }[]
    complaintTagOptions: { label: string; value: number }[]
    weworkContacts?: CustomerDetailApi.CustomerWeworkContactItem[]
    customerBasicInfo?: CustomerDetailApi.CustomerBasicInfoRespVO
    appointments?: CustomerDetailApi.CustomerAppointmentRespVO[]
    appointmentTotal?: number
    appointmentPageNo?: number
    appointmentPageSize?: number
    orderRecords?: OrderApi.OrderPageRespVO[]
    orderTotal?: number
    orderPageNo?: number
    orderPageSize?: number
    ticketRecords?: AftersalesApi.AftersalesRespVO[]
    ticketTotal?: number
    ticketPageNo?: number
    ticketPageSize?: number
    trackList?: CustomerDetailApi.CustomerTrackRespVO[]
    trackTotal?: number
    trackPageNo?: number
    trackPageSize?: number
    smsRecords?: SmsLogApi.SmsLogVO[]
    smsTotal?: number
    smsPageNo?: number
    smsPageSize?: number
    outboundCallRecords?: OutboundCallRecordApi.OutboundCallRecordVO[]
    outboundCallTotal?: number
    outboundCallPageNo?: number
    outboundCallPageSize?: number
    hideEnrollAction?: boolean
    readonly?: boolean
    allowReadonlyEditActions?: boolean
}>()

const route = useRoute()
const readonlyMode = computed(() => !!props.readonly)
const allowReadonlyEditActions = computed(() => !!props.allowReadonlyEditActions)
const showEditAction = computed(() => !readonlyMode.value || allowReadonlyEditActions.value)
const showTagAction = computed(() => !readonlyMode.value || allowReadonlyEditActions.value)
const hideEnrollAction = computed(
    () =>
        readonlyMode.value ||
        props.hideEnrollAction ||
        route.name === 'CrmCustomerDetail' ||
        route.path.startsWith('/crm/customer')
)

const emit = defineEmits<{
    edit: []
    'cancel-edit': []
    save: [payload: { formRef: any; formData: any }]
    'save-consult': [payload: CustomerDetailApi.CustomerConsultRecordCreateReqVO]
    sms: []
    enroll: []
    release: []
    tag: []
    close: []
    'change-appointment-page': [payload: { pageNo: number; pageSize: number }]
    'change-order-page': [payload: { pageNo: number; pageSize: number }]
    'change-ticket-page': [payload: { pageNo: number; pageSize: number }]
    'change-track-page': [payload: { pageNo: number; pageSize: number }]
    'change-outbound-call-page': [payload: { pageNo: number; pageSize: number }]
    'change-sms-page': [payload: { pageNo: number; pageSize: number }]
}>()

const installmentStatusLabel = (value?: number) =>
    getOptionLabel(INSTALLMENT_STATUS_OPTIONS, value)

const avatarText = computed(() => (props.clue.name || '线').slice(0, 1))
const { dialing: outboundDialing, dialOutboundMobile } = useOutboundDial()
const editFormRef = ref()
const consultFormRef = ref()
const recordTab = ref('appointments')
const productPickerVisible = ref(false)
const visibleTrackMobileMap = ref<Record<string, boolean>>({})

const educationOptions = getIntDictOptions(DICT_TYPE.CRM_CLUE_EDUCATION)
const consultResultOptions = getIntDictOptions(DICT_TYPE.CRM_CLUE_CONSULT_RESULT)
const consultTypeOptions = getIntDictOptions(DICT_TYPE.CRM_CLUE_CONSULT_TYPE)
const invalidTypeOptions = getIntDictOptions(DICT_TYPE.CRM_CLUE_INVALID_TYPE)
const notConnectedReasonOptions = getIntDictOptions(DICT_TYPE.CRM_CLUE_NOT_CONNECTED_REASON)

const regionText = computed(() => {
    return buildAreaLabel(props.clue)
})

const ownerText = computed(() => {
    return buildOwnerDisplayName(
        props.clue.currentOwnerName || props.customerBasicInfo?.ownerName,
        props.clue.currentOwnerId || props.customerBasicInfo?.ownerId
    )
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

const handleOutboundCall = async () => {
    const result = await ClueApi.copyClueMobile(props.clueId, 'mobile')
    await dialOutboundMobile(result?.mobile)
}

const selectedConsultProductName = computed(() => {
    if (consultForm.productName) {
        return consultForm.productName
    }
    if (consultForm.productId) {
        return '所选商品已下架'
    }
    return ''
})

const showConsultType = computed(() => Number(consultForm.consultResult) === 1)
const showFollowUpFields = computed(
    () => Number(consultForm.consultResult) === 1 && Number(consultForm.consultType) === 1
)
const showAppointmentFields = computed(
    () => Number(consultForm.consultResult) === 1 && Number(consultForm.consultType) === 2
)
const showNeedRemindFields = computed(
    () => showFollowUpFields.value || showAppointmentFields.value
)
const showInvalidFields = computed(() => Number(consultForm.consultResult) === 2)
const showNotConnectedFields = computed(() => Number(consultForm.consultResult) === 3)

const editForm = reactive({
    id: undefined as number | undefined,
    mobile: '',
    mobile2: '',
    wechat: '',
    wechat2: '',
    wechatRemark: '',
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
    complaintTagIds: [] as number[],
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
    invalidType: undefined as number | undefined,
    invalidReason: '',
    notConnectedReason: undefined as number | undefined,
    consultContent: props.clue.contactLastContent || ''
})

const validateIdCardNo = (_rule: any, value: string, callback: (error?: Error) => void) => {
    const idCardNo = String(value || '').trim()
    if (!idCardNo || editForm.certificateType !== '身份证') {
        callback()
        return
    }
    if (!isValidChineseIdCard(idCardNo)) {
        callback(new Error('请输入合法的身份证号码'))
        return
    }
    callback()
}

const editRules = reactive({
    mobile: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    clueSourceId: [{ required: true, message: '请选择来源', trigger: 'change' }],
    areaId: [{ required: true, message: '请选择地区', trigger: 'change' }],
    consultProjectId: [{ required: true, message: '请选择咨询项目', trigger: 'change' }],
    idCardNo: [{ validator: validateIdCardNo, trigger: 'blur' }]
})

const consultRules = reactive({
    consultType: [
        {
            required: true,
            validator: (_rule: any, value: number | undefined, callback: any) => {
                if (showConsultType.value && !value) {
                    callback(new Error('请选择操作类型'))
                    return
                }
                callback()
            },
            trigger: 'change'
        }
    ],
    consultResult: [
        {
            required: true,
            validator: (_rule: any, value: number | undefined, callback: any) => {
                if (!value) {
                    callback(new Error('请选择是否有效'))
                    return
                }
                callback()
            },
            trigger: 'change'
        }
    ],
    nextFollowTime: [
        {
            required: true,
            validator: (_rule: any, value: string | undefined, callback: any) => {
                if (showFollowUpFields.value && !value) {
                    callback(new Error('请选择下次回访时间'))
                    return
                }
                callback()
            },
            trigger: 'change'
        }
    ],
    appointmentTime: [
        {
            required: true,
            validator: (_rule: any, value: string | undefined, callback: any) => {
                if (showAppointmentFields.value && !value) {
                    callback(new Error('请选择预约时间'))
                    return
                }
                callback()
            },
            trigger: 'change'
        }
    ],
    productId: [
        {
            required: true,
            validator: (_rule: any, value: number | undefined, callback: any) => {
                if (showAppointmentFields.value && !value) {
                    callback(new Error('请选择商品'))
                    return
                }
                callback()
            },
            trigger: 'change'
        }
    ],
    invalidType: [
        {
            required: true,
            validator: (_rule: any, value: number | undefined, callback: any) => {
                if (showInvalidFields.value && !value) {
                    callback(new Error('请选择无效类型'))
                    return
                }
                callback()
            },
            trigger: 'change'
        }
    ],
    invalidReason: [
        {
            required: true,
            validator: (_rule: any, value: string | undefined, callback: any) => {
                if (showInvalidFields.value && !String(value || '').trim()) {
                    callback(new Error('请输入无效原因'))
                    return
                }
                callback()
            },
            trigger: 'blur'
        }
    ],
    notConnectedReason: [
        {
            required: true,
            validator: (_rule: any, value: number | undefined, callback: any) => {
                if (showNotConnectedFields.value && !value) {
                    callback(new Error('请选择未接通原因'))
                    return
                }
                callback()
            },
            trigger: 'change'
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

const formatAppointmentPriceText = (value: unknown) => {
    if (value === null || value === undefined || value === '') return ''
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? formatAmount(numericValue) : String(value)
}

const deptNameMap = ref<Record<number, string>>({})
const userNameMap = ref<Record<number, string>>({})

const CLAIM_SOURCE_LABELS: Record<number, string> = {
    3: '复购激活'
}

const getSmsSendStatusLabel = (value?: number | null) => {
    if (value === null || value === undefined) return '--'
    return getDictLabel(DICT_TYPE.SYSTEM_SMS_SEND_STATUS, Number(value)) || '--'
}

const getSmsReceiveStatusLabel = (value?: number | null) => {
    if (value === null || value === undefined) return '--'
    return getDictLabel(DICT_TYPE.SYSTEM_SMS_RECEIVE_STATUS, Number(value)) || '--'
}

const getSmsChannelLabel = (value?: string) =>
    value ? getDictLabel(DICT_TYPE.SYSTEM_SMS_CHANNEL_CODE, value) || value : '--'

const formatCallDuration = (durationSeconds?: number) => {
    if (!durationSeconds || durationSeconds < 0) {
        return '--'
    }
    const totalSeconds = Math.floor(durationSeconds)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const TRACK_FIELD_LABELS: Record<string, string> = {
    clueId: '客户编号',
    clueIds: '客户编号',
    silentReason: '静默原因',
    ownerId: '归属人',
    claimSource: '领取来源',
    action: '操作',
    orderNo: '订单编号',
    departmentId: '归属部门',
    seaType: '公海类型',
    externalUserId: '企微客户编号',
    staffUserId: '添加成员',
    source: '客户来源',
    consultProjectId: '咨询项目编号',
    projectId: '咨询项目编号',
    productCategoryId: '商品分类编号',
    productId: '商品编号',
    campusId: '校区编号',
    allocationType: '分配类型',
    ownerUserName: '归属人',
    mobile: '手机号',
    mobile2: '手机号2'
}

const TRACK_FIELD_ORDER = [
    'orderNo',
    'ownerUserName',
    'allocationType',
    'claimSource',
    'action',
    'departmentId',
    'ownerUserId',
    'orderId'
]

const TRACK_ACTION_LABELS: Record<string, string> = {
    repurchase_activate: '复购激活'
}

const TRACK_HIDDEN_FIELDS = new Set(['ownerUserId', 'ownerId', 'orderId'])
const TRACK_MOBILE_LINE_PATTERN = /^(手机号|手机号2|联系电话|联系电话2|mobile|mobile2)\s*[:：]\s*(.+)$/

const filterTrackLines = (lines: string[]) =>
    lines.filter((line) => Boolean(String(line || '').trim()))

const parseTrackMobileLine = (line?: string) => {
    const match = String(line || '').trim().match(TRACK_MOBILE_LINE_PATTERN)
    if (!match) return undefined
    return {
        label: TRACK_FIELD_LABELS[match[1]] || match[1],
        value: match[2]?.trim() || ''
    }
}

const maskTrackMobile = (mobile?: string) => {
    const value = String(mobile || '').trim()
    if (!value) return '--'
    if (value.length <= 4) return '*'.repeat(value.length)
    if (value.length <= 7) return `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`
    return `${value.slice(0, 3)}${'*'.repeat(Math.max(4, value.length - 7))}${value.slice(-4)}`
}

const getTrackMobileVisibleKey = (trackId: number | string | undefined, index: number) =>
    `${trackId || 'track'}-${index}`

const isTrackMobileVisible = (trackId: number | string | undefined, index: number) =>
    Boolean(visibleTrackMobileMap.value[getTrackMobileVisibleKey(trackId, index)])

const toggleTrackMobileVisible = (trackId: number | string | undefined, index: number) => {
    const key = getTrackMobileVisibleKey(trackId, index)
    visibleTrackMobileMap.value[key] = !visibleTrackMobileMap.value[key]
}

const getTrackMobileLinesFromContent = (content?: string) => {
    if (!content || !content.trim().startsWith('{')) return []
    try {
        const parsed = JSON.parse(content)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return []
        return ['mobile', 'mobile2']
            .map((key) => {
                const value = (parsed as Record<string, unknown>)[key]
                if (value === null || value === undefined || value === '') return ''
                return `${TRACK_FIELD_LABELS[key]}：${String(value)}`
            })
            .filter(Boolean)
    } catch {
        return []
    }
}

const ensureTrackMobileLines = (
    lines: string[],
    item: CustomerDetailApi.CustomerTrackRespVO
) => {
    const normalizedLines = filterTrackLines(lines)
    const hasMobileLine = normalizedLines.some((line) => parseTrackMobileLine(line))
    if (hasMobileLine) return normalizedLines
    const contentMobileLines = getTrackMobileLinesFromContent(item.content)
    return [...normalizedLines, ...contentMobileLines]
}

const buildTrackDisplayLines = (lines: string[]) =>
    lines.map((line) => {
        const mobileLine = parseTrackMobileLine(line)
        if (mobileLine) {
            return {
                type: 'mobile' as const,
                label: mobileLine.label,
                value: mobileLine.value,
                text: ''
            }
        }
        return {
            type: 'text' as const,
            text: line,
            label: '',
            value: ''
        }
    })

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
        const invalidTypeLabel = getDictLabel(
            DICT_TYPE.CRM_CLUE_INVALID_TYPE,
            Number(parsed.invalidType)
        )
        const notConnectedReasonLabel = getDictLabel(
            DICT_TYPE.CRM_CLUE_NOT_CONNECTED_REASON,
            Number(parsed.notConnectedReason)
        )
        const lines = [
            consultResultLabel ? `是否有效：${consultResultLabel}` : '',
            consultTypeLabel ? `操作类型：${consultTypeLabel}` : '',
            campusName ? `校区：${campusName}` : '',
            formatConsultValue(parsed.projectId) ? `咨询项目编号：${parsed.projectId}` : '',
            formatConsultValue(parsed.productCategoryId)
                ? `商品分类编号：${parsed.productCategoryId}`
                : '',
            formatConsultValue(parsed.productId) ? `商品编号：${parsed.productId}` : '',
            formatAppointmentPriceText(parsed.appointmentPrice)
                ? `预约价格：${formatAppointmentPriceText(parsed.appointmentPrice)}`
                : '',
            parsed.appointmentTime ? `预约时间：${formatDateTime(parsed.appointmentTime)}` : '',
            parsed.nextFollowTime ? `下次回访时间：${formatDateTime(parsed.nextFollowTime)}` : '',
            parsed.needRemind !== null && parsed.needRemind !== undefined
                ? `是否提醒：${parsed.needRemind ? '是' : '否'}`
                : '',
            invalidTypeLabel ? `无效类型：${invalidTypeLabel}` : '',
            parsed.invalidReason ? `无效原因：${parsed.invalidReason}` : '',
            notConnectedReasonLabel ? `未接通原因：${notConnectedReasonLabel}` : '',
            parsed.consultContent ? `备注：${parsed.consultContent}` : ''
        ].filter(Boolean)
        return lines.length ? lines : [content]
    } catch {
        return [content]
    }
}

const formatTrackFieldValue = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') return ''
    if (key === 'clueId' || key === 'clueIds') {
        return props.clue.customerId || String(value)
    }
    if (Array.isArray(value)) {
        return value.filter((item) => item !== null && item !== undefined && item !== '').join('、')
    }
    if (key === 'seaType') {
        return Number(value) === 1 ? '首咨公海' : Number(value) === 2 ? '复购公海' : String(value)
    }
    if (key === 'claimSource') {
        return CLAIM_SOURCE_LABELS[Number(value)] || String(value)
    }
    if (key === 'allocationType') {
        return getDictLabel(DICT_TYPE.CRM_CLUE_ALLOCATION_TYPE, Number(value)) || String(value)
    }
    if (key === 'action') {
        return TRACK_ACTION_LABELS[String(value)] || String(value)
    }
    if (key === 'departmentId') {
        return (
            deptNameMap.value[Number(value)] ||
            (Number(props.clue.currentDepartmentId) === Number(value)
                ? props.clue.currentDepartmentName
                : '') ||
            String(value)
        )
    }
    if (key === 'ownerUserName') {
        return String(value)
    }
    if (key === 'ownerUserId') {
        return (
            userNameMap.value[Number(value)] ||
            (Number(props.clue.currentOwnerId) === Number(value) ? props.clue.currentOwnerName : '') ||
            String(value)
        )
    }
    if (key === 'ownerId') {
        return (
            userNameMap.value[Number(value)] ||
            (Number(props.clue.currentOwnerId) === Number(value) ? props.clue.currentOwnerName : '') ||
            String(value)
        )
    }
    if (typeof value === 'boolean') {
        return value ? '是' : '否'
    }
    if (typeof value === 'string' && /time|date/i.test(key)) {
        return formatDateTime(value)
    }
    return String(value)
}

const buildJsonTrackLines = (content?: string) => {
    if (!content || !content.trim().startsWith('{')) {
        return content ? [content] : []
    }
    try {
        const parsed = JSON.parse(content)
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return [content]
        }
        const normalizedParsed = { ...(parsed as Record<string, unknown>) }
        if (
            !normalizedParsed.ownerUserName &&
            normalizedParsed.ownerUserId !== null &&
            normalizedParsed.ownerUserId !== undefined
        ) {
            normalizedParsed.ownerUserName = formatTrackFieldValue(
                'ownerUserId',
                normalizedParsed.ownerUserId
            )
        }
        if (
            !normalizedParsed.ownerUserName &&
            normalizedParsed.ownerId !== null &&
            normalizedParsed.ownerId !== undefined
        ) {
            normalizedParsed.ownerUserName = formatTrackFieldValue('ownerId', normalizedParsed.ownerId)
        }
        if (
            !normalizedParsed.departmentName &&
            normalizedParsed.departmentId !== null &&
            normalizedParsed.departmentId !== undefined
        ) {
            normalizedParsed.departmentName = formatTrackFieldValue(
                'departmentId',
                normalizedParsed.departmentId
            )
        }
        const entries = Object.entries(normalizedParsed)
        const orderedKeys = Array.from(
            new Set([
                ...['clueId', 'clueIds', 'silentReason'].filter((key) => key in normalizedParsed),
                ...TRACK_FIELD_ORDER.filter((key) => key in normalizedParsed),
                ...entries.map(([key]) => key).filter((key) => !TRACK_FIELD_ORDER.includes(key))
            ])
        )
        const lines = orderedKeys
            .map((key) => {
                if (TRACK_HIDDEN_FIELDS.has(key)) return ''
                if (key === 'departmentName') return ''
                const formattedValue = formatTrackFieldValue(
                    key,
                    normalizedParsed[key]
                )
                if (!formattedValue) return ''
                return `${TRACK_FIELD_LABELS[key] || key}：${formattedValue}`
            })
            .filter(Boolean)
        return lines.length ? lines : [content]
    } catch {
        return [content]
    }
}

const loadTrackOptionMaps = async () => {
    try {
        const [depts, users] = await Promise.all([
            DeptApi.getSimpleDeptList(),
            UserApi.getSimpleUserList()
        ])
        deptNameMap.value = Object.fromEntries(
            (depts || []).map((item) => [Number(item.id), item.name || String(item.id)])
        )
        userNameMap.value = Object.fromEntries(
            (users || []).map((item) => [Number(item.id), item.nickname || item.username || String(item.id)])
        )
    } catch {
        deptNameMap.value = {}
        userNameMap.value = {}
    }
}

const normalizeTrackLines = (item: CustomerDetailApi.CustomerTrackRespVO) => {
    const rawContentLines = (item.contentLines || []).filter(Boolean)
    if (rawContentLines.length) {
        if (rawContentLines.length === 1) {
            const [singleLine] = rawContentLines
            if (singleLine?.trim().startsWith('{')) {
                const parsedLines = item.type === 4 || item.typeName === '咨询信息'
                    ? buildConsultTrackLines(singleLine)
                    : buildJsonTrackLines(singleLine)
                return ensureTrackMobileLines(parsedLines, item)
            }
        }
        return ensureTrackMobileLines(rawContentLines, item)
    }
    const parsedLines = item.type === 4 || item.typeName === '咨询信息'
        ? buildConsultTrackLines(item.content)
        : buildJsonTrackLines(item.content)
    return ensureTrackMobileLines(parsedLines, item)
}

const syncEditForm = () => {
    editForm.id = props.clue.id
    editForm.mobile = props.clue.mobile || ''
    editForm.mobile2 = props.clue.mobile2 || ''
    editForm.wechat = props.clue.wechat || ''
    editForm.wechat2 = props.clue.wechat2 || ''
    editForm.wechatRemark = props.clue.wechatRemark || ''
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
    editForm.complaintTagIds = (props.clue.complaintTagIds || []).map((item) => Number(item))
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
    consultForm.invalidType = undefined
    consultForm.invalidReason = ''
    consultForm.notConnectedReason = undefined
    consultForm.consultContent = props.clue.contactLastContent || ''
}

watch(
    () => consultForm.consultResult,
    (value) => {
        const result = Number(value)
        if (result !== 1) {
            consultForm.campusId = undefined
            consultForm.projectId = props.clue.consultProjectId
            consultForm.productCategoryId = undefined
            consultForm.productId = undefined
            consultForm.productName = ''
            consultForm.appointmentPrice = undefined
            consultForm.appointmentTime = ''
            consultForm.nextFollowTime = ''
            consultForm.needRemind = false
        }
        if (result !== 2) {
            consultForm.invalidType = undefined
            consultForm.invalidReason = ''
        }
        if (result !== 3) {
            consultForm.notConnectedReason = undefined
        }
        nextTick(() => {
            consultFormRef.value?.clearValidate?.([
                'consultType',
                'nextFollowTime',
                'appointmentTime',
                'productId',
                'invalidType',
                'invalidReason',
                'notConnectedReason'
            ])
        })
    }
)

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

onMounted(() => {
    loadTrackOptionMaps()
})

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
    (props.trackList || []).map((item) => {
        const lines = normalizeTrackLines(item)
        return {
            ...item,
            lines,
            displayLines: buildTrackDisplayLines(lines)
        }
    })
)

const basicInfoItems = computed(() => [
    { label: '客户编号', value: props.clue.customerId || '--' },
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
    { label: '微信备注名', value: props.clue.wechatRemark || '--' },
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
        consultResult: consultForm.consultResult,
        consultType: showConsultType.value ? consultForm.consultType : undefined,
        campusId: showAppointmentFields.value ? consultForm.campusId : undefined,
        projectId: showAppointmentFields.value ? consultForm.projectId : undefined,
        productCategoryId: showAppointmentFields.value ? consultForm.productCategoryId : undefined,
        productId: showAppointmentFields.value ? consultForm.productId : undefined,
        appointmentPrice:
            showAppointmentFields.value &&
            consultForm.appointmentPrice !== undefined &&
            consultForm.appointmentPrice !== null
                ? yuanToFen(consultForm.appointmentPrice)
                : undefined,
        appointmentTime:
            showAppointmentFields.value ? consultForm.appointmentTime || undefined : undefined,
        nextFollowTime: showFollowUpFields.value ? consultForm.nextFollowTime || undefined : undefined,
        needRemind: showNeedRemindFields.value ? consultForm.needRemind : undefined,
        invalidType: showInvalidFields.value ? consultForm.invalidType : undefined,
        invalidReason: showInvalidFields.value ? consultForm.invalidReason.trim() || undefined : undefined,
        notConnectedReason: showNotConnectedFields.value ? consultForm.notConnectedReason : undefined,
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
    const selectedCategory = (props.productCategoryOptions || []).find(
        (item) => Number(item.id) === Number(product.categoryId)
    )
    if (selectedCategory?.parentId !== undefined && selectedCategory?.parentId !== null) {
        consultForm.projectId = Number(selectedCategory.parentId) || consultForm.projectId
    }
    consultForm.productCategoryId =
        Number(selectedCategory?.id || product.categoryId) || consultForm.productCategoryId
    consultForm.productId = Number(product.id)
    consultForm.productName = product.name || ''
}
</script>

<style scoped lang="scss">
@import './style.scss';

.record-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
}

.track-mobile-line {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.track-mobile-line__value {
    color: var(--el-text-color-primary);
}

.track-mobile-line__toggle {
    height: 20px;
    min-height: 20px;
    padding: 0 2px;
    color: var(--el-color-primary);
    vertical-align: middle;
}
</style>
