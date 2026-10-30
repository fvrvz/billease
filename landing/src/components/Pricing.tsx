import { Component } from "solid-js";
import { Check, ArrowRight } from "lucide-solid";

interface PricingProps {
  onOpenDemo: () => void;
}

export const Pricing: Component<PricingProps> = (props) => {
  const plans = [
    {
      name: "Starter / Community",
      price: "₹0",
      period: "free forever",
      desc: "Perfect for single-counter corner grocery stores and small kiosks.",
      features: [
        "1 Store Location",
        "Up to 2 Counter Cashiers",
        "Fast POS Billing & Barcode Scanning",
        "Standard 58mm Thermal Printing",
        "Basic GST Invoicing",
        "Community Support on GitHub",
      ],
      cta: "Get Started Free",
      highlighted: false,
    },
    {
      name: "Retail Pro",
      price: "₹799",
      period: "/ store / month",
      desc: "For busy retail shops, supermarkets, and pharmacies demanding full automation.",
      features: [
        "Unlimited Counter Cashiers",
        "WhatsApp Direct PDF Invoicing",
        "Dynamic BharatPe/PhonePe UPI QR",
        "Customer Khata & Udhaar Tracking",
        "Customer Loyalty Points & Coupons",
        "Custom Logo Upload & Brand Receipts",
        "58mm & 80mm ESC/POS Thermal",
        "Priority WhatsApp Support",
      ],
      cta: "Start 14-Day Free Trial",
      highlighted: true,
      badge: "Most Popular",
    },
    {
      name: "Multi-Store Enterprise",
      price: "₹2,499",
      period: "/ month (up to 5 stores)",
      desc: "For retail chains and multi-branch pharmacy or grocery franchises.",
      features: [
        "Up to 5 Store Branches Included",
        "SuperAdmin Centralized Dashboard",
        "Consolidated Financial & Sales Ledger",
        "OIDC Single Sign-On (AuthForest/Keycloak)",
        "Dedicated Database Instance",
        "Custom Feature Development SLA",
        "On-premise / Private Cloud Setup",
      ],
      cta: "Schedule Enterprise Demo",
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <span class="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          Transparent Pricing
        </span>
        <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight mt-3">
          Simple Plans. Zero Surprise Hidden Fees.
        </h2>
        <p class="mt-4 text-slate-400 text-sm sm:text-base">
          Start for free, scale when your store grows. No hardware lock-in or proprietary device rentals.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => (
          <div
            class={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
              plan.highlighted
                ? "bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 md:scale-105 z-10"
                : "bg-slate-900/60 border border-slate-800 hover:border-slate-700"
            }`}
          >
            {plan.badge && (
              <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-md">
                {plan.badge}
              </div>
            )}

            <div>
              <h3 class="text-xl font-bold text-white">{plan.name}</h3>
              <p class="text-xs text-slate-400 mt-2 min-h-[36px]">{plan.desc}</p>

              <div class="mt-6 flex items-baseline gap-2">
                <span class="text-4xl sm:text-5xl font-black text-white font-mono">
                  {plan.price}
                </span>
                <span class="text-xs text-slate-400 font-medium">{plan.period}</span>
              </div>

              <div class="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Included Features:
                </p>
                {plan.features.map((feat) => (
                  <div class="flex items-center gap-2.5 text-xs text-slate-300">
                    <Check class="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={props.onOpenDemo}
              class={`mt-8 w-full py-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                plan.highlighted
                  ? "bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/25 hover:scale-[1.02]"
                  : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              }`}
            >
              <span>{plan.cta}</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
