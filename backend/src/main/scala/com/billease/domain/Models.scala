package com.billease.domain

import io.circe.Codec
import java.time.{LocalDate, Instant}
import java.util.UUID
import doobie.util.meta.Meta
import sttp.tapir.Schema
import scala.util.Try

private def enumCodec[T <: reflect.Enum](valueOf: String => T): Codec[T] =
  Codec.from(
    io.circe.Decoder.decodeString.emap(s => Try(valueOf(s)).toEither.left.map(_.getMessage)),
    io.circe.Encoder.encodeString.contramap(_.toString)
  )

enum Role:
  case SUPER_ADMIN, STORE_ADMIN, MANAGER, CASHIER

object Role:
  given Meta[Role] = Meta[String].imap(s => Try(Role.valueOf(s)).getOrElse(Role.CASHIER))(_.toString)
  given Schema[Role] = Schema.string
  given Codec[Role] = enumCodec(Role.valueOf)

enum InvoiceType:
  case TAX_INVOICE, RETAIL_BILL

object InvoiceType:
  given Meta[InvoiceType] = Meta[String].imap(s => Try(InvoiceType.valueOf(s)).getOrElse(InvoiceType.RETAIL_BILL))(_.toString)
  given Schema[InvoiceType] = Schema.string
  given Codec[InvoiceType] = enumCodec(InvoiceType.valueOf)

enum PaymentMode:
  case CASH, UPI, CARD, CREDIT_KHATA, SPLIT

object PaymentMode:
  given Meta[PaymentMode] = Meta[String].imap(s => Try(PaymentMode.valueOf(s)).getOrElse(PaymentMode.CASH))(_.toString)
  given Schema[PaymentMode] = Schema.string
  given Codec[PaymentMode] = enumCodec(PaymentMode.valueOf)

enum DiscountType:
  case PERCENTAGE, FLAT

object DiscountType:
  given Meta[DiscountType] = Meta[String].imap(s => Try(DiscountType.valueOf(s)).getOrElse(DiscountType.PERCENTAGE))(_.toString)
  given Schema[DiscountType] = Schema.string
  given Codec[DiscountType] = enumCodec(DiscountType.valueOf)

enum KhataEntryType:
  case BILL_CREDIT, PAYMENT_RECEIVED, ADJUSTMENT

object KhataEntryType:
  given Meta[KhataEntryType] = Meta[String].imap(s => Try(KhataEntryType.valueOf(s)).getOrElse(KhataEntryType.ADJUSTMENT))(_.toString)
  given Schema[KhataEntryType] = Schema.string
  given Codec[KhataEntryType] = enumCodec(KhataEntryType.valueOf)

enum AlertType:
  case LOW_STOCK, OUT_OF_STOCK, NEAR_EXPIRY

object AlertType:
  given Meta[AlertType] = Meta[String].imap(s => Try(AlertType.valueOf(s)).getOrElse(AlertType.LOW_STOCK))(_.toString)
  given Schema[AlertType] = Schema.string
  given Codec[AlertType] = enumCodec(AlertType.valueOf)

enum AlertChannel:
  case WHATSAPP, EMAIL

object AlertChannel:
  given Meta[AlertChannel] = Meta[String].imap(s => Try(AlertChannel.valueOf(s)).getOrElse(AlertChannel.EMAIL))(_.toString)
  given Schema[AlertChannel] = Schema.string
  given Codec[AlertChannel] = enumCodec(AlertChannel.valueOf)

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
    batchId: Option[UUID] = None,
    productName: String,
    quantity: BigDecimal,
    unitPrice: BigDecimal,
    mrp: BigDecimal,
    discountPercent: Option[BigDecimal] = None,
    gstRate: Option[BigDecimal] = None
) derives Codec.AsObject

case class CreateInvoiceRequest(
    customerId: Option[UUID] = None,
    customerName: Option[String] = None,
    customerPhone: Option[String] = None,
    items: List[InvoiceItemInput],
    billDiscountPercent: Option[BigDecimal] = None,
    billDiscountAmount: Option[BigDecimal] = None,
    couponCode: Option[String] = None,
    redeemLoyaltyPoints: Option[BigDecimal] = None,
    paymentMode: Option[PaymentMode] = None,
    cashTendered: Option[BigDecimal] = None,
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

case class InvoiceRow(
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
    createdAt: Instant
) derives Codec.AsObject:
  def toInvoice(items: List[InvoiceItem] = Nil): Invoice =
    Invoice(
      id = id,
      tenantId = tenantId,
      invoiceNumber = invoiceNumber,
      invoiceType = invoiceType,
      customerId = customerId,
      customerName = customerName,
      customerPhone = customerPhone,
      subtotal = subtotal,
      itemDiscountTotal = itemDiscountTotal,
      billDiscountPercent = billDiscountPercent,
      billDiscountAmount = billDiscountAmount,
      couponCode = couponCode,
      couponDiscountAmount = couponDiscountAmount,
      loyaltyPointsRedeemed = loyaltyPointsRedeemed,
      loyaltyDiscountAmount = loyaltyDiscountAmount,
      taxableAmount = taxableAmount,
      cgstAmount = cgstAmount,
      sgstAmount = sgstAmount,
      igstAmount = igstAmount,
      roundOff = roundOff,
      grandTotal = grandTotal,
      paymentMode = paymentMode,
      cashTendered = cashTendered,
      changeReturned = changeReturned,
      cashierId = cashierId,
      cashierName = cashierName,
      notes = notes,
      createdAt = createdAt,
      items = items
    )

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

