package com.billease.domain

import io.circe.Codec
import java.time.{LocalDate, Instant}
import java.util.UUID

enum Role derives Codec.AsObject:
  case SUPER_ADMIN, STORE_ADMIN, MANAGER, CASHIER

enum InvoiceType derives Codec.AsObject:
  case TAX_INVOICE, RETAIL_BILL

enum PaymentMode derives Codec.AsObject:
  case CASH, UPI, CARD, CREDIT_KHATA, SPLIT

enum DiscountType derives Codec.AsObject:
  case PERCENTAGE, FLAT

enum KhataEntryType derives Codec.AsObject:
  case BILL_CREDIT, PAYMENT_RECEIVED, ADJUSTMENT

enum AlertType derives Codec.AsObject:
  case LOW_STOCK, OUT_OF_STOCK, NEAR_EXPIRY

enum AlertChannel derives Codec.AsObject:
  case WHATSAPP, EMAIL

// Tenant (Store)
case class Tenant(
    id: UUID,
    slug: String,
    name: String,
    legalName: Option[String],
    phone: String,
    email: Option[String],
    address: Option[String],
    city: Option[String],
    stateCode: String,
    hasGst: Boolean,
    gstin: Option[String],
    isCompositionScheme: Boolean,
    logoUrl: Option[String],
    bannerUrl: Option[String],
    invoicePrefix: String,
    invoiceFooter: String,
    thermalWidthMm: Int,
    upiVpa: Option[String],
    upiPayeeName: Option[String],
    loyaltyPointsPer100: BigDecimal,
    loyaltyPointValueRs: BigDecimal,
    isActive: Boolean
) derives Codec.AsObject

case class TenantUpdate(
    name: Option[String] = None,
    legalName: Option[String] = None,
    phone: Option[String] = None,
    email: Option[String] = None,
    address: Option[String] = None,
    city: Option[String] = None,
    stateCode: Option[String] = None,
    hasGst: Option[Boolean] = None,
    gstin: Option[String] = None,
    isCompositionScheme: Option[Boolean] = None,
    logoUrl: Option[String] = None,
    bannerUrl: Option[String] = None,
    invoicePrefix: Option[String] = None,
    invoiceFooter: Option[String] = None,
    thermalWidthMm: Option[Int] = None,
    upiVpa: Option[String] = None,
    upiPayeeName: Option[String] = None,
    loyaltyPointsPer100: Option[BigDecimal] = None,
    loyaltyPointValueRs: Option[BigDecimal] = None
) derives Codec.AsObject

// User
case class User(
    id: UUID,
    tenantId: Option[UUID],
    username: String,
    fullName: String,
    email: Option[String],
    phone: Option[String],
    role: Role,
    isActive: Boolean
) derives Codec.AsObject

case class UserCreate(
    tenantId: Option[UUID],
    username: String,
    password: String,
    fullName: String,
    email: Option[String],
    phone: Option[String],
    role: Role
) derives Codec.AsObject

case class AuthTokenResponse(
    token: String,
    user: User,
    tenant: Option[Tenant]
) derives Codec.AsObject

case class LoginRequest(
    username: String,
    password: String
) derives Codec.AsObject

// Category
case class Category(
    id: UUID,
    tenantId: UUID,
    name: String
) derives Codec.AsObject

case class CategoryCreate(
    name: String
) derives Codec.AsObject

// Product & Batches
case class Product(
    id: UUID,
    tenantId: UUID,
    categoryId: Option[UUID],
    name: String,
    barcode: Option[String],
    sku: Option[String],
    unit: String,
    hsnCode: String,
    gstRate: BigDecimal,
    isPriceTaxInclusive: Boolean,
    minStockAlert: Int,
    isActive: Boolean,
    currentStock: BigDecimal = BigDecimal(0),
    mrp: BigDecimal = BigDecimal(0),
    sellingPrice: BigDecimal = BigDecimal(0)
) derives Codec.AsObject

case class ProductCreate(
    categoryId: Option[UUID],
    name: String,
    barcode: Option[String],
    sku: Option[String],
    unit: String = "PCS",
    hsnCode: Option[String] = None,
    gstRate: BigDecimal = BigDecimal(0),
    isPriceTaxInclusive: Boolean = true,
    minStockAlert: Int = 5,
    initialQuantity: BigDecimal = BigDecimal(0),
    mrp: BigDecimal,
    costPrice: BigDecimal = BigDecimal(0),
    sellingPrice: BigDecimal,
    batchNo: Option[String] = None,
    expiryDate: Option[String] = None
) derives Codec.AsObject

case class ProductBatch(
    id: UUID,
    tenantId: UUID,
    productId: UUID,
    batchNo: String,
    mfgDate: Option[LocalDate],
    expiryDate: Option[LocalDate],
    mrp: BigDecimal,
    costPrice: BigDecimal,
    sellingPrice: BigDecimal,
    quantity: BigDecimal
) derives Codec.AsObject

// Customer & Khata
case class Customer(
    id: UUID,
    tenantId: UUID,
    name: String,
    phone: String,
    gstin: Option[String],
    address: Option[String],
    creditLimit: BigDecimal,
    currentDue: BigDecimal,
    loyaltyPoints: BigDecimal
) derives Codec.AsObject

case class CustomerCreate(
    name: String,
    phone: String,
    gstin: Option[String] = None,
    address: Option[String] = None,
    creditLimit: BigDecimal = BigDecimal(5000)
) derives Codec.AsObject

case class KhataEntry(
    id: UUID,
    tenantId: UUID,
    customerId: UUID,
    entryType: KhataEntryType,
    amount: BigDecimal,
    balanceAfter: BigDecimal,
    invoiceId: Option[UUID],
    paymentMethod: Option[String],
    notes: Option[String],
    createdAt: Instant
) derives Codec.AsObject

case class KhataPaymentRequest(
    customerId: UUID,
    amount: BigDecimal,
    paymentMethod: String = "CASH",
    notes: Option[String] = None
) derives Codec.AsObject

// Coupons
case class Coupon(
    id: UUID,
    tenantId: UUID,
    code: String,
    discountType: DiscountType,
    discountValue: BigDecimal,
    minOrderAmount: BigDecimal,
    maxDiscountCap: Option[BigDecimal],
    validUntil: Option[Instant],
    usageCount: Int,
    maxUsage: Int,
    isActive: Boolean
) derives Codec.AsObject

case class CouponCreate(
    code: String,
    discountType: DiscountType,
    discountValue: BigDecimal,
    minOrderAmount: BigDecimal = BigDecimal(0),
    maxDiscountCap: Option[BigDecimal] = None,
    validUntil: Option[Instant] = None,
    maxUsage: Int = 1000
) derives Codec.AsObject

case class CouponValidateRequest(
    code: String,
    cartTotal: BigDecimal
) derives Codec.AsObject

case class CouponValidationResult(
    isValid: Boolean,
    discountAmount: BigDecimal,
    message: String
) derives Codec.AsObject

// Billing & Invoices
case class InvoiceItemInput(
    productId: UUID,
    batchId: Option[UUID],
    productName: String,
    quantity: BigDecimal,
    unitPrice: BigDecimal,
    mrp: BigDecimal,
    discountPercent: BigDecimal = BigDecimal(0),
    gstRate: BigDecimal = BigDecimal(0)
) derives Codec.AsObject

case class CreateInvoiceRequest(
    customerId: Option[UUID],
    customerName: Option[String],
    customerPhone: Option[String],
    items: List[InvoiceItemInput],
    billDiscountPercent: BigDecimal = BigDecimal(0),
    billDiscountAmount: BigDecimal = BigDecimal(0),
    couponCode: Option[String] = None,
    redeemLoyaltyPoints: BigDecimal = BigDecimal(0),
    paymentMode: PaymentMode = PaymentMode.CASH,
    cashTendered: BigDecimal = BigDecimal(0),
    notes: Option[String] = None
) derives Codec.AsObject

case class InvoiceItem(
    id: UUID,
    invoiceId: UUID,
    tenantId: UUID,
    productId: UUID,
    batchId: Option[UUID],
    productName: String,
    quantity: BigDecimal,
    unit: String,
    unitPrice: BigDecimal,
    mrp: BigDecimal,
    discountPercent: BigDecimal,
    discountAmount: BigDecimal,
    gstRate: BigDecimal,
    cgstAmount: BigDecimal,
    sgstAmount: BigDecimal,
    igstAmount: BigDecimal,
    totalAmount: BigDecimal
) derives Codec.AsObject

case class Invoice(
    id: UUID,
    tenantId: UUID,
    invoiceNumber: String,
    invoiceType: InvoiceType,
    customerId: Option[UUID],
    customerName: Option[String],
    customerPhone: Option[String],
    subtotal: BigDecimal,
    itemDiscountTotal: BigDecimal,
    billDiscountPercent: BigDecimal,
    billDiscountAmount: BigDecimal,
    couponCode: Option[String],
    couponDiscountAmount: BigDecimal,
    loyaltyPointsRedeemed: BigDecimal,
    loyaltyDiscountAmount: BigDecimal,
    taxableAmount: BigDecimal,
    cgstAmount: BigDecimal,
    sgstAmount: BigDecimal,
    igstAmount: BigDecimal,
    roundOff: BigDecimal,
    grandTotal: BigDecimal,
    paymentMode: PaymentMode,
    cashTendered: BigDecimal,
    changeReturned: BigDecimal,
    cashierId: Option[UUID],
    cashierName: Option[String],
    notes: Option[String],
    createdAt: Instant,
    items: List[InvoiceItem] = Nil
) derives Codec.AsObject

// Stock Alerts
case class StockAlert(
    id: UUID,
    tenantId: UUID,
    productId: Option[UUID],
    productName: String,
    currentStock: BigDecimal,
    minStockAlert: Int,
    alertType: AlertType,
    message: String,
    channel: AlertChannel,
    recipient: String,
    status: String,
    createdAt: Instant
) derives Codec.AsObject
