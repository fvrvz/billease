package com.billease.service

import com.billease.domain.{Invoice, InvoiceItem, Tenant, PaymentMode}
import com.lowagie.text.{Document, PageSize, Paragraph, Chunk, Phrase, FontFactory, Rectangle, Element}
import com.lowagie.text.pdf.{PdfWriter, PdfPTable, PdfPCell}
import java.io.ByteArrayOutputStream
import java.awt.Color
import java.time.format.DateTimeFormatter
import java.time.ZoneId
import scala.math.BigDecimal.RoundingMode as RM
import scala.util.Try

class PdfService:

  private val primaryColor   = new Color(37, 99, 235)   // Blue #2563EB
  private val textDark       = new Color(15, 23, 42)    // Slate #0F172A
  private val textMuted      = new Color(100, 116, 139) // Slate-500 #64748B
  private val tableHeaderBg  = new Color(241, 245, 249) // Slate-100 #F1F5F9
  private val alternateRowBg = new Color(248, 250, 252) // Slate-50 #F8FAFC
  private val borderCol      = new Color(226, 232, 240) // Slate-200 #E2E8F0
  private val successGreen   = new Color(22, 101, 52)   // Green #166534

  private val dtf = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")
    .withZone(ZoneId.of("Asia/Kolkata"))

  def generateInvoicePdf(tenant: Tenant, invoice: Invoice, items: List[InvoiceItem]): Array[Byte] =
    val out = new ByteArrayOutputStream()
    val doc = new Document(PageSize.A4, 36f, 36f, 36f, 36f)
    PdfWriter.getInstance(doc, out)
    doc.open()

    val fontStoreTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, primaryColor)
    val fontDocTitle   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, textDark)
    val fontMetaLabel  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, textDark)
    val fontMetaVal    = FontFactory.getFont(FontFactory.HELVETICA, 9, textDark)
    val fontSmall      = FontFactory.getFont(FontFactory.HELVETICA, 8, textMuted)
    val fontTableHead  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, textDark)
    val fontTableBody  = FontFactory.getFont(FontFactory.HELVETICA, 9, textDark)
    val fontTotalLabel = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, textDark)
    val fontGrandTotal = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, primaryColor)
    val fontSuccess    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, successGreen)

    // 1. Header Table (Store Details Left, Invoice Metadata Right)
    val headerTable = new PdfPTable(2)
    headerTable.setWidthPercentage(100f)
    headerTable.setWidths(Array(60f, 40f))

    // Store Info Cell
    val storeCell = new PdfPCell()
    storeCell.setBorder(Rectangle.NO_BORDER)
    storeCell.setPadding(0f)
    storeCell.addElement(new Paragraph(tenant.name, fontStoreTitle))
    tenant.legalName.foreach { legal =>
      storeCell.addElement(new Paragraph(legal, fontSmall))
    }
    val addr = List(tenant.address, tenant.city).flatten.mkString(", ")
    if addr.nonEmpty then storeCell.addElement(new Paragraph(addr, fontSmall))
    if tenant.hasGst then
      val gstinText = s"GSTIN: ${tenant.gstin.getOrElse("UNREGISTERED")}"
      storeCell.addElement(new Paragraph(gstinText, fontSmall))
    storeCell.addElement(new Paragraph(s"Phone: ${tenant.phone}", fontSmall))
    tenant.email.foreach { email =>
      storeCell.addElement(new Paragraph(s"Email: $email", fontSmall))
    }
    headerTable.addCell(storeCell)

    // Invoice Meta Cell
    val metaCell = new PdfPCell()
    metaCell.setBorder(Rectangle.NO_BORDER)
    metaCell.setPadding(0f)
    metaCell.setHorizontalAlignment(Element.ALIGN_RIGHT)

    val docTypeTitle = if tenant.hasGst then "TAX INVOICE" else "RETAIL INVOICE"
    val docTitleP = new Paragraph(docTypeTitle, fontDocTitle)
    docTitleP.setAlignment(Element.ALIGN_RIGHT)
    metaCell.addElement(docTitleP)

    val invNumP = new Paragraph(s"Invoice No: ${invoice.invoiceNumber}", fontMetaLabel)
    invNumP.setAlignment(Element.ALIGN_RIGHT)
    metaCell.addElement(invNumP)

    val formattedDate = Try(dtf.format(invoice.createdAt)).getOrElse(invoice.createdAt.toString)
    val dateP = new Paragraph(s"Date: $formattedDate", fontMetaVal)
    dateP.setAlignment(Element.ALIGN_RIGHT)
    metaCell.addElement(dateP)

    val payModeP = new Paragraph(s"Payment: ${invoice.paymentMode}  |  Status: PAID", fontSuccess)
    payModeP.setAlignment(Element.ALIGN_RIGHT)
    metaCell.addElement(payModeP)

    invoice.cashierName.foreach { cashier =>
      val cashierP = new Paragraph(s"Cashier: $cashier", fontSmall)
      cashierP.setAlignment(Element.ALIGN_RIGHT)
      metaCell.addElement(cashierP)
    }

    headerTable.addCell(metaCell)
    doc.add(headerTable)

    doc.add(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 6)))

    // 2. Buyer Details Box
    val buyerTable = new PdfPTable(1)
    buyerTable.setWidthPercentage(100f)
    val buyerCell = new PdfPCell()
    buyerCell.setBackgroundColor(tableHeaderBg)
    buyerCell.setBorderColor(borderCol)
    buyerCell.setPadding(8f)

    val buyerName = invoice.customerName.filter(_.trim.nonEmpty).getOrElse("Walk-in Customer")
    val buyerPhone = invoice.customerPhone.filter(_.trim.nonEmpty).map(p => s"  |  Phone: +91 $p").getOrElse("")
    val buyerP = new Paragraph()
    buyerP.add(new Chunk("Billed To: ", fontMetaLabel))
    buyerP.add(new Chunk(buyerName, fontMetaVal))
    buyerP.add(new Chunk(buyerPhone, fontMetaVal))
    buyerCell.addElement(buyerP)
    buyerTable.addCell(buyerCell)
    doc.add(buyerTable)

    doc.add(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 8)))

    // 3. Line Items Table
    val itemsTable = new PdfPTable(6)
    itemsTable.setWidthPercentage(100f)
    itemsTable.setWidths(Array(6f, 44f, 12f, 12f, 10f, 16f))

    def makeHeaderCell(text: String, align: Int = Element.ALIGN_LEFT): PdfPCell =
      val cell = new PdfPCell(new Phrase(text, fontTableHead))
      cell.setBackgroundColor(tableHeaderBg)
      cell.setBorderColor(borderCol)
      cell.setPadding(6f)
      cell.setHorizontalAlignment(align)
      cell

    itemsTable.addCell(makeHeaderCell("#", Element.ALIGN_CENTER))
    itemsTable.addCell(makeHeaderCell("Item Description"))
    itemsTable.addCell(makeHeaderCell("Qty", Element.ALIGN_RIGHT))
    itemsTable.addCell(makeHeaderCell("Rate (Rs)", Element.ALIGN_RIGHT))
    itemsTable.addCell(makeHeaderCell("GST %", Element.ALIGN_RIGHT))
    itemsTable.addCell(makeHeaderCell("Amount (Rs)", Element.ALIGN_RIGHT))

    items.zipWithIndex.foreach { case (item, idx) =>
      val rowBg = if idx % 2 == 1 then alternateRowBg else Color.WHITE

      def makeBodyCell(text: String, align: Int = Element.ALIGN_LEFT): PdfPCell =
        val cell = new PdfPCell(new Phrase(text, fontTableBody))
        cell.setBackgroundColor(rowBg)
        cell.setBorderColor(borderCol)
        cell.setPadding(6f)
        cell.setHorizontalAlignment(align)
        cell

      itemsTable.addCell(makeBodyCell((idx + 1).toString, Element.ALIGN_CENTER))
      itemsTable.addCell(makeBodyCell(item.productName))
      itemsTable.addCell(makeBodyCell(s"${item.quantity.setScale(2, RM.HALF_UP)} ${item.unit}", Element.ALIGN_RIGHT))
      itemsTable.addCell(makeBodyCell(item.unitPrice.setScale(2, RM.HALF_UP).toString, Element.ALIGN_RIGHT))
      itemsTable.addCell(makeBodyCell(s"${item.gstRate.setScale(0, RM.HALF_UP)}%", Element.ALIGN_RIGHT))
      itemsTable.addCell(makeBodyCell(item.totalAmount.setScale(2, RM.HALF_UP).toString, Element.ALIGN_RIGHT))
    }

    doc.add(itemsTable)

    doc.add(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 6)))

    // 4. Summary & Totals Table
    val summaryTable = new PdfPTable(2)
    summaryTable.setWidthPercentage(100f)
    summaryTable.setWidths(Array(55f, 45f))

    // Left Column: Notes & Terms
    val leftNotesCell = new PdfPCell()
    leftNotesCell.setBorder(Rectangle.NO_BORDER)
    leftNotesCell.setPadding(8f)
    val footerNote = if tenant.invoiceFooter.nonEmpty then tenant.invoiceFooter else "Thank you for shopping with us!"
    leftNotesCell.addElement(new Paragraph(footerNote, fontSmall))
    leftNotesCell.addElement(new Paragraph("Terms: Goods once sold will be accepted for return as per store policy.", fontSmall))
    summaryTable.addCell(leftNotesCell)

    // Right Column: Calculation Breakdown
    val totalsTable = new PdfPTable(2)
    totalsTable.setWidthPercentage(100f)
    totalsTable.setWidths(Array(60f, 40f))

    def addTotalRow(label: String, value: String, isBold: Boolean = false, isGrand: Boolean = false): Unit =
      val lFont = if isGrand then fontGrandTotal else if isBold then fontTotalLabel else fontMetaVal
      val vFont = if isGrand then fontGrandTotal else if isBold then fontTotalLabel else fontMetaVal
      val bg = if isGrand then tableHeaderBg else Color.WHITE

      val lCell = new PdfPCell(new Phrase(label, lFont))
      lCell.setBackgroundColor(bg)
      lCell.setBorderColor(borderCol)
      lCell.setPadding(if isGrand then 6f else 4f)
      totalsTable.addCell(lCell)

      val vCell = new PdfPCell(new Phrase(value, vFont))
      vCell.setBackgroundColor(bg)
      vCell.setBorderColor(borderCol)
      vCell.setPadding(if isGrand then 6f else 4f)
      vCell.setHorizontalAlignment(Element.ALIGN_RIGHT)
      totalsTable.addCell(vCell)

    addTotalRow("Subtotal:", s"Rs. ${invoice.subtotal.setScale(2, RM.HALF_UP)}")

    if invoice.itemDiscountTotal > BigDecimal(0) then
      addTotalRow("Item Discount:", s"- Rs. ${invoice.itemDiscountTotal.setScale(2, RM.HALF_UP)}")
    if invoice.billDiscountAmount > BigDecimal(0) then
      addTotalRow("Bill Discount:", s"- Rs. ${invoice.billDiscountAmount.setScale(2, RM.HALF_UP)}")
    if invoice.couponDiscountAmount > BigDecimal(0) then
      addTotalRow("Coupon Discount:", s"- Rs. ${invoice.couponDiscountAmount.setScale(2, RM.HALF_UP)}")
    if invoice.loyaltyDiscountAmount > BigDecimal(0) then
      addTotalRow("Loyalty Redeemed:", s"- Rs. ${invoice.loyaltyDiscountAmount.setScale(2, RM.HALF_UP)}")

    if tenant.hasGst then
      addTotalRow("CGST:", s"Rs. ${invoice.cgstAmount.setScale(2, RM.HALF_UP)}")
      addTotalRow("SGST:", s"Rs. ${invoice.sgstAmount.setScale(2, RM.HALF_UP)}")
      if invoice.igstAmount > BigDecimal(0) then
        addTotalRow("IGST:", s"Rs. ${invoice.igstAmount.setScale(2, RM.HALF_UP)}")

    if invoice.roundOff != BigDecimal(0) then
      addTotalRow("Round Off:", s"Rs. ${invoice.roundOff.setScale(2, RM.HALF_UP)}")

    addTotalRow("Grand Total:", s"Rs. ${invoice.grandTotal.setScale(2, RM.HALF_UP)}", isBold = true, isGrand = true)

    val rightTotalsCell = new PdfPCell(totalsTable)
    rightTotalsCell.setBorder(Rectangle.NO_BORDER)
    rightTotalsCell.setPadding(0f)
    summaryTable.addCell(rightTotalsCell)

    doc.add(summaryTable)

    doc.add(new Paragraph(" ", FontFactory.getFont(FontFactory.HELVETICA, 12)))

    // 5. Document Watermark / Bottom Footer
    val bottomFooter = new Paragraph("Powered by BillEase • Official GST Bill Copy", fontSmall)
    bottomFooter.setAlignment(Element.ALIGN_CENTER)
    doc.add(bottomFooter)

    doc.close()
    out.toByteArray
