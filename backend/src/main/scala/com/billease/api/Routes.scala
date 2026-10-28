package com.billease.api

import cats.effect.IO
import cats.implicits.*
import org.http4s.HttpRoutes
import sttp.tapir.server.http4s.Http4sServerInterpreter
import sttp.tapir.swagger.bundle.SwaggerInterpreter
import com.billease.auth.{OidcValidator, AuthenticatedUser}
import com.billease.domain.*
import com.billease.service.*
import java.util.UUID

class Routes(
    oidcValidator: OidcValidator,
    tenantService: TenantService,
    productService: ProductService,
    billingService: BillingService,
    khataService: KhataService,
    couponService: LoyaltyCouponService
):

  private def requireAuth(token: String): IO[Either[String, AuthenticatedUser]] =
    oidcValidator.validateToken(token)

  private def requireTenantAccess(user: AuthenticatedUser, tenantId: UUID): Either[String, Unit] =
    if user.role == Role.SUPER_ADMIN || user.tenantId.contains(tenantId) then Right(())
    else Left("Access denied to this store")

  val loginRoute = Endpoints.loginEndpoint.serverLogic { req =>
    tenantService.authenticateUser(req.username, req.password).map {
      case Some((user, tenantOpt)) =>
        val token = user.role match
          case Role.SUPER_ADMIN => "superadmin-token"
          case Role.STORE_ADMIN => "owner-token"
          case _ => "cashier-token"
        Right(AuthTokenResponse(token, user, tenantOpt))
      case None =>
        Left("Invalid username or password")
    }
  }

  val listTenantsRoute = Endpoints.listTenantsEndpoint.serverLogic { token =>
    requireAuth(token).flatMap {
      case Right(user) if user.role == Role.SUPER_ADMIN =>
        tenantService.listAllTenants().map(Right(_))
      case Right(_) =>
        IO.pure(Left("Super Admin permissions required"))
      case Left(err) =>
        IO.pure(Left(err))
    }
  }

  val getTenantRoute = Endpoints.getTenantEndpoint.serverLogic { tenantId =>
    tenantService.getTenantById(tenantId).map(Right(_))
  }

  val updateTenantRoute = Endpoints.updateTenantEndpoint.serverLogic { (tenantId, token, req) =>
    requireAuth(token).flatMap {
      case Right(user) if user.role == Role.SUPER_ADMIN || (user.tenantId.contains(tenantId) && (user.role == Role.STORE_ADMIN)) =>
        tenantService.updateTenant(tenantId, req).map(Right(_))
      case Right(_) =>
        IO.pure(Left("Insufficient permissions to update store settings"))
      case Left(err) =>
        IO.pure(Left(err))
    }
  }

  val listProductsRoute = Endpoints.listProductsEndpoint.serverLogic { (tenantId, queryOpt) =>
    queryOpt match
      case Some(q) if q.trim.nonEmpty =>
        productService.searchProducts(tenantId, q.trim).map(Right(_))
      case _ =>
        productService.listProducts(tenantId).map(Right(_))
  }

  val createProductRoute = Endpoints.createProductEndpoint.serverLogic { (tenantId, token, req) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) if user.role != Role.CASHIER =>
            productService.createProduct(tenantId, req).map(Right(_))
          case Right(_) =>
            IO.pure(Left("Cashiers cannot create products"))
          case Left(err) =>
            IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val lowStockRoute = Endpoints.lowStockEndpoint.serverLogic { (tenantId, token) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) => productService.getLowStockProducts(tenantId).map(Right(_))
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val createInvoiceRoute = Endpoints.createInvoiceEndpoint.serverLogic { (tenantId, token, req) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) =>
            billingService.createInvoice(tenantId, user.userId, user.username, req).map(Right(_))
              .handleError(e => Left(s"Billing failed: ${e.getMessage}"))
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val listInvoicesRoute = Endpoints.listInvoicesEndpoint.serverLogic { (tenantId, token) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) => billingService.listRecentInvoices(tenantId, 100).map(Right(_))
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val getSalesOverviewRoute = Endpoints.getSalesOverviewEndpoint.serverLogic { (tenantId, token) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) => billingService.getSalesOverview(tenantId).map(Right(_))
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val getSoldItemsRoute = Endpoints.getSoldItemsEndpoint.serverLogic { (tenantId, token) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) => billingService.getSoldItems(tenantId).map(Right(_))
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val sendInvoiceWhatsappRoute = Endpoints.sendInvoiceWhatsappEndpoint.serverLogic { (tenantId, invoiceId, token, req) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) =>
            billingService.sendInvoiceWhatsapp(tenantId, invoiceId, req.phone, req.customMessage).map(Right(_))
              .handleError(e => Left(s"Failed to process WhatsApp request: ${e.getMessage}"))
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val getInvoicePdfRoute = Endpoints.getInvoicePdfEndpoint.serverLogic { (tenantId, invoiceId, token) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) =>
            billingService.getInvoicePdf(tenantId, invoiceId).map {
              case Right((invNum, bytes)) =>
                Right(("application/pdf", Some(s"""inline; filename="Bill_${invNum}.pdf""""), bytes))
              case Left(err) => Left(err)
            }
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val getPublicInvoicePdfRoute = Endpoints.getPublicInvoicePdfEndpoint.serverLogic { invoiceId =>
    billingService.getPublicInvoicePdf(invoiceId).map {
      case Right((invNum, bytes)) =>
        Right(("application/pdf", Some(s"""inline; filename="Bill_${invNum}.pdf""""), bytes))
      case Left(err) => Left(err)
    }
  }

  val updateInvoicePaymentStatusRoute = Endpoints.updateInvoicePaymentStatusEndpoint.serverLogic { (tenantId, invoiceId, token, req) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) =>
            billingService.updatePaymentStatus(tenantId, invoiceId, req).map(Right(_))
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val listCustomersRoute = Endpoints.listCustomersEndpoint.serverLogic { (tenantId, token) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) => khataService.listCustomers(tenantId).map(Right(_))
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val createCustomerRoute = Endpoints.createCustomerEndpoint.serverLogic { (tenantId, token, req) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) => khataService.createCustomer(tenantId, req).map(Right(_))
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val recordKhataPaymentRoute = Endpoints.recordKhataPaymentEndpoint.serverLogic { (tenantId, token, req) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) => khataService.recordPayment(tenantId, req).map(Right(_))
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val getCustomerLedgerRoute = Endpoints.getCustomerLedgerEndpoint.serverLogic { (tenantId, customerId, token) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) => khataService.getCustomerLedger(tenantId, customerId).map(Right(_))
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val listCouponsRoute = Endpoints.listCouponsEndpoint.serverLogic { (tenantId, token) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) => couponService.listCoupons(tenantId).map(Right(_))
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val createCouponRoute = Endpoints.createCouponEndpoint.serverLogic { (tenantId, token, req) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) if user.role != Role.CASHIER =>
            couponService.createCoupon(tenantId, req).map(Right(_))
          case Right(_) => IO.pure(Left("Cashiers cannot create coupons"))
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val validateCouponRoute = Endpoints.validateCouponEndpoint.serverLogic { (tenantId, req) =>
    couponService.validateCoupon(tenantId, req.code, req.cartTotal).map(Right(_))
  }

  val toggleCouponRoute = Endpoints.toggleCouponEndpoint.serverLogic { (tenantId, couponId, token) =>
    requireAuth(token).flatMap {
      case Right(user) =>
        requireTenantAccess(user, tenantId) match
          case Right(_) if user.role != Role.CASHIER =>
            couponService.toggleCoupon(tenantId, couponId).map(Right(_))
          case Right(_) => IO.pure(Left("Cashiers cannot toggle coupons"))
          case Left(err) => IO.pure(Left(err))
      case Left(err) => IO.pure(Left(err))
    }
  }

  val allEndpoints = List(
    Endpoints.loginEndpoint,
    Endpoints.listTenantsEndpoint,
    Endpoints.getTenantEndpoint,
    Endpoints.updateTenantEndpoint,
    Endpoints.listProductsEndpoint,
    Endpoints.createProductEndpoint,
    Endpoints.lowStockEndpoint,
    Endpoints.createInvoiceEndpoint,
    Endpoints.listInvoicesEndpoint,
    Endpoints.getSalesOverviewEndpoint,
    Endpoints.getSoldItemsEndpoint,
    Endpoints.sendInvoiceWhatsappEndpoint,
    Endpoints.getInvoicePdfEndpoint,
    Endpoints.getPublicInvoicePdfEndpoint,
    Endpoints.updateInvoicePaymentStatusEndpoint,
    Endpoints.listCustomersEndpoint,
    Endpoints.createCustomerEndpoint,
    Endpoints.recordKhataPaymentEndpoint,
    Endpoints.getCustomerLedgerEndpoint,
    Endpoints.listCouponsEndpoint,
    Endpoints.createCouponEndpoint,
    Endpoints.validateCouponEndpoint,
    Endpoints.toggleCouponEndpoint
  )

  val swaggerEndpoints = SwaggerInterpreter().fromEndpoints[IO](allEndpoints, "Billease API", "1.0.0")

  val allServerEndpoints = List(
    loginRoute,
    listTenantsRoute,
    getTenantRoute,
    updateTenantRoute,
    listProductsRoute,
    createProductRoute,
    lowStockRoute,
    createInvoiceRoute,
    listInvoicesRoute,
    getSalesOverviewRoute,
    getSoldItemsRoute,
    sendInvoiceWhatsappRoute,
    getInvoicePdfRoute,
    getPublicInvoicePdfRoute,
    updateInvoicePaymentStatusRoute,
    listCustomersRoute,
    createCustomerRoute,
    recordKhataPaymentRoute,
    getCustomerLedgerRoute,
    listCouponsRoute,
    createCouponRoute,
    validateCouponRoute,
    toggleCouponRoute
  ) ++ swaggerEndpoints

  val httpRoutes: HttpRoutes[IO] = Http4sServerInterpreter[IO]().toRoutes(allServerEndpoints)

