import { Component, createSignal, onMount, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { Settings, Image, QrCode, Printer, Check, ShieldCheck } from 'lucide-solid';

export const StoreSettings: Component = () => {
  const { tenant, updateTenantData, isCashier } = useAuth();

  const [name, setName] = createSignal('');
  const [legalName, setLegalName] = createSignal('');
  const [phone, setPhone] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [address, setAddress] = createSignal('');
  const [city, setCity] = createSignal('');
  
  // GST 1-question configuration
  const [hasGst, setHasGst] = createSignal(false);
  const [gstin, setGstin] = createSignal('');
  const [stateCode, setStateCode] = createSignal('27');

  // Branding
  const [logoUrl, setLogoUrl] = createSignal('');
  const [bannerUrl, setBannerUrl] = createSignal('');

  // Receipt & Print
  const [invoicePrefix, setInvoicePrefix] = createSignal('INV');
  const [invoiceFooter, setInvoiceFooter] = createSignal('Thank you for shopping with us! Visit again.');
  const [thermalWidthMm, setThermalWidthMm] = createSignal(80);

  // Dynamic UPI
  const [upiVpa, setUpiVpa] = createSignal('');
  const [upiPayeeName, setUpiPayeeName] = createSignal('');

  const [isSaving, setIsSaving] = createSignal(false);
  const [showSavedPill, setShowSavedPill] = createSignal(false);

  onMount(() => {
    const t = tenant();
    if (!t) return;
    setName(t.name);
    setLegalName(t.legalName || '');
    setPhone(t.phone);
    setEmail(t.email || '');
    setAddress(t.address || '');
    setCity(t.city || '');
    setHasGst(t.hasGst);
    setGstin(t.gstin || '');
    setStateCode(t.stateCode || '27');
    setLogoUrl(t.logoUrl || '');
    setBannerUrl(t.bannerUrl || '');
    setInvoicePrefix(t.invoicePrefix);
    setInvoiceFooter(t.invoiceFooter);
    setThermalWidthMm(t.thermalWidthMm);
    setUpiVpa(t.upiVpa || '');
    setUpiPayeeName(t.upiPayeeName || '');
  });

  const handleSave = async (e: Event) => {
    e.preventDefault();
    setIsSaving(true);

    // Auto extract state code from GSTIN if present
    let detectedState = stateCode();
    if (hasGst() && gstin().trim().length >= 2) {
      detectedState = gstin().trim().substring(0, 2);
    }

    await updateTenantData({
      name: name().trim(),
      legalName: legalName().trim() || undefined,
      phone: phone().trim(),
      email: email().trim() || undefined,
      address: address().trim() || undefined,
      city: city().trim() || undefined,
      hasGst: hasGst(),
      gstin: hasGst() ? gstin().trim().toUpperCase() : undefined,
      stateCode: detectedState,
      logoUrl: logoUrl().trim() || undefined,
      bannerUrl: bannerUrl().trim() || undefined,
      invoicePrefix: invoicePrefix().trim().toUpperCase(),
      invoiceFooter: invoiceFooter().trim(),
      thermalWidthMm: thermalWidthMm(),
      upiVpa: upiVpa().trim() || undefined,
      upiPayeeName: upiPayeeName().trim() || name().trim()
    });

    setIsSaving(false);
    setShowSavedPill(true);
    setTimeout(() => setShowSavedPill(false), 3000);
  };

  return (
    <div class="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings class="w-5 h-5 text-emerald-600" />
            Store Profile & Branding Settings
          </h2>
          <p class="text-xs text-slate-500">
            Configure store banner, logo, receipt printing, GST, and UPI QR code.
          </p>
        </div>

        <Show when={showSavedPill()}>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
            <Check class="w-4 h-4" /> All Changes Saved!
          </span>
        </Show>
      </div>

      <form onSubmit={handleSave} class="space-y-6 text-xs">

        {/* 1. Basic Store Details */}
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Store Identity
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Store Display Name *</label>
              <input
                type="text"
                required
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200 font-medium"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Legal Business / Enterprise Name</label>
              <input
                type="text"
                value={legalName()}
                onInput={(e) => setLegalName(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200 font-medium"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Store Phone *</label>
              <input
                type="text"
                required
                value={phone()}
                onInput={(e) => setPhone(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200 font-mono"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Store Email</label>
              <input
                type="email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">City / Town</label>
              <input
                type="text"
                value={city()}
                onInput={(e) => setCity(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Full Shop Address</label>
            <textarea
              rows="2"
              value={address()}
              onInput={(e) => setAddress(e.currentTarget.value)}
              class="w-full p-2.5 rounded-lg border border-slate-200 font-medium"
            />
          </div>
        </div>

        {/* 2. Simplified GST Configuration (1 Question) */}
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">
                GST Configuration
              </h3>
              <p class="text-[11px] text-slate-500">
                Small shops without GST can turn this off to print simple cash memos.
              </p>
            </div>

            {/* Simple YES / NO Toggle */}
            <div class="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setHasGst(false)}
                class={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  !hasGst() ? 'bg-white shadow-xs text-slate-800' : 'text-slate-500'
                }`}
              >
                No GST
              </button>
              <button
                type="button"
                onClick={() => setHasGst(true)}
                class={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  hasGst() ? 'bg-emerald-600 shadow-xs text-white' : 'text-slate-500'
                }`}
              >
                Yes, have GST
              </button>
            </div>
          </div>

          <Show when={hasGst()}>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label class="block font-bold text-slate-700 mb-1">15-Digit GSTIN *</label>
                <input
                  type="text"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={gstin()}
                  onInput={(e) => setGstin(e.currentTarget.value.toUpperCase())}
                  class="w-full p-2.5 rounded-lg border border-slate-200 font-mono font-bold uppercase text-xs"
                />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Detected Home State Code</label>
                <input
                  type="text"
                  readonly
                  value={gstin().length >= 2 ? `${gstin().substring(0, 2)} (Auto-detected)` : stateCode()}
                  class="w-full p-2.5 rounded-lg border border-slate-100 bg-slate-50 font-mono text-slate-600 text-xs"
                />
              </div>
            </div>
          </Show>
        </div>

        {/* 3. Visual Branding (Logo & Banner) */}
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Store Visuals & Logo
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Store Logo Image URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={logoUrl()}
                onInput={(e) => setLogoUrl(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-xs"
              />
              <Show when={logoUrl()}>
                <img src={logoUrl()} alt="Preview" class="mt-2 w-14 h-14 rounded-lg object-cover border border-slate-200" />
              </Show>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Store Banner Image URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={bannerUrl()}
                onInput={(e) => setBannerUrl(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-xs"
              />
              <Show when={bannerUrl()}>
                <img src={bannerUrl()} alt="Banner Preview" class="mt-2 h-14 w-full rounded-lg object-cover border border-slate-200" />
              </Show>
            </div>
          </div>
        </div>

        {/* 4. Dynamic NPCI UPI QR Code Setup */}
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div class="border-b border-slate-100 pb-2">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <QrCode class="w-4 h-4 text-emerald-600" />
              Dynamic UPI Scan & Pay Settings
            </h3>
            <p class="text-[11px] text-slate-500">
              Generates an instant QR code on the POS screen and printed receipt for customer payment.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Store UPI VPA / ID *</label>
              <input
                type="text"
                placeholder="e.g. shreeganesh@upi or 9876543210@paytm"
                value={upiVpa()}
                onInput={(e) => setUpiVpa(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200 font-mono font-medium text-xs"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">UPI Payee Display Name</label>
              <input
                type="text"
                placeholder="e.g. Shree Ganesh Supermarket"
                value={upiPayeeName()}
                onInput={(e) => setUpiPayeeName(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* 5. Thermal Receipt Printer Layout */}
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div class="border-b border-slate-100 pb-2">
            <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Printer class="w-4 h-4 text-emerald-600" />
              Thermal Receipt Printing
            </h3>
            <p class="text-[11px] text-slate-500">
              Formats receipts for TVS, NGX, Everycom, Pegasus, and standard thermal POS roll printers.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Paper Roll Width</label>
              <select
                value={thermalWidthMm()}
                onChange={(e) => setThermalWidthMm(Number(e.currentTarget.value))}
                class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
              >
                <option value={80}>3-inch Roll (80mm) - Standard</option>
                <option value={58}>2-inch Roll (58mm) - Compact</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                value={invoicePrefix()}
                onInput={(e) => setInvoicePrefix(e.currentTarget.value.toUpperCase())}
                class="w-full p-2.5 rounded-lg border border-slate-200 font-mono uppercase text-xs"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Footer Greeting Note</label>
              <input
                type="text"
                value={invoiceFooter()}
                onInput={(e) => setInvoiceFooter(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div class="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving()}
            class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs"
          >
            {isSaving() ? 'Saving Changes...' : 'Save All Settings'}
          </button>
        </div>

      </form>
    </div>
  );
};

