import { Component, createSignal, Show } from "solid-js";
import { DemoBooking } from "../types";
import {
  Calendar,
  X,
  CheckCircle2,
  Store,
  User,
  Phone,
  Mail,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-solid";

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookDemoModal: Component<BookDemoModalProps> = (props) => {
  const [storeName, setStoreName] = createSignal("");
  const [ownerName, setOwnerName] = createSignal("");
  const [phone, setPhone] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [storeType, setStoreType] = createSignal<DemoBooking["storeType"]>("kirana");
  const [preferredDate, setPreferredDate] = createSignal(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [preferredTime, setPreferredTime] = createSignal("11:00 AM");
  const [notes, setNotes] = createSignal("");

  const [submitted, setSubmitted] = createSignal(false);
  const [loading, setLoading] = createSignal(false);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!storeName().trim() || !ownerName().trim() || !phone().trim()) {
      alert("Please fill in Store Name, Contact Name, and Phone Number.");
      return;
    }

    setLoading(true);

    const booking: DemoBooking = {
      storeName: storeName().trim(),
      ownerName: ownerName().trim(),
      phone: phone().trim(),
      email: email().trim(),
      storeType: storeType(),
      preferredDate: preferredDate(),
      preferredTime: preferredTime(),
      notes: notes().trim() || undefined,
    };

    // Save lead locally to demonstrate persistence
    try {
      const existing = JSON.parse(localStorage.getItem("billease_demo_bookings") || "[]");
      existing.push({ ...booking, bookedAt: new Date().toISOString() });
      localStorage.setItem("billease_demo_bookings", JSON.stringify(existing));
    } catch (_) {}

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  const handleReset = () => {
    setSubmitted(false);
    props.onClose();
  };

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-left relative my-8">
          
          {/* Close Button */}
          <button
            onClick={props.onClose}
            class="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>

          <Show
            when={!submitted()}
            fallback={
              <div class="py-8 text-center space-y-4">
                <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 class="w-8 h-8" />
                </div>
                <h3 class="text-2xl font-black text-white">
                  Demo Session Confirmed!
                </h3>
                <p class="text-sm text-slate-300 max-w-sm mx-auto">
                  Thank you, <strong class="text-white">{ownerName()}</strong>! Our retail specialist will reach out on WhatsApp at{" "}
                  <strong class="text-emerald-400">+91 {phone()}</strong> for the walkthrough of{" "}
                  <span class="text-white">{storeName()}</span>.
                </p>

                <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                  <p>📅 Scheduled Date: <strong class="text-white">{preferredDate()}</strong></p>
                  <p>⏰ Slot: <strong class="text-white">{preferredTime()}</strong></p>
                  <p>🏪 Category: <strong class="text-emerald-400 uppercase">{storeType()}</strong></p>
                </div>

                <div class="pt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={handleReset}
                    class="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
                  >
                    Done
                  </button>
                </div>
              </div>
            }
          >
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-3">
                <Sparkles class="w-3.5 h-3.5" />
                <span>15-Minute Live Walkthrough</span>
              </div>
              <h3 class="text-2xl font-black text-white">
                Book a Personalized Store Demo
              </h3>
              <p class="text-xs text-slate-400 mt-1">
                See how Billease runs on your existing printer and barcode setup.
              </p>

              <form onSubmit={handleSubmit} class="mt-6 space-y-3.5 text-xs">
                <div>
                  <label class="block font-bold text-slate-300 mb-1">Store / Retailer Name *</label>
                  <div class="relative">
                    <Store class="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Laxmi Supermarket or Apollo Medico"
                      value={storeName()}
                      onInput={(e) => setStoreName(e.currentTarget.value)}
                      class="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Your Name *</label>
                    <div class="relative">
                      <User class="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Sharma"
                        value={ownerName()}
                        onInput={(e) => setOwnerName(e.currentTarget.value)}
                        class="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-300 mb-1">WhatsApp Mobile *</label>
                    <div class="relative">
                      <Phone class="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        placeholder="98220 12345"
                        value={phone()}
                        onInput={(e) => setPhone(e.currentTarget.value)}
                        class="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Email Address</label>
                    <div class="relative">
                      <Mail class="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="rajesh@gmail.com"
                        value={email()}
                        onInput={(e) => setEmail(e.currentTarget.value)}
                        class="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Store Vertical</label>
                    <select
                      value={storeType()}
                      onChange={(e) => setStoreType(e.currentTarget.value as DemoBooking["storeType"])}
                      class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    >
                      <option value="kirana">Kirana / Provision Store</option>
                      <option value="supermarket">Supermarket / Mart</option>
                      <option value="pharmacy">Pharmacy / Medico</option>
                      <option value="retail">Apparel / Footwear / Other</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Preferred Date</label>
                    <div class="relative">
                      <Calendar class="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="date"
                        value={preferredDate()}
                        onInput={(e) => setPreferredDate(e.currentTarget.value)}
                        class="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block font-bold text-slate-300 mb-1">Preferred Time Slot</label>
                    <div class="relative">
                      <Clock class="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                      <select
                        value={preferredTime()}
                        onChange={(e) => setPreferredTime(e.currentTarget.value)}
                        class="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="11:00 AM">11:00 AM (Morning)</option>
                        <option value="02:00 PM">02:00 PM (Afternoon)</option>
                        <option value="04:30 PM">04:30 PM (Evening)</option>
                        <option value="07:00 PM">07:00 PM (Post-rush)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block font-bold text-slate-300 mb-1">
                    Existing Hardware or Specific Questions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. We use TVS RP3200 thermal printer and 2 barcode guns..."
                    value={notes()}
                    onInput={(e) => setNotes(e.currentTarget.value)}
                    class="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div class="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={props.onClose}
                    class="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading()}
                    class="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    <span>{loading() ? "Scheduling..." : "Confirm Free Demo"}</span>
                    <ArrowRight class="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </Show>

        </div>
      </div>
    </Show>
  );
};
