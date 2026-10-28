import { Component, createSignal, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { PaymentMode, PaymentStatus } from '../types';
import { Banknote, QrCode, CreditCard, BookOpen, CheckCircle, Clock, X } from 'lucide-solid';

interface PaymentProcessModalProps {
  amount: number;
  initialMode: PaymentMode;
  buyerName?: string;
  buyerPhone?: string;
  selectedCustomerName?: string;
  onConfirm: (mode: PaymentMode, status: PaymentStatus, cashTendered?: number) => void;
  onClose: () => void;
}

export const PaymentProcessModal: Component<PaymentProcessModalProps> = (props) => {
  const { tenant } = useAuth();
  const [activeMode, setActiveMode] = createSignal<PaymentMode>(props.initialMode);
  const [cashTendered, setCashTendered] = createSignal<number>(props.amount);

  const changeReturn = () => {
    return Math.max(0, (cashTendered() || 0) - props.amount);
  };

  const upiQrUrl = () => {
    const t = tenant();
    if (!t) return '';
    const upiVpa = t.upiVpa || 'store@upi';
    const upiPayee = encodeURIComponent(t.upiPayeeName || t.name);
    const invoiceNumHint = `${t.invoicePrefix}-${Date.now() % 100000}`;
    const uri = `upi://pay?pa=${upiVpa}&pn=${upiPayee}&am=${props.amount}&cu=INR&tn=Bill-${invoiceNumHint}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(uri)}`;
  };

  const handleDone = () => {
    props.onConfirm(activeMode(), 'COMPLETED', activeMode() === 'CASH' ? cashTendered() : props.amount);
  };

  const handlePending = () => {
    props.onConfirm(activeMode(), 'PENDING', activeMode() === 'CASH' ? cashTendered() : 0);
  };

  return (
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
        
        {/* Top Header */}
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 class="text-base font-black text-slate-900 tracking-tight">Payment Confirmation</h2>
            <p class="text-xs text-slate-500">Only completed payments are counted in total sell ledger.</p>
          </div>
          <button onClick={props.onClose} class="text-slate-400 hover:text-slate-600 font-bold p-1">
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Amount Due Banner */}
        <div class="p-3.5 bg-slate-900 rounded-2xl text-center text-white">
          <span class="text-xs text-slate-300 font-semibold uppercase tracking-wider block">Total Amount Due</span>
          <span class="text-3xl font-black text-emerald-400">₹{props.amount.toFixed(2)}</span>
          <Show when={props.buyerName || props.selectedCustomerName}>
            <p class="text-xs text-slate-300 mt-1">
              Customer: <b class="text-white">{props.buyerName || props.selectedCustomerName}</b>
              {props.buyerPhone ? ` (+91 ${props.buyerPhone})` : ''}
            </p>
          </Show>
        </div>

        {/* Mode Selector Tabs */}
        <div class="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveMode('CASH')}
            class={`py-2 text-xs font-bold rounded-lg flex flex-col items-center gap-1 transition-all ${
              activeMode() === 'CASH'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Banknote class="w-4 h-4" />
            <span>Cash</span>
          </button>

          <button
            onClick={() => setActiveMode('UPI')}
            class={`py-2 text-xs font-bold rounded-lg flex flex-col items-center gap-1 transition-all ${
              activeMode() === 'UPI'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode class="w-4 h-4" />
            <span>UPI QR</span>
          </button>

          <button
            onClick={() => setActiveMode('CARD')}
            class={`py-2 text-xs font-bold rounded-lg flex flex-col items-center gap-1 transition-all ${
              activeMode() === 'CARD'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard class="w-4 h-4" />
            <span>Card</span>
          </button>

          <button
            onClick={() => setActiveMode('CREDIT_KHATA')}
            class={`py-2 text-xs font-bold rounded-lg flex flex-col items-center gap-1 transition-all ${
              activeMode() === 'CREDIT_KHATA'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen class="w-4 h-4" />
            <span>Udhaar</span>
          </button>
        </div>

        {/* Dynamic Panel Content for Selected Mode */}
        
        {/* 1. CASH CONTENT */}
        <Show when={activeMode() === 'CASH'}>
          <div class="space-y-3 bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-emerald-950">Cash Received from Buyer:</label>
              <div class="flex items-center gap-1 text-xs">
                <span class="font-mono text-emerald-800">₹</span>
                <input
                  type="number"
                  value={cashTendered()}
                  onInput={(e) => setCashTendered(Number(e.currentTarget.value) || 0)}
                  class="w-28 p-1.5 bg-white border border-emerald-300 rounded-lg text-right font-black text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick Currency Chip Presets */}
            <div class="flex items-center gap-1.5 justify-end flex-wrap">
              <button
                type="button"
                onClick={() => setCashTendered(props.amount)}
                class="px-2 py-1 bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-md text-[10px] font-bold"
              >
                Exact
              </button>
              <button
                type="button"
                onClick={() => setCashTendered(100)}
                class="px-2 py-1 bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-md text-[10px] font-bold"
              >
                ₹100
              </button>
              <button
                type="button"
                onClick={() => setCashTendered(200)}
                class="px-2 py-1 bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-md text-[10px] font-bold"
              >
                ₹200
              </button>
              <button
                type="button"
                onClick={() => setCashTendered(500)}
                class="px-2 py-1 bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-md text-[10px] font-bold"
              >
                ₹500
              </button>
              <button
                type="button"
                onClick={() => setCashTendered(2000)}
                class="px-2 py-1 bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-md text-[10px] font-bold"
              >
                ₹2000
              </button>
            </div>

            {/* Change to return */}
            <div class="flex items-center justify-between pt-2 border-t border-emerald-200/60 text-xs">
              <span class="text-emerald-900 font-semibold">Change to Return:</span>
              <span class={`font-black text-sm ${changeReturn() > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                ₹{changeReturn().toFixed(2)}
              </span>
            </div>
          </div>
        </Show>

        {/* 2. UPI CONTENT */}
        <Show when={activeMode() === 'UPI'}>
          <div class="space-y-2 bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 text-center">
            <div class="flex justify-center">
              <img
                src={upiQrUrl()}
                alt="Scan to Pay UPI QR"
                class="w-40 h-40 rounded-xl object-contain border border-indigo-200 bg-white p-2"
              />
            </div>
            <div class="text-[11px] text-indigo-900 font-medium">
              <span>{tenant()?.upiPayeeName || tenant()?.name} • <b>{tenant()?.upiVpa}</b></span>
              <p class="text-[10px] text-slate-500 mt-0.5">Customer scans using GPay, PhonePe, Paytm, or BHIM</p>
            </div>
          </div>
        </Show>

        {/* 3. CARD CONTENT */}
        <Show when={activeMode() === 'CARD'}>
          <div class="space-y-2 bg-purple-50/60 p-4 rounded-2xl border border-purple-100 text-center">
            <CreditCard class="w-8 h-8 text-purple-600 mx-auto" />
            <h4 class="font-bold text-purple-950 text-sm">Swipe or Tap Card on Terminal</h4>
            <p class="text-xs text-purple-800">Process ₹{props.amount.toFixed(2)} on your POS Card machine.</p>
          </div>
        </Show>

        {/* 4. UDHAAR / KHATA CONTENT */}
        <Show when={activeMode() === 'CREDIT_KHATA'}>
          <div class="space-y-2 bg-amber-50/60 p-4 rounded-2xl border border-amber-100 text-center">
            <BookOpen class="w-8 h-8 text-amber-600 mx-auto" />
            <h4 class="font-bold text-amber-950 text-sm">Record to Khata Credit (Udhaar)</h4>
            <p class="text-xs text-amber-800">
              Customer: <b>{props.buyerName || props.selectedCustomerName || 'Selected Khata Customer'}</b>
            </p>
          </div>
        </Show>

        {/* Bottom Dual Action Buttons */}
        <div class="space-y-2 pt-2">
          {/* Action 1: Mark Payment DONE / COMPLETED */}
          <button
            type="button"
            onClick={handleDone}
            class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-98"
          >
            <CheckCircle class="w-4 h-4" />
            <span>Mark Payment Done & Generate Bill</span>
          </button>

          {/* Action 2: Generate as PENDING / UNPAID */}
          <button
            type="button"
            onClick={handlePending}
            class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Clock class="w-3.5 h-3.5 text-amber-600" />
            <span>Generate Bill (Payment Pending / Not Received Yet)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
