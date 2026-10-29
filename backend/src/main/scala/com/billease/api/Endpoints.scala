package com.billease.api

import sttp.tapir.*
import sttp.tapir.json.circe.*
import sttp.tapir.generic.auto.*
import com.billease.domain.*
import java.util.UUID

object Endpoints:

  given invoiceListSchema: Schema[List[Invoice]] = Schema.schemaForIterable[Invoice, List]

  def baseEndpoint = endpoint.in("api")

  // Auth & Login
  def loginEndpoint = baseEndpoint.post
    .in("auth" / "login")
    .in(jsonBody[LoginRequest])
    .out(jsonBody[AuthTokenResponse])
    .errorOut(stringBody)

  // Tenants (Admin)
  def listTenantsEndpoint = baseEndpoint.get
    .in("admin" / "tenants")
    .in(auth.bearer[String]())
    .out(jsonBody[List[Tenant]])
    .errorOut(stringBody)

  def updateTenantEndpoint = baseEndpoint.put
    .in("tenants" / path[UUID]("tenantId"))
    .in(auth.bearer[String]())
    .in(jsonBody[TenantUpdate])
    .out(jsonBody[Option[Tenant]])
    .errorOut(stringBody)

  def getTenantEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId"))
    .out(jsonBody[Option[Tenant]])
    .errorOut(stringBody)

  // Products
  def listProductsEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "products")
    .in(query[Option[String]]("q"))
    .in(query[Option[UUID]]("categoryId"))
    .in(query[Option[Boolean]]("inStockOnly"))
    .in(query[Option[Int]]("page"))
    .in(query[Option[Int]]("limit"))
    .out(jsonBody[PagedProducts])
    .errorOut(stringBody)

  def createProductEndpoint = baseEndpoint.post
    .in("tenants" / path[UUID]("tenantId") / "products")
    .in(auth.bearer[String]())
    .in(jsonBody[ProductCreate])
    .out(jsonBody[Product])
    .errorOut(stringBody)

  def lowStockEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "products" / "low-stock")
    .in(auth.bearer[String]())
    .out(jsonBody[List[Product]])
    .errorOut(stringBody)

  // Invoices & Billing
  def createInvoiceEndpoint = baseEndpoint.post
    .in("tenants" / path[UUID]("tenantId") / "invoices")
    .in(auth.bearer[String]())
    .in(jsonBody[CreateInvoiceRequest])
    .out(jsonBody[Invoice])
    .errorOut(stringBody)

  def listInvoicesEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "invoices")
    .in(auth.bearer[String]())
    .in(query[Option[String]]("q"))
    .in(query[Option[String]]("paymentMode"))
    .in(query[Option[String]]("paymentStatus"))
    .in(query[Option[Int]]("page"))
    .in(query[Option[Int]]("limit"))
    .out(jsonBody[PagedInvoices])
    .errorOut(stringBody)

  def getSalesOverviewEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "sales" / "overview")
    .in(auth.bearer[String]())
    .out(jsonBody[SalesOverview])
    .errorOut(stringBody)

  def getSoldItemsEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "sales" / "sold-items")
    .in(auth.bearer[String]())
    .in(query[Option[String]]("q"))
    .in(query[Option[Int]]("page"))
    .in(query[Option[Int]]("limit"))
    .out(jsonBody[PagedSoldItems])
    .errorOut(stringBody)

  def sendInvoiceWhatsappEndpoint = baseEndpoint.post
    .in("tenants" / path[UUID]("tenantId") / "invoices" / path[UUID]("invoiceId") / "whatsapp")
    .in(auth.bearer[String]())
    .in(jsonBody[SendWhatsappBillRequest])
    .out(jsonBody[SendWhatsappBillResponse])
    .errorOut(stringBody)

  def getInvoicePdfEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "invoices" / path[UUID]("invoiceId") / "pdf")
    .in(auth.bearer[String]())
    .out(header[String]("Content-Type"))
    .out(header[Option[String]]("Content-Disposition"))
    .out(byteArrayBody)
    .errorOut(stringBody)

  def getPublicInvoicePdfEndpoint = baseEndpoint.get
    .in("public" / "invoices" / path[UUID]("invoiceId") / "pdf")
    .out(header[String]("Content-Type"))
    .out(header[Option[String]]("Content-Disposition"))
    .out(byteArrayBody)
    .errorOut(stringBody)

  def updateInvoicePaymentStatusEndpoint = baseEndpoint.patch
    .in("tenants" / path[UUID]("tenantId") / "invoices" / path[UUID]("invoiceId") / "payment-status")
    .in(auth.bearer[String]())
    .in(jsonBody[UpdatePaymentStatusRequest])
    .out(jsonBody[Option[Invoice]])
    .errorOut(stringBody)

  // Khata & Customers
  def listCustomersEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "customers")
    .in(auth.bearer[String]())
    .in(query[Option[String]]("q"))
    .in(query[Option[Boolean]]("withDueOnly"))
    .in(query[Option[Int]]("page"))
    .in(query[Option[Int]]("limit"))
    .out(jsonBody[PagedCustomers])
    .errorOut(stringBody)

  def createCustomerEndpoint = baseEndpoint.post
    .in("tenants" / path[UUID]("tenantId") / "customers")
    .in(auth.bearer[String]())
    .in(jsonBody[CustomerCreate])
    .out(jsonBody[Customer])
    .errorOut(stringBody)

  def recordKhataPaymentEndpoint = baseEndpoint.post
    .in("tenants" / path[UUID]("tenantId") / "customers" / "payment")
    .in(auth.bearer[String]())
    .in(jsonBody[KhataPaymentRequest])
    .out(jsonBody[Option[Customer]])
    .errorOut(stringBody)

  def getCustomerLedgerEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "customers" / path[UUID]("customerId") / "ledger")
    .in(auth.bearer[String]())
    .out(jsonBody[List[KhataEntry]])
    .errorOut(stringBody)

  // Coupons & Loyalty
  def listCouponsEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "coupons")
    .in(auth.bearer[String]())
    .out(jsonBody[List[Coupon]])
    .errorOut(stringBody)

  def createCouponEndpoint = baseEndpoint.post
    .in("tenants" / path[UUID]("tenantId") / "coupons")
    .in(auth.bearer[String]())
    .in(jsonBody[CouponCreate])
    .out(jsonBody[Coupon])
    .errorOut(stringBody)

  def validateCouponEndpoint = baseEndpoint.post
    .in("tenants" / path[UUID]("tenantId") / "coupons" / "validate")
    .in(jsonBody[CouponValidateRequest])
    .out(jsonBody[CouponValidationResult])
    .errorOut(stringBody)

  def toggleCouponEndpoint = baseEndpoint.patch
    .in("tenants" / path[UUID]("tenantId") / "coupons" / path[UUID]("couponId") / "toggle")
    .in(auth.bearer[String]())
    .out(jsonBody[Option[Coupon]])
    .errorOut(stringBody)
