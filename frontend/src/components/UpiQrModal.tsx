import { Component, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { QrCode, CheckCircle2 } from 'lucide-solid';

interface UpiQrModalProps {
  amount: number;
  upiUri: string;
  onClose: () => void;
}

export const UpiQrModal: Component<UpiQrModalProps> = (props) => {
  const { tenant } = useAuth();

  // Standard Google Chart API or QR generator URL for zero external npm heavy dependencies
  const qrImageUrl = () => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(props.upiUri)}`;
  };

  return (
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
        
        {/* Top Header */}
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <div class="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
            <QrCode class="w-4 h-4" />
            <span>Dynamic UPI QR</span>
          </div>
          <button onClick={props.onClose} class="text-slate-400 hover:text-slate-600 font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Store Name & Amount */}
        <div>
          <h3 class="font-black text-slate-900 text-lg leading-tight">
            {tenant()?.upiPayeeName || tenant()?.name}
          </h3>
          <p class="text-xs font-mono text-slate-500 mt-0.5">{tenant()?.upiVpa}</p>
          
          <div class="mt-3 py-2 px-4 bg-indigo-50/80 rounded-xl inline-block border border-indigo-100">
            <span class="text-xs text-indigo-700 font-bold block">SCAN & PAY EXACT AMOUNT</span>
            <span class="text-3xl font-black text-indigo-950">₹{props.amount.toFixed(2)}</span>
          </div>
        </div>

        {/* QR Code Canvas / Image */}
        <div class="p-3 bg-white border-2 border-dashed border-indigo-200 rounded-2xl flex items-center justify-center">
          <img
            src={qrImageUrl()}
            alt="Scan to Pay UPI QR"
            class="w-56 h-56 rounded-xl object-contain"
          />
        </div>

        {/* Accepted Apps Logos */}
        <div class="text-[11px] font-medium text-slate-500">
          <span>Accepts Google Pay • PhonePe • Paytm • BHIM • Any UPI App</span>
        </div>

        {/* Action Button */}
        <button
          onClick={props.onClose}
          class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-600/20"
        >
          <CheckCircle2 class="w-4 h-4" />
          Customer Paid (Close)
        </button>

      </div>
    </div>
  );
};

