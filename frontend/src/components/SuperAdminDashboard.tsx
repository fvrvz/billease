import { Component, createSignal, onMount, For, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { Tenant } from '../types';
import { ShieldCheck, Store, Plus, CheckCircle2, Sliders, KeyRound, Globe, Phone } from 'lucide-solid';

export const SuperAdminDashboard: Component = () => {
  const { tenant } = useAuth();

  const [tenants, setTenants] = createSignal<Tenant[]>([]);
  const [showOnboardModal, setShowOnboardModal] = createSignal(false);

  // Onboard form
  const [storeName, setStoreName] = createSignal('');
  const [phone, setPhone] = createSignal('');
  const [city, setCity] = createSignal('');
  const [hasGst, setHasGst] = createSignal(true);
  const [gstin, setGstin] = createSignal('');
  const [adminUsername, setAdminUsername] = createSignal('');
  const [adminPassword, setAdminPassword] = createSignal('store123');

  // Feature toggles for the new vendor
  const [featWhatsapp, setFeatWhatsapp] = createSignal(true);
  const [featLoyalty, setFeatLoyalty] = createSignal(true);
  const [featThermal, setFeatThermal] = createSignal(true);

  onMount(() => {
    // Populate sample tenants list
    const current = tenant();
    if (current) {
      setTenants([
        current,
        {
          id: 'a0000000-0000-0000-0000-000000000002',
          slug: 'laxmi-kirana-general-store',
          name: 'Laxmi Kirana & General Store',
          legalName: 'Laxmi Retailers Pvt Ltd',
          phone: '+91 98230 45678',
          email: 'laxmi.store@gmail.com',
          city: 'Nagpur',
          stateCode: '27',
          hasGst: false,
          isCompositionScheme: true,
          invoicePrefix: 'LKG',
          invoiceFooter: 'Dhanyawad! Phir aaiye.',
          thermalWidthMm: 58,
          upiVpa: 'laxmikirana@paytm',
          upiPayeeName: 'Laxmi Kirana',
          loyaltyPointsPer100: 1,
          loyaltyPointValueRs: 1,
          isActive: true
        },
        {
          id: 'a0000000-0000-0000-0000-000000000003',
          slug: 'apollo-wellness-pharma',
          name: 'Janata Medico & Pharma',
          legalName: 'Janata Drug Agency',
          phone: '+91 99887 65432',
          email: 'janatamedico@pharma.in',
          city: 'Indore',
          stateCode: '23',
          hasGst: true,
          gstin: '23AABCT1234D1Z2',
          isCompositionScheme: false,
          invoicePrefix: 'JMP',
          invoiceFooter: 'Get well soon. No return without bill.',
          thermalWidthMm: 80,
          upiVpa: 'janatamedico@icici',
          upiPayeeName: 'Janata Medico',
          loyaltyPointsPer100: 2,
          loyaltyPointValueRs: 1,
          isActive: true
        }
      ]);
    }
  });

  const handleOnboardTenant = (e: Event) => {
    e.preventDefault();
    if (!storeName().trim() || !phone().trim()) return;

    const slug = storeName().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newTenant: Tenant = {
      id: 'a0000000-0000-0000-0000-00000000000' + (tenants().length + 1),
      slug,
      name: storeName().trim(),
      phone: phone().trim(),
      city: city().trim() || 'Mumbai',
      stateCode: '27',
      hasGst: hasGst(),
      gstin: hasGst() ? gstin().trim().toUpperCase() : undefined,
      isCompositionScheme: false,
      invoicePrefix: slug.substring(0, 3).toUpperCase(),
      invoiceFooter: 'Thank you for shopping with us!',
      thermalWidthMm: 80,
      upiVpa: `${slug}@upi`,
      upiPayeeName: storeName().trim(),
      loyaltyPointsPer100: 1,
      loyaltyPointValueRs: 1,
      isActive: true
    };

    setTenants([...tenants(), newTenant]);
    setStoreName('');
    setPhone('');
    setGstin('');
    setShowOnboardModal(false);
  };

  return (
    <div class="space-y-6">
      
      {/* Super Admin Top Header */}
      <div class="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
              Platform Superuser
            </span>
          </div>
          <h2 class="text-2xl font-black mt-1">Tenant & Retailer Provisioning</h2>
          <p class="text-xs text-purple-200 mt-1 max-w-xl">
            Onboard new vendor/retail stores, enable customized feature sets, and configure runtime OIDC credentials.
          </p>
        </div>

        <button
          onClick={() => setShowOnboardModal(true)}
          class="px-4 py-2.5 bg-white text-purple-950 hover:bg-purple-50 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          Onboard New Retailer
        </button>
      </div>

      {/* Metric Cards */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Retailers</span>
          <p class="text-2xl font-black text-slate-900 mt-1">{tenants().length}</p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">GST-Registered Stores</span>
          <p class="text-2xl font-black text-emerald-600 mt-1">
            {tenants().filter(t => t.hasGst).length}
          </p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Active Counters</span>
          <p class="text-2xl font-black text-indigo-600 mt-1">{tenants().length * 2}</p>
        </div>
      </div>

      {/* Stores List */}
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
            All Onboarded Tenants / Retailers
          </h3>
        </div>

        <div class="divide-y divide-slate-100">
          <For each={tenants()}>
            {(t) => (
              <div class="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-900 text-sm">{t.name}</span>
                    <span class="text-xs font-mono text-slate-400">({t.slug})</span>
                    <Show when={t.hasGst} fallback={
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        Composition / No GST
                      </span>
                    }>
                      <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        GST: {t.gstin}
                      </span>
                    </Show>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-slate-500">
                    <span class="flex items-center gap-1"><Phone class="w-3 h-3" /> {t.phone}</span>
                    <span>•</span>
                    <span class="flex items-center gap-1"><Globe class="w-3 h-3" /> {t.city || 'India'}</span>
                    <span>•</span>
                    <span>Thermal: {t.thermalWidthMm}mm</span>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 class="w-3.5 h-3.5" /> Active
                  </span>
                  <button class="px-2.5 py-1 text-xs border border-slate-200 rounded-lg font-semibold hover:bg-slate-100 text-slate-700">
                    Manage Permissions
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Onboard Retailer Modal */}
      <Show when={showOnboardModal()}>
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <Store class="w-5 h-5 text-purple-700" />
                Onboard New Retailer / Vendor
              </h3>
              <button onClick={() => setShowOnboardModal(false)} class="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardTenant} class="space-y-4 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Store / Retailer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laxmi Kirana & General Store"
                  value={storeName()}
                  onInput={(e) => setStoreName(e.currentTarget.value)}
                  class="w-full p-2.5 rounded-lg border border-slate-200 font-medium"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Owner Mobile *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9822012345"
                    value={phone()}
                    onInput={(e) => setPhone(e.currentTarget.value)}
                    class="w-full p-2.5 rounded-lg border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">City / Town</label>
                  <input
                    type="text"
                    placeholder="e.g. Surat or Lucknow"
                    value={city()}
                    onInput={(e) => setCity(e.currentTarget.value)}
                    class="w-full p-2.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              {/* GST Toggle */}
              <div>
                <label class="block font-bold text-slate-700 mb-1">Store GST Status</label>
                <div class="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasGst(false)}
                    class={`flex-1 py-2 rounded-lg font-bold border transition-colors ${
                      !hasGst() ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Unregistered / No GST
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasGst(true)}
                    class={`flex-1 py-2 rounded-lg font-bold border transition-colors ${
                      hasGst() ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Registered with GST
                  </button>
                </div>
              </div>

              <Show when={hasGst()}>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">15-Digit GSTIN</label>
                  <input
                    type="text"
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    value={gstin()}
                    onInput={(e) => setGstin(e.currentTarget.value.toUpperCase())}
                    class="w-full p-2.5 rounded-lg border border-slate-200 font-mono uppercase font-bold"
                  />
                </div>
              </Show>

              {/* Feature Permissions Enabled by Platform Admin */}
              <div class="pt-2 border-t border-slate-100">
                <span class="block font-bold text-slate-700 mb-2">Enable Store Feature Entitlements</span>
                <div class="space-y-2">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featWhatsapp()}
                      onChange={(e) => setFeatWhatsapp(e.currentTarget.checked)}
                      class="rounded text-purple-600"
                    />
                    <span class="font-medium text-slate-800">WhatsApp Stock Alerts & Udhaar Reminders</span>
                  </label>

                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featLoyalty()}
                      onChange={(e) => setFeatLoyalty(e.currentTarget.checked)}
                      class="rounded text-purple-600"
                    />
                    <span class="font-medium text-slate-800">Customer Loyalty Points & Promo Coupons</span>
                  </label>

                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featThermal()}
                      onChange={(e) => setFeatThermal(e.currentTarget.checked)}
                      class="rounded text-purple-600"
                    />
                    <span class="font-medium text-slate-800">ESC/POS Thermal Receipt Printing Engine</span>
                  </label>
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold transition-colors shadow-xs"
                >
                  Create & Activate Store
                </button>
              </div>
            </form>

          </div>
        </div>
      </Show>

    </div>
  );
};

