import { Component, createSignal, onMount, For, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { Coupon, DiscountType } from '../types';
import { apiClient } from '../api/client';
import { Tag, Plus, Award, Check, PowerOff, Sparkles, ToggleLeft, ToggleRight } from 'lucide-solid';

export const CouponLoyalty: Component = () => {
  const { tenant, token, updateTenantData, isCashier } = useAuth();

  const [coupons, setCoupons] = createSignal<Coupon[]>([]);
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [togglingId, setTogglingId] = createSignal<string | null>(null);

  // New coupon form state
  const [code, setCode] = createSignal('');
  const [discountType, setDiscountType] = createSignal<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = createSignal<number>(10);
  const [minOrderAmount, setMinOrderAmount] = createSignal<number>(300);
  const [maxDiscountCap, setMaxDiscountCap] = createSignal<number>(100);
  const [creating, setCreating] = createSignal(false);

  // Loyalty settings
  const [pointsPer100, setPointsPer100] = createSignal<number>(1);
  const [pointValueRs, setPointValueRs] = createSignal<number>(1);
  const [loyaltySaved, setLoyaltySaved] = createSignal(false);

  const loadCoupons = async () => {
    const t = tenant();
    if (!t) return;
    const list = await apiClient.listCoupons(t.id, token());
    setCoupons(list);
    setPointsPer100(t.loyaltyPointsPer100);
    setPointValueRs(t.loyaltyPointValueRs);
  };

  onMount(() => loadCoupons());

  const handleCreateCoupon = async (e: Event) => {
    e.preventDefault();
    const t = tenant();
    if (!t || !code().trim() || discountValue() <= 0) return;
    setCreating(true);
    try {
      await apiClient.createCoupon(t.id, token(), {
        code: code().trim().toUpperCase(),
        discountType: discountType(),
        discountValue: discountValue(),
        minOrderAmount: minOrderAmount(),
        maxDiscountCap: maxDiscountCap() || undefined,
      });
      setCode('');
      setShowAddModal(false);
      await loadCoupons();
    } finally {
      setCreating(false);
    }
  };

  const handleToggleCoupon = async (coupon: Coupon) => {
    const t = tenant();
    if (!t) return;
    setTogglingId(coupon.id);
    try {
      const updated = await apiClient.toggleCoupon(t.id, coupon.id, token());
      if (updated) {
        setCoupons(prev => prev.map(c => c.id === updated.id ? updated : c));
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveLoyalty = async () => {
    await updateTenantData({
      loyaltyPointsPer100: pointsPer100(),
      loyaltyPointValueRs: pointValueRs(),
    });
    setLoyaltySaved(true);
    setTimeout(() => setLoyaltySaved(false), 2500);
  };

  const activeCoupons = () => coupons().filter(c => c.isActive);
  const inactiveCoupons = () => coupons().filter(c => !c.isActive);

  return (
    <div class="space-y-6 max-w-4xl">

      {/* Page Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-slate-900">Coupons & Loyalty</h1>
          <p class="text-sm text-slate-500 mt-0.5">Manage discount coupons and customer loyalty rewards</p>
        </div>
        <Show when={!isCashier()}>
          <button
            onClick={() => setShowAddModal(true)}
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
          >
            <Plus class="w-4 h-4" />
            New Coupon
          </button>
        </Show>
      </div>

      {/* Loyalty Program Card */}
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Award class="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 class="font-bold text-slate-900 text-sm">Loyalty Programme</h2>
              <p class="text-xs text-slate-500">Reward frequent customers</p>
            </div>
          </div>
          <Show when={loyaltySaved()}>
            <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              <Check class="w-3.5 h-3.5" /> Saved!
            </span>
          </Show>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">Points earned per ₹100 spent</label>
              <input
                type="number"
                min="0"
                disabled={isCashier()}
                value={pointsPer100()}
                onInput={(e) => setPointsPer100(Number(e.currentTarget.value) || 0)}
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              />
              <p class="text-[11px] text-slate-400 mt-1">e.g. ₹500 bill → 5 points</p>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5">₹ value of 1 point</label>
              <input
                type="number"
                min="0"
                disabled={isCashier()}
                value={pointValueRs()}
                onInput={(e) => setPointValueRs(Number(e.currentTarget.value) || 0)}
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
              />
              <p class="text-[11px] text-slate-400 mt-1">e.g. 50 points = ₹50 discount</p>
            </div>
          </div>
          <Show when={!isCashier()}>
            <div class="mt-5 flex justify-end">
              <button
                onClick={handleSaveLoyalty}
                class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-xs"
              >
                Save Loyalty Rules
              </button>
            </div>
          </Show>
        </div>
      </div>

      {/* Active Coupons */}
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Tag class="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 class="font-bold text-slate-900 text-sm">Active Coupons</h2>
              <p class="text-xs text-slate-500">{activeCoupons().length} active</p>
            </div>
          </div>
        </div>

        <Show when={activeCoupons().length === 0}>
          <div class="py-12 text-center">
            <Tag class="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p class="text-slate-500 text-sm">No active coupons</p>
            <Show when={!isCashier()}>
              <button
                onClick={() => setShowAddModal(true)}
                class="mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-semibold"
              >
                + Create your first coupon
              </button>
            </Show>
          </div>
        </Show>

        <div class="divide-y divide-slate-100">
          <For each={activeCoupons()}>
            {(coupon) => (
              <CouponRow
                coupon={coupon}
                toggling={togglingId() === coupon.id}
                canManage={!isCashier()}
                onToggle={() => handleToggleCoupon(coupon)}
              />
            )}
          </For>
        </div>
      </div>

      {/* Disabled Coupons */}
      <Show when={inactiveCoupons().length > 0}>
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <PowerOff class="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h2 class="font-bold text-slate-700 text-sm">Disabled Coupons</h2>
              <p class="text-xs text-slate-500">{inactiveCoupons().length} paused</p>
            </div>
          </div>
          <div class="divide-y divide-slate-100">
            <For each={inactiveCoupons()}>
              {(coupon) => (
                <CouponRow
                  coupon={coupon}
                  toggling={togglingId() === coupon.id}
                  canManage={!isCashier()}
                  onToggle={() => handleToggleCoupon(coupon)}
                />
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Add Coupon Modal */}
      <Show when={showAddModal()}>
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 class="font-bold text-slate-900 flex items-center gap-2">
                <Tag class="w-4 h-4 text-emerald-600" />
                Create Promo Coupon
              </h3>
              <button onClick={() => setShowAddModal(false)} class="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateCoupon} class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1.5">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="DIWALI50 or SAVE10"
                  value={code()}
                  onInput={(e) => setCode(e.currentTarget.value.toUpperCase())}
                  class="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-mono font-bold uppercase text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1.5">Discount Type</label>
                  <select
                    value={discountType()}
                    onChange={(e) => setDiscountType(e.currentTarget.value as DiscountType)}
                    class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1.5">
                    Value ({discountType() === 'PERCENTAGE' ? '%' : '₹'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={discountValue()}
                    onInput={(e) => setDiscountValue(Number(e.currentTarget.value) || 0)}
                    class="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1.5">Min Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderAmount()}
                    onInput={(e) => setMinOrderAmount(Number(e.currentTarget.value) || 0)}
                    class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 mb-1.5">Max Cap (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={maxDiscountCap()}
                    onInput={(e) => setMaxDiscountCap(Number(e.currentTarget.value) || 0)}
                    class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating()}
                  class="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm transition shadow-xs"
                >
                  {creating() ? 'Creating…' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Show>
    </div>
  );
};

// Extracted CouponRow sub-component
interface CouponRowProps {
  coupon: Coupon;
  toggling: boolean;
  canManage: boolean;
  onToggle: () => void;
}

const CouponRow: Component<CouponRowProps> = (props) => {
  const { coupon } = props;

  return (
    <div class={`flex items-center gap-4 px-6 py-4 transition-colors ${!coupon.isActive ? 'opacity-60' : ''}`}>
      {/* Coupon Code */}
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class={`font-mono font-black text-sm tracking-wide ${coupon.isActive ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
            {coupon.code}
          </span>
          <span class={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            coupon.isActive
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-500'
          }`}>
            <Show when={coupon.isActive} fallback={<PowerOff class="w-2.5 h-2.5" />}>
              <Sparkles class="w-2.5 h-2.5" />
            </Show>
            {coupon.isActive ? 'Active' : 'Disabled'}
          </span>
        </div>
        <p class="text-xs text-slate-500">
          {coupon.discountType === 'PERCENTAGE'
            ? `${coupon.discountValue}% off`
            : `₹${coupon.discountValue} flat off`}
          {' · '}Min ₹{coupon.minOrderAmount}
          {coupon.maxDiscountCap ? ` · Max ₹${coupon.maxDiscountCap}` : ''}
        </p>
      </div>

      {/* Usage */}
      <div class="hidden sm:block text-right">
        <p class="text-xs font-bold text-slate-700">{coupon.usageCount}/{coupon.maxUsage}</p>
        <p class="text-[10px] text-slate-400">uses</p>
      </div>

      {/* Toggle */}
      <Show when={props.canManage}>
        <button
          onClick={props.onToggle}
          disabled={props.toggling}
          title={coupon.isActive ? 'Disable coupon' : 'Enable coupon'}
          class={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
            coupon.isActive
              ? 'bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600'
              : 'bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-600'
          }`}
        >
          <Show when={props.toggling} fallback={
            <Show when={coupon.isActive} fallback={<ToggleLeft class="w-3.5 h-3.5" />}>
              <ToggleRight class="w-3.5 h-3.5" />
            </Show>
          }>
            <span class="animate-spin w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full inline-block" />
          </Show>
          {coupon.isActive ? 'Disable' : 'Enable'}
        </button>
      </Show>
    </div>
  );
};
