import { Component, createSignal, For, Show } from "solid-js";
import { DemoProduct, CartItem } from "../types";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  MessageCircle,
  QrCode,
  Banknote,
  BookOpen,
  CheckCircle2,
  Receipt,
  Sparkles,
  RefreshCw,
} from "lucide-solid";

const SAMPLE_PRODUCTS: DemoProduct[] = [
  {
    id: "p1",
    name: "Tata Salt Vacuum Evaporated (1kg Pouch)",
    mrp: 30,
    sellingPrice: 28,
    unit: "PKT",
    gstRate: 0,
    category: "Grocery",
  },
  {
    id: "p2",
    name: "Amul Pasteurised Salted Butter (500g Tub)",
    mrp: 290,
    sellingPrice: 275,
    unit: "BOX",
    gstRate: 12,
    category: "Dairy",
  },
  {
    id: "p3",
    name: "Aashirvaad Superior MP Sharbati Atta (5kg)",
    mrp: 265,
    sellingPrice: 245,
    unit: "BAG",
    gstRate: 5,
    category: "Grocery",
  },
  {
    id: "p4",
    name: "Paracetamol 650mg Fast-Action Tablets (15s Strip)",
    mrp: 35,
    sellingPrice: 32,
    unit: "STRIP",
    gstRate: 12,
    category: "Pharma",
  },
  {
    id: "p5",
    name: "Fortune Sunlite Refined Sunflower Oil (1L Pouch)",
    mrp: 145,
    sellingPrice: 135,
    unit: "L",
    gstRate: 5,
    category: "Oil",
  },
  {
    id: "p6",
    name: "Maggi 2-Minute Masala Instant Noodles (4-Pack 280g)",
    mrp: 60,
    sellingPrice: 56,
    unit: "PKT",
    gstRate: 18,
    category: "Snacks",
  },
];

export const InteractiveSimulator: Component = () => {
  const [cart, setCart] = createSignal<CartItem[]>([
    { product: SAMPLE_PRODUCTS[0], quantity: 2 },
    { product: SAMPLE_PRODUCTS[1], quantity: 1 },
    { product: SAMPLE_PRODUCTS[2], quantity: 1 },
  ]);

  const [paymentMode, setPaymentMode] = createSignal<"UPI" | "CASH" | "KHATA">("UPI");
  const [thermalWidth, setThermalWidth] = createSignal<58 | 80>(80);
  const [buyerName, setBuyerName] = createSignal("Amit Joshi");
  const [buyerPhone, setBuyerPhone] = createSignal("98220 12345");
  const [sendWhatsapp, setSendWhatsapp] = createSignal(true);
  const [billGenerated, setBillGenerated] = createSignal(false);
  const [invoiceNumber] = createSignal("INV-2026-0891");

  const addToCart = (product: DemoProduct) => {
    const existing = cart().find((item) => item.product.id === product.id);
    if (existing) {
      setCart(
        cart().map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart(), { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeItem = (productId: string) => {
    setCart(cart().filter((item) => item.product.id !== productId));
  };

  const subtotal = () =>
    cart().reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

  const totalGst = () =>
    cart().reduce((sum, item) => {
      const price = item.product.sellingPrice * item.quantity;
      const gstAmt = price * (item.product.gstRate / 100);
      return sum + gstAmt;
    }, 0);

  const grandTotal = () => Math.round(subtotal() + totalGst());

  const resetSimulator = () => {
    setCart([
      { product: SAMPLE_PRODUCTS[0], quantity: 2 },
      { product: SAMPLE_PRODUCTS[1], quantity: 1 },
      { product: SAMPLE_PRODUCTS[2], quantity: 1 },
    ]);
    setBillGenerated(false);
  };

  return (
    <section id="demo-preview" class="py-24 bg-slate-900/50 relative border-y border-slate-800/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div class="text-center max-w-3xl mx-auto mb-16">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-3">
            <Sparkles class="w-3.5 h-3.5" />
            <span>Interactive Simulator</span>
          </div>
          <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Try the Billease POS Engine in Action
          </h2>
          <p class="mt-4 text-slate-400 text-sm sm:text-base">
            Test the live cashier workflow right in your browser. Add sample items,
            test payment modes, toggle printer widths, and generate a live GST receipt.
          </p>
        </div>

        {/* Live Simulator Workbench */}
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Product Catalog & Quick Add */}
          <div class="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShoppingCart class="w-4 h-4 text-emerald-400" />
                  Store Product Catalog
                </h3>
                <p class="text-xs text-slate-400">Click any product to add to cashier cart</p>
              </div>
              <button
                onClick={resetSimulator}
                class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 border border-slate-800 transition-colors"
                title="Reset Simulator"
              >
                <RefreshCw class="w-3 h-3" />
                Reset
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <For each={SAMPLE_PRODUCTS}>
                {(product) => (
                  <button
                    onClick={() => {
                      addToCart(product);
                      setBillGenerated(false);
                    }}
                    class="text-left p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/60 transition-all hover:scale-[1.02] group"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                        {product.category}
                      </span>
                      <span class="text-[10px] font-mono text-slate-500">
                        GST {product.gstRate}%
                      </span>
                    </div>
                    <p class="text-xs font-bold text-slate-200 group-hover:text-emerald-400 mt-2 line-clamp-2 leading-tight">
                      {product.name}
                    </p>
                    <div class="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-900">
                      <div class="flex items-baseline gap-1.5">
                        <span class="text-sm font-black text-emerald-400 font-mono">
                          ₹{product.sellingPrice}
                        </span>
                        <span class="text-[10px] line-through text-slate-500 font-mono">
                          ₹{product.mrp}
                        </span>
                      </div>
                      <span class="text-[10px] text-emerald-400 font-bold group-hover:underline flex items-center gap-0.5">
                        + Add
                      </span>
                    </div>
                  </button>
                )}
              </For>
            </div>

            {/* Hardware & Settings Toggle in Simulator */}
            <div class="pt-4 border-t border-slate-800 space-y-3 text-xs">
              <span class="block font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                Printer & WhatsApp Settings
              </span>
              <div class="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setThermalWidth(58)}
                  class={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-colors ${
                    thermalWidth() === 58
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  <Printer class="w-3.5 h-3.5" />
                  <span>58mm Mini Roll</span>
                </button>
                <button
                  onClick={() => setThermalWidth(80)}
                  class={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition-colors ${
                    thermalWidth() === 80
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  <Printer class="w-3.5 h-3.5" />
                  <span>80mm Standard</span>
                </button>
              </div>

              <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="flex items-center gap-2 text-slate-300 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={sendWhatsapp()}
                      onChange={(e) => setSendWhatsapp(e.currentTarget.checked)}
                      class="rounded text-emerald-500 focus:ring-emerald-400"
                    />
                    <span>WhatsApp Direct PDF Copy</span>
                  </label>
                  <MessageCircle class="w-4 h-4 text-emerald-400" />
                </div>
                <Show when={sendWhatsapp()}>
                  <div class="grid grid-cols-2 gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Buyer Name"
                      value={buyerName()}
                      onInput={(e) => setBuyerName(e.currentTarget.value)}
                      class="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                    <input
                      type="tel"
                      placeholder="WhatsApp Mobile"
                      value={buyerPhone()}
                      onInput={(e) => setBuyerPhone(e.currentTarget.value)}
                      class="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                    />
                  </div>
                </Show>
              </div>
            </div>
          </div>

          {/* Middle Column: Current Cart & Payment Mode */}
          <div class="lg:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Receipt class="w-4 h-4 text-emerald-400" />
                Active Register Cart
              </h3>
              <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
                {cart().length} items
              </span>
            </div>

            {/* Cart Items List */}
            <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
              <For
                each={cart()}
                fallback={
                  <div class="p-6 text-center text-slate-500 text-xs">
                    Cart is empty. Click items from the catalog.
                  </div>
                }
              >
                {(item) => (
                  <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                    <div class="min-w-0 flex-1">
                      <p class="font-bold text-slate-200 truncate">{item.product.name}</p>
                      <p class="text-[11px] text-slate-400 font-mono">
                        ₹{item.product.sellingPrice} × {item.quantity} = ₹
                        {item.product.sellingPrice * item.quantity}
                      </p>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        class="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                      >
                        <Minus class="w-3 h-3" />
                      </button>
                      <span class="w-6 text-center font-mono font-bold text-slate-200">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        class="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                      >
                        <Plus class="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        class="p-1 text-slate-500 hover:text-rose-400 ml-1"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </For>
            </div>

            {/* Pricing Summary */}
            <div class="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-400">
              <div class="flex justify-between">
                <span>Items Subtotal</span>
                <span class="font-mono text-slate-200">₹{subtotal().toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span>Estimated GST</span>
                <span class="font-mono text-slate-200">₹{totalGst().toFixed(2)}</span>
              </div>
              <div class="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                <span>Net Payable</span>
                <span class="text-emerald-400 font-mono text-base">₹{grandTotal()}</span>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div class="space-y-1.5">
              <span class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Select Payment Mode
              </span>
              <div class="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMode("UPI")}
                  class={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                    paymentMode() === "UPI"
                      ? "bg-indigo-600/20 text-indigo-300 border-indigo-500"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  <QrCode class="w-4 h-4" />
                  <span>UPI QR</span>
                </button>
                <button
                  onClick={() => setPaymentMode("CASH")}
                  class={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                    paymentMode() === "CASH"
                      ? "bg-emerald-600/20 text-emerald-300 border-emerald-500"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  <Banknote class="w-4 h-4" />
                  <span>Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMode("KHATA")}
                  class={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                    paymentMode() === "KHATA"
                      ? "bg-amber-600/20 text-amber-300 border-amber-500"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  <BookOpen class="w-4 h-4" />
                  <span>Udhaar</span>
                </button>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => setBillGenerated(true)}
              disabled={cart().length === 0}
              class="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Receipt class="w-4 h-4" />
              <span>Complete Payment & Print Bill (₹{grandTotal()})</span>
            </button>
          </div>

          {/* Right Column: Live Simulated ESC/POS Receipt Output */}
          <div class="lg:col-span-3 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col items-center">
            <div class="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Printer class="w-3.5 h-3.5 text-emerald-400" />
                Receipt Preview ({thermalWidth()}mm)
              </span>
              <span class="text-[10px] font-mono text-slate-400">ESC/POS</span>
            </div>

            {/* Physical Thermal Paper Simulation */}
            <div
              class={`w-full bg-[#faf9f5] text-slate-900 p-4 rounded-lg shadow-2xl font-mono text-[11px] leading-tight transition-all duration-300 ${
                thermalWidth() === 58 ? "max-w-[210px] text-[10px]" : "max-w-[280px]"
              }`}
            >
              <div class="text-center pb-2 border-b border-dashed border-slate-400 space-y-0.5">
                <p class="font-black text-sm uppercase tracking-tight text-slate-950">
                  SHREE GANESH SUPERMARKET
                </p>
                <p class="text-[10px] text-slate-600">Main Road, Sector 14, Pune</p>
                <p class="text-[10px] text-slate-600 font-bold">GSTIN: 27AABCS1429B1Z8</p>
                <p class="text-[10px] text-slate-500">Ph: +91 98220 12345</p>
              </div>

              <div class="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px] text-slate-600">
                <div class="flex justify-between">
                  <span>Bill No: {invoiceNumber()}</span>
                  <span>POS: #01</span>
                </div>
                <div class="flex justify-between">
                  <span>Date: 30-Oct-2026</span>
                  <span>18:30</span>
                </div>
                <Show when={sendWhatsapp() && buyerName()}>
                  <div class="flex justify-between font-bold text-slate-800 pt-0.5">
                    <span>Customer: {buyerName()}</span>
                  </div>
                </Show>
              </div>

              {/* Items List with Name Wrapping */}
              <div class="py-2 border-b border-dashed border-slate-400 space-y-2">
                <For each={cart()}>
                  {(item) => (
                    <div>
                      {/* Product name wraps onto next line gracefully */}
                      <p class="font-bold text-slate-950 break-words leading-tight">
                        {item.product.name}
                      </p>
                      <div class="flex justify-between text-slate-700 text-[10px] pt-0.5">
                        <span>
                          {item.quantity} {item.product.unit} @ ₹{item.product.sellingPrice}
                        </span>
                        <span class="font-bold">
                          ₹{(item.product.sellingPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </For>
              </div>

              {/* Totals Breakdown */}
              <div class="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
                <div class="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal().toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                  <span>CGST:</span>
                  <span>₹{(totalGst() / 2).toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                  <span>SGST:</span>
                  <span>₹{(totalGst() / 2).toFixed(2)}</span>
                </div>
                <div class="flex justify-between font-black text-xs text-slate-950 pt-1 border-t border-slate-400">
                  <span>TOTAL:</span>
                  <span>₹{grandTotal().toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-[10px] text-slate-700">
                  <span>Payment Mode:</span>
                  <span class="font-bold uppercase">{paymentMode()}</span>
                </div>
              </div>

              {/* Footer Note */}
              <div class="text-center pt-2 text-[9px] text-slate-500 space-y-0.5">
                <p class="font-bold text-slate-700">Thank you! Visit again.</p>
                <p>Goods once sold cannot be returned.</p>
                <p class="text-[8px] text-slate-400 pt-1">Powered by Billease</p>
              </div>
            </div>

            {/* Simulated WhatsApp Notification Pill */}
            <Show when={billGenerated() && sendWhatsapp()}>
              <div class="mt-4 w-full p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-300">
                <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
                <div class="min-w-0">
                  <p class="font-bold text-[11px]">PDF Receipt Sent to WhatsApp</p>
                  <p class="text-[10px] text-emerald-400/80 truncate">
                    +91 {buyerPhone()} ({invoiceNumber()}.pdf)
                  </p>
                </div>
              </div>
            </Show>
          </div>

        </div>

      </div>
    </section>
  );
};
