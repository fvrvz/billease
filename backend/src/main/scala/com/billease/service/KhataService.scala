package com.billease.service

import cats.effect.IO
import doobie.*
import doobie.implicits.*
import doobie.postgres.implicits.*
import com.billease.domain.*
import java.util.UUID
import java.time.Instant

class KhataService(xa: Transactor[IO]):

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
