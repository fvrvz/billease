package com.billease.service

import cats.effect.IO
import cats.implicits.*
import doobie.*
import doobie.implicits.*
import doobie.postgres.implicits.*
import com.billease.domain.*
import java.util.UUID
import java.time.Instant
import scala.math.BigDecimal.RoundingMode as RM

class BillingService(
    xa: Transactor[IO],
    tenantService: TenantService,
    couponService: LoyaltyCouponService,
    khataService: KhataService,
    notificationService: NotificationService
):

  def createInvoice(
      tenantId: UUID,
      cashierId: UUID,
      cashierName: String,
      req: CreateInvoiceRequest
  ): IO[Invoice] =
    for
      tenantOpt <- tenantService.getTenantById(tenantId)
      tenant = tenantOpt.getOrElse(throw new RuntimeException("Tenant not found"))

      // 1. Calculate raw item totals & taxes
      lineItemsCalculated = req.items.map { item =>
        val itemDiscAmount = (item.unitPrice * item.quantity * item.discountPercent / BigDecimal(100)).setScale(2, RM.HALF_UP)
        val tax = GstCalculator.calculateItemTax(
          priceUnit = item.unitPrice,
          quantity = item.quantity,
          discountAmount = itemDiscAmount,
          gstRate = item.gstRate,
          isPriceTaxInclusive = true,
          hasStoreGst = tenant.hasGst,
          isInterState = false
        )
        (item, itemDiscAmount, tax)
      }

      rawSubtotal = lineItemsCalculated.map(_._3.totalAmount).sum
      itemDiscTotal = lineItemsCalculated.map(_._2).sum

      // 2. Bill level discount
      billDiscAmount = if req.billDiscountPercent > BigDecimal(0) then
        (rawSubtotal * req.billDiscountPercent / BigDecimal(100)).setScale(2, RM.HALF_UP)
      else req.billDiscountAmount

      // 3. Coupon validation & discount
      couponResult <- req.couponCode match
        case Some(code) => couponService.validateCoupon(tenantId, code, rawSubtotal - billDiscAmount)
        case None => IO.pure(CouponValidationResult(false, BigDecimal(0), ""))

      couponDiscAmt = if couponResult.isValid then couponResult.discountAmount else BigDecimal(0)

      // 4. Loyalty points redemption
      loyaltyDiscAmt = (req.redeemLoyaltyPoints * tenant.loyaltyPointValueRs).setScale(2, RM.HALF_UP)

      // 5. Final totals & Round-off
      tentativeTotal = (rawSubtotal - billDiscAmount - couponDiscAmt - loyaltyDiscAmt).max(BigDecimal(0))
      roundedGrandTotal = tentativeTotal.setScale(0, RM.HALF_UP)
      roundOff = roundedGrandTotal - tentativeTotal

      // Tax breakdown totals
      taxableTotal = lineItemsCalculated.map(_._3.taxableAmount).sum
      cgstTotal = lineItemsCalculated.map(_._3.cgstAmount).sum
      sgstTotal = lineItemsCalculated.map(_._3.sgstAmount).sum
      igstTotal = lineItemsCalculated.map(_._3.igstAmount).sum

      invoiceId = UUID.randomUUID()
      invoiceNum = s"${tenant.invoicePrefix}-${System.currentTimeMillis() % 1000000}"
      invType = if tenant.hasGst then InvoiceType.TAX_INVOICE else InvoiceType.RETAIL_BILL

      change = if req.paymentMode == PaymentMode.CASH && req.cashTendered > roundedGrandTotal then
        req.cashTendered - roundedGrandTotal
      else BigDecimal(0)

      now = Instant.now()

      // 6. Persist Invoice
      _ <- sql"""
        INSERT INTO invoices (
          id, tenant_id, invoice_number, invoice_type, customer_id, customer_name,
          customer_phone, subtotal, item_discount_total, bill_discount_percent,
          bill_discount_amount, coupon_code, coupon_discount_amount,
          loyalty_points_redeemed, loyalty_discount_amount, taxable_amount,
          cgst_amount, sgst_amount, igst_amount, round_off, grand_total,
          payment_mode, cash_tendered, change_returned, cashier_id, cashier_name,
          notes, created_at
        ) VALUES (
          $invoiceId, $tenantId, $invoiceNum, ${invType.toString}, ${req.customerId},
          ${req.customerName}, ${req.customerPhone}, $rawSubtotal, $itemDiscTotal,
          ${req.billDiscountPercent}, $billDiscAmount, ${req.couponCode}, $couponDiscAmt,
          ${req.redeemLoyaltyPoints}, $loyaltyDiscAmt, $taxableTotal,
          $cgstTotal, $sgstTotal, $igstTotal, $roundOff, $roundedGrandTotal,
          ${req.paymentMode.toString}, ${req.cashTendered}, $change, $cashierId,
          $cashierName, ${req.notes}, $now
        )
      """.update.run.transact(xa)

      // 7. Persist Line Items & Deduct Stock
      savedItems <- lineItemsCalculated.traverse { case (item, discAmt, tax) =>
        val itemId = UUID.randomUUID()
        val insertItem = sql"""
          INSERT INTO invoice_items (
            id, invoice_id, tenant_id, product_id, batch_id, product_name,
            quantity, unit, unit_price, mrp, discount_percent, discount_amount,
            gst_rate, cgst_amount, sgst_amount, igst_amount, total_amount
          ) VALUES (
            $itemId, $invoiceId, $tenantId, ${item.productId}, ${item.batchId},
            ${item.productName}, ${item.quantity}, 'PCS', ${item.unitPrice},
            ${item.mrp}, ${item.discountPercent}, $discAmt, ${item.gstRate},
            ${tax.cgstAmount}, ${tax.sgstAmount}, ${tax.igstAmount}, ${tax.totalAmount}
          )
        """.update.run

        val deductStock = item.batchId match
          case Some(bId) =>
            sql"""
              UPDATE product_batches
              SET quantity = GREATEST(0, quantity - ${item.quantity})
              WHERE id = $bId AND tenant_id = $tenantId
            """.update.run
          case None =>
            sql"""
              UPDATE product_batches
              SET quantity = GREATEST(0, quantity - ${item.quantity})
              WHERE id = (
                SELECT id FROM product_batches
                WHERE product_id = ${item.productId} AND tenant_id = $tenantId AND quantity > 0
                ORDER BY expiry_date ASC NULLS LAST, created_at ASC
                LIMIT 1
              )
            """.update.run

        (insertItem *> deductStock).transact(xa).as(
          InvoiceItem(
            id = itemId,
            invoiceId = invoiceId,
            tenantId = tenantId,
            productId = item.productId,
            batchId = item.batchId,
            productName = item.productName,
            quantity = item.quantity,
            unit = "PCS",
            unitPrice = item.unitPrice,
            mrp = item.mrp,
            discountPercent = item.discountPercent,
            discountAmount = discAmt,
            gstRate = item.gstRate,
            cgstAmount = tax.cgstAmount,
            sgstAmount = tax.sgstAmount,
            igstAmount = tax.igstAmount,
            totalAmount = tax.totalAmount
          )
        )
      }

      // 8. Handle Udhaar / Customer Khata Credit
      _ <- (req.customerId, req.paymentMode) match
        case (Some(custId), PaymentMode.CREDIT_KHATA) =>
          val ledgerId = UUID.randomUUID()
          sql"""
            UPDATE customers SET current_due = current_due + $roundedGrandTotal
            WHERE id = $custId AND tenant_id = $tenantId
          """.update.run.transact(xa) *>
          sql"""
            INSERT INTO khata_ledger (
              id, tenant_id, customer_id, entry_type, amount, balance_after,
              invoice_id, payment_method, notes
            ) VALUES (
              $ledgerId, $tenantId, $custId, 'BILL_CREDIT', $roundedGrandTotal,
              (SELECT current_due FROM customers WHERE id = $custId),
              $invoiceId, 'CREDIT_KHATA', ${s"Bill #$invoiceNum"}
            )
          """.update.run.transact(xa).void
        case _ => IO.unit

      // 9. Update Customer Loyalty Points
      _ <- req.customerId match
        case Some(custId) =>
          val pointsEarned = ((roundedGrandTotal / BigDecimal(100)) * tenant.loyaltyPointsPer100).setScale(2, RM.HALF_UP)
          val netPointsChange = pointsEarned - req.redeemLoyaltyPoints
          sql"""
            UPDATE customers
            SET loyalty_points = GREATEST(0, loyalty_points + $netPointsChange)
            WHERE id = $custId AND tenant_id = $tenantId
          """.update.run.transact(xa).void
        case None => IO.unit

      // 10. Increment Coupon Usage
      _ <- req.couponCode match
        case Some(code) if couponResult.isValid => couponService.incrementCouponUsage(tenantId, code)
        case _ => IO.unit

      // 11. Check Low Stock Trigger (Asynchronously)
      _ <- req.items.traverse { item =>
        sql"""
          SELECT p.name, COALESCE(SUM(b.quantity), 0), p.min_stock_alert
          FROM products p
          LEFT JOIN product_batches b ON p.id = b.product_id
          WHERE p.id = ${item.productId} AND p.tenant_id = $tenantId
          GROUP BY p.id
        """.query[(String, BigDecimal, Int)].option.transact(xa).flatMap {
          case Some((name, stock, minStock)) if stock <= minStock =>
            notificationService.sendLowStockAlert(
              tenantId = tenantId,
              productId = item.productId,
              productName = name,
              currentStock = stock,
              minStock = minStock,
              recipientPhone = tenant.phone,
              recipientEmail = tenant.email
            ).start.void
          case _ => IO.unit
        }
      }

    yield Invoice(
      id = invoiceId,
      tenantId = tenantId,
      invoiceNumber = invoiceNum,
      invoiceType = invType,
      customerId = req.customerId,
      customerName = req.customerName,
      customerPhone = req.customerPhone,
      subtotal = rawSubtotal,
      itemDiscountTotal = itemDiscTotal,
      billDiscountPercent = req.billDiscountPercent,
      billDiscountAmount = billDiscAmount,
      couponCode = req.couponCode,
      couponDiscountAmount = couponDiscAmt,
      loyaltyPointsRedeemed = req.redeemLoyaltyPoints,
      loyaltyDiscountAmount = loyaltyDiscAmt,
      taxableAmount = taxableTotal,
      cgstAmount = cgstTotal,
      sgstAmount = sgstTotal,
      igstAmount = igstTotal,
      roundOff = roundOff,
      grandTotal = roundedGrandTotal,
      paymentMode = req.paymentMode,
      cashTendered = req.cashTendered,
      changeReturned = change,
      cashierId = Some(cashierId),
      cashierName = Some(cashierName),
      notes = req.notes,
      createdAt = now,
      items = savedItems
    )

  def listRecentInvoices(tenantId: UUID, limit: Int = 20): IO[List[Invoice]] =
    sql"""
      SELECT id, tenant_id, invoice_number, invoice_type, customer_id, customer_name,
             customer_phone, subtotal, item_discount_total, bill_discount_percent,
             bill_discount_amount, coupon_code, coupon_discount_amount,
             loyalty_points_redeemed, loyalty_discount_amount, taxable_amount,
             cgst_amount, sgst_amount, igst_amount, round_off, grand_total,
             payment_mode, cash_tendered, change_returned, cashier_id, cashier_name,
             notes, created_at
      FROM invoices
      WHERE tenant_id = $tenantId
      ORDER BY created_at DESC
      LIMIT $limit
    """.query[Invoice].to[List].transact(xa)

