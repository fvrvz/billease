import { Component } from "solid-js";
import {
  Zap,
  QrCode,
  Printer,
  MessageCircle,
  BookOpen,
  ShieldCheck,
  WifiOff,
  Package,
  Layers,
  Percent,
} from "lucide-solid";

export const FeatureGrid: Component = () => {
  const features = [
    {
      icon: Zap,
      title: "Sub-2-Second Checkout",
      desc: "Blazing fast billing with global hotkeys (F2 Search, F4 Cash, F5 UPI, F6 Khata), instant barcode scanning, and auto-focus search.",
      color: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30",
    },
    {
      icon: QrCode,
      title: "Dynamic UPI Payment QR",
      desc: "Generates real-time NPCI-compliant UPI QRs for PhonePe, Paytm, and GPay embedded with the exact invoice payable amount.",
      color: "from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/30",
    },
    {
      icon: Printer,
      title: "ESC/POS Thermal Engine",
      desc: "Native support for both 58mm mini roll and 80mm standard desktop thermal printers. Multi-line product name wrapping ensures zero truncated text.",
      color: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp PDF Invoicing",
      desc: "Dispatch clean, high-resolution PDF tax invoices and retail bills directly to customer WhatsApp with customizable store branding.",
      color: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30",
    },
    {
      icon: BookOpen,
      title: "Digital Khata & Udhaar Ledger",
      desc: "Track customer credit limits, outstanding balances, record partial repayments, and reward regular customers with automatic loyalty points.",
      color: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30",
    },
    {
      icon: ShieldCheck,
      title: "Granular Role Governance",
      desc: "Multi-tenant role architecture isolating SuperAdmin retailer provisioning, Store Owner inventory controls, and restricted Cashier terminals.",
      color: "from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30",
    },
    {
      icon: WifiOff,
      title: "Stale-While-Revalidate Caching",
      desc: "Optimized client-side SWR caching layer guarantees the counter never freezes even during intermittent broadband dropouts.",
      color: "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30",
    },
    {
      icon: Percent,
      title: "Flexible Coupons & Loyalty",
      desc: "Configure flat or percentage promotional promo codes with minimum cart thresholds, maximum discount caps, and expiry dates.",
      color: "from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/30",
    },
    {
      icon: Package,
      title: "Smart Low-Stock Alerter",
      desc: "Automated thresholds alert store managers before high-velocity inventory sells out. Supports HSN codes and GST slab categorization.",
      color: "from-teal-500/20 to-teal-500/5 text-teal-400 border-teal-500/30",
    },
  ];

  return (
    <section id="features" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-3">
          <Layers class="w-3.5 h-3.5" />
          <span>Core Capabilities</span>
        </div>
        <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Everything Your Store Counter Needs to Operate Flawlessly
        </h2>
        <p class="mt-4 text-slate-400 text-sm sm:text-base">
          Built from the ground up for the unique demands of high-traffic Indian retail.
          No bloated enterprise complexity — just pure speed, reliability, and precision.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat) => (
          <div class="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all hover:translate-y-[-2px] group">
            <div
              class={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
            >
              <feat.icon class="w-6 h-6" />
            </div>
            <h3 class="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
              {feat.title}
            </h3>
            <p class="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
              {feat.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
