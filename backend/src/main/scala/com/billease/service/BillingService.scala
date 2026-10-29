package com.billease.service

import cats.effect.IO
import cats.implicits.*
import cats.data.NonEmptyList
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
      payStatus = req.paymentStatus.getOrElse(PaymentStatus.COMPLETED)

      // 6. Persist Invoice
      _ <- sql"""
        INSERT INTO invoices (
          id, tenant_id, invoice_number, invoice_type, customer_id, customer_name,
          customer_phone, subtotal, item_discount_total, bill_discount_percent,
          bill_discount_amount, coupon_code, coupon_discount_amount,
          loyalty_points_redeemed, loyalty_discount_amount, taxable_amount,
          cgst_amount, sgst_amount, igst_amount, round_off, grand_total,
          payment_mode, payment_status, cash_tendered, change_returned, cashier_id, cashier_name,
          notes, created_at
        ) VALUES (
          $invoiceId, $tenantId, $invoiceNum, ${invType.toString}, ${req.customerId},
          ${req.customerName}, ${req.customerPhone}, $rawSubtotal, $itemDiscTotal,
          $billDiscPct, $billDiscAmount, ${req.couponCode}, $couponDiscAmt,
          $redeemPoints, $loyaltyDiscAmt, $taxableTotal,
          $cgstTotal, $sgstTotal, $igstTotal, $roundOff, $roundedGrandTotal,
          ${payMode.toString}, ${payStatus.toString}, $cashTendered, $change, $cashierId,
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

      // 8. Handle Udhaar / Customer Khata Credit (Only if payment is COMPLETED / Confirmed)
      _ <- (req.customerId, payMode, payStatus) match
        case (Some(custId), PaymentMode.CREDIT_KHATA, PaymentStatus.COMPLETED) =>
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
      paymentStatus = payStatus,
      cashTendered = cashTendered,
      changeReturned = change,
      cashierId = Some(cashierId),
      cashierName = Some(cashierName),
      notes = req.notes,
      createdAt = now,
      items = savedItems
    )

  private def combineWhere(filters: List[Option[Fragment]]): Fragment =
    filters.flatten match
      case Nil => fr""
      case head :: tail => fr"WHERE " ++ tail.foldLeft(head)((acc, f) => acc ++ fr" AND " ++ f)

  def listInvoicesPaged(
      tenantId: UUID,
      qOpt: Option[String] = None,
      paymentModeOpt: Option[String] = None,
      paymentStatusOpt: Option[String] = None,
      page: Int = 1,
      limit: Int = 50
  ): IO[PagedInvoices] =
    val safePage = page.max(1)
    val safeLimit = limit.max(1).min(500)
    val offset = (safePage - 1) * safeLimit

    val filterFragments = List(
      Some(fr"tenant_id = $tenantId"),
      qOpt.filter(_.trim.nonEmpty).map { q =>
        val wildcard = s"%${q.trim}%"
        fr"(invoice_number ILIKE $wildcard OR customer_name ILIKE $wildcard OR customer_phone ILIKE $wildcard)"
      },
      paymentModeOpt.filter(m => m.trim.nonEmpty && m != "ALL").map(m => fr"payment_mode = $m"),
      paymentStatusOpt.filter(s => s.trim.nonEmpty && s != "ALL").map(s => fr"payment_status = $s")
    )
    val whereClause = combineWhere(filterFragments)

    val countQuery = (fr"SELECT COUNT(*) FROM invoices" ++ whereClause).query[Long].unique

    val rowsQuery = (fr"""
      SELECT id, tenant_id, invoice_number, invoice_type, customer_id, customer_name,
             customer_phone, subtotal, item_discount_total, bill_discount_percent,
             bill_discount_amount, coupon_code, coupon_discount_amount,
             loyalty_points_redeemed, loyalty_discount_amount, taxable_amount,
             cgst_amount, sgst_amount, igst_amount, round_off, grand_total,
             payment_mode, payment_status, cash_tendered, change_returned, cashier_id, cashier_name,
             notes, created_at
      FROM invoices
    """ ++ whereClause ++ fr"ORDER BY created_at DESC LIMIT $safeLimit OFFSET $offset").query[InvoiceRow].to[List]

    for
      total <- countQuery.transact(xa)
      invRows <- rowsQuery.transact(xa)
      invoiceIds = invRows.map(_.id)
      itemsList <- NonEmptyList.fromList(invoiceIds) match
        case None => IO.pure(Nil)
        case Some(nel) =>
          (fr"""
            SELECT id, invoice_id, tenant_id, product_id, batch_id, product_name,
                   quantity, unit, unit_price, mrp, discount_percent, discount_amount,
                   gst_rate, cgst_amount, sgst_amount, igst_amount, total_amount
            FROM invoice_items
            WHERE tenant_id = $tenantId AND """ ++ Fragments.in(fr"invoice_id", nel)
          ).query[InvoiceItem].to[List].transact(xa)
      itemsByInvoice = itemsList.groupBy(_.invoiceId)
      items = invRows.map(r => r.toInvoice(itemsByInvoice.getOrElse(r.id, Nil)))
      totalPages = if total == 0 then 1 else Math.ceil(total.toDouble / safeLimit).toInt
    yield PagedInvoices(items, total, safePage, safeLimit, totalPages)

  def listRecentInvoices(tenantId: UUID, limit: Int = 100): IO[List[Invoice]] =
    for
      invRows <- sql"""
        SELECT id, tenant_id, invoice_number, invoice_type, customer_id, customer_name,
               customer_phone, subtotal, item_discount_total, bill_discount_percent,
               bill_discount_amount, coupon_code, coupon_discount_amount,
               loyalty_points_redeemed, loyalty_discount_amount, taxable_amount,
               cgst_amount, sgst_amount, igst_amount, round_off, grand_total,
               payment_mode, payment_status, cash_tendered, change_returned, cashier_id, cashier_name,
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
        COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' THEN grand_total ELSE 0 END), 0) as total_sales,
        COUNT(CASE WHEN payment_status = 'COMPLETED' THEN 1 END) as total_invoices,
        COALESCE((
          SELECT SUM(ii.quantity) 
          FROM invoice_items ii 
          JOIN invoices i ON ii.invoice_id = i.id 
          WHERE ii.tenant_id = $tenantId AND i.payment_status = 'COMPLETED'
        ), 0) as total_items_sold,
        COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' AND payment_mode = 'CASH' THEN grand_total ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' AND payment_mode = 'UPI' THEN grand_total ELSE 0 END), 0) as upi_sales,
        COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' AND payment_mode = 'CREDIT_KHATA' THEN grand_total ELSE 0 END), 0) as khata_sales,
        COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' AND payment_mode = 'CARD' THEN grand_total ELSE 0 END), 0) as card_sales,
        COALESCE(SUM(CASE WHEN payment_status = 'COMPLETED' AND payment_mode = 'SPLIT' THEN grand_total ELSE 0 END), 0) as split_sales,
        COALESCE(SUM(CASE WHEN payment_status = 'PENDING' THEN grand_total ELSE 0 END), 0) as pending_sales,
        COUNT(CASE WHEN payment_status = 'PENDING' THEN 1 END) as pending_invoices
      FROM invoices
      WHERE tenant_id = $tenantId
    """.query[SalesOverview].unique.transact(xa)

  def getSoldItemsPaged(
      tenantId: UUID,
      qOpt: Option[String] = None,
      page: Int = 1,
      limit: Int = 50
  ): IO[PagedSoldItems] =
    val safePage = page.max(1)
    val safeLimit = limit.max(1).min(500)
    val offset = (safePage - 1) * safeLimit

    val filterFragments = List(
      Some(fr"ii.tenant_id = $tenantId"),
      Some(fr"i.payment_status = 'COMPLETED'"),
      qOpt.filter(_.trim.nonEmpty).map { q =>
        val wildcard = s"%${q.trim}%"
        fr"ii.product_name ILIKE $wildcard"
      }
    )
    val whereClause = combineWhere(filterFragments)

    val countQuery = (fr"""
      SELECT COUNT(DISTINCT ii.product_name)
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
    """ ++ whereClause).query[Long].unique

    val dataQuery = (fr"""
      SELECT 
        ii.product_name,
        COALESCE(SUM(ii.quantity), 0) as total_quantity,
        COALESCE(SUM(ii.total_amount), 0) as total_revenue,
        COALESCE(AVG(ii.unit_price), 0) as avg_price,
        COUNT(DISTINCT ii.invoice_id) as orders_count
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
    """ ++ whereClause ++ fr"""
      GROUP BY ii.product_name
      ORDER BY total_revenue DESC
      LIMIT $safeLimit OFFSET $offset
    """).query[SoldItemStats].to[List]

    for
      total <- countQuery.transact(xa)
      items <- dataQuery.transact(xa)
      totalPages = if total == 0 then 1 else Math.ceil(total.toDouble / safeLimit).toInt
    yield PagedSoldItems(items, total, safePage, safeLimit, totalPages)

  def getSoldItems(tenantId: UUID): IO[List[SoldItemStats]] =
    sql"""
      SELECT 
        ii.product_name,
        COALESCE(SUM(ii.quantity), 0) as total_quantity,
        COALESCE(SUM(ii.total_amount), 0) as total_revenue,
        COALESCE(AVG(ii.unit_price), 0) as avg_price,
        COUNT(DISTINCT ii.invoice_id) as orders_count
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      WHERE ii.tenant_id = $tenantId AND i.payment_status = 'COMPLETED'
      GROUP BY ii.product_name
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
               payment_mode, payment_status, cash_tendered, change_returned, cashier_id, cashier_name,
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

  def updatePaymentStatus(
      tenantId: UUID,
      invoiceId: UUID,
      req: UpdatePaymentStatusRequest
  ): IO[Option[Invoice]] =
    for
      invOpt <- getInvoiceById(tenantId, invoiceId)
      res <- invOpt match
        case None => IO.pure(None)
        case Some(inv) =>
          val newMode = req.paymentMode.getOrElse(inv.paymentMode)
          for
            _ <- sql"""
              UPDATE invoices
              SET payment_status = ${req.paymentStatus},
                  payment_mode = $newMode,
                  notes = COALESCE(${req.notes}, notes)
              WHERE tenant_id = $tenantId AND id = $invoiceId
            """.update.run.transact(xa)

            // If transitioning to COMPLETED on Khata, record ledger entry
            _ <- if req.paymentStatus == PaymentStatus.COMPLETED && inv.paymentStatus != PaymentStatus.COMPLETED && newMode == PaymentMode.CREDIT_KHATA then
              inv.customerId match
                case Some(cid) =>
                  val ledgerId = UUID.randomUUID()
                  sql"""
                    UPDATE customers SET current_due = current_due + ${inv.grandTotal}
                    WHERE id = $cid AND tenant_id = $tenantId
                  """.update.run.transact(xa) *>
                  sql"""
                    INSERT INTO khata_ledger (
                      id, tenant_id, customer_id, entry_type, amount, balance_after,
                      invoice_id, payment_method, notes
                    ) VALUES (
                      $ledgerId, $tenantId, $cid, 'BILL_CREDIT', ${inv.grandTotal},
                      (SELECT current_due FROM customers WHERE id = $cid),
                      $invoiceId, 'CREDIT_KHATA', ${s"Bill #${inv.invoiceNumber}"}
                    )
                  """.update.run.transact(xa).void
                case None => IO.unit
            else IO.unit

            updated <- getInvoiceById(tenantId, invoiceId)
          yield updated
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
             payment_mode, payment_status, cash_tendered, change_returned, cashier_id, cashier_name,
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
               payment_mode, payment_status, cash_tendered, change_returned, cashier_id, cashier_name,
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

