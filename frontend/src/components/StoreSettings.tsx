import { Component, createSignal, onMount, Show } from "solid-js";
import { useAuth } from "../context/AuthContext";
import {
  Settings,
  QrCode,
  Printer,
  Check,
  Upload,
  Image as ImageIcon,
  Trash2,
  Store,
} from "lucide-solid";
import { compressStoreLogo } from "../utils/imageCompressor";

export const StoreSettings: Component = () => {
  const { tenant, updateTenantData } = useAuth();

  const [name, setName] = createSignal("");
  const [legalName, setLegalName] = createSignal("");
  const [phone, setPhone] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [address, setAddress] = createSignal("");
  const [city, setCity] = createSignal("");

  // GST 1-question configuration
  const [hasGst, setHasGst] = createSignal(false);
  const [gstin, setGstin] = createSignal("");
  const [stateCode, setStateCode] = createSignal("27");

  // Branding (Logo only, banner removed)
  const [logoUrl, setLogoUrl] = createSignal("");
  const [isCompressingLogo, setIsCompressingLogo] = createSignal(false);
  const [logoUploadError, setLogoUploadError] = createSignal("");

  // Receipt & Print
  const [invoicePrefix, setInvoicePrefix] = createSignal("INV");
  const [invoiceFooter, setInvoiceFooter] = createSignal(
    "Thank you for shopping with us! Visit again.",
  );
  const [thermalWidthMm, setThermalWidthMm] = createSignal(80);

  // Dynamic UPI
  const [upiVpa, setUpiVpa] = createSignal("");
  const [upiPayeeName, setUpiPayeeName] = createSignal("");

  const [isSaving, setIsSaving] = createSignal(false);
  const [showSavedPill, setShowSavedPill] = createSignal(false);

  onMount(() => {
    const t = tenant();
    if (!t) return;
    setName(t.name);
    setLegalName(t.legalName || "");
    setPhone(t.phone);
    setEmail(t.email || "");
    setAddress(t.address || "");
    setCity(t.city || "");
    setHasGst(t.hasGst);
    setGstin(t.gstin || "");
    setStateCode(t.stateCode || "27");
    setLogoUrl(t.logoUrl || "");
    setInvoicePrefix(t.invoicePrefix);
    setInvoiceFooter(t.invoiceFooter);
    setThermalWidthMm(t.thermalWidthMm);
    setUpiVpa(t.upiVpa || "");
    setUpiPayeeName(t.upiPayeeName || "");
  });

  const handleLogoFileChange = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    setLogoUploadError("");
    setIsCompressingLogo(true);
    try {
      const compressedDataUrl = await compressStoreLogo(file, 320, 0.88);
      setLogoUrl(compressedDataUrl);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to compress image";
      setLogoUploadError(msg);
    } finally {
      setIsCompressingLogo(false);
      input.value = "";
    }
  };

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
      invoicePrefix: invoicePrefix().trim().toUpperCase(),
      invoiceFooter: invoiceFooter().trim(),
      thermalWidthMm: thermalWidthMm(),
      upiVpa: upiVpa().trim() || undefined,
      upiPayeeName: upiPayeeName().trim() || name().trim(),
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
            Configure store banner, logo, receipt printing, GST, and UPI QR
            code.
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
              <label class="block font-bold text-slate-700 mb-1">
                Store Display Name *
              </label>
              <input
                type="text"
                required
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200 font-medium"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                Legal Business / Enterprise Name
              </label>
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
              <label class="block font-bold text-slate-700 mb-1">
                Store Phone *
              </label>
              <input
                type="text"
                required
                value={phone()}
                onInput={(e) => setPhone(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200 font-mono"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                Store Email
              </label>
              <input
                type="email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                City / Town
              </label>
              <input
                type="text"
                value={city()}
                onInput={(e) => setCity(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200"
              />
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">
              Full Shop Address
            </label>
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
                Small shops without GST can turn this off to print simple cash
                memos.
              </p>
            </div>

            {/* Simple YES / NO Toggle */}
            <div class="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setHasGst(false)}
                class={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  !hasGst()
                    ? "bg-white shadow-xs text-slate-800"
                    : "text-slate-500"
                }`}
              >
                No GST
              </button>
              <button
                type="button"
                onClick={() => setHasGst(true)}
                class={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  hasGst()
                    ? "bg-emerald-600 shadow-xs text-white"
                    : "text-slate-500"
                }`}
              >
                Yes, have GST
              </button>
            </div>
          </div>

          <Show when={hasGst()}>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label class="block font-bold text-slate-700 mb-1">
                  15-Digit GSTIN *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={gstin()}
                  onInput={(e) => setGstin(e.currentTarget.value.toUpperCase())}
                  class="w-full p-2.5 rounded-lg border border-slate-200 font-mono font-bold uppercase text-xs"
                />
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">
                  Detected Home State Code
                </label>
                <input
                  type="text"
                  readonly
                  value={
                    gstin().length >= 2
                      ? `${gstin().substring(0, 2)} (Auto-detected)`
                      : stateCode()
                  }
                  class="w-full p-2.5 rounded-lg border border-slate-100 bg-slate-50 font-mono text-slate-600 text-xs"
                />
              </div>
            </div>
          </Show>
        </div>

        {/* 3. Visual Branding (Store Logo) */}
        <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div class="border-b border-slate-100 pb-2 flex items-center justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon class="w-4 h-4 text-emerald-600" />
                Store Brand Logo
              </h3>
              <p class="text-[11px] text-slate-500 mt-0.5">
                Upload your store logo or paste an image URL. If not provided, a
                default store emblem is used.
              </p>
            </div>

            <Show when={logoUrl()}>
              <button
                type="button"
                onClick={() => setLogoUrl("")}
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                title="Remove custom logo and revert to default"
              >
                <Trash2 class="w-3.5 h-3.5" />
                Use Default
              </button>
            </Show>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Logo Preview */}
            <div class="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Show
                when={logoUrl()}
                fallback={
                  <div class="w-24 h-24 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shadow-md">
                    <Store class="w-10 h-10 text-emerald-400" />
                    <span class="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-wider">
                      Default
                    </span>
                  </div>
                }
              >
                <div class="w-24 h-24 rounded-2xl bg-white border border-slate-200 p-2 shadow-xs flex items-center justify-center overflow-hidden">
                  <img
                    src={logoUrl()}
                    alt="Store Logo"
                    class="max-w-full max-h-full object-contain"
                  />
                </div>
              </Show>
              <p class="text-[11px] font-medium text-slate-500 mt-2 text-center">
                {logoUrl() ? "Active Custom Logo" : "Default Emblem in use"}
              </p>
            </div>

            {/* Inputs: File Upload & URL */}
            <div class="lg:col-span-2 space-y-4">
              {/* Option A: Upload File */}
              <div>
                <label class="block font-bold text-xs text-slate-700 mb-1 flex items-center gap-1.5">
                  <Upload class="w-3.5 h-3.5 text-emerald-600" />
                  Upload Image File (Auto-Optimized, Aspect Ratio Preserved)
                </label>
                <div class="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    disabled={isCompressingLogo()}
                    class="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-lg p-1.5"
                  />
                </div>
                <Show when={isCompressingLogo()}>
                  <p class="text-[11px] text-emerald-600 font-semibold mt-1">
                    Optimizing image proportionally...
                  </p>
                </Show>
                <Show when={logoUploadError()}>
                  <p class="text-[11px] text-rose-600 font-medium mt-1">
                    {logoUploadError()}
                  </p>
                </Show>
              </div>

              {/* Option B: Or Image URL */}
              <div>
                <label class="block font-bold text-xs text-slate-700 mb-1">
                  Or Paste Logo Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl()}
                  onInput={(e) => setLogoUrl(e.currentTarget.value)}
                  class="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
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
              Generates an instant QR code on the POS screen and printed receipt
              for customer payment.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                Store UPI VPA / ID *
              </label>
              <input
                type="text"
                placeholder="e.g. shreeganesh@upi or 9876543210@paytm"
                value={upiVpa()}
                onInput={(e) => setUpiVpa(e.currentTarget.value)}
                class="w-full p-2.5 rounded-lg border border-slate-200 font-mono font-medium text-xs"
              />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                UPI Payee Display Name
              </label>
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
              Formats receipts for TVS, NGX, Everycom, Pegasus, and standard
              thermal POS roll printers.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block font-bold text-slate-700 mb-1">
                Paper Roll Width
              </label>
              <select
                value={thermalWidthMm()}
                onChange={(e) =>
                  setThermalWidthMm(Number(e.currentTarget.value))
                }
                class="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-medium"
              >
                <option value={80}>3-inch Roll (80mm) - Standard</option>
                <option value={58}>2-inch Roll (58mm) - Compact</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                value={invoicePrefix()}
                onInput={(e) =>
                  setInvoicePrefix(e.currentTarget.value.toUpperCase())
                }
                class="w-full p-2.5 rounded-lg border border-slate-200 font-mono uppercase text-xs"
              />
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">
                Footer Greeting Note
              </label>
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
            {isSaving() ? "Saving Changes..." : "Save All Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};
