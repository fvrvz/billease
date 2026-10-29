import jsPDF from 'jspdf';
import type { Invoice } from '../types';

export interface PdfStoreDetails {
  name?: string;
  legalName?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  hasGst?: boolean;
}

export function generateInvoicePdfDoc(
  invoice: Invoice,
  storeDetails?: PdfStoreDetails
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const storeName = storeDetails?.name || 'BillEase Store';
  const hasGst = storeDetails?.hasGst ?? invoice.cgstAmount > 0;
  const docTitle = hasGst ? 'TAX INVOICE' : 'RETAIL INVOICE';

  // Page Dimensions & Margins
  const startX = 14;
  let currentY = 16;
  const pageWidth = 210;
  const contentWidth = pageWidth - startX * 2; // 182mm

  // 1. Top Decorative Brand Bar
  doc.setFillColor(15, 23, 42); // Slate-900 Primary
  doc.rect(startX, currentY, contentWidth, 1.8, 'F');
  currentY += 7;

  // 2. Header Section
  // Left: Store Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(storeName, startX, currentY);

  // Right: Document Title Badge
  const badgeWidth = 46;
  const badgeHeight = 8;
  const badgeX = pageWidth - startX - badgeWidth;
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.roundedRect(badgeX, currentY - 5.5, badgeWidth, badgeHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(docTitle, badgeX + badgeWidth / 2, currentY - 0.5, { align: 'center' });

  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // Slate-600

  if (storeDetails?.legalName) {
    doc.text(storeDetails.legalName, startX, currentY);
    currentY += 4.2;
  }

  const storeAddressParts = [storeDetails?.address, storeDetails?.city].filter(Boolean);
  if (storeAddressParts.length > 0) {
    doc.text(storeAddressParts.join(', '), startX, currentY);
    currentY += 4.2;
  }

  if (storeDetails?.gstin) {
    doc.setFont('helvetica', 'bold');
    doc.text(`GSTIN: ${storeDetails.gstin}`, startX, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 4.2;
  }

  if (storeDetails?.phone) {
    const contactLine = `Phone: ${storeDetails.phone}${storeDetails.email ? `  |  Email: ${storeDetails.email}` : ''}`;
    doc.text(contactLine, startX, currentY);
    currentY += 4.2;
  }

  // Invoice Metadata (Right-Aligned)
  let metaY = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, pageWidth - startX, metaY, { align: 'right' });

  metaY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const invoiceDate = new Date(invoice.createdAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  doc.text(`Date & Time: ${invoiceDate}`, pageWidth - startX, metaY, { align: 'right' });

  metaY += 4.5;
  const isCompleted = (invoice.paymentStatus || 'COMPLETED') === 'COMPLETED';
  if (isCompleted) {
    doc.setTextColor(22, 101, 52); // Emerald-800
    doc.setFont('helvetica', 'bold');
    doc.text(`Payment: ${invoice.paymentMode}  •  Status: PAID (DONE)`, pageWidth - startX, metaY, { align: 'right' });
  } else {
    doc.setTextColor(217, 119, 6); // Amber-600
    doc.setFont('helvetica', 'bold');
    doc.text(`Payment: ${invoice.paymentMode}  •  Status: PAYMENT PENDING`, pageWidth - startX, metaY, { align: 'right' });
  }

  if (invoice.cashierName) {
    metaY += 4.5;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Billed by: ${invoice.cashierName}`, pageWidth - startX, metaY, { align: 'right' });
  }

  currentY = Math.max(currentY + 3, metaY + 5);

  // 3. Customer / Buyer Details Card
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(startX, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Billed To Customer: ', startX + 4, currentY + 7.5);

  const buyerName = invoice.customerName?.trim() || 'Walk-in Buyer';
  const buyerPhone = invoice.customerPhone?.trim() ? `  |  Mobile: +91 ${invoice.customerPhone}` : '';

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`${buyerName}${buyerPhone}`, startX + 38, currentY + 7.5);

  currentY += 16;

  // 4. Line Items Table Header
  const colWidths = {
    idx: 10,
    desc: 82,
    qty: 24,
    rate: 22,
    gst: 18,
    total: 26,
  };

  const colX = {
    idx: startX,
    desc: startX + colWidths.idx,
    qty: startX + colWidths.idx + colWidths.desc,
    rate: startX + colWidths.idx + colWidths.desc + colWidths.qty,
    gst: startX + colWidths.idx + colWidths.desc + colWidths.qty + colWidths.rate,
    total: startX + colWidths.idx + colWidths.desc + colWidths.qty + colWidths.rate + colWidths.gst,
  };

  doc.setFillColor(15, 23, 42); // Slate-900 Header
  doc.rect(startX, currentY, contentWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);

  doc.text('#', colX.idx + 3, currentY + 5.5);
  doc.text('Item Description', colX.desc + 2, currentY + 5.5);
  doc.text('Qty & Unit', colX.qty + colWidths.qty - 3, currentY + 5.5, { align: 'right' });
  doc.text('Rate (Rs)', colX.rate + colWidths.rate - 3, currentY + 5.5, { align: 'right' });
  doc.text('GST %', colX.gst + colWidths.gst - 3, currentY + 5.5, { align: 'right' });
  doc.text('Amount (Rs)', colX.total + colWidths.total - 3, currentY + 5.5, { align: 'right' });

  currentY += 8;

  // 5. Line Items Rows with Multi-Line Wrapping (Never Truncate Product Names!)
  const items = invoice.items || [];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  items.forEach((item, index) => {
    // Wrap product description cleanly across multiple lines
    const descLines = doc.splitTextToSize(item.productName, colWidths.desc - 4);
    const rowHeight = Math.max(7.5, descLines.length * 4.2 + 3);

    // Alternate row shading
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(startX, currentY, contentWidth, rowHeight, 'F');
    }

    // Bottom subtle border
    doc.setDrawColor(241, 245, 249);
    doc.line(startX, currentY + rowHeight, startX + contentWidth, currentY + rowHeight);

    // SL Number
    doc.setTextColor(100, 116, 139);
    doc.text(String(index + 1), colX.idx + 3, currentY + 5.2);

    // Product Name (Multi-line supported)
    doc.setTextColor(15, 23, 42);
    doc.text(descLines, colX.desc + 2, currentY + 5.2);

    // Quantity & Unit
    const qtyStr = `${item.quantity} ${item.unit || 'pcs'}`;
    doc.text(qtyStr, colX.qty + colWidths.qty - 3, currentY + 5.2, { align: 'right' });

    // Rate
    doc.text(item.unitPrice.toFixed(2), colX.rate + colWidths.rate - 3, currentY + 5.2, { align: 'right' });

    // GST
    doc.text(`${item.gstRate}%`, colX.gst + colWidths.gst - 3, currentY + 5.2, { align: 'right' });

    // Total Amount
    doc.setFont('helvetica', 'bold');
    doc.text(item.totalAmount.toFixed(2), colX.total + colWidths.total - 3, currentY + 5.2, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    currentY += rowHeight;
  });

  currentY += 5;

  // 6. Summary & Totals Calculation Box
  const summaryLeftX = startX + 96;
  const summaryWidth = contentWidth - 96;

  const addSummaryRow = (label: string, value: string, isGrand = false): void => {
    if (isGrand) {
      doc.setFillColor(15, 23, 42); // Slate-900 Accent Box
      doc.roundedRect(summaryLeftX, currentY - 1, summaryWidth, 9, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
    }

    doc.text(label, summaryLeftX + 4, currentY + 4.8);
    doc.text(value, summaryLeftX + summaryWidth - 4, currentY + 4.8, { align: 'right' });
    currentY += isGrand ? 11 : 5.6;
  };

  addSummaryRow('Subtotal (Gross Items):', `Rs. ${invoice.subtotal.toFixed(2)}`);

  if (invoice.itemDiscountTotal > 0) {
    addSummaryRow('Item Discount Total:', `- Rs. ${invoice.itemDiscountTotal.toFixed(2)}`);
  }
  if (invoice.billDiscountAmount > 0) {
    addSummaryRow('Bill Discount:', `- Rs. ${invoice.billDiscountAmount.toFixed(2)}`);
  }
  if (invoice.couponDiscountAmount > 0) {
    addSummaryRow('Coupon Applied:', `- Rs. ${invoice.couponDiscountAmount.toFixed(2)}`);
  }
  if (invoice.loyaltyDiscountAmount > 0) {
    addSummaryRow('Loyalty Points Redeemed:', `- Rs. ${invoice.loyaltyDiscountAmount.toFixed(2)}`);
  }

  if (hasGst) {
    addSummaryRow('CGST Total:', `Rs. ${invoice.cgstAmount.toFixed(2)}`);
    addSummaryRow('SGST Total:', `Rs. ${invoice.sgstAmount.toFixed(2)}`);
    if (invoice.igstAmount > 0) {
      addSummaryRow('IGST Total:', `Rs. ${invoice.igstAmount.toFixed(2)}`);
    }
  }

  if (invoice.roundOff !== 0) {
    addSummaryRow('Round Off Adjustment:', `Rs. ${invoice.roundOff.toFixed(2)}`);
  }

  addSummaryRow('Grand Total Amount:', `Rs. ${invoice.grandTotal.toFixed(2)}`, true);

  // 7. Footer & Terms
  currentY = Math.max(currentY + 6, 260);

  doc.setDrawColor(226, 232, 240);
  doc.line(startX, currentY, startX + contentWidth, currentY);
  currentY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('Thank you for shopping with us! Terms: Goods once sold will be accepted for exchange as per store policy.', startX, currentY);

  currentY += 4;
  doc.text('BillEase GST Retail POS System • Electronically generated official invoice document.', startX, currentY);

  return doc;
}

export function generateInvoicePdfBlob(
  invoice: Invoice,
  storeDetails?: PdfStoreDetails
): Blob {
  const doc = generateInvoicePdfDoc(invoice, storeDetails);
  return doc.output('blob');
}

export function downloadInvoicePdfLocally(
  invoice: Invoice,
  storeDetails?: PdfStoreDetails
): void {
  const doc = generateInvoicePdfDoc(invoice, storeDetails);
  doc.save(`Bill_${invoice.invoiceNumber}.pdf`);
}

/**
 * Shares or sends the invoice PDF directly to WhatsApp:
 * 1. On platforms with Web Share API file support (Mobile Chrome/Safari, macOS Safari),
 *    attaches the actual PDF file directly into WhatsApp.
 * 2. On desktop browsers without Web Share file support, automatically triggers
 *    the PDF file download locally AND launches WhatsApp Web with the recipient and
 *    receipt summary so the cashier can drop/attach the file directly into the chat.
 */
export async function shareInvoicePdf(
  invoice: Invoice,
  storeDetails?: PdfStoreDetails,
  buyerPhone?: string
): Promise<{ shared: boolean; method: 'web-share-file' | 'desktop-download-and-whatsapp' }> {
  const phone = buyerPhone || invoice.customerPhone || '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const targetPhone =
    cleanPhone.startsWith('91') && cleanPhone.length === 12
      ? cleanPhone
      : cleanPhone.length === 10
      ? `91${cleanPhone}`
      : cleanPhone;

  const pdfBlob = generateInvoicePdfBlob(invoice, storeDetails);
  const pdfFileName = `Bill_${invoice.invoiceNumber}.pdf`;
  const pdfFile = new File([pdfBlob], pdfFileName, {
    type: 'application/pdf',
  });

  // Method 1: Direct File Attachment via Web Share API
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [pdfFile] })
  ) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Bill ${invoice.invoiceNumber}`,
        text: `Official Bill ${invoice.invoiceNumber} from ${storeDetails?.name || 'BillEase Store'}. Grand Total: Rs. ${invoice.grandTotal.toFixed(2)}`,
      });
      return { shared: true, method: 'web-share-file' };
    } catch {
      // User cancelled share dialog or share failed, fallback to download & WhatsApp Web
    }
  }

  // Method 2: Automatically save PDF to user's computer/downloads and open WhatsApp Web
  downloadInvoicePdfLocally(invoice, storeDetails);

  const itemsText = (invoice.items || [])
    .map((it) => `• ${it.quantity}x ${it.productName} - Rs. ${it.totalAmount.toFixed(2)}`)
    .join('\n');

  const pdfUrl = `${window.location.protocol}//${window.location.hostname}:8081/api/public/invoices/${invoice.id}/pdf`;

  const waText = `🧾 *${storeDetails?.name || 'BillEase Store'}*
*Invoice No:* ${invoice.invoiceNumber}
*Customer:* ${invoice.customerName || 'Customer'}
------------------------------------
*Items:*
${itemsText}
------------------------------------
*Grand Total:* *Rs. ${invoice.grandTotal.toFixed(2)}* (${invoice.paymentMode})
*Payment Status:* *${(invoice.paymentStatus || 'COMPLETED') === 'COMPLETED' ? 'PAID (DONE)' : 'PENDING'}*
------------------------------------
📄 *Direct PDF Download:*
${pdfUrl}

(PDF copy has also been downloaded to your system to drag & attach into this chat)
Thank you for shopping with us! 🙏`;

  const waUrl = targetPhone
    ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(waText)}`
    : `https://wa.me/?text=${encodeURIComponent(waText)}`;

  window.open(waUrl, '_blank', 'noopener,noreferrer');
  return { shared: true, method: 'desktop-download-and-whatsapp' };
}
