import { Component, createSignal, onMount, For, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { Customer } from '../types';
import { apiClient } from '../api/client';
import { BookOpen, Plus, Search, MessageCircle, ArrowDownLeft, Award, UserPlus, CheckCircle } from 'lucide-solid';

export const CustomerKhata: Component = () => {
  const { tenant, token } = useAuth();

  const [customers, setCustomers] = createSignal<Customer[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  
  // Modals
  const [showAddCustModal, setShowAddCustModal] = createSignal(false);
  const [paymentCustomer, setPaymentCustomer] = createSignal<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = createSignal<number>(0);
  const [paymentMethod, setPaymentMethod] = createSignal('CASH');

  // New customer form
  const [name, setName] = createSignal('');
  const [phone, setPhone] = createSignal('');
  const [creditLimit, setCreditLimit] = createSignal<number>(5000);

  const loadCustomers = async () => {
    const t = tenant();
    if (!t) return;
    const list = await apiClient.listCustomers(t.id, token());
    setCustomers(list);
  };

  onMount(() => loadCustomers());

  const filteredCustomers = () => {
    const q = searchQuery().toLowerCase().trim();
    if (!q) return customers();
    return customers().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  };

  const totalOutstandingUdhaar = () => {
    return customers().reduce((sum, c) => sum + c.currentDue, 0);
  };

  const handleCreateCustomer = async (e: Event) => {
    e.preventDefault();
    const t = tenant();
    if (!t) return;

    if (!name().trim() || !phone().trim()) {
      alert('Please enter customer name and mobile number');
      return;
    }

    await apiClient.createCustomer(t.id, token(), {
      name: name().trim(),
      phone: phone().trim(),
      creditLimit: creditLimit()
    });

    setName('');
    setPhone('');
    setShowAddCustModal(false);
    loadCustomers();
  };

  const handleReceivePayment = async () => {
    const t = tenant();
    const c = paymentCustomer();
    if (!t || !c || paymentAmount() <= 0) return;

    await apiClient.recordKhataPayment(t.id, token(), c.id, paymentAmount(), paymentMethod(), 'Counter payment');
    setPaymentCustomer(null);
    setPaymentAmount(0);
    loadCustomers();
  };

  // Pre-formatted WhatsApp payment reminder
  const sendWhatsAppReminder = (c: Customer) => {
    const storeName = tenant()?.name || 'our store';
    const cleanPhone = c.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Namaste ${c.name} ji, aapka ${storeName} par ₹${c.currentDue} ka baki hisab (Udhaar) hai. Kripya suvidhanusar bhuqtan karein. UPI / Cash dono chalega. Dhanyawad!`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div class="space-y-6">
      
      {/* Top Banner & Summary */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Total Udhaar Pending</p>
            <h3 class="text-2xl font-black text-rose-600 mt-1">₹{totalOutstandingUdhaar().toFixed(2)}</h3>
          </div>
          <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <BookOpen class="w-6 h-6" />
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Active Khata Accounts</p>
            <h3 class="text-2xl font-black text-slate-900 mt-1">{customers().length}</h3>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserPlus class="w-6 h-6" />
          </div>
        </div>

        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Action</p>
            <button
              onClick={() => setShowAddCustModal(true)}
              class="mt-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus class="w-4 h-4" />
              New Customer
            </button>
          </div>
          <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Award class="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Customer List Section */}
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div class="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen class="w-5 h-5 text-emerald-600" />
            Customer Khata & Udhaar Book
          </h3>

          <div class="relative w-full sm:w-64">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or mobile..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div class="divide-y divide-slate-100">
          <Show when={filteredCustomers().length === 0}>
            <div class="p-8 text-center text-slate-400 text-xs">
              No customers found. Add your first customer using the button above.
            </div>
          </Show>

          <For each={filteredCustomers()}>
            {(cust) => {
              const hasDue = cust.currentDue > 0;
              return (
                <div class="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-slate-900 text-sm">{cust.name}</span>
                      <span class="text-xs text-slate-500">{cust.phone}</span>
                    </div>
                    <div class="flex items-center gap-3 text-xs text-slate-500">
                      <span>Limit: ₹{cust.creditLimit}</span>
                      <span>•</span>
                      <span class="text-emerald-700 font-medium flex items-center gap-1">
                        <Award class="w-3.5 h-3.5" /> {cust.loyaltyPoints} Loyalty Points
                      </span>
                    </div>
                  </div>

                  {/* Due Amount & Actions */}
                  <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div class="text-right">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Balance</span>
                      <span class={`text-base font-black ${hasDue ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {hasDue ? `₹${cust.currentDue.toFixed(2)} Pending` : 'All Clear ✓'}
                      </span>
                    </div>

                    <div class="flex items-center gap-2">
                      <Show when={hasDue}>
                        <button
                          onClick={() => sendWhatsAppReminder(cust)}
                          class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-emerald-200"
                          title="Send polite WhatsApp payment reminder"
                        >
                          <MessageCircle class="w-3.5 h-3.5 text-emerald-600" />
                          WhatsApp
                        </button>

                        <button
                          onClick={() => {
                            setPaymentCustomer(cust);
                            setPaymentAmount(cust.currentDue);
                          }}
                          class="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                        >
                          <ArrowDownLeft class="w-3.5 h-3.5" />
                          Receive ₹
                        </button>
                      </Show>
                    </div>
                  </div>

                </div>
              );
            }}
          </For>
        </div>

      </div>

      {/* Add Customer Modal */}
      <Show when={showAddCustModal()}>
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus class="w-5 h-5 text-emerald-600" />
                Add New Khata Customer
              </h3>
              <button onClick={() => setShowAddCustModal(false)} class="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} class="space-y-4 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Bhai Shinde"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9822012345"
                  value={phone()}
                  onInput={(e) => setPhone(e.currentTarget.value)}
                  class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Max Credit Limit (₹)</label>
                <input
                  type="number"
                  value={creditLimit()}
                  onInput={(e) => setCreditLimit(Number(e.currentTarget.value) || 0)}
                  class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-bold"
                />
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustModal(false)}
                  class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>

          </div>
        </div>
      </Show>

      {/* Receive Udhaar Payment Modal */}
      <Show when={paymentCustomer()}>
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowDownLeft class="w-5 h-5 text-emerald-600" />
                Receive Khata Payment
              </h3>
              <button onClick={() => setPaymentCustomer(null)} class="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div class="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <span class="font-bold text-slate-800 block text-sm">{paymentCustomer()?.name}</span>
              <span class="text-slate-500">Pending Udhaar: ₹{paymentCustomer()?.currentDue.toFixed(2)}</span>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  value={paymentAmount()}
                  onInput={(e) => setPaymentAmount(Number(e.currentTarget.value) || 0)}
                  class="w-full p-2.5 rounded-lg border border-slate-200 text-base font-bold text-emerald-700"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod()}
                  onChange={(e) => setPaymentMethod(e.currentTarget.value)}
                  class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                </select>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentCustomer(null)}
                  class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReceivePayment}
                  class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
                >
                  Confirm Payment
                </button>
              </div>
            </div>

          </div>
        </div>
      </Show>

    </div>
  );
};

