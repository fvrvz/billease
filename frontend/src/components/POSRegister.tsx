import { Component, createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { Product, Customer, CartItem, PaymentMode, Invoice } from '../types';
import { apiClient } from '../api/client';
import { Search, Plus, Minus, Trash2, QrCode, Banknote, BookOpen, Award, UserCheck, MessageCircle } from 'lucide-solid';

interface POSRegisterProps {
  onBillGenerated: (invoice: Invoice) => void;
  openUpiModal: (amount: number, upiUri: string) => void;
}

export const POSRegister: Component<POSRegisterProps> = (props) => {
  const { tenant, token } = useAuth();

  const [products, setProducts] = createSignal<Product[]>([]);
  const [customers, setCustomers] = createSignal<Customer[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [cart, setCart] = createSignal<CartItem[]>([]);
  
  // Selected Customer & Buyer Details
  const [selectedCustomerId, setSelectedCustomerId] = createSignal<string>('');
  const [buyerName, setBuyerName] = createSignal('');
  const [buyerPhone, setBuyerPhone] = createSignal('');
  const [sendWhatsappCopy, setSendWhatsappCopy] = createSignal(true);
  
  // Discounts & Coupons
  const [billDiscountPercent, setBillDiscountPercent] = createSignal<number>(0);
  const [billDiscountAmount, setBillDiscountAmount] = createSignal<number>(0);
  const [couponCode, setCouponCode] = createSignal<string>('');
  const [couponDiscount, setCouponDiscount] = createSignal<number>(0);
  const [couponMsg, setCouponMsg] = createSignal<{ text: string; success: boolean } | null>(null);
  
  // Loyalty Points
  const [redeemPoints, setRedeemPoints] = createSignal<number>(0);

  // Cash tendered for change
  const [cashTendered, setCashTendered] = createSignal<number>(0);

  let searchInputRef: HTMLInputElement | undefined;

  // Load products & customers
  const loadData = async () => {
    const t = tenant();
    if (!t) return;
    const [pList, cList] = await Promise.all([
      apiClient.listProducts(t.id),
      apiClient.listCustomers(t.id, token())
    ]);
    setProducts(pList);
    setCustomers(cList);
  };

  onMount(() => {
    loadData();

    // Global keyboard shortcuts: F2 (Search), F4 (Cash), F5 (UPI), F6 (Khata)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleCheckout('CASH');
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleCheckout('UPI');
      } else if (e.key === 'F6') {
        e.preventDefault();
        handleCheckout('CREDIT_KHATA');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
  });

  // Selected customer object
  const selectedCustomer = () => customers().find(c => c.id === selectedCustomerId());

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    if (id) {
      const c = customers().find(x => x.id === id);
      if (c) {
        setBuyerName(c.name);
        setBuyerPhone(c.phone);
      }
    }
  };

  // Filtered products for quick-add list
  const filteredProducts = () => {
    const q = searchQuery().toLowerCase().trim();
    if (!q) return products();
    return products().filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.barcode && p.barcode.includes(q))
    );
  };

  // Add to cart
  const addToCart = (product: Product) => {
    const current = [...cart()];
    const index = current.findIndex(ci => ci.product.id === product.id);
    if (index >= 0) {
      current[index].quantity += 1;
    } else {
      current.push({ product, quantity: 1, discountPercent: 0 });
    }
    setCart(current);
    setSearchQuery('');
    searchInputRef?.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    const current = [...cart()];
    const index = current.findIndex(ci => ci.product.id === productId);
    if (index >= 0) {
      const newQty = current[index].quantity + delta;
      if (newQty <= 0) {
        current.splice(index, 1);
      } else {
        current[index].quantity = newQty;
      }
      setCart(current);
    }
  };

  const updateItemDiscount = (productId: string, discPercent: number) => {
    const current = [...cart()];
    const index = current.findIndex(ci => ci.product.id === productId);
    if (index >= 0) {
      current[index].discountPercent = Math.max(0, Math.min(100, discPercent));
      setCart(current);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart().filter(ci => ci.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setBillDiscountPercent(0);
    setBillDiscountAmount(0);
    setCouponCode('');
    setCouponDiscount(0);
    setCouponMsg(null);
    setRedeemPoints(0);
    setCashTendered(0);
    setBuyerName('');
    setBuyerPhone('');
    setSelectedCustomerId('');
  };

  // Mathematical Totals
  const subtotal = () => cart().reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
  
  const itemDiscountTotal = () => cart().reduce((sum, item) => {
    const disc = (item.product.sellingPrice * item.quantity * item.discountPercent) / 100;
    return sum + disc;
  }, 0);

  const calculatedBillDiscount = () => {
    const base = subtotal() - itemDiscountTotal();
    if (billDiscountPercent() > 0) {
      return Math.round(((base * billDiscountPercent()) / 100) * 100) / 100;
    }
    return billDiscountAmount();
  };

  const loyaltyDiscount = () => {
    const t = tenant();
    if (!t) return 0;
    return redeemPoints() * t.loyaltyPointValueRs;
  };

  const grandTotal = () => {
    const raw = subtotal() - itemDiscountTotal() - calculatedBillDiscount() - couponDiscount() - loyaltyDiscount();
    return Math.max(0, Math.round(raw));
  };

  // Validate coupon
  const handleApplyCoupon = async () => {
    const t = tenant();
    if (!t || !couponCode().trim()) return;
    const res = await apiClient.validateCoupon(t.id, couponCode().trim(), subtotal() - calculatedBillDiscount());
    if (res.isValid) {
      setCouponDiscount(res.discountAmount);
      setCouponMsg({ text: res.message, success: true });
    } else {
      setCouponDiscount(0);
      setCouponMsg({ text: res.message, success: false });
    }
  };

  // Handle Checkout / Billing
  const handleCheckout = async (mode: PaymentMode) => {
    const t = tenant();
    if (!t || cart().length === 0) return;

    if (mode === 'CREDIT_KHATA' && !selectedCustomerId()) {
      alert('Please select a customer from the Khata dropdown before placing an Udhaar order!');
      return;
    }

    const total = grandTotal();

    // If UPI, generate dynamic NPCI UPI URI and popup QR
    const upiVpa = t.upiVpa || 'store@upi';
    const upiPayee = encodeURIComponent(t.upiPayeeName || t.name);
    const invoiceNumHint = `${t.invoicePrefix}-${Date.now() % 100000}`;
    const upiUri = `upi://pay?pa=${upiVpa}&pn=${upiPayee}&am=${total}&cu=INR&tn=Bill-${invoiceNumHint}`;

    if (mode === 'UPI') {
      props.openUpiModal(total, upiUri);
    }

    const finalCustomerName = buyerName().trim() || selectedCustomer()?.name || undefined;
    const finalCustomerPhone = buyerPhone().trim() || selectedCustomer()?.phone || undefined;

    const payload = {
      customerId: selectedCustomerId() || undefined,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      items: cart().map(ci => ({
        productId: ci.product.id,
        productName: ci.product.name,
        quantity: ci.quantity,
        unitPrice: ci.product.sellingPrice,
        mrp: ci.product.mrp,
        discountPercent: ci.discountPercent,
        gstRate: ci.product.gstRate
      })),
      billDiscountPercent: billDiscountPercent(),
      billDiscountAmount: calculatedBillDiscount(),
      couponCode: couponCode().trim() || undefined,
      couponDiscountAmount: couponDiscount(),
      redeemLoyaltyPoints: redeemPoints(),
      paymentMode: mode,
      cashTendered: mode === 'CASH' ? cashTendered() || total : total,
      notes: ''
    };

    const invoice = await apiClient.createInvoice(t.id, token(), payload);

    // Send copy of bill on WhatsApp if mobile number is provided & toggle checked
    if (finalCustomerPhone && sendWhatsappCopy()) {
      try {
        await apiClient.sendInvoiceWhatsapp(t.id, invoice.id, token(), finalCustomerPhone);
      } catch (_) {}
    }

    props.onBillGenerated(invoice);
    clearCart();
    loadData();
  };

  return (
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left Column: Product Search & Fast Catalog Grid */}
      <div class="lg:col-span-7 space-y-4">
        
        {/* Search & Barcode Bar */}
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div class="relative flex-1">
            <Search class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Scan Barcode or Type Product Name (F2)..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredProducts().length > 0) {
                  addToCart(filteredProducts()[0]);
                }
              }}
              class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>
          <button
            onClick={() => {
              if (filteredProducts().length > 0) addToCart(filteredProducts()[0]);
            }}
            class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <Plus class="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Quick Item Cards Grid */}
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Fast Selection Catalog ({filteredProducts().length})
            </h3>
            <span class="text-xs text-slate-400">Click item or press Enter to add</span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
            <For each={filteredProducts()}>
              {(prod) => (
                <div
                  onClick={() => addToCart(prod)}
                  class="p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer bg-slate-50 hover:bg-white flex flex-col justify-between"
                >
                  <div>
                    <div class="flex items-start justify-between gap-1">
                      <span class="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                        {prod.name}
                      </span>
                    </div>
                    <div class="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span>Stock: {prod.currentStock} {prod.unit}</span>
                      <Show when={prod.gstRate > 0}>
                        <span class="bg-slate-200 text-slate-700 px-1 rounded text-[10px]">
                          {prod.gstRate}% GST
                        </span>
                      </Show>
                    </div>
                  </div>

                  <div class="mt-3 flex items-baseline justify-between">
                    <div>
                      <span class="text-base font-extrabold text-emerald-700">
                        ₹{prod.sellingPrice.toFixed(2)}
                      </span>
                      <Show when={prod.mrp > prod.sellingPrice}>
                        <span class="ml-1 text-xs text-slate-400 line-through">
                          ₹{prod.mrp.toFixed(2)}
                        </span>
                      </Show>
                    </div>
                    <button class="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors">
                      <Plus class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

      </div>

      {/* Right Column: Checkout Register & Billing Math */}
      <div class="lg:col-span-5 space-y-4">
        
        {/* Customer & Buyer Information */}
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <UserCheck class="w-4 h-4 text-emerald-600" />
              Buyer Details (Optional)
            </label>
            <Show when={selectedCustomer()}>
              <span class="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Award class="w-3.5 h-3.5" />
                {selectedCustomer()?.loyaltyPoints} Points
              </span>
            </Show>
          </div>

          {/* Existing Khata Account selector */}
          <div>
            <label class="block text-[11px] font-semibold text-slate-500 mb-1">Select Khata Account (Optional)</label>
            <select
              value={selectedCustomerId()}
              onChange={(e) => handleSelectCustomer(e.currentTarget.value)}
              class="w-full p-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">Walk-in Customer / Manual Entry</option>
              <For each={customers()}>
                {(cust) => (
                  <option value={cust.id}>
                    {cust.name} ({cust.phone}) {cust.currentDue > 0 ? `• Due: ₹${cust.currentDue}` : ''}
                  </option>
                )}
              </For>
            </select>
          </div>

          {/* Optional Buyer Name & Mobile Number */}
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Buyer Name</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={buyerName()}
                onInput={(e) => setBuyerName(e.currentTarget.value)}
                class="w-full p-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-500 mb-1">Mobile No (WhatsApp)</label>
              <input
                type="tel"
                placeholder="e.g. 9822012345"
                value={buyerPhone()}
                onInput={(e) => setBuyerPhone(e.currentTarget.value)}
                class="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* WhatsApp bill send toggle if phone is entered */}
          <Show when={buyerPhone().trim().length >= 10}>
            <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800">
              <label class="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={sendWhatsappCopy()}
                  onChange={(e) => setSendWhatsappCopy(e.currentTarget.checked)}
                  class="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span class="flex items-center gap-1.5 font-bold">
                  <MessageCircle class="w-4 h-4 text-emerald-600 shrink-0" />
                  Send copy of bill on WhatsApp
                </span>
              </label>
              <span class="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                +{buyerPhone().trim().replace(/[^0-9]/g, '')}
              </span>
            </div>
          </Show>

          {/* Loyalty points redemption if customer has points */}
          <Show when={selectedCustomer() && (selectedCustomer()?.loyaltyPoints || 0) > 0}>
            <div class="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between">
              <span class="text-xs text-indigo-900 font-medium">
                Redeem Loyalty Points (₹1 per point):
              </span>
              <input
                type="number"
                min="0"
                max={selectedCustomer()?.loyaltyPoints || 0}
                value={redeemPoints()}
                onInput={(e) => setRedeemPoints(Math.min(selectedCustomer()?.loyaltyPoints || 0, Number(e.currentTarget.value) || 0))}
                class="w-20 px-2 py-1 bg-white border border-indigo-200 rounded text-xs text-right font-bold"
              />
            </div>
          </Show>
        </div>

        {/* Current Cart Items Table */}
        <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">
              Current Bill ({cart().length} items)
            </h4>
            <button
              onClick={clearCart}
              class="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
            >
              <Trash2 class="w-3.5 h-3.5" />
              Clear
            </button>
          </div>

          <div class="max-h-56 overflow-y-auto divide-y divide-slate-100">
            <Show when={cart().length === 0}>
              <div class="p-8 text-center text-slate-400 text-sm">
                Cart is empty. Scan items or pick from catalog on the left.
              </div>
            </Show>

            <For each={cart()}>
              {(item) => (
                <div class="p-3 flex items-center justify-between gap-2 border-b border-slate-100 last:border-0">
                  <div class="flex-1 min-w-0 pr-2 break-words whitespace-normal">
                    <span class="text-xs font-bold text-slate-900 block leading-snug break-words whitespace-normal">
                      {item.product.name}
                    </span>
                    <span class="text-[11px] text-slate-500">
                      ₹{item.product.sellingPrice.toFixed(2)} each
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      class="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 text-xs font-bold"
                    >
                      <Minus class="w-3 h-3" />
                    </button>
                    <span class="w-7 text-center font-bold text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      class="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 text-xs font-bold"
                    >
                      <Plus class="w-3 h-3" />
                    </button>
                  </div>

                  {/* Item Discount % */}
                  <div class="flex items-center gap-1 text-[11px] text-slate-600">
                    <span>Disc%:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discountPercent}
                      onInput={(e) => updateItemDiscount(item.product.id, Number(e.currentTarget.value) || 0)}
                      class="w-10 px-1 py-0.5 border border-slate-200 rounded text-center text-xs"
                    />
                  </div>

                  {/* Line Total */}
                  <div class="text-right min-w-[65px]">
                    <span class="font-bold text-slate-900 text-xs">
                      ₹{((item.product.sellingPrice * item.quantity) * (1 - item.discountPercent/100)).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    class="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Discounts, Coupon & Billing Calculations */}
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          
          {/* Bill-Level Discount & Coupon Input */}
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label class="block text-slate-500 font-medium mb-1">Bill Discount %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={billDiscountPercent()}
                onInput={(e) => setBillDiscountPercent(Number(e.currentTarget.value) || 0)}
                placeholder="e.g. 5%"
                class="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-medium"
              />
            </div>
            <div>
              <label class="block text-slate-500 font-medium mb-1">Coupon Promo Code</label>
              <div class="flex gap-1">
                <input
                  type="text"
                  placeholder="e.g. DIWALI50"
                  value={couponCode()}
                  onInput={(e) => setCouponCode(e.currentTarget.value)}
                  class="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-mono uppercase"
                />
                <button
                  onClick={handleApplyCoupon}
                  class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          <Show when={couponMsg()}>
            <p class={`text-[11px] font-medium ${couponMsg()?.success ? 'text-emerald-700' : 'text-rose-600'}`}>
              {couponMsg()?.text}
            </p>
          </Show>

          {/* Cost Math Summary */}
          <div class="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            <div class="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>₹{subtotal().toFixed(2)}</span>
            </div>

            <Show when={itemDiscountTotal() > 0}>
              <div class="flex justify-between text-emerald-700">
                <span>Item Discounts:</span>
                <span>-₹{itemDiscountTotal().toFixed(2)}</span>
              </div>
            </Show>

            <Show when={calculatedBillDiscount() > 0}>
              <div class="flex justify-between text-emerald-700">
                <span>Bill Discount:</span>
                <span>-₹{calculatedBillDiscount().toFixed(2)}</span>
              </div>
            </Show>

            <Show when={couponDiscount() > 0}>
              <div class="flex justify-between text-emerald-700">
                <span>Coupon ({couponCode().toUpperCase()}):</span>
                <span>-₹{couponDiscount().toFixed(2)}</span>
              </div>
            </Show>

            <Show when={loyaltyDiscount() > 0}>
              <div class="flex justify-between text-emerald-700">
                <span>Loyalty Redeemed ({redeemPoints()} pts):</span>
                <span>-₹{loyaltyDiscount().toFixed(2)}</span>
              </div>
            </Show>

            {/* Grand Total Bar */}
            <div class="flex items-baseline justify-between pt-2 border-t border-slate-200">
              <span class="text-sm font-bold text-slate-900">Total to Pay:</span>
              <span class="text-2xl font-black text-emerald-700">
                ₹{grandTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Cash Tendered & Change return helper */}
          <div class="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
            <span class="text-slate-600 font-medium">Cash Given:</span>
            <input
              type="number"
              placeholder={`₹${grandTotal()}`}
              value={cashTendered() || ''}
              onInput={(e) => setCashTendered(Number(e.currentTarget.value) || 0)}
              class="w-24 px-2 py-1 bg-white border border-slate-200 rounded text-right font-bold"
            />
            <Show when={cashTendered() > grandTotal()}>
              <span class="font-bold text-emerald-700">
                Change: ₹{(cashTendered() - grandTotal()).toFixed(2)}
              </span>
            </Show>
          </div>

          {/* Quick Payment Buttons (F4, F5, F6) */}
          <div class="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => handleCheckout('CASH')}
              disabled={cart().length === 0}
              class="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <Banknote class="w-4 h-4" />
              <span>💵 Cash (F4)</span>
            </button>

            <button
              onClick={() => handleCheckout('UPI')}
              disabled={cart().length === 0}
              class="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <QrCode class="w-4 h-4" />
              <span>📱 Scan UPI (F5)</span>
            </button>

            <button
              onClick={() => handleCheckout('CREDIT_KHATA')}
              disabled={cart().length === 0}
              class="p-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors"
            >
              <BookOpen class="w-4 h-4" />
              <span>📒 Udhaar (F6)</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

