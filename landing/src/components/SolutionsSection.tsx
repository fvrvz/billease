import { Component, createSignal, For } from "solid-js";
import {
  Store,
  ShoppingCart,
  Pill,
  ShoppingBag,
  CheckCircle2,
} from "lucide-solid";

export const SolutionsSection: Component = () => {
  const [activeTab, setActiveTab] = createSignal<number>(0);

  const solutions = [
    {
      id: "kirana",
      title: "Kirana & Provision Stores",
      icon: Store,
      badge: "Built for Bharat",
      headline: "Ditch the paper diary. Manage Khata and bills in one screen.",
      description:
        "Designed specifically for neighbourhood retail with frequent regulars. Maintain customer balances, send WhatsApp payment reminders, and ring up sales in seconds.",
      highlights: [
        "One-click Udhaar ledger entry directly from billing screen",
        "WhatsApp bill and balance reminder alerts to customer mobile",
        "Fast weight-based and loose goods pricing",
        "Supports compact 58mm Bluetooth thermal printers",
      ],
      stats: { primary: "100%", label: "Digital Khata Accuracy", secondary: "< 2s", secondaryLabel: "Per Customer Checkout" },
    },
    {
      id: "supermarket",
      title: "Supermarkets & Marts",
      icon: ShoppingCart,
      badge: "High Throughput",
      headline: "Zero queue bottlenecks during evening peak rush hours.",
      description:
        "Multi-counter support with high-density barcode scanning, instant GST calculation, and cash drawer integration. Cashiers need zero training to get started.",
      highlights: [
        "Rapid continuous barcode scanner support with audible feedback",
        "Multi-counter cashier shift management and deactivation controls",
        "Auto-calculation of CGST, SGST, IGST across varying tax slabs",
        "Comprehensive sales ledger with CSV/Excel export",
      ],
      stats: { primary: "500+", label: "Bills / Hour / Counter", secondary: "0 ms", secondaryLabel: "Keypress Latency" },
    },
    {
      id: "pharmacy",
      title: "Pharmacies & Medicos",
      icon: Pill,
      badge: "Compliance Ready",
      headline: "Accurate HSN codes, batch tracking, and doctor invoice footers.",
      description:
        "Stay compliant with drug dispensing tax guidelines. Billease auto-prints statutory pharmacy disclaimers, store DL numbers, and tax invoice prefixes.",
      highlights: [
        "Pre-configured HSN codes for Schedule H and OTC medicines",
        "Custom footer policies (e.g. 'No returns without cash memo')",
        "Doctor and patient name capture on bill headers",
        "Composition scheme and Regular GST toggle per store",
      ],
      stats: { primary: "100%", label: "Tax Compliance", secondary: "58/80mm", secondaryLabel: "Thermal Slip Printing" },
    },
    {
      id: "retail",
      title: "Apparel & Retail Outlets",
      icon: ShoppingBag,
      badge: "Brand & Retention",
      headline: "Turn one-time shoppers into loyal regulars with reward points.",
      description:
        "Print professional branded receipts with your store logo and custom UPI QR. Reward repeat customers with automated loyalty points and festive coupons.",
      highlights: [
        "Custom store logo upload with auto-compression & aspect ratio retention",
        "Configurable loyalty point accrual (e.g. 1 point per ₹100 spent)",
        "Festival coupon engine with discount caps and minimum spend rules",
        "Split payment handling (Partial Cash + Partial UPI)",
      ],
      stats: { primary: "25%", label: "Repeat Footfall Increase", secondary: "100%", secondaryLabel: "Custom Branding" },
    },
  ];

  return (
    <section id="solutions" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <span class="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          Tailored Workflows
        </span>
        <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight mt-3">
          Customized for Your Retail Model
        </h2>
        <p class="mt-4 text-slate-400 text-sm sm:text-base">
          Whether you run a single-counter grocery corner or a busy multi-terminal supermarket,
          Billease adapts to your store's workflow.
        </p>
      </div>

      {/* Tabs Selector */}
      <div class="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 max-w-3xl mx-auto mb-12">
        <For each={solutions}>
          {(sol, idx) => (
            <button
              onClick={() => setActiveTab(idx())}
              class={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
                activeTab() === idx()
                  ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <sol.icon class="w-4 h-4" />
              <span>{sol.title.split(" ")[0]}</span>
            </button>
          )}
        </For>
      </div>

      {/* Tab Content Card */}
      {(() => {
        const current = solutions[activeTab()];
        return (
          <div class="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-slate-800 p-8 sm:p-12 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div class="lg:col-span-7 space-y-6">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <current.icon class="w-4 h-4" />
                <span>{current.badge}</span>
              </div>
              <h3 class="text-2xl sm:text-3xl font-black text-white leading-tight">
                {current.headline}
              </h3>
              <p class="text-sm text-slate-300 leading-relaxed">
                {current.description}
              </p>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <For each={current.highlights}>
                  {(item) => (
                    <div class="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  )}
                </For>
              </div>
            </div>

            <div class="lg:col-span-5 bg-slate-950/80 rounded-2xl border border-slate-800/80 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div>
                <p class="text-xs font-mono uppercase tracking-wider text-slate-500">
                  Performance & Impact
                </p>
                <div class="mt-4 grid grid-cols-2 gap-4">
                  <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <p class="text-3xl font-black text-emerald-400 font-mono">
                      {current.stats.primary}
                    </p>
                    <p class="text-xs text-slate-400 mt-1 font-medium">
                      {current.stats.label}
                    </p>
                  </div>
                  <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <p class="text-3xl font-black text-teal-300 font-mono">
                      {current.stats.secondary}
                    </p>
                    <p class="text-xs text-slate-400 mt-1 font-medium">
                      {current.stats.secondaryLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
                <p class="font-bold text-slate-200">Recommended Hardware Compatibility:</p>
                <p>• USB/Bluetooth Thermal Receipt Printer (58mm/80mm)</p>
                <p>• Standard 1D/2D Barcode Scanner (Honeywell/TVS/Datalogic)</p>
                <p>• Any Desktop PC, Laptop, Tablet, or POS Terminal</p>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
};
