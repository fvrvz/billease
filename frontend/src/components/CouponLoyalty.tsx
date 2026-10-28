import { Component, createSignal, onMount, For, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { Coupon, DiscountType } from '../types';
import { apiClient } from '../api/client';
import { Tag, Plus, Award, Check, Sparkles } from 'lucide-solid';

export const CouponLoyalty: Component = () => {
  const { tenant, token, updateTenantData, isCashier } = useAuth();

  const [coupons, setCoupons] = createSignal<Coupon[]>([]);
  const [showAddCouponModal, setShowAddCouponModal] = createSignal(false);

  // New coupon form
  const [code, setCode] = createSignal('');
  const [discountType, setDiscountType] = createSignal<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = createSignal<number>(10);
  const [minOrderAmount, setMinOrderAmount] = createSignal<number>(300);
  const [maxDiscountCap, setMaxDiscountCap] = createSignal<number>(100);

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

    await apiClient.createCoupon(t.id, token(), {
      code: code().trim().toUpperCase(),
      discountType: discountType(),
      discountValue: discountValue(),
      minOrderAmount: minOrderAmount(),
      maxDiscountCap: maxDiscountCap() || undefined
    });

    setCode('');
    setShowAddCouponModal(false);
    loadCoupons();
  };

  const handleSaveLoyaltySettings = async () => {
    await updateTenantData({
      loyaltyPointsPer100: pointsPer100(),
      loyaltyPointValueRs: pointValueRs()
    });
    setLoyaltySaved(true);
    setTimeout(() => setLoyaltySaved(false), 2500);
  };

  return (
    <div class="space-y-6">
      
      {/* Loyalty Program Settings Card */}
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div class="flex items-center gap-2">
            <Award class="w-5 h-5 text-indigo-600" />
            <div>
              <h3 class="text-base font-bold text-slate-900">Store Loyalty Program</h3>
              <p class="text-xs text-slate-500">Reward frequent customers with points that convert to bill discounts.</p>
            </div>
          </div>
          <Show when={loyaltySaved()}>
            <span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
              <Check class="w-3.5 h-3.5" /> Saved!
            </span>
          </Show>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">
              Points earned per ₹100 spent
            </label>
            <input
              type="number"
              disabled={isCashier()}
              value={pointsPer100()}
              onInput={(e) => setPointsPer100(Number(e.currentTarget.value) || 0)}
              class="w-full p-2.5 rounded-lg border border-slate-200 font-bold text-xs"
            />
            <span class="text-[11px] text-slate-400 mt-1 block">e.g. ₹500 bill gives 5 points</span>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">
              Value of 1 Point in Rupees (₹)
            </label>
            <input
              type="number"
              disabled={isCashier()}
              value={pointValueRs()}
              onInput={(e) => setPointValueRs(Number(e.currentTarget.value) || 0)}
              class="w-full p-2.5 rounded-lg border border-slate-200 font-bold text-xs"
            />
            <span class="text-[11px] text-slate-400 mt-1 block">e.g. 50 points = ₹50 bill discount</span>
          </div>
        </div>

        <Show when={!isCashier()}>
          <div class="mt-4 flex justify-end">
            <button
              onClick={handleSaveLoyaltySettings}
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              Update Loyalty Rules
            </button>
          </div>
        </Show>
      </div>

      {/* Coupons List & Creator */}
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-4 border-b border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Tag class="w-5 h-5 text-emerald-600" />
            <div>
              <h3 class="text-base font-bold text-slate-900">Promotional Coupons</h3>
              <p class="text-xs text-slate-500">Discount codes cashiers can punch at checkout.</p>
            </div>
          </div>

          <Show when={!isCashier()}>
            <button
              onClick={() => setShowAddCouponModal(true)}
              class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus class="w-4 h-4" />
              New Coupon
            </button>
          </Show>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <For each={coupons()}>
            {(coup) => (
              <div class="p-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-black text-sm tracking-widest text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      {coup.code}
                    </span>
                    <span class="text-[10px] text-emerald-800 font-bold bg-white px-1.5 py-0.5 rounded-full border border-emerald-200">
                      Used {coup.usageCount} times
                    </span>
                  </div>

                  <p class="mt-2 text-xs font-bold text-slate-800">
                    {coup.discountType === 'PERCENTAGE'
                      ? `${coup.discountValue}% OFF (Max ₹${coup.maxDiscountCap || 'No cap'})`
                      : `Flat ₹${coup.discountValue} OFF`}
                  </p>
                  <p class="text-[11px] text-slate-500">
                    Min order amount: ₹{coup.minOrderAmount}
                  </p>
                </div>

                <div class="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800 font-medium">
                  <span class="flex items-center gap-1">
                    <Sparkles class="w-3.5 h-3.5" /> Active for POS
                  </span>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* Add Coupon Modal */}
      <Show when={showAddCouponModal()}>
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag class="w-5 h-5 text-emerald-600" />
                Create Promo Coupon
              </h3>
              <button onClick={() => setShowAddCouponModal(false)} class="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DIWALI50 or SAVE10"
                  value={code()}
                  onInput={(e) => setCode(e.currentTarget.value.toUpperCase())}
                  class="w-full p-2.5 rounded-lg border border-slate-200 font-mono font-bold uppercase text-xs"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={discountType()}
                    onChange={(e) => setDiscountType(e.currentTarget.value as DiscountType)}
                    class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    value={discountValue()}
                    onInput={(e) => setDiscountValue(Number(e.currentTarget.value) || 0)}
                    class="w-full p-2.5 rounded-lg border border-slate-200 font-bold text-xs"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Min Order Total (₹)</label>
                  <input
                    type="number"
                    value={minOrderAmount()}
                    onInput={(e) => setMinOrderAmount(Number(e.currentTarget.value) || 0)}
                    class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
                  />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Max Cap (₹, for %)</label>
                  <input
                    type="number"
                    value={maxDiscountCap()}
                    onInput={(e) => setMaxDiscountCap(Number(e.currentTarget.value) || 0)}
                    class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCouponModal(false)}
                  class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
                >
                  Save Coupon
                </button>
              </div>
            </form>

          </div>
        </div>
      </Show>

    </div>
  );
};
