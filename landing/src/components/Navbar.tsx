import { Component, createSignal, onMount, onCleanup, Show } from "solid-js";
import {
  Store,
  ExternalLink,
  Menu,
  X,
  Github,
  Calendar,
} from "lucide-solid";

interface NavbarProps {
  onOpenDemo: () => void;
}

export const Navbar: Component<NavbarProps> = (props) => {
  const [scrolled, setScrolled] = createSignal(false);
  const [mobileMenuOpen, setMobileMenuOpen] = createSignal(false);

  const handleScroll = () => {
    setScrolled(window.scrollY > 20);
  };

  onMount(() => {
    window.addEventListener("scroll", handleScroll);
  });

  onCleanup(() => {
    window.removeEventListener("scroll", handleScroll);
  });

  return (
    <header
      class={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled()
          ? "bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 py-3 shadow-xl"
          : "bg-transparent py-5"
      }`}
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between">
          {/* Brand */}
          <a href="#" class="flex items-center gap-2.5 group">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Store class="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xl font-black tracking-tight text-white">
                  Billease
                </span>
                <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v1.0
                </span>
              </div>
              <p class="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:block">
                Modern Retail POS & Khata
              </p>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav class="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#features" class="hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#demo-preview" class="hover:text-emerald-400 transition-colors">
              Live Preview
            </a>
            <a href="#solutions" class="hover:text-emerald-400 transition-colors">
              Solutions
            </a>
            <a href="#docs" class="hover:text-emerald-400 transition-colors">
              Documentation
            </a>
            <a href="#pricing" class="hover:text-emerald-400 transition-colors">
              Pricing
            </a>
            <a href="#faq" class="hover:text-emerald-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action Buttons */}
          <div class="hidden sm:flex items-center gap-3">
            <a
              href="https://github.com/fvrvz/billease"
              target="_blank"
              rel="noopener noreferrer"
              class="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="GitHub Repository"
            >
              <Github class="w-5 h-5" />
            </a>

            <button
              onClick={props.onOpenDemo}
              class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 transition-all hover:scale-[1.02] shadow-xs"
            >
              <Calendar class="w-3.5 h-3.5 text-emerald-400" />
              Book a Demo
            </button>

            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-md shadow-emerald-500/25 hover:scale-[1.02]"
            >
              <span>Launch App</span>
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div class="md:hidden flex items-center gap-2">
            <button
              onClick={props.onOpenDemo}
              class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700"
            >
              Demo
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen())}
              class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <Show when={mobileMenuOpen()} fallback={<Menu class="w-6 h-6" />}>
                <X class="w-6 h-6" />
              </Show>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <Show when={mobileMenuOpen()}>
          <div class="md:hidden mt-4 pb-4 border-t border-slate-800/80 pt-4 space-y-3">
            <div class="flex flex-col gap-2.5 text-sm font-semibold text-slate-300">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                class="hover:text-emerald-400 py-1"
              >
                Features
              </a>
              <a
                href="#demo-preview"
                onClick={() => setMobileMenuOpen(false)}
                class="hover:text-emerald-400 py-1"
              >
                Live Preview
              </a>
              <a
                href="#solutions"
                onClick={() => setMobileMenuOpen(false)}
                class="hover:text-emerald-400 py-1"
              >
                Solutions
              </a>
              <a
                href="#docs"
                onClick={() => setMobileMenuOpen(false)}
                class="hover:text-emerald-400 py-1"
              >
                Documentation
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                class="hover:text-emerald-400 py-1"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                class="hover:text-emerald-400 py-1"
              >
                FAQ
              </a>
            </div>

            <div class="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  props.onOpenDemo();
                }}
                class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700"
              >
                <Calendar class="w-4 h-4 text-emerald-400" />
                Book a Live Demo
              </button>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noopener noreferrer"
                class="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md"
              >
                Launch Web POS <ExternalLink class="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </Show>
      </div>
    </header>
  );
};
