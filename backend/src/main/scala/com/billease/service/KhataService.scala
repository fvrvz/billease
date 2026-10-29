package com.billease.service

import cats.effect.IO
import cats.syntax.all.*
import doobie.*
import doobie.implicits.*
import doobie.postgres.implicits.*
import com.billease.domain.*
import java.util.UUID
import java.time.Instant

class KhataService(xa: Transactor[IO]):

  private def combineWhere(filters: List[Option[Fragment]]): Fragment =
    filters.flatten match
      case Nil => fr""
      case head :: tail => fr"WHERE " ++ tail.foldLeft(head)((acc, f) => acc ++ fr" AND " ++ f)

  def listCustomersPaged(
      tenantId: UUID,
      qOpt: Option[String] = None,
      withDueOnlyOpt: Option[Boolean] = None,
      page: Int = 1,
      limit: Int = 50
  ): IO[PagedCustomers] =
    val safePage = page.max(1)
    val safeLimit = limit.max(1).min(500)
    val offset = (safePage - 1) * safeLimit

    val filterFragments = List(
      Some(fr"tenant_id = $tenantId"),
      qOpt.filter(_.trim.nonEmpty).map { q =>
        val wildcard = s"%${q.trim}%"
        fr"(name ILIKE $wildcard OR phone ILIKE $wildcard)"
      },
      withDueOnlyOpt.filter(identity).map(_ => fr"current_due > 0")
    )
    val whereClause = combineWhere(filterFragments)

    val countQuery = (fr"SELECT COUNT(*) FROM customers" ++ whereClause).query[Long].unique
    val dataQuery = (fr"""
      SELECT id, tenant_id, name, phone, gstin, address, credit_limit, current_due, loyalty_points
      FROM customers
    """ ++ whereClause ++ fr"ORDER BY current_due DESC, name ASC LIMIT $safeLimit OFFSET $offset").query[Customer].to[List]

    for
      total <- countQuery.transact(xa)
      items <- dataQuery.transact(xa)
      totalPages = if total == 0 then 1 else Math.ceil(total.toDouble / safeLimit).toInt
    yield PagedCustomers(items, total, safePage, safeLimit, totalPages)

  def listCustomers(tenantId: UUID): IO[List[Customer]] =
    sql"""
      SELECT id, tenant_id, name, phone, gstin, address, credit_limit, current_due, loyalty_points
      FROM customers
      WHERE tenant_id = $tenantId
      ORDER BY current_due DESC, name ASC
    """.query[Customer].to[List].transact(xa)

  def getCustomerById(tenantId: UUID, customerId: UUID): IO[Option[Customer]] =
    sql"""
      SELECT id, tenant_id, name, phone, gstin, address, credit_limit, current_due, loyalty_points
      FROM customers
      WHERE tenant_id = $tenantId AND id = $customerId
    """.query[Customer].option.transact(xa)

  def createCustomer(tenantId: UUID, req: CustomerCreate): IO[Customer] =
    val id = UUID.randomUUID()
    sql"""
      INSERT INTO customers (id, tenant_id, name, phone, gstin, address, credit_limit, current_due, loyalty_points)
      VALUES ($id, $tenantId, ${req.name}, ${req.phone}, ${req.gstin}, ${req.address}, ${req.creditLimit}, 0.00, 0.00)
    """.update.run.transact(xa).map { _ =>
      Customer(id, tenantId, req.name, req.phone, req.gstin, req.address, req.creditLimit, BigDecimal(0), BigDecimal(0))
    }

  def recordPayment(tenantId: UUID, req: KhataPaymentRequest): IO[Option[Customer]] =
    for
      custOpt <- getCustomerById(tenantId, req.customerId)
      result <- custOpt match
        case Some(c) =>
          val newDue = (c.currentDue - req.amount).max(BigDecimal(0))
          val ledgerId = UUID.randomUUID()
          val updateCust = sql"""
            UPDATE customers SET current_due = $newDue WHERE id = ${c.id} AND tenant_id = $tenantId
          """.update.run

          val insertLedger = sql"""
            INSERT INTO khata_ledger (
              id, tenant_id, customer_id, entry_type, amount, balance_after,
              payment_method, notes
            ) VALUES (
              $ledgerId, $tenantId, ${c.id}, 'PAYMENT_RECEIVED', ${req.amount}, $newDue,
              ${req.paymentMethod}, ${req.notes}
            )
          """.update.run

          (updateCust *> insertLedger).transact(xa).map(_ => Some(c.copy(currentDue = newDue)))
        case None => IO.pure(None)
    yield result

  def getCustomerLedger(tenantId: UUID, customerId: UUID): IO[List[KhataEntry]] =
    sql"""
      SELECT id, tenant_id, customer_id, entry_type, amount, balance_after, invoice_id, payment_method, notes, created_at
      FROM khata_ledger
      WHERE tenant_id = $tenantId AND customer_id = $customerId
      ORDER BY created_at DESC
    """.query[KhataEntry].to[List].transact(xa)

