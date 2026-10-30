import { Component } from "solid-js";
import { Store, Github, Heart, ExternalLink } from "lucide-solid";

export const Footer: Component = () => {
  return (
    <footer class="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 text-slate-400 text-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
          {/* Brand info */}
          <div class="md:col-span-1 space-y-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
                <Store class="w-4 h-4 text-slate-950" />
              </div>
              <span class="text-lg font-black text-white">Billease</span>
            </div>
            <p class="text-xs text-slate-400 leading-relaxed font-normal">
              High-speed, GST-ready retail POS & billing platform built for Indian kiranas, supermarkets, and pharmacies.
            </p>
            <div class="pt-2 flex items-center gap-3">
              <a
                href="https://github.com/fvrvz/billease"
                target="_blank"
                rel="noopener noreferrer"
                class="text-slate-400 hover:text-white transition-colors"
                title="GitHub"
              >
                <Github class="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product links */}
          <div>
            <p class="text-xs font-bold text-white uppercase tracking-wider mb-3">Product</p>
            <ul class="space-y-2">
              <li><a href="#features" class="hover:text-emerald-400 transition-colors">Features</a></li>
              <li><a href="#demo-preview" class="hover:text-emerald-400 transition-colors">Interactive POS Simulator</a></li>
              <li><a href="#solutions" class="hover:text-emerald-400 transition-colors">Store Solutions</a></li>
              <li><a href="#pricing" class="hover:text-emerald-400 transition-colors">Pricing & Plans</a></li>
              <li><a href="http://localhost:3000" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-400 flex items-center gap-1">Launch POS App <ExternalLink class="w-3 h-3" /></a></li>
            </ul>
          </div>

          {/* Developers & Docs */}
          <div>
            <p class="text-xs font-bold text-white uppercase tracking-wider mb-3">Developers & Docs</p>
            <ul class="space-y-2">
              <li><a href="#docs" class="hover:text-emerald-400 transition-colors">Quickstart Guide</a></li>
              <li><a href="#docs" class="hover:text-emerald-400 transition-colors">System Architecture</a></li>
              <li><a href="http://localhost:8081/docs" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-400 flex items-center gap-1">Interactive Swagger UI <ExternalLink class="w-3 h-3" /></a></li>
              <li><a href="#docs" class="hover:text-emerald-400 transition-colors">Thermal Printer Setup</a></li>
              <li><a href="#docs" class="hover:text-emerald-400 transition-colors">Docker Deployment</a></li>
            </ul>
          </div>

          {/* Compliance & Hardware */}
          <div>
            <p class="text-xs font-bold text-white uppercase tracking-wider mb-3">Compliance & Hardware</p>
            <ul class="space-y-2">
              <li><span>GST / HSN Tax Engine</span></li>
              <li><span>Composition Scheme Support</span></li>
              <li><span>ESC/POS 58mm / 80mm</span></li>
              <li><span>NPCI Dynamic UPI QR</span></li>
              <li><span>Customer Khata Ledger</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Billease Open Source. Apache-2.0 License.</p>
          <p class="flex items-center gap-1">
            Engineered with <Heart class="w-3 h-3 text-rose-500 fill-rose-500" /> for Indian Retailers
          </p>
        </div>
      </div>
    </footer>
  );
};
