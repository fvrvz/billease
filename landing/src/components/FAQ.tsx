import { Component, createSignal, For, Show } from "solid-js";
import { ChevronDown, HelpCircle } from "lucide-solid";

export const FAQ: Component = () => {
  const [openIndex, setOpenIndex] = createSignal<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex() === idx ? null : idx);
  };

  const faqs = [
    {
      q: "Do I need special expensive POS hardware or can I use my existing PC?",
      a: "No special hardware required! Billease runs seamlessly in any web browser on any standard desktop PC, laptop, or Android tablet. It works directly with standard USB/Bluetooth handheld barcode scanners and ESC/POS thermal printers (both 58mm and 80mm).",
    },
    {
      q: "What happens if our broadband or WiFi connection disconnects during a rush?",
      a: "Billease features a client-side Stale-While-Revalidate (SWR) cache and local persistence layer. Your cashiers can continue searching products, building carts, and ringing up sales without screen lockups or blank screens.",
    },
    {
      q: "How does the WhatsApp PDF invoice delivery work?",
      a: "When entering a customer's mobile number at checkout, Billease compiles a crisp, high-resolution PDF invoice (with your store logo, GSTIN, and line-item breakdown) and sends it straight to the customer's WhatsApp in one click.",
    },
    {
      q: "Is Billease compliant with Indian GST laws and composition schemes?",
      a: "Yes, 100%. Billease natively supports CGST, SGST, and IGST breakdowns, multi-tier tax slabs (0%, 5%, 12%, 18%, 28%), statutory HSN codes, and a dedicated toggle for Composition Scheme stores who don't charge tax to end-consumers.",
    },
    {
      q: "Can cashiers delete or manipulate historical sales records?",
      a: "No. Role-based access control strictly isolates cashier permissions. Cashiers can only ring up active sales and accept payments. Only authorized Store Owners or SuperAdmins can view full financial audits or configure store settings.",
    },
    {
      q: "Can we self-host Billease on our own premises or private cloud?",
      a: "Absolutely. Billease is 100% dockerized with reproducible Docker Compose files. You can deploy it to your local in-store server or any cloud VPS (AWS, DigitalOcean, Hetzner) with zero external cloud dependencies.",
    },
  ];

  return (
    <section id="faq" class="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-3">
          <HelpCircle class="w-3.5 h-3.5" />
          <span>Got Questions?</span>
        </div>
        <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Frequently Asked Questions
        </h2>
        <p class="mt-4 text-slate-400 text-sm sm:text-base">
          Clear answers to common questions about setup, hardware compatibility, and billing.
        </p>
      </div>

      <div class="space-y-3">
        <For each={faqs}>
          {(faq, idx) => (
            <div class="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden transition-colors">
              <button
                onClick={() => toggle(idx())}
                class="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-white text-sm sm:text-base hover:text-emerald-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  class={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    openIndex() === idx() ? "rotate-180 text-emerald-400" : ""
                  }`}
                />
              </button>
              <Show when={openIndex() === idx()}>
                <div class="px-5 pb-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
    </section>
  );
};
