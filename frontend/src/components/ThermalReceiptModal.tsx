import { Component, For, Show, createSignal } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { Invoice } from '../types';
import { Printer, CheckCircle, MessageCircle } from 'lucide-solid';

interface ThermalReceiptModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const ThermalReceiptModal: Component<ThermalReceiptModalProps> = (props) => {
  const { tenant } = useAuth();
  const [customPhone, setCustomPhone] = createSignal('');

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = () => {
    const d = new Date(props.invoice.createdAt);
    return `${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getWhatsappMessage = () => {
    const t = tenant();
    const itemsSummary = props.invoice.items?.map(it => `• ${it.quantity}x ${it.productName} - ₹${it.totalAmount.toFixed(2)}`).join('\n') || '';
    return `🧾 *${t?.name || 'Store'}*\nBill No: ${props.invoice.invoiceNumber}\nDate: ${formattedDate()}\nBuyer: ${props.invoice.customerName || 'Customer'}\n--------------------------\nItems:\n${itemsSummary}\n--------------------------\nGrand Total: *₹${props.invoice.grandTotal.toFixed(2)}*\nPayment Mode: ${props.invoice.paymentMode}\n--------------------------\nThank you for shopping with us! 🙏`;
  };

  const whatsappUrl = () => {
    const phone = (props.invoice.customerPhone || customPhone()).replace(/[^0-9]/g, '');
    const target = phone.length === 10 ? `91${phone}` : phone;
    return `https://wa.me/${target}?text=${encodeURIComponent(getWhatsappMessage())}`;
  };

  const receiptUpiUrl = () => {
    const t = tenant();
    if (!t?.upiVpa) return '';
    const total = props.invoice.grandTotal;
    const payee = encodeURIComponent(t.upiPayeeName || t.name);
    const uri = `upi://pay?pa=${t.upiVpa}&pn=${payee}&am=${total}&cu=INR&tn=${props.invoice.invoiceNumber}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(uri)}`;
  };

  return (
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Controls (Not printed) */}
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 print:hidden">
          <div class="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <CheckCircle class="w-5 h-5" />
            <span>Bill Generated Successfully!</span>
          </div>
          <button onClick={props.onClose} class="text-slate-400 hover:text-slate-600 font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Action Buttons (Not printed) */}
        <div class="space-y-2 print:hidden">
          <div class="flex items-center gap-2">
            <button
              onClick={handlePrint}
              class="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Printer class="w-4 h-4" />
              Print Thermal Bill (Ctrl+P)
            </button>

            <Show when={props.invoice.customerPhone}>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <MessageCircle class="w-4 h-4" />
                WhatsApp Copy
              </a>
            </Show>

            <button
              onClick={props.onClose}
              class="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors"
            >
              Done (F2)
            </button>
          </div>

          {/* Quick WhatsApp input if buyer phone wasn't set earlier */}
          <Show when={!props.invoice.customerPhone}>
            <div class="p-2 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs">
              <MessageCircle class="w-4 h-4 text-emerald-600 shrink-0" />
              <input
                type="tel"
                placeholder="Send copy to WhatsApp mobile no..."
                value={customPhone()}
                onInput={(e) => setCustomPhone(e.currentTarget.value)}
                class="flex-1 p-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-mono"
              />
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                class={`px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs ${
                  customPhone().trim().length < 10 ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                Send
              </a>
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
              <span>Bill No: <b>{props.invoice.invoiceNumber}</b></span>
              <span>{formattedDate()}</span>
            </div>
            <Show when={props.invoice.customerName || props.invoice.customerPhone}>
              <div class="flex justify-between">
                <span>Buyer: <b>{props.invoice.customerName || 'Customer'}</b></span>
                <span class="font-bold">{props.invoice.customerPhone || ''}</span>
              </div>
            </Show>
            <div class="flex justify-between text-slate-500">
              <span>Payment: <b>{props.invoice.paymentMode}</b></span>
              <span>Cashier: {props.invoice.cashierName || 'Counter'}</span>
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

            <For each={props.invoice.items}>
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
              <span>₹{props.invoice.subtotal.toFixed(2)}</span>
            </div>

            <Show when={props.invoice.itemDiscountTotal > 0}>
              <div class="flex justify-between">
                <span>Item Discount:</span>
                <span>-₹{props.invoice.itemDiscountTotal.toFixed(2)}</span>
              </div>
            </Show>

            <Show when={props.invoice.billDiscountAmount > 0}>
              <div class="flex justify-between">
                <span>Bill Discount:</span>
                <span>-₹{props.invoice.billDiscountAmount.toFixed(2)}</span>
              </div>
            </Show>

            <Show when={props.invoice.couponDiscountAmount > 0}>
              <div class="flex justify-between">
                <span>Coupon ({props.invoice.couponCode}):</span>
                <span>-₹{props.invoice.couponDiscountAmount.toFixed(2)}</span>
              </div>
            </Show>

            <Show when={props.invoice.loyaltyDiscountAmount > 0}>
              <div class="flex justify-between">
                <span>Loyalty Redeemed:</span>
                <span>-₹{props.invoice.loyaltyDiscountAmount.toFixed(2)}</span>
              </div>
            </Show>

            {/* Final Grand Total in Bold */}
            <div class="flex justify-between text-sm font-black border-y border-dashed border-slate-400 py-1 mt-1">
              <span>TOTAL AMOUNT:</span>
              <span>₹{props.invoice.grandTotal.toFixed(2)}</span>
            </div>

            <Show when={props.invoice.paymentMode === 'CASH' && props.invoice.cashTendered > 0}>
              <div class="flex justify-between text-[10px] text-slate-600">
                <span>Cash Tendered: ₹{props.invoice.cashTendered.toFixed(2)}</span>
                <span>Change Returned: ₹{props.invoice.changeReturned.toFixed(2)}</span>
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

