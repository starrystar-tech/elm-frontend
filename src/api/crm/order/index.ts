import request from '@/config/axios'

export interface OrderPageReqVO extends PageParam {
  clueId?: number
  customer?: string
  mobile?: string
  orderNo?: string
  orderStatus?: number
  contractStatus?: number
  productCategory?: string
  productKeyword?: string
  minPaidAmount?: number
  maxPaidAmount?: number
  ownerUserName?: string
  cardOwnerUserName?: string
  creator?: string
  beginEnrollTime?: string
  endEnrollTime?: string
  beginExpireTime?: string
  endExpireTime?: string
  beginCreateTime?: string
  endCreateTime?: string
}

export interface OrderPageRespVO {
  id: number
  orderNo: string
  enrollTime?: string
  customerName: string
  customerId: string
  customerMobile: string
  orderStatus: number
  contractStatus: number
  payableAmount: number
  paidAmount: number
  refundAmount: number
  campusName: string
  ownerUserName: string
  cardOwnerUserName: string
  remark: string
  creator: string
  creatorName?: string
  createTime: string
  expireTime?: string
  projectName?: string
  mainProductCategoryPath?: string
  mainProductName?: string
  mainProductCode?: string
}

export interface OrderItemRespVO {
  id: number
  sort: number
  productId: number
  projectName: string
  productCode: string
  productName: string
  productCategoryPath: string
  productPrice: number
  payableAmount: number
  paidAmount: number
  refundAmount: number
  contractStatus: number
  expireTime?: string
  remark?: string
}

export interface OrderPayRecordRespVO {
  id: number
  payNo: string
  orderId: number
  orderNo: string
  customerId: string
  customerName: string
  customerMobile: string
  payAmount: number
  payMethod: string
  payStatus: number
  payTime?: string
  channelPayNo?: string
  confirmStatus: number
  confirmResult?: string
  confirmUserId?: number
  confirmUserName?: string
  confirmTime?: string
  confirmRemark?: string
  createTime: string
}

export interface OrderRefundRespVO {
  id: number
  refundNo: string
  orderId: number
  orderNo: string
  payRecordId?: number
  customerId: string
  customerName: string
  customerMobile: string
  refundMethod: string
  refundType: number
  refundAmount: number
  refundStatus: number
  refundReason: string
  refundRemark?: string
  auditUserId?: number
  auditUserName?: string
  auditTime?: string
  auditRemark?: string
  refundTime?: string
  aftersalesTicketId?: number
  aftersalesPriority?: number
  aftersalesStatus?: number
  aftersalesHandlerUserId?: number
  aftersalesHandlerUserName?: string
  aftersalesProcessTime?: string
  aftersalesProcessResult?: string
  creator: string
  creatorName?: string
  createTime: string
}

export interface OrderDetailRespVO extends OrderPageRespVO {
  clueId?: number
  gender?: number
  qq?: string
  wechat?: string
  wechat2?: string
  customerMobile2?: string
  certificateType?: string
  idCardNo?: string
  occupation?: string
  emergencyMobile?: string
  emergencyContact?: string
  birthday?: string
  education?: number
  areaId?: number
  province?: string
  city?: string
  district?: string
  campusId?: number
  organizationName?: string
  ownerUserId?: number
  cardOwnerUserId?: number
  items: OrderItemRespVO[]
  payRecords: OrderPayRecordRespVO[]
  refunds: OrderRefundRespVO[]
}

export interface OrderCreateItemReqVO {
  sort: number
  productId: number
  projectName?: string
  productCode?: string
  productName: string
  productCategoryPath?: string
  productPrice: number
  payableAmount: number
  remark?: string
}

export interface OrderCreateReqVO {
  clueId?: number
  customerId?: string
  customerName: string
  customerMobile: string
  gender?: number
  wechat?: string
  campusId: number
  campusName: string
  projectName?: string
  mainProductCategoryPath?: string
  mainProductName?: string
  mainProductCode?: string
  ownerUserId?: number
  ownerUserName?: string
  cardOwnerUserId?: number
  cardOwnerUserName?: string
  enrollTime?: string
  payableAmount: number
  remark?: string
  items: OrderCreateItemReqVO[]
}

export interface OrderPayReqVO {
  orderId: number
  payAmount: number
  payMethod: string
  channelPayNo?: string
  payTime?: string
}

export interface OrderPayConfirmReqVO {
  id: number
  confirmStatus: number
  confirmResult?: string
  confirmRemark?: string
}

export interface OrderBatchUpdateOwnerReqVO {
  orderIds: number[]
  ownerUserId: number
}

export interface OrderExportReqVO extends OrderPageReqVO {
  authCode?: string
  exportPlainMobile?: boolean
}

export interface OrderPayRecordPageReqVO extends PageParam {
  customer?: string
  mobile?: string
  orderNo?: string
  payStatus?: number
  confirmStatus?: number
  payNo?: string
  payMethod?: string
  beginPayTime?: string
  endPayTime?: string
  minPayAmount?: number
  maxPayAmount?: number
}

export interface OrderRefundPageReqVO extends PageParam {
  customer?: string
  mobile?: string
  orderNo?: string
  refundStatus?: number
  refundNo?: string
  refundType?: number
  beginRefundTime?: string
  endRefundTime?: string
  minRefundAmount?: number
  maxRefundAmount?: number
  creator?: string
  beginCreateTime?: string
  endCreateTime?: string
}

export interface OrderRefundCreateReqVO {
  orderId: number
  payRecordId?: number
  refundMethod: string
  refundType: number
  refundAmount: number
  refundReason: string
  refundRemark?: string
}

export interface OrderRefundAuditReqVO {
  id: number
  refundStatus: number
  auditRemark?: string
}

export const getMyOrderPage = async (params: OrderPageReqVO) => {
  return await request.get({ url: '/crm/order/my-page', params })
}

export const createMyOrderExportTask = async (data: OrderExportReqVO) => {
  return await request.post<number>({ url: '/crm/order/my-export-task', data })
}

export const getOrderPage = async (params: OrderPageReqVO) => {
  return await request.get({ url: '/crm/order/page', params })
}

export const getOrder = async (id: number) => {
  return await request.get<OrderDetailRespVO>({ url: '/crm/order/get', params: { id } })
}

export const createOrder = async (data: OrderCreateReqVO) => {
  return await request.post<number>({ url: '/crm/order/create', data })
}

export const payOrder = async (data: OrderPayReqVO) => {
  return await request.post<number>({ url: '/crm/order/pay', data })
}

export const voidOrder = async (id: number) => {
  return await request.put<boolean>({ url: '/crm/order/void', params: { id } })
}

export const repurchaseOrder = async (id: number) => {
  return await request.post<number>({ url: '/crm/order/repurchase', params: { id } })
}

export const batchUpdateOwner = async (data: OrderBatchUpdateOwnerReqVO) => {
  return await request.put<boolean>({ url: '/crm/order/batch-update-owner', data })
}

export const createOrderExportTask = async (data: OrderExportReqVO) => {
  return await request.post<number>({ url: '/crm/order/export-task', data })
}

export const getPayRecordPage = async (params: OrderPayRecordPageReqVO) => {
  return await request.get({ url: '/crm/order/pay-record/page', params })
}

export const getPayConfirmPage = async (params: OrderPayRecordPageReqVO) => {
  return await request.get({ url: '/crm/order/pay-record/confirm-page', params })
}

export const confirmPayRecord = async (data: OrderPayConfirmReqVO) => {
  return await request.put<boolean>({ url: '/crm/order/pay-record/confirm', data })
}

export const getRefundPage = async (params: OrderRefundPageReqVO) => {
  return await request.get({ url: '/crm/order/refund/page', params })
}

export const createRefund = async (data: OrderRefundCreateReqVO) => {
  return await request.post<number>({ url: '/crm/order/refund/create', data })
}

export const auditRefund = async (data: OrderRefundAuditReqVO) => {
  return await request.put<boolean>({ url: '/crm/order/refund/audit', data })
}
