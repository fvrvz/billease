import { Component, createSignal, onMount, For, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import { apiClient } from '../api/client';
import { Package, Plus, Search, AlertTriangle, Barcode, Calendar, Check } from 'lucide-solid';

export const ProductCatalog: Component = () => {
  const { tenant, token, isCashier } = useAuth();

  const [products, setProducts] = createSignal<Product[]>([]);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [showAddModal, setShowAddModal] = createSignal(false);

  // New product form
  const [name, setName] = createSignal('');
  const [barcode, setBarcode] = createSignal('');
  const [unit, setUnit] = createSignal('PACK');
  const [gstRate, setGstRate] = createSignal<number>(18);
  const [mrp, setMrp] = createSignal<number>(0);
  const [sellingPrice, setSellingPrice] = createSignal<number>(0);
  const [costPrice, setCostPrice] = createSignal<number>(0);
  const [initialQuantity, setInitialQuantity] = createSignal<number>(50);
  const [minStockAlert, setMinStockAlert] = createSignal<number>(5);
  const [expiryDate, setExpiryDate] = createSignal('');
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const loadProducts = async () => {
    const t = tenant();
    if (!t) return;
    const list = await apiClient.listProducts(t.id);
    setProducts(list);
  };

  onMount(() => loadProducts());

  const filteredProducts = () => {
    const q = searchQuery().toLowerCase().trim();
    if (!q) return products();
    return products().filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  };

  const handleCreateProduct = async (e: Event) => {
    e.preventDefault();
    const t = tenant();
    if (!t) return;

    if (!name().trim() || sellingPrice() <= 0) {
      alert('Please enter a valid product name and selling price');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.createProduct(t.id, token(), {
        name: name().trim(),
        barcode: barcode().trim() || undefined,
        unit: unit(),
        gstRate: gstRate(),
        isPriceTaxInclusive: true,
        mrp: mrp() || sellingPrice(),
        costPrice: costPrice(),
        sellingPrice: sellingPrice(),
        initialQuantity: initialQuantity(),
        minStockAlert: minStockAlert(),
        expiryDate: expiryDate() || undefined
      });

      // Reset form
      setName('');
      setBarcode('');
      setMrp(0);
      setSellingPrice(0);
      setCostPrice(0);
      setInitialQuantity(50);
      setExpiryDate('');
      setShowAddModal(false);
      loadProducts();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create product';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateBarcode = () => {
    const random = Math.floor(8900000000000 + Math.random() * 99999999999);
    setBarcode(random.toString());
  };

  return (
    <div class="space-y-6">
      
      {/* Top Header & Action */}
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package class="w-5 h-5 text-emerald-600" />
            Stock & Inventory Catalog
          </h2>
          <p class="text-xs text-slate-500">
            Track product quantities, prices, batches, and low-stock alerts.
          </p>
        </div>

        <div class="flex items-center gap-3 w-full sm:w-auto">
          <div class="relative flex-1 sm:w-64">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery()}
              onInput={(e) => setSearchQuery(e.currentTarget.value)}
              class="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <Show when={!isCashier()}>
            <button
              onClick={() => setShowAddModal(true)}
              class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-xs"
            >
              <Plus class="w-4 h-4" />
              Add Product
            </button>
          </Show>
        </div>
      </div>

      {/* Products Table */}
      <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th class="p-3">Product Name</th>
                <th class="p-3">Barcode</th>
                <th class="p-3">GST Rate</th>
                <th class="p-3">MRP</th>
                <th class="p-3">Selling Price</th>
                <th class="p-3">Available Stock</th>
                <th class="p-3">Stock Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <Show when={filteredProducts().length === 0}>
                <tr>
                  <td colspan="7" class="p-8 text-center text-slate-400">
                    No products found. Add your first item using the button above.
                  </td>
                </tr>
              </Show>

              <For each={filteredProducts()}>
                {(prod) => {
                  const isLow = prod.currentStock <= prod.minStockAlert;
                  return (
                    <tr class="hover:bg-slate-50 transition-colors">
                      <td class="p-3 font-bold text-slate-900">
                        {prod.name}
                        <Show when={prod.unit}>
                          <span class="ml-1 text-[10px] text-slate-400 font-normal">({prod.unit})</span>
                        </Show>
                      </td>
                      <td class="p-3 font-mono text-slate-600">
                        {prod.barcode || '-'}
                      </td>
                      <td class="p-3">
                        <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800">
                          {prod.gstRate}%
                        </span>
                      </td>
                      <td class="p-3 text-slate-500 font-medium">
                        ₹{prod.mrp.toFixed(2)}
                      </td>
                      <td class="p-3 font-bold text-emerald-700">
                        ₹{prod.sellingPrice.toFixed(2)}
                      </td>
                      <td class="p-3 font-bold text-slate-800">
                        {prod.currentStock} {prod.unit}
                      </td>
                      <td class="p-3">
                        <Show when={isLow} fallback={
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Check class="w-3 h-3" /> In Stock
                          </span>
                        }>
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle class="w-3 h-3" /> Low Stock
                          </span>
                        </Show>
                      </td>
                    </tr>
                  );
                }}
              </For>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <Show when={showAddModal()}>
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus class="w-5 h-5 text-emerald-600" />
                Add New Product / Inventory
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                class="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} class="space-y-4 text-xs">
              
              <div>
                <label class="block font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parle-G 100g or Dolo 650"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  class="w-full p-2.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Barcode with Auto-Generator */}
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="font-bold text-slate-700">Barcode (EAN-13)</label>
                  <button
                    type="button"
                    onClick={generateBarcode}
                    class="text-emerald-700 hover:underline font-semibold flex items-center gap-1 text-[11px]"
                  >
                    <Barcode class="w-3.5 h-3.5" /> Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Scan with gun or leave blank..."
                  value={barcode()}
                  onInput={(e) => setBarcode(e.currentTarget.value)}
                  class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-mono"
                />
              </div>

              {/* Price Row: MRP & Selling Price */}
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="10.00"
                    value={mrp() || ''}
                    onInput={(e) => {
                      const v = Number(e.currentTarget.value) || 0;
                      setMrp(v);
                      if (!sellingPrice()) setSellingPrice(v);
                    }}
                    class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="10.00"
                    value={sellingPrice() || ''}
                    onInput={(e) => setSellingPrice(Number(e.currentTarget.value) || 0)}
                    class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* 1-Click GST Rate Selection Chips */}
              <div>
                <label class="block font-bold text-slate-700 mb-1.5">
                  GST Rate (Inclusive in Price)
                </label>
                <div class="grid grid-cols-5 gap-1.5">
                  {[0, 5, 12, 18, 28].map((rate) => (
                    <button
                      type="button"
                      onClick={() => setGstRate(rate)}
                      class={`py-1.5 rounded-lg font-bold border text-xs transition-colors ${
                        gstRate() === rate
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial Stock & Alert threshold */}
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    value={initialQuantity()}
                    onInput={(e) => setInitialQuantity(Number(e.currentTarget.value) || 0)}
                    class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
                  />
                </div>
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Low Stock Alert at</label>
                  <input
                    type="number"
                    value={minStockAlert()}
                    onInput={(e) => setMinStockAlert(Number(e.currentTarget.value) || 0)}
                    class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Optional Expiry Date */}
              <div>
                <label class="block font-bold text-slate-700 mb-1">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={expiryDate()}
                  onInput={(e) => setExpiryDate(e.currentTarget.value)}
                  class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
                />
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting()}
                  class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
                >
                  {isSubmitting() ? 'Saving...' : 'Save Product'}
                </button>
              </div>

            </form>

          </div>
        </div>
      </Show>

    </div>
  );
};

