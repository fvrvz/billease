package com.billease.api

import sttp.tapir.*
import sttp.tapir.json.circe.*
import sttp.tapir.generic.auto.*
import com.billease.domain.*
import java.util.UUID

object Endpoints:

  val baseEndpoint = endpoint.in("api")

  // Auth & Login
  val loginEndpoint = baseEndpoint.post
    .in("auth" / "login")
    .in(jsonBody[LoginRequest])
    .out(jsonBody[AuthTokenResponse])
    .errorOut(stringBody)

  // Tenants (Admin)
  val listTenantsEndpoint = baseEndpoint.get
    .in("admin" / "tenants")
    .in(auth.bearer[String]())
    .out(jsonBody[List[Tenant]])
    .errorOut(stringBody)

  val updateTenantEndpoint = baseEndpoint.put
    .in("tenants" / path[UUID]("tenantId"))
    .in(auth.bearer[String]())
    .in(jsonBody[TenantUpdate])
    .out(jsonBody[Option[Tenant]])
    .errorOut(stringBody)

  val getTenantEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId"))
    .out(jsonBody[Option[Tenant]])
    .errorOut(stringBody)

  // Products
  val listProductsEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "products")
    .in(query[Option[String]]("q"))
    .out(jsonBody[List[Product]])
    .errorOut(stringBody)

  val createProductEndpoint = baseEndpoint.post
    .in("tenants" / path[UUID]("tenantId") / "products")
    .in(auth.bearer[String]())
    .in(jsonBody[ProductCreate])
    .out(jsonBody[Product])
    .errorOut(stringBody)

  val lowStockEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "products" / "low-stock")
    .in(auth.bearer[String]())
    .out(jsonBody[List[Product]])
    .errorOut(stringBody)

  // Invoices & Billing
  val createInvoiceEndpoint = baseEndpoint.post
    .in("tenants" / path[UUID]("tenantId") / "invoices")
    .in(auth.bearer[String]())
    .in(jsonBody[CreateInvoiceRequest])
    .out(jsonBody[Invoice])
    .errorOut(stringBody)

  val listInvoicesEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "invoices")
    .in(auth.bearer[String]())
    .out(jsonBody[List[Invoice]])
    .errorOut(stringBody)

  // Khata & Customers
  val listCustomersEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "customers")
    .in(auth.bearer[String]())
    .out(jsonBody[List[Customer]])
    .errorOut(stringBody)

  val createCustomerEndpoint = baseEndpoint.post
    .in("tenants" / path[UUID]("tenantId") / "customers")
    .in(auth.bearer[String]())
    .in(jsonBody[CustomerCreate])
    .out(jsonBody[Customer])
    .errorOut(stringBody)

  val recordKhataPaymentEndpoint = baseEndpoint.post
    .in("tenants" / path[UUID]("tenantId") / "customers" / "payment")
    .in(auth.bearer[String]())
    .in(jsonBody[KhataPaymentRequest])
    .out(jsonBody[Option[Customer]])
    .errorOut(stringBody)

  val getCustomerLedgerEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "customers" / path[UUID]("customerId") / "ledger")
    .in(auth.bearer[String]())
    .out(jsonBody[List[KhataEntry]])
    .errorOut(stringBody)

  // Coupons & Loyalty
  val listCouponsEndpoint = baseEndpoint.get
    .in("tenants" / path[UUID]("tenantId") / "coupons")
    .in(auth.bearer[String]())
    .out(jsonBody[List[Coupon]])
    .errorOut(stringBody)

  val createCouponEndpoint = baseEndpoint.post
    .in("tenants" / path[UUID]("tenantId") / "coupons")
    .in(auth.bearer[String]())
    .in(jsonBody[CouponCreate])
    .out(jsonBody[Coupon])
    .errorOut(stringBody)

  val validateCouponEndpoint = baseEndpoint.post
    .in("tenants" / path[UUID]("tenantId") / "coupons" / "validate")
    .in(jsonBody[CouponValidateRequest])
    .out(jsonBody[CouponValidationResult])
    .errorOut(stringBody)

