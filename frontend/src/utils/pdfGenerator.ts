import jsPDF from 'jspdf';
import type { Invoice } from '../types';

export interface PdfStoreDetails {
  name?: string;
  legalName?: string;
  address?: string;
  city?: string;
  phone?: string;
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

  // Margins & Dimensions
  const startX = 14;
  let currentY = 16;
  const pageWidth = 210;
  const contentWidth = pageWidth - startX * 2; // 182mm

  // 1. Header (Store details left, Invoice metadata right)
  doc.setTextColor(37, 99, 235); // Primary Blue
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(storeName, startX, currentY);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(docTitle, pageWidth - startX, currentY, { align: 'right' });

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // Slate-600

  if (storeDetails?.legalName) {
    doc.text(storeDetails.legalName, startX, currentY);
    currentY += 4.5;
  }

  const storeAddressParts = [storeDetails?.address, storeDetails?.city].filter(Boolean);
  if (storeAddressParts.length > 0) {
    doc.text(storeAddressParts.join(', '), startX, currentY);
    currentY += 4.5;
  }

  if (storeDetails?.gstin) {
    doc.text(`GSTIN: ${storeDetails.gstin}`, startX, currentY);
    currentY += 4.5;
  }

  if (storeDetails?.phone) {
    doc.text(`Phone: ${storeDetails.phone}`, startX, currentY);
    currentY += 4.5;
  }

  // Invoice metadata on the right
  let metaY = 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, pageWidth - startX, metaY, { align: 'right' });

  metaY += 4.5;
  doc.setFont('helvetica', 'normal');
  const invoiceDate = new Date(invoice.createdAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  doc.text(`Date: ${invoiceDate}`, pageWidth - startX, metaY, { align: 'right' });

  metaY += 4.5;
  doc.setTextColor(22, 101, 52); // Emerald Green
  doc.setFont('helvetica', 'bold');
  doc.text(`Payment: ${invoice.paymentMode}  |  Status: PAID`, pageWidth - startX, metaY, { align: 'right' });

  if (invoice.cashierName) {
    metaY += 4.5;
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cashier: ${invoice.cashierName}`, pageWidth - startX, metaY, { align: 'right' });
  }

  currentY = Math.max(currentY + 2, metaY + 4);

  // 2. Buyer Details Box
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(startX, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Billed To: ', startX + 4, currentY + 7.5);

  const buyerName = invoice.customerName?.trim() || 'Walk-in Customer';
  const buyerPhone = invoice.customerPhone?.trim() ? `  |  Mobile: +91 ${invoice.customerPhone}` : '';

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`${buyerName}${buyerPhone}`, startX + 22, currentY + 7.5);

  currentY += 16;

  // 3. Line Items Table Header
  const colWidths = {
    idx: 10,
    desc: 78,
    qty: 24,
    rate: 22,
    gst: 18,
    total: 30,
  };

  const colX = {
    idx: startX,
    desc: startX + colWidths.idx,
    qty: startX + colWidths.idx + colWidths.desc,
    rate: startX + colWidths.idx + colWidths.desc + colWidths.qty,
    gst: startX + colWidths.idx + colWidths.desc + colWidths.qty + colWidths.rate,
    total: startX + colWidths.idx + colWidths.desc + colWidths.qty + colWidths.rate + colWidths.gst,
  };

  doc.setFillColor(241, 245, 249); // Slate-100
  doc.setDrawColor(226, 232, 240);
  doc.rect(startX, currentY, contentWidth, 8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  doc.text('#', colX.idx + 3, currentY + 5.5);
  doc.text('Item Description', colX.desc + 2, currentY + 5.5);
  doc.text('Qty', colX.qty + colWidths.qty - 3, currentY + 5.5, { align: 'right' });
  doc.text('Rate (Rs)', colX.rate + colWidths.rate - 3, currentY + 5.5, { align: 'right' });
  doc.text('GST %', colX.gst + colWidths.gst - 3, currentY + 5.5, { align: 'right' });
  doc.text('Amount (Rs)', colX.total + colWidths.total - 3, currentY + 5.5, { align: 'right' });

  currentY += 8;

  // 4. Line Items Table Rows
  const items = invoice.items || [];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  items.forEach((item, index) => {
    const isAlt = index % 2 === 1;
    if (isAlt) {
      doc.setFillColor(248, 250, 252);
      doc.rect(startX, currentY, contentWidth, 7.5, 'F');
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(startX, currentY + 7.5, startX + contentWidth, currentY + 7.5);

    doc.setTextColor(100, 116, 139);
    doc.text(String(index + 1), colX.idx + 3, currentY + 5.2);

    doc.setTextColor(15, 23, 42);
    // Truncate long product names cleanly
    const maxDescChars = 44;
    const truncatedDesc =
      item.productName.length > maxDescChars
        ? `${item.productName.substring(0, maxDescChars)}...`
        : item.productName;
    doc.text(truncatedDesc, colX.desc + 2, currentY + 5.2);

    const qtyStr = `${item.quantity} ${item.unit || 'pcs'}`;
    doc.text(qtyStr, colX.qty + colWidths.qty - 3, currentY + 5.2, { align: 'right' });

    doc.text(item.unitPrice.toFixed(2), colX.rate + colWidths.rate - 3, currentY + 5.2, { align: 'right' });
    doc.text(`${item.gstRate}%`, colX.gst + colWidths.gst - 3, currentY + 5.2, { align: 'right' });
    doc.text(item.totalAmount.toFixed(2), colX.total + colWidths.total - 3, currentY + 5.2, { align: 'right' });

    currentY += 7.5;
  });

  currentY += 4;

  // 5. Summary & Totals Box
  const summaryLeftX = startX + 90;
  const summaryWidth = contentWidth - 90;

  const addSummaryRow = (label: string, value: string, isGrand: boolean = false): void => {
    if (isGrand) {
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(summaryLeftX, currentY - 1, summaryWidth, 8, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(37, 99, 235);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
    }

    doc.text(label, summaryLeftX + 3, currentY + 4.5);
    doc.text(value, summaryLeftX + summaryWidth - 3, currentY + 4.5, { align: 'right' });
    currentY += isGrand ? 9.5 : 5.5;
  };

  addSummaryRow('Subtotal:', `Rs. ${invoice.subtotal.toFixed(2)}`);

  if (invoice.itemDiscountTotal > 0) {
    addSummaryRow('Item Discount:', `- Rs. ${invoice.itemDiscountTotal.toFixed(2)}`);
  }
  if (invoice.billDiscountAmount > 0) {
    addSummaryRow('Bill Discount:', `- Rs. ${invoice.billDiscountAmount.toFixed(2)}`);
  }
  if (invoice.couponDiscountAmount > 0) {
    addSummaryRow('Coupon Discount:', `- Rs. ${invoice.couponDiscountAmount.toFixed(2)}`);
  }
  if (invoice.loyaltyDiscountAmount > 0) {
    addSummaryRow('Loyalty Redeemed:', `- Rs. ${invoice.loyaltyDiscountAmount.toFixed(2)}`);
  }

  if (hasGst) {
    addSummaryRow('CGST:', `Rs. ${invoice.cgstAmount.toFixed(2)}`);
    addSummaryRow('SGST:', `Rs. ${invoice.sgstAmount.toFixed(2)}`);
    if (invoice.igstAmount > 0) {
      addSummaryRow('IGST:', `Rs. ${invoice.igstAmount.toFixed(2)}`);
    }
  }

  if (invoice.roundOff !== 0) {
    addSummaryRow('Round Off:', `Rs. ${invoice.roundOff.toFixed(2)}`);
  }

  addSummaryRow('Grand Total:', `Rs. ${invoice.grandTotal.toFixed(2)}`, true);

  // 6. Footer Notes
  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('Thank you for shopping with us! Terms: Goods once sold will be accepted for return as per store policy.', startX, currentY);

  currentY += 4.5;
  doc.text('Powered by BillEase • Official GST Bill Copy', startX, currentY);

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

export async function shareInvoicePdf(
  invoice: Invoice,
  storeDetails?: PdfStoreDetails,
  buyerPhone?: string
): Promise<{ shared: boolean; method: 'web-share' | 'whatsapp-link' }> {
  const phone = buyerPhone || invoice.customerPhone || '';
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const targetPhone =
    cleanPhone.startsWith('91') && cleanPhone.length === 12
      ? cleanPhone
      : cleanPhone.length === 10
      ? `91${cleanPhone}`
      : cleanPhone;

  const pdfBlob = generateInvoicePdfBlob(invoice, storeDetails);
  const pdfFile = new File([pdfBlob], `Bill_${invoice.invoiceNumber}.pdf`, {
    type: 'application/pdf',
  });

  // Try native Web Share API with attached PDF file (Supported on Mobile Chrome, Safari, macOS)
  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files: [pdfFile] })
  ) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `Tax Invoice ${invoice.invoiceNumber}`,
        text: `Tax Invoice ${invoice.invoiceNumber} from ${storeDetails?.name || 'BillEase Store'}. Grand Total: Rs. ${invoice.grandTotal.toFixed(2)}`,
      });
      return { shared: true, method: 'web-share' };
    } catch {
      // User cancelled share or share failed; proceed to fallback
    }
  }

  // Universal Fallback: Open WhatsApp with itemized message and direct PDF download link
  const itemsText = (invoice.items || [])
    .map((it) => `• ${it.quantity}x ${it.productName} - Rs. ${it.totalAmount.toFixed(2)}`)
    .join('\n');

  const pdfUrl = `${window.location.protocol}//${window.location.hostname}:8081/api/public/invoices/${invoice.id}/pdf`;

  const waText = `🧾 *${storeDetails?.name || 'BillEase Store'}*
*Bill No:* ${invoice.invoiceNumber}
*Customer:* ${invoice.customerName || 'Customer'}
--------------------------
*Items:*
${itemsText}
--------------------------
*Grand Total:* *Rs. ${invoice.grandTotal.toFixed(2)}* (${invoice.paymentMode})
--------------------------
📄 *Download Official PDF Bill Copy:*
${pdfUrl}

Thank you for shopping with us! 🙏`;

  const waUrl = targetPhone
    ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(waText)}`
    : `https://wa.me/?text=${encodeURIComponent(waText)}`;

  window.open(waUrl, '_blank', 'noopener,noreferrer');
  return { shared: true, method: 'whatsapp-link' };
}
