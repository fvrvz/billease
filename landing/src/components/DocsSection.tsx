import { Component, createSignal, For, Show } from "solid-js";
import {
  FileText,
  Code,
  Terminal,
  Cpu,
  Printer,
  Server,
  ExternalLink,
  Copy,
  Check,
} from "lucide-solid";

export const DocsSection: Component = () => {
  const [activeTab, setActiveTab] = createSignal<string>("quickstart");
  const [copiedIndex, setCopiedIndex] = createSignal<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const tabs = [
    { id: "quickstart", label: "Quick Start", icon: Terminal },
    { id: "architecture", label: "Architecture", icon: Cpu },
    { id: "api", label: "API Reference", icon: Code },
    { id: "hardware", label: "Hardware Setup", icon: Printer },
    { id: "deployment", label: "Self-Hosting", icon: Server },
  ];

  return (
    <section id="docs" class="py-24 bg-slate-950 relative border-t border-slate-800/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div class="text-center max-w-3xl mx-auto mb-16">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 mb-3">
            <FileText class="w-3.5 h-3.5" />
            <span>Developer & Operator Guide</span>
          </div>
          <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Comprehensive Documentation
          </h2>
          <p class="mt-4 text-slate-400 text-sm sm:text-base">
            Everything you need to run, configure, customize, and extend Billease.
            Built on transparent open-source foundations.
          </p>
        </div>

        {/* Documentation Console Shell */}
        <div class="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          {/* Top Bar with Navigation Tabs */}
          <div class="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-2">
              <For each={tabs}>
                {(tab) => (
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    class={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      activeTab() === tab.id
                        ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <tab.icon class="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )}
              </For>
            </div>

            <a
              href="http://localhost:8081/docs"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 text-xs font-semibold transition-colors"
            >
              <span>Interactive Swagger UI</span>
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Tab Content Panes */}
          <div class="p-6 sm:p-10 text-slate-300 font-normal leading-relaxed text-sm">
            {/* Quickstart Tab */}
            <Show when={activeTab() === "quickstart"}>
              <div class="space-y-6">
                <div>
                  <h3 class="text-xl font-bold text-white">Running Billease via Docker Compose</h3>
                  <p class="text-slate-400 text-xs mt-1">
                    Billease ships with a fully containerized environment bundling PostgreSQL 16, the Scala 3 backend API, and the SolidJS frontend.
                  </p>
                </div>

                <div class="space-y-3">
                  <p class="text-xs font-bold text-slate-200">1. Clone the repository and navigate into the project:</p>
                  <div class="relative bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-emerald-400">
                    <code>git clone https://github.com/fvrvz/billease.git && cd billease</code>
                    <button
                      onClick={() => copyToClipboard("git clone https://github.com/fvrvz/billease.git && cd billease", 1)}
                      class="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-white rounded bg-slate-900"
                    >
                      <Show when={copiedIndex() === 1} fallback={<Copy class="w-4 h-4" />}>
                        <Check class="w-4 h-4 text-emerald-400" />
                      </Show>
                    </button>
                  </div>

                  <p class="text-xs font-bold text-slate-200 pt-2">2. Spin up all containers in detached mode:</p>
                  <div class="relative bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-emerald-400">
                    <code>docker compose up -d</code>
                    <button
                      onClick={() => copyToClipboard("docker compose up -d", 2)}
                      class="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-white rounded bg-slate-900"
                    >
                      <Show when={copiedIndex() === 2} fallback={<Copy class="w-4 h-4" />}>
                        <Check class="w-4 h-4 text-emerald-400" />
                      </Show>
                    </button>
                  </div>

                  <p class="text-xs font-bold text-slate-200 pt-2">3. Default Access URLs & Test Credentials:</p>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span class="text-[10px] text-slate-500 font-mono">WEB APP</span>
                      <p class="font-bold text-white mt-1">http://localhost:3000</p>
                      <p class="text-[11px] text-emerald-400 mt-1">Cashier & Owner Portal</p>
                    </div>
                    <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span class="text-[10px] text-slate-500 font-mono">BACKEND API</span>
                      <p class="font-bold text-white mt-1">http://localhost:8081</p>
                      <p class="text-[11px] text-indigo-400 mt-1">HTTP4S / Tapir REST</p>
                    </div>
                    <div class="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span class="text-[10px] text-slate-500 font-mono">TEST USER</span>
                      <p class="font-bold text-white mt-1">ganesh_owner</p>
                      <p class="text-[11px] text-slate-400 mt-1">Password: store123</p>
                    </div>
                  </div>
                </div>
              </div>
            </Show>

            {/* Architecture Tab */}
            <Show when={activeTab() === "architecture"}>
              <div class="space-y-6">
                <div>
                  <h3 class="text-xl font-bold text-white">System Architecture & Tech Stack</h3>
                  <p class="text-slate-400 text-xs mt-1">
                    Billease is engineered for extreme throughput, type-safety, and offline resilience.
                  </p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span class="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      Backend (Scala 3 Functional Stack)
                    </span>
                    <ul class="space-y-1.5 text-xs text-slate-300">
                      <li>• <strong>Scala 3:</strong> Modern functional language with strict type inference</li>
                      <li>• <strong>Http4s:</strong> Blazing non-blocking, functional HTTP server on Cats Effect</li>
                      <li>• <strong>Tapir:</strong> Declarative, self-documenting type-safe API endpoints</li>
                      <li>• <strong>Doobie:</strong> Pure functional JDBC layer with compile-time checked SQL</li>
                      <li>• <strong>Flyway:</strong> Version-controlled schema migrations</li>
                    </ul>
                  </div>

                  <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span class="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider">
                      Frontend (SolidJS Reactive UI)
                    </span>
                    <ul class="space-y-1.5 text-xs text-slate-300">
                      <li>• <strong>SolidJS:</strong> Fine-grained reactivity with zero Virtual DOM overhead</li>
                      <li>• <strong>TailwindCSS v4:</strong> Hardware-accelerated CSS styling engine</li>
                      <li>• <strong>SWR Cache:</strong> Client-side caching with TTL & tag invalidation</li>
                      <li>• <strong>Lucide:</strong> Ultra-crisp iconography</li>
                      <li>• <strong>jsPDF:</strong> High-resolution client-side thermal and A4 bill generator</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Show>

            {/* API Tab */}
            <Show when={activeTab() === "api"}>
              <div class="space-y-6">
                <div>
                  <h3 class="text-xl font-bold text-white">RESTful Endpoints Summary</h3>
                  <p class="text-slate-400 text-xs mt-1">
                    Fully typed HTTP endpoints auto-generated into OpenAPI 3.0 & Swagger specifications.
                  </p>
                </div>

                <div class="space-y-2">
                  <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs">
                    <div class="flex items-center gap-3">
                      <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">POST</span>
                      <span class="text-white">/api/auth/login</span>
                    </div>
                    <span class="text-slate-400 text-[11px]">Authenticate cashier or store owner</span>
                  </div>

                  <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs">
                    <div class="flex items-center gap-3">
                      <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
                      <span class="text-white">/api/tenants/:id/products</span>
                    </div>
                    <span class="text-slate-400 text-[11px]">List products (paged, search & inStock filters)</span>
                  </div>

                  <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs">
                    <div class="flex items-center gap-3">
                      <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">POST</span>
                      <span class="text-white">/api/tenants/:id/invoices</span>
                    </div>
                    <span class="text-slate-400 text-[11px]">Create invoice, calculate GST, deduct stock</span>
                  </div>

                  <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs">
                    <div class="flex items-center gap-3">
                      <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
                      <span class="text-white">/api/tenants/:id/sales/overview</span>
                    </div>
                    <span class="text-slate-400 text-[11px]">KPI aggregates (Cash, UPI, Khata, Card)</span>
                  </div>

                  <div class="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs">
                    <div class="flex items-center gap-3">
                      <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
                      <span class="text-white">/api/tenants/:id/users</span>
                    </div>
                    <span class="text-slate-400 text-[11px]">Store staff & cashier roster management</span>
                  </div>
                </div>
              </div>
            </Show>

            {/* Hardware Tab */}
            <Show when={activeTab() === "hardware"}>
              <div class="space-y-6">
                <div>
                  <h3 class="text-xl font-bold text-white">Peripherals & Hardware Guide</h3>
                  <p class="text-slate-400 text-xs mt-1">
                    Connect any standard USB, Bluetooth, or Network thermal receipt printer.
                  </p>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <p class="font-bold text-emerald-400">ESC/POS Thermal Printers</p>
                    <p class="text-slate-300">
                      Supports all TVS Electronics, Epson, Everycom, NGX, and Star Micronics thermal receipt printers.
                    </p>
                    <p class="text-slate-400">
                      Configure paper width (58mm or 80mm) in <strong>Store Settings</strong>. Billease formats column widths automatically with zero character truncation.
                    </p>
                  </div>

                  <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <p class="font-bold text-indigo-400">Barcode Scanners & Keyboards</p>
                    <p class="text-slate-300">
                      Works out-of-the-box with any USB HID or Bluetooth handheld barcode gun (Honeywell, Zebra, TVS).
                    </p>
                    <p class="text-slate-400">
                      Global shortcut <strong>F2</strong> focuses the search bar instantly. Scanners sending an 'Enter' suffix automatically add the single-matched product to cart.
                    </p>
                  </div>
                </div>
              </div>
            </Show>

            {/* Deployment Tab */}
            <Show when={activeTab() === "deployment"}>
              <div class="space-y-6">
                <div>
                  <h3 class="text-xl font-bold text-white">Self-Hosting & Cloud Deployment</h3>
                  <p class="text-slate-400 text-xs mt-1">
                    Host on your own local store server, AWS, Hetzner, or DigitalOcean droplet.
                  </p>
                </div>

                <div class="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                  <p class="text-emerald-400 font-bold"># Environment Variables (.env)</p>
                  <p>DATABASE_URL=jdbc:postgresql://db:5432/billease_db</p>
                  <p>DATABASE_USER=postgres</p>
                  <p>DATABASE_PASSWORD=postgres</p>
                  <p>OIDC_ISSUER_URL=http://localhost:8080</p>
                  <p>PORT=8080</p>
                </div>
              </div>
            </Show>
          </div>
        </div>

      </div>
    </section>
  );
};
