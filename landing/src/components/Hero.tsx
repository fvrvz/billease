import { Component } from "solid-js";
import {
  Sparkles,
  Zap,
  Receipt,
  QrCode,
  Play,
  ArrowRight,
  CheckCircle2,
} from "lucide-solid";

interface HeroProps {
  onOpenDemo: () => void;
  onScrollToDemo: () => void;
}

export const Hero: Component<HeroProps> = (props) => {
  return (
    <section class="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background radial gradients */}
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10 radial-glow" />
      <div class="absolute -top-40 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div class="absolute top-60 left-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Pill Badge */}
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-6 shadow-sm glow-pill">
          <Sparkles class="w-3.5 h-3.5 text-emerald-400" />
          <span>Next-Gen Indian Retail Billing & Khata Engine</span>
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Main Heading */}
        <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] max-w-5xl mx-auto">
          Retail Billing at the Speed of Light.{" "}
          <span class="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
            Zero Hardware Lock-in.
          </span>
        </h1>

        {/* Subtitle */}
        <p class="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
          Engineered for Indian Supermarkets, Kirana General Stores, and Pharmacies.
          Generate GST-compliant bills in under 2 seconds, accept dynamic UPI payments,
          manage customer Khata / Udhaar ledgers, and dispatch clean PDF receipts straight to customer WhatsApp.
        </p>

        {/* CTA Buttons */}
        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={props.onOpenDemo}
            class="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-extrabold text-sm transition-all shadow-xl shadow-emerald-500/20 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <span>Book a Personalized Demo</span>
            <ArrowRight class="w-4 h-4" />
          </button>

          <button
            onClick={props.onScrollToDemo}
            class="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700/80 transition-all hover:scale-[1.02] flex items-center justify-center gap-2.5 backdrop-blur-sm"
          >
            <Play class="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span>Try Interactive Simulator</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div class="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-semibold text-slate-400">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-400" />
            <span>100% GST & Composition Scheme</span>
          </div>
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-400" />
            <span>ESC/POS 58mm & 80mm Printing</span>
          </div>
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-400" />
            <span>Customer Khata & Udhaar Tracking</span>
          </div>
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-400" />
            <span>Self-Hostable on Docker / Cloud</span>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div class="mt-14 relative max-w-5xl mx-auto rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-slate-700/40 via-slate-800/20 to-transparent border border-slate-700/60 shadow-2xl backdrop-blur-xl">
          <div class="rounded-2xl bg-slate-900 overflow-hidden border border-slate-800 shadow-inner">
            {/* Mock Top bar */}
            <div class="px-4 py-3 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span class="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span class="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span class="ml-2 font-mono text-[11px] text-slate-400">billease.app/pos — Counter #1</span>
              </div>
              <div class="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                <span class="text-emerald-400 font-bold">● ONLINE</span>
                <span>F2 Search</span>
                <span>F4 Cash</span>
                <span>F5 UPI</span>
              </div>
            </div>

            {/* Mock App Preview Grid */}
            <div class="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800 text-left">
              {/* Product catalog preview */}
              <div class="md:col-span-7 p-5 bg-slate-900/60">
                <div class="flex items-center justify-between mb-4">
                  <div class="space-y-0.5">
                    <p class="text-xs font-bold text-slate-300 uppercase tracking-wider">Quick Pick Items</p>
                    <p class="text-[11px] text-slate-500">Tap or scan barcode to add to bill</p>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    54 Products in Stock
                  </span>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div class="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-emerald-500/50 transition-colors cursor-pointer group">
                    <span class="text-[10px] text-slate-400 font-mono">GROCERY</span>
                    <p class="text-xs font-bold text-white mt-0.5 group-hover:text-emerald-400">Tata Salt 1kg</p>
                    <div class="flex items-center justify-between mt-2">
                      <span class="text-xs font-black text-emerald-400">₹28</span>
                      <span class="text-[10px] line-through text-slate-500">₹30</span>
                    </div>
                  </div>

                  <div class="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-emerald-500/50 transition-colors cursor-pointer group">
                    <span class="text-[10px] text-slate-400 font-mono">DAIRY</span>
                    <p class="text-xs font-bold text-white mt-0.5 group-hover:text-emerald-400">Amul Butter 500g</p>
                    <div class="flex items-center justify-between mt-2">
                      <span class="text-xs font-black text-emerald-400">₹275</span>
                      <span class="text-[10px] text-slate-500 font-mono">GST 12%</span>
                    </div>
                  </div>

                  <div class="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 hover:border-emerald-500/50 transition-colors cursor-pointer group">
                    <span class="text-[10px] text-slate-400 font-mono">STAPLE</span>
                    <p class="text-xs font-bold text-white mt-0.5 group-hover:text-emerald-400">Aashirvaad Atta 5kg</p>
                    <div class="flex items-center justify-between mt-2">
                      <span class="text-xs font-black text-emerald-400">₹245</span>
                      <span class="text-[10px] text-slate-500 font-mono">GST 5%</span>
                    </div>
                  </div>
                </div>

                {/* Hotkeys strip */}
                <div class="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <div class="flex items-center gap-2">
                    <Zap class="w-4 h-4 text-amber-400" />
                    <span>Instant Khata Udhaar Sync</span>
                  </div>
                  <span class="text-slate-500">Auto-calculated CGST/SGST</span>
                </div>
              </div>

              {/* Receipt & Bill Summary preview */}
              <div class="md:col-span-5 p-5 bg-slate-950/50 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt class="w-4 h-4 text-emerald-400" />
                      Active Bill #INV-00142
                    </span>
                    <span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      PAID (UPI)
                    </span>
                  </div>

                  <div class="mt-3 space-y-2 text-xs">
                    <div class="flex justify-between text-slate-300">
                      <span>Tata Salt 1kg × 2</span>
                      <span class="font-mono">₹56.00</span>
                    </div>
                    <div class="flex justify-between text-slate-300">
                      <span>Amul Butter 500g × 1</span>
                      <span class="font-mono">₹275.00</span>
                    </div>
                    <div class="flex justify-between text-slate-300">
                      <span>Aashirvaad Atta 5kg × 1</span>
                      <span class="font-mono">₹245.00</span>
                    </div>
                  </div>

                  <div class="mt-4 pt-3 border-t border-slate-800 space-y-1 text-xs text-slate-400">
                    <div class="flex justify-between">
                      <span>Subtotal</span>
                      <span class="font-mono text-slate-300">₹576.00</span>
                    </div>
                    <div class="flex justify-between">
                      <span>CGST + SGST (Included)</span>
                      <span class="font-mono text-slate-300">₹39.20</span>
                    </div>
                    <div class="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                      <span>Grand Total</span>
                      <span class="text-emerald-400 font-mono">₹576.00</span>
                    </div>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span class="flex items-center gap-1">
                    <QrCode class="w-3.5 h-3.5 text-indigo-400" />
                    Dynamic BharatPe / PhonePe QR
                  </span>
                  <span class="text-emerald-400 font-bold">WhatsApp PDF Sent ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Counters */}
        <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <p class="text-3xl font-black text-emerald-400">1.8s</p>
            <p class="text-xs text-slate-400 mt-1 font-medium">Avg. Checkout Speed</p>
          </div>
          <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <p class="text-3xl font-black text-white">0%</p>
            <p class="text-xs text-slate-400 mt-1 font-medium">Cloud Lock-in</p>
          </div>
          <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <p class="text-3xl font-black text-teal-300">100%</p>
            <p class="text-xs text-slate-400 mt-1 font-medium">GST & Composition Ready</p>
          </div>
          <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <p class="text-3xl font-black text-indigo-400">58/80</p>
            <p class="text-xs text-slate-400 mt-1 font-medium">mm Thermal Widths</p>
          </div>
        </div>
      </div>
    </section>
  );
};
