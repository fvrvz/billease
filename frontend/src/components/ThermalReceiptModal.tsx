import { Component, For, Show, createSignal } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { Invoice } from '../types';
import { apiClient } from '../api/client';
import { Printer, CheckCircle, MessageCircle, FileDown, Clock } from 'lucide-solid';
import { downloadInvoicePdfLocally, shareInvoicePdf } from '../utils/pdfGenerator';

interface ThermalReceiptModalProps {
  invoice: Invoice;
  onClose: () => void;
  onInvoiceUpdated?: (invoice: Invoice) => void;
}

export const ThermalReceiptModal: Component<ThermalReceiptModalProps> = (props) => {
  const { tenant, token } = useAuth();
  const [currentInvoice, setCurrentInvoice] = createSignal<Invoice>(props.invoice);
  const [customPhone, setCustomPhone] = createSignal('');
  const [isSharing, setIsSharing] = createSignal(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = createSignal(false);

  const handlePrint = () => {
    window.print();
  };

  const handleMarkPaymentDone = async () => {
    const t = tenant();
    if (!t) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await apiClient.updateInvoicePaymentStatus(t.id, currentInvoice().id, token(), {
        paymentStatus: 'COMPLETED'
      });
      if (updated) {
        setCurrentInvoice(updated);
        props.onInvoiceUpdated?.(updated);
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDownloadPdf = () => {
    const t = tenant();
    downloadInvoicePdfLocally(currentInvoice(), {
      name: t?.name,
      legalName: t?.legalName,
      address: t?.address,
      city: t?.city,
      phone: t?.phone,
      gstin: t?.gstin,
      hasGst: t?.hasGst,
    });
  };

  const handleSharePdf = async () => {
    setIsSharing(true);
    try {
      const t = tenant();
      await shareInvoicePdf(
        currentInvoice(),
        {
          name: t?.name,
          legalName: t?.legalName,
          address: t?.address,
          city: t?.city,
          phone: t?.phone,
          gstin: t?.gstin,
          hasGst: t?.hasGst,
        },
        currentInvoice().customerPhone || customPhone()
      );
    } finally {
      setIsSharing(false);
    }
  };

  const formattedDate = () => {
    const d = new Date(currentInvoice().createdAt);
    return `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const receiptUpiUrl = () => {
    const t = tenant();
    if (!t?.upiVpa) return '';
    const total = currentInvoice().grandTotal;
    const payee = encodeURIComponent(t.upiPayeeName || t.name);
    const uri = `upi://pay?pa=${t.upiVpa}&pn=${payee}&am=${total}&cu=INR&tn=${currentInvoice().invoiceNumber}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(uri)}`;
  };

  return (
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Controls (Not printed) */}
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 print:hidden">
          <div class="flex items-center gap-2 font-bold text-sm">
            <Show
              when={currentInvoice().paymentStatus === 'COMPLETED'}
              fallback={
                <div class="flex items-center gap-2 text-amber-700">
                  <Clock class="w-5 h-5 text-amber-600" />
                  <span>Bill Created (Payment Pending)</span>
                </div>
              }
            >
              <div class="flex items-center gap-2 text-emerald-700">
                <CheckCircle class="w-5 h-5" />
                <span>Payment Done • Bill Completed</span>
              </div>
            </Show>
          </div>
          <button onClick={props.onClose} class="text-slate-400 hover:text-slate-600 font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Pending Payment Warning & 1-Click Mark Done Banner */}
        <Show when={currentInvoice().paymentStatus === 'PENDING'}>
          <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 print:hidden">
            <div class="flex items-center gap-2">
              <Clock class="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p class="font-bold">Payment Not Received Yet</p>
                <p class="text-[10px] text-amber-700">This bill is excluded from total sales until marked done.</p>
              </div>
            </div>
            <button
              onClick={handleMarkPaymentDone}
              disabled={isUpdatingStatus()}
              class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <CheckCircle class="w-3.5 h-3.5" />
              {isUpdatingStatus() ? 'Updating...' : 'Mark Done'}
            </button>
          </div>
        </Show>

        {/* Action Buttons (Not printed) */}
        <div class="space-y-2 print:hidden">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handlePrint}
              class="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              title="Print Thermal Bill (Ctrl+P)"
            >
              <Printer class="w-4 h-4 shrink-0" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              class="py-2.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              title="Download PDF Bill Copy"
            >
              <FileDown class="w-4 h-4 shrink-0" />
              <span>PDF Bill</span>
            </button>

            <button
              onClick={handleSharePdf}
              disabled={isSharing()}
              class="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              title="Send or Share PDF Bill on WhatsApp"
            >
              <MessageCircle class="w-4 h-4 shrink-0" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={props.onClose}
              class="py-2.5 px-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center"
            >
              Done (F2)
            </button>
          </div>

          {/* Quick WhatsApp input if buyer phone wasn't set earlier */}
          <Show when={!currentInvoice().customerPhone}>
            <div class="p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs">
              <MessageCircle class="w-4 h-4 text-emerald-600 shrink-0" />
              <input
                type="tel"
                placeholder="Send PDF to WhatsApp mobile no..."
                value={customPhone()}
                onInput={(e) => setCustomPhone(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customPhone().trim().length >= 10) {
                    handleSharePdf();
                  }
                }}
                class="flex-1 p-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-mono"
              />
              <button
                onClick={handleSharePdf}
                disabled={customPhone().trim().length < 10 || isSharing()}
                class={`px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs ${
                  customPhone().trim().length < 10 ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                Send PDF
              </button>
            </div>
          </Show>
        </div>

        {/* THERMAL RECEIPT CONTAINER (Target for Print Engine) */}
        <div id="thermal-receipt" class="bg-white p-4 border border-dashed border-slate-300 rounded-lg text-slate-900 font-mono text-[11px] leading-tight space-y-3">
          
          {/* Header */}
          <div class="text-center space-y-1">
            <Show when={tenant()?.logoUrl}>
              <img src={tenant()?.logoUrl} alt="Logo" class="w-12 h-12 mx-auto rounded object-cover mb-1" />
            </Show>
            <h2 class="text-sm font-black uppercase tracking-wider">{tenant()?.name}</h2>
            <Show when={tenant()?.legalName}>
              <p class="text-[10px] text-slate-500">{tenant()?.legalName}</p>
            </Show>
            <p class="text-[10px] text-slate-600">{tenant()?.address}, {tenant()?.city}</p>
            <p class="text-[10px] font-bold">Phone: {tenant()?.phone}</p>
            
            <Show when={tenant()?.hasGst && tenant()?.gstin}>
              <p class="text-[10px] font-bold text-slate-900">GSTIN: {tenant()?.gstin}</p>
              <div class="mt-1 border-y border-dashed border-slate-300 py-0.5 font-bold uppercase text-[10px]">
                TAX INVOICE
              </div>
            </Show>
            <Show when={!tenant()?.hasGst}>
              <div class="mt-1 border-y border-dashed border-slate-300 py-0.5 font-bold uppercase text-[10px]">
                RETAIL CASH MEMO
              </div>
            </Show>
          </div>

          {/* Invoice Meta */}
          <div class="border-b border-dashed border-slate-300 pb-2 text-[10px] space-y-0.5">
            <div class="flex justify-between">
              <span>Bill No: <b>{currentInvoice().invoiceNumber}</b></span>
              <span>{formattedDate()}</span>
            </div>
            <Show when={currentInvoice().customerName || currentInvoice().customerPhone}>
              <div class="flex justify-between">
                <span>Buyer: <b>{currentInvoice().customerName || 'Customer'}</b></span>
                <span class="font-bold">{currentInvoice().customerPhone || ''}</span>
              </div>
            </Show>
            <div class="flex justify-between text-slate-500">
              <span>Payment: <b>{currentInvoice().paymentMode}</b></span>
              <span class={currentInvoice().paymentStatus === 'COMPLETED' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                {currentInvoice().paymentStatus === 'COMPLETED' ? 'STATUS: PAID (DONE)' : 'STATUS: PAYMENT PENDING'}
              </span>
            </div>
          </div>

          {/* Itemized Table */}
          <div class="space-y-1">
            <div class="flex justify-between font-bold border-b border-dashed border-slate-300 pb-1 text-[10px] uppercase text-slate-700">
              <span class="flex-1 pr-2">Item Description</span>
              <span class="w-8 text-center shrink-0">Qty</span>
              <span class="w-12 text-right shrink-0">Rate</span>
              <span class="w-14 text-right shrink-0">Total</span>
            </div>

            <For each={currentInvoice().items}>
              {(item) => (
                <div class="flex justify-between items-start text-[10px] py-1 border-b border-dotted border-slate-200/70">
                  <div class="flex-1 pr-2 min-w-0 break-words whitespace-normal leading-snug">
                    <span class="font-bold text-slate-900 block break-words whitespace-normal">{item.productName}</span>
                    <Show when={item.discountPercent > 0}>
                      <span class="text-[9px] text-rose-600 block font-normal">(-{item.discountPercent}% off)</span>
                    </Show>
                  </div>
                  <span class="w-8 text-center font-bold text-slate-700 shrink-0">{item.quantity}</span>
                  <span class="w-12 text-right text-slate-600 shrink-0">₹{item.unitPrice.toFixed(2)}</span>
                  <span class="w-14 text-right font-bold text-slate-900 shrink-0">₹{item.totalAmount.toFixed(2)}</span>
                </div>
              )}
            </For>
          </div>

          {/* Calculations Summary */}
          <div class="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[10px]">
            <div class="flex justify-between">
              <span>Gross Subtotal:</span>
              <span>₹{currentInvoice().subtotal.toFixed(2)}</span>
            </div>

            <Show when={currentInvoice().itemDiscountTotal > 0}>
              <div class="flex justify-between">
                <span>Item Discount:</span>
                <span>-₹{currentInvoice().itemDiscountTotal.toFixed(2)}</span>
              </div>
            </Show>

            <Show when={currentInvoice().billDiscountAmount > 0}>
              <div class="flex justify-between">
                <span>Bill Discount:</span>
                <span>-₹{currentInvoice().billDiscountAmount.toFixed(2)}</span>
              </div>
            </Show>

            <Show when={currentInvoice().couponDiscountAmount > 0}>
              <div class="flex justify-between">
                <span>Coupon ({currentInvoice().couponCode}):</span>
                <span>-₹{currentInvoice().couponDiscountAmount.toFixed(2)}</span>
              </div>
            </Show>

            <Show when={currentInvoice().loyaltyDiscountAmount > 0}>
              <div class="flex justify-between">
                <span>Loyalty Redeemed:</span>
                <span>-₹{currentInvoice().loyaltyDiscountAmount.toFixed(2)}</span>
              </div>
            </Show>

            {/* Final Grand Total in Bold */}
            <div class="flex justify-between text-sm font-black border-y border-dashed border-slate-400 py-1 mt-1">
              <span>TOTAL AMOUNT:</span>
              <span>₹{currentInvoice().grandTotal.toFixed(2)}</span>
            </div>

            <Show when={currentInvoice().paymentMode === 'CASH' && currentInvoice().cashTendered > 0}>
              <div class="flex justify-between text-[10px] text-slate-600">
                <span>Cash Tendered: ₹{currentInvoice().cashTendered.toFixed(2)}</span>
                <span>Change Returned: ₹{currentInvoice().changeReturned.toFixed(2)}</span>
              </div>
            </Show>
          </div>

          {/* Tax Breakdown (Only if GST is enabled) */}
          <Show when={tenant()?.hasGst && (props.invoice.cgstAmount > 0 || props.invoice.sgstAmount > 0)}>
            <div class="border-t border-dashed border-slate-200 pt-1 text-[9px] text-slate-600 space-y-0.5">
              <div class="flex justify-between font-bold">
                <span>GST Breakdown</span>
                <span>CGST: ₹{props.invoice.cgstAmount.toFixed(2)} | SGST: ₹{props.invoice.sgstAmount.toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span>Taxable Value: ₹{props.invoice.taxableAmount.toFixed(2)}</span>
                <span>Total Tax: ₹{(props.invoice.cgstAmount + props.invoice.sgstAmount).toFixed(2)}</span>
              </div>
            </div>
          </Show>

          {/* Dynamic UPI QR Code for instant scan / verification */}
          <Show when={tenant()?.upiVpa && receiptUpiUrl()}>
            <div class="text-center pt-2 border-t border-dashed border-slate-300">
              <img src={receiptUpiUrl()} alt="Scan & Pay" class="w-24 h-24 mx-auto object-contain" />
              <p class="text-[9px] font-bold mt-0.5">Scan with UPI to Pay / Verify</p>
            </div>
          </Show>

          {/* Footer greeting */}
          <div class="text-center pt-2 text-[10px] text-slate-500">
            <p>{tenant()?.invoiceFooter || 'Thank you! Visit again.'}</p>
            <p class="text-[8px] mt-1 text-slate-400">Powered by Billease Retail OS</p>
          </div>

        </div>

      </div>
    </div>
  );
};

