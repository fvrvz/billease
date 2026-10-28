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
    notificationService: NotificationService,
    pdfService: PdfService = new PdfService()
):

  def createInvoice(
      tenantId: UUID,
      cashierId: UUID,
      cashierName: String,
      req: CreateInvoiceRequest
  ): IO[Invoice] =
    val billDiscPct = req.billDiscountPercent.getOrElse(BigDecimal(0))
    val billDiscAmtReq = req.billDiscountAmount.getOrElse(BigDecimal(0))
    val redeemPoints = req.redeemLoyaltyPoints.getOrElse(BigDecimal(0))
    val payMode = req.paymentMode.getOrElse(PaymentMode.CASH)
    val cashTendered = req.cashTendered.getOrElse(BigDecimal(0))

    for
      tenantOpt <- tenantService.getTenantById(tenantId)
      tenant = tenantOpt.getOrElse(throw new RuntimeException("Tenant not found"))

      // 1. Calculate raw item totals & taxes
      lineItemsCalculated = req.items.map { item =>
        val discPct = item.discountPercent.getOrElse(BigDecimal(0))
        val gst = item.gstRate.getOrElse(BigDecimal(0))
        val itemDiscAmount = (item.unitPrice * item.quantity * discPct / BigDecimal(100)).setScale(2, RM.HALF_UP)
        val tax = GstCalculator.calculateItemTax(
          priceUnit = item.unitPrice,
          quantity = item.quantity,
          discountAmount = itemDiscAmount,
          gstRate = gst,
          isPriceTaxInclusive = true,
          hasStoreGst = tenant.hasGst,
          isInterState = false
        )
        (item, discPct, gst, itemDiscAmount, tax)
      }

      rawSubtotal = lineItemsCalculated.map(_._5.totalAmount).sum
      itemDiscTotal = lineItemsCalculated.map(_._4).sum

      // 2. Bill level discount
      billDiscAmount = if billDiscPct > BigDecimal(0) then
        (rawSubtotal * billDiscPct / BigDecimal(100)).setScale(2, RM.HALF_UP)
      else billDiscAmtReq

      // 3. Coupon validation & discount
      couponResult <- req.couponCode match
        case Some(code) => couponService.validateCoupon(tenantId, code, rawSubtotal - billDiscAmount)
        case None => IO.pure(CouponValidationResult(false, BigDecimal(0), ""))

      couponDiscAmt = if couponResult.isValid then couponResult.discountAmount else BigDecimal(0)

      // 4. Loyalty points redemption
      loyaltyDiscAmt = (redeemPoints * tenant.loyaltyPointValueRs).setScale(2, RM.HALF_UP)

      // 5. Final totals & Round-off
      tentativeTotal = (rawSubtotal - billDiscAmount - couponDiscAmt - loyaltyDiscAmt).max(BigDecimal(0))
      roundedGrandTotal = tentativeTotal.setScale(0, RM.HALF_UP)
      roundOff = roundedGrandTotal - tentativeTotal

      // Tax breakdown totals
      taxableTotal = lineItemsCalculated.map(_._5.taxableAmount).sum
      cgstTotal = lineItemsCalculated.map(_._5.cgstAmount).sum
      sgstTotal = lineItemsCalculated.map(_._5.sgstAmount).sum
      igstTotal = lineItemsCalculated.map(_._5.igstAmount).sum

      invoiceId = UUID.randomUUID()
      invoiceNum = s"${tenant.invoicePrefix}-${System.currentTimeMillis() % 1000000}"
      invType = if tenant.hasGst then InvoiceType.TAX_INVOICE else InvoiceType.RETAIL_BILL

      change = if payMode == PaymentMode.CASH && cashTendered > roundedGrandTotal then
        cashTendered - roundedGrandTotal
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
          $billDiscPct, $billDiscAmount, ${req.couponCode}, $couponDiscAmt,
          $redeemPoints, $loyaltyDiscAmt, $taxableTotal,
          $cgstTotal, $sgstTotal, $igstTotal, $roundOff, $roundedGrandTotal,
          ${payMode.toString}, $cashTendered, $change, $cashierId,
          $cashierName, ${req.notes}, $now
        )
      """.update.run.transact(xa)

      // 7. Persist Line Items & Deduct Stock
      savedItems <- lineItemsCalculated.traverse { case (item, discPct, gst, discAmt, tax) =>
        val itemId = UUID.randomUUID()
        val insertItem = sql"""
          INSERT INTO invoice_items (
            id, invoice_id, tenant_id, product_id, batch_id, product_name,
            quantity, unit, unit_price, mrp, discount_percent, discount_amount,
            gst_rate, cgst_amount, sgst_amount, igst_amount, total_amount
          ) VALUES (
            $itemId, $invoiceId, $tenantId, ${item.productId}, ${item.batchId},
            ${item.productName}, ${item.quantity}, 'PCS', ${item.unitPrice},
            ${item.mrp}, $discPct, $discAmt, $gst,
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
            discountPercent = discPct,
            discountAmount = discAmt,
            gstRate = gst,
            cgstAmount = tax.cgstAmount,
            sgstAmount = tax.sgstAmount,
            igstAmount = tax.igstAmount,
            totalAmount = tax.totalAmount
          )
        )
      }

      // 8. Handle Udhaar / Customer Khata Credit
      _ <- (req.customerId, payMode) match
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
          val netPointsChange = pointsEarned - redeemPoints
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
      billDiscountPercent = billDiscPct,
      billDiscountAmount = billDiscAmount,
      couponCode = req.couponCode,
      couponDiscountAmount = couponDiscAmt,
      loyaltyPointsRedeemed = redeemPoints,
      loyaltyDiscountAmount = loyaltyDiscAmt,
      taxableAmount = taxableTotal,
      cgstAmount = cgstTotal,
      sgstAmount = sgstTotal,
      igstAmount = igstTotal,
      roundOff = roundOff,
      grandTotal = roundedGrandTotal,
      paymentMode = payMode,
      cashTendered = cashTendered,
      changeReturned = change,
      cashierId = Some(cashierId),
      cashierName = Some(cashierName),
      notes = req.notes,
      createdAt = now,
      items = savedItems
    )

  def listRecentInvoices(tenantId: UUID, limit: Int = 100): IO[List[Invoice]] =
    for
      invRows <- sql"""
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
      """.query[InvoiceRow].to[List].transact(xa)

      itemsList <- sql"""
        SELECT id, invoice_id, tenant_id, product_id, batch_id, product_name,
               quantity, unit, unit_price, mrp, discount_percent, discount_amount,
               gst_rate, cgst_amount, sgst_amount, igst_amount, total_amount
        FROM invoice_items
        WHERE tenant_id = $tenantId
      """.query[InvoiceItem].to[List].transact(xa)

      itemsByInvoice = itemsList.groupBy(_.invoiceId)
    yield invRows.map(r => r.toInvoice(itemsByInvoice.getOrElse(r.id, Nil)))

  def getSalesOverview(tenantId: UUID): IO[SalesOverview] =
    sql"""
      SELECT 
        COALESCE(SUM(grand_total), 0) as total_sales,
        COUNT(id) as total_invoices,
        COALESCE((SELECT SUM(quantity) FROM invoice_items WHERE tenant_id = $tenantId), 0) as total_items_sold,
        COALESCE(SUM(CASE WHEN payment_mode = 'CASH' THEN grand_total ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN payment_mode = 'UPI' THEN grand_total ELSE 0 END), 0) as upi_sales,
        COALESCE(SUM(CASE WHEN payment_mode = 'CREDIT_KHATA' THEN grand_total ELSE 0 END), 0) as khata_sales,
        COALESCE(SUM(CASE WHEN payment_mode = 'CARD' THEN grand_total ELSE 0 END), 0) as card_sales,
        COALESCE(SUM(CASE WHEN payment_mode = 'SPLIT' THEN grand_total ELSE 0 END), 0) as split_sales
      FROM invoices
      WHERE tenant_id = $tenantId
    """.query[SalesOverview].unique.transact(xa)

  def getSoldItems(tenantId: UUID): IO[List[SoldItemStats]] =
    sql"""
      SELECT 
        product_name,
        COALESCE(SUM(quantity), 0) as total_quantity,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(unit_price), 0) as avg_price,
        COUNT(DISTINCT invoice_id) as orders_count
      FROM invoice_items
      WHERE tenant_id = $tenantId
      GROUP BY product_name
      ORDER BY total_revenue DESC
    """.query[SoldItemStats].to[List].transact(xa)

  def getInvoiceById(tenantId: UUID, invoiceId: UUID): IO[Option[Invoice]] =
    for
      invOpt <- sql"""
        SELECT id, tenant_id, invoice_number, invoice_type, customer_id, customer_name,
               customer_phone, subtotal, item_discount_total, bill_discount_percent,
               bill_discount_amount, coupon_code, coupon_discount_amount,
               loyalty_points_redeemed, loyalty_discount_amount, taxable_amount,
               cgst_amount, sgst_amount, igst_amount, round_off, grand_total,
               payment_mode, cash_tendered, change_returned, cashier_id, cashier_name,
               notes, created_at
        FROM invoices
        WHERE tenant_id = $tenantId AND id = $invoiceId
      """.query[InvoiceRow].option.transact(xa)
      res <- invOpt match
        case None => IO.pure(None)
        case Some(row) =>
          sql"""
            SELECT id, invoice_id, tenant_id, product_id, batch_id, product_name,
                   quantity, unit, unit_price, mrp, discount_percent, discount_amount,
                   gst_rate, cgst_amount, sgst_amount, igst_amount, total_amount
            FROM invoice_items
            WHERE tenant_id = $tenantId AND invoice_id = $invoiceId
          """.query[InvoiceItem].to[List].transact(xa).map(items => Some(row.toInvoice(items)))
    yield res

  def getInvoicePdf(tenantId: UUID, invoiceId: UUID): IO[Either[String, (String, Array[Byte])]] =
    for
      tenantOpt <- tenantService.getTenantById(tenantId)
      invOpt <- getInvoiceById(tenantId, invoiceId)
    yield (tenantOpt, invOpt) match
      case (Some(tenant), Some(invoice)) =>
        val bytes = pdfService.generateInvoicePdf(tenant, invoice, invoice.items)
        Right((invoice.invoiceNumber, bytes))
      case (None, _) => Left("Tenant not found")
      case (_, None) => Left("Invoice not found")

  def getPublicInvoicePdf(invoiceId: UUID): IO[Either[String, (String, Array[Byte])]] =
    sql"""
      SELECT id, tenant_id, invoice_number, invoice_type, customer_id, customer_name,
             customer_phone, subtotal, item_discount_total, bill_discount_percent,
             bill_discount_amount, coupon_code, coupon_discount_amount,
             loyalty_points_redeemed, loyalty_discount_amount, taxable_amount,
             cgst_amount, sgst_amount, igst_amount, round_off, grand_total,
             payment_mode, cash_tendered, change_returned, cashier_id, cashier_name,
             notes, created_at
      FROM invoices
      WHERE id = $invoiceId
    """.query[InvoiceRow].option.transact(xa).flatMap {
      case None => IO.pure(Left("Invoice not found"))
      case Some(row) =>
        for
          tenantOpt <- tenantService.getTenantById(row.tenantId)
          items <- sql"""
            SELECT id, invoice_id, tenant_id, product_id, batch_id, product_name,
                   quantity, unit, unit_price, mrp, discount_percent, discount_amount,
                   gst_rate, cgst_amount, sgst_amount, igst_amount, total_amount
            FROM invoice_items
            WHERE invoice_id = $invoiceId
          """.query[InvoiceItem].to[List].transact(xa)
        yield tenantOpt match
          case None => Left("Tenant not found")
          case Some(tenant) =>
            val invoice = row.toInvoice(items)
            val bytes = pdfService.generateInvoicePdf(tenant, invoice, items)
            Right((invoice.invoiceNumber, bytes))
    }

  def sendInvoiceWhatsapp(
      tenantId: UUID,
      invoiceId: UUID,
      phone: String,
      customMsg: Option[String]
  ): IO[SendWhatsappBillResponse] =
    for
      tenantOpt <- tenantService.getTenantById(tenantId)
      tenant = tenantOpt.getOrElse(throw new RuntimeException("Tenant not found"))

      invOpt <- sql"""
        SELECT id, tenant_id, invoice_number, invoice_type, customer_id, customer_name,
               customer_phone, subtotal, item_discount_total, bill_discount_percent,
               bill_discount_amount, coupon_code, coupon_discount_amount,
               loyalty_points_redeemed, loyalty_discount_amount, taxable_amount,
               cgst_amount, sgst_amount, igst_amount, round_off, grand_total,
               payment_mode, cash_tendered, change_returned, cashier_id, cashier_name,
               notes, created_at
        FROM invoices
        WHERE tenant_id = $tenantId AND id = $invoiceId
      """.query[InvoiceRow].option.transact(xa)
      invRow = invOpt.getOrElse(throw new RuntimeException("Invoice not found"))

      items <- sql"""
        SELECT id, invoice_id, tenant_id, product_id, batch_id, product_name,
               quantity, unit, unit_price, mrp, discount_percent, discount_amount,
               gst_rate, cgst_amount, sgst_amount, igst_amount, total_amount
        FROM invoice_items
        WHERE tenant_id = $tenantId AND invoice_id = $invoiceId
      """.query[InvoiceItem].to[List].transact(xa)

      itemsText = items.map(it => s"• ${it.quantity}x ${it.productName} - ₹${it.totalAmount}").mkString("\n")
      pdfUrl = s"http://localhost:8081/api/public/invoices/${invRow.id}/pdf"

      billText = customMsg.getOrElse(
        s"""🧾 *${tenant.name}*
*Bill No:* ${invRow.invoiceNumber}
*Customer:* ${invRow.customerName.getOrElse("Customer")}
--------------------------
*Items:*
$itemsText
--------------------------
*Grand Total:* *₹${invRow.grandTotal}* (${invRow.paymentMode})
--------------------------
📄 *Download Official PDF Bill:*
$pdfUrl

Thank you for shopping with us! 🙏"""
      )

      res <- notificationService.sendInvoiceWhatsapp(tenantId, phone, billText)
    yield res

