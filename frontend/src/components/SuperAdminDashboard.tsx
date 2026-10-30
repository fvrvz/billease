import { Component, createSignal, onMount, For, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { Tenant, TenantCreateInput } from '../types';
import { apiClient } from '../api/client';
import {
  Store,
  Plus,
  CheckCircle2,
  XCircle,
  Globe,
  Phone,
  Trash2,
  RefreshCw,
} from 'lucide-solid';

export const SuperAdminDashboard: Component = () => {
  const { tenant, token } = useAuth();

  const [tenants, setTenants] = createSignal<Tenant[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [showOnboardModal, setShowOnboardModal] = createSignal(false);
  const [submitting, setSubmitting] = createSignal(false);

  // Onboard form
  const [storeName, setStoreName] = createSignal('');
  const [phone, setPhone] = createSignal('');
  const [city, setCity] = createSignal('');
  const [hasGst, setHasGst] = createSignal(true);
  const [gstin, setGstin] = createSignal('');

  // Feature toggles for the new vendor
  const [featWhatsapp, setFeatWhatsapp] = createSignal(true);
  const [featLoyalty, setFeatLoyalty] = createSignal(true);
  const [featThermal, setFeatThermal] = createSignal(true);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const data = await apiClient.listTenants(token());
      if (data && data.length > 0) {
        setTenants(data);
      } else {
        const current = tenant();
        if (current) setTenants([current]);
      }
    } catch (_) {
      const current = tenant();
      if (current) setTenants([current]);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    loadTenants();
  });

  const handleToggleTenant = async (t: Tenant) => {
    const confirmMsg = t.isActive
      ? `Disable retailer "${t.name}"? Cashiers and store owners won't be able to bill.`
      : `Re-activate retailer "${t.name}"?`;
    if (!confirm(confirmMsg)) return;

    try {
      const updated = await apiClient.toggleTenantActive(t.id, token());
      if (updated) {
        setTenants((prev) =>
          prev.map((item) => (item.id === t.id ? { ...item, isActive: updated.isActive } : item))
        );
      } else {
        setTenants((prev) =>
          prev.map((item) => (item.id === t.id ? { ...item, isActive: !item.isActive } : item))
        );
      }
    } catch (_) {
      alert('Failed to update retailer status.');
    }
  };

  const handleRemoveTenant = async (t: Tenant) => {
    if (!confirm(`Are you sure you want to completely remove retailer "${t.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await apiClient.deleteTenant(t.id, token());
      setTenants((prev) => prev.filter((item) => item.id !== t.id));
    } catch (_) {
      alert('Failed to remove retailer.');
    }
  };

  const handleOnboardTenant = async (e: Event) => {
    e.preventDefault();
    if (!storeName().trim() || !phone().trim()) return;

    setSubmitting(true);
    const slug = storeName().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const input: TenantCreateInput = {
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
    };

    try {
      const created = await apiClient.createTenant(token(), input);
      if (created) {
        setTenants((prev) => [...prev, created]);
      } else {
        // Fallback local addition
        const fallbackTenant: Tenant = {
          id: 'a0000000-0000-0000-0000-00000000000' + (tenants().length + 1),
          ...input,
          stateCode: input.stateCode || '27',
          hasGst: input.hasGst || false,
          isCompositionScheme: false,
          invoicePrefix: input.invoicePrefix || 'INV',
          invoiceFooter: input.invoiceFooter || 'Thank you for shopping with us!',
          thermalWidthMm: 80,
          loyaltyPointsPer100: 1,
          loyaltyPointValueRs: 1,
          isActive: true,
        };
        setTenants((prev) => [...prev, fallbackTenant]);
      }
      setStoreName('');
      setPhone('');
      setGstin('');
      setShowOnboardModal(false);
    } catch (_) {
      alert('Failed to onboard retailer.');
    } finally {
      setSubmitting(false);
    }
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
        <div class="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">
            All Onboarded Tenants / Retailers
          </h3>
          <button
            onClick={loadTenants}
            class="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw class={`w-3.5 h-3.5 ${loading() ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <Show
          when={!loading()}
          fallback={
            <div class="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw class="w-6 h-6 animate-spin text-purple-600" />
              <span>Loading registered retailers...</span>
            </div>
          }
        >
          <div class="divide-y divide-slate-100">
            <For
              each={tenants()}
              fallback={
                <div class="p-8 text-center text-slate-400 text-xs">
                  No retailers registered yet. Click "Onboard New Retailer" to add one.
                </div>
              }
            >
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
                    <Show
                      when={t.isActive}
                      fallback={
                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle class="w-3.5 h-3.5" /> Disabled
                        </span>
                      }
                    >
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 class="w-3.5 h-3.5" /> Active
                      </span>
                    </Show>
                    <button
                      onClick={() => handleToggleTenant(t)}
                      class={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-colors ${
                        t.isActive
                          ? "border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100"
                          : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                      }`}
                    >
                      {t.isActive ? "Disable" : "Re-activate"}
                    </button>
                    <button
                      onClick={() => handleRemoveTenant(t)}
                      class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                      title="Remove Retailer"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
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
                  disabled={submitting()}
                  class="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {submitting() ? "Creating & Activating..." : "Create & Activate Store"}
                </button>
              </div>
            </form>

          </div>
        </div>
      </Show>

    </div>
  );
};

