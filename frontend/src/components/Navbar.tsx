import { Component, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, Package, BookOpen, Tag, Settings, ShieldCheck, Shield, ExternalLink } from 'lucide-solid';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openOidcModal: () => void;
}

export const Navbar: Component<NavbarProps> = (props) => {
  const { user, tenant, isSuperAdmin, isStoreAdmin, switchRole } = useAuth();

  return (
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          {/* Store Branding */}
          <div class="flex items-center gap-3">
            <Show when={tenant()?.logoUrl} fallback={
              <div class="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                B
              </div>
            }>
              <img 
                src={tenant()?.logoUrl} 
                alt="Store Logo" 
                class="w-10 h-10 rounded-lg object-cover border border-slate-200 shadow-xs" 
              />
            </Show>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-900 text-base leading-tight">
                  {tenant()?.name || 'Billease Store'}
                </span>
                <Show when={tenant()?.hasGst}>
                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                    GST Active
                  </span>
                </Show>
              </div>
              <p class="text-xs text-slate-500">
                {tenant()?.city ? `${tenant()?.city} • ` : ''} Indian Retail OS
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav class="hidden md:flex space-x-1">
            <button
              onClick={() => props.setActiveTab('pos')}
              class={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                props.activeTab === 'pos'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShoppingCart class="w-4 h-4" />
              POS Billing (F2)
            </button>

            <button
              onClick={() => props.setActiveTab('products')}
              class={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                props.activeTab === 'products'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Package class="w-4 h-4" />
              Stock & Inventory
            </button>

            <button
              onClick={() => props.setActiveTab('khata')}
              class={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                props.activeTab === 'khata'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen class="w-4 h-4" />
              Khata / Udhaar
            </button>

            <button
              onClick={() => props.setActiveTab('coupons')}
              class={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                props.activeTab === 'coupons'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Tag class="w-4 h-4" />
              Coupons & Loyalty
            </button>

            <Show when={isStoreAdmin() || isSuperAdmin()}>
              <button
                onClick={() => props.setActiveTab('settings')}
                class={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  props.activeTab === 'settings'
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Settings class="w-4 h-4" />
                Store Settings
              </button>
            </Show>

            <Show when={isSuperAdmin()}>
              <button
                onClick={() => props.setActiveTab('superadmin')}
                class={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  props.activeTab === 'superadmin'
                    ? 'bg-purple-50 text-purple-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck class="w-4 h-4 text-purple-600" />
                Super Admin
              </button>
            </Show>
          </nav>

          {/* Right Header: AuthForest OIDC Button & Role Switcher */}
          <div class="flex items-center gap-2">

            {/* Swagger API Docs Link */}
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Tapir Swagger OpenAPI Documentation"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors border border-indigo-200 shadow-2xs"
            >
              <span>Swagger</span>
              <ExternalLink class="w-3.5 h-3.5 text-indigo-600" />
            </a>
            
            {/* AuthForest OIDC Integration Button */}
            <button
              onClick={props.openOidcModal}
              title="Configure AuthForest OIDC Connection"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors border border-emerald-200 shadow-2xs"
            >
              <Shield class="w-3.5 h-3.5 text-emerald-600" />
              <span class="hidden sm:inline">AuthForest</span> OIDC
            </button>

            <div class="hidden lg:flex flex-col text-right">
              <span class="text-xs font-semibold text-slate-800">{user()?.fullName}</span>
              <span class="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                {user()?.role?.replace('_', ' ')}
              </span>
            </div>

            {/* Quick Demo Switcher */}
            <div class="bg-slate-100 p-1 rounded-lg flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => switchRole('CASHIER')}
                title="Switch to Cashier Role"
                class={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                  user()?.role === 'CASHIER' ? 'bg-white shadow-xs text-emerald-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cashier
              </button>
              <button
                onClick={() => switchRole('STORE_ADMIN')}
                title="Switch to Store Owner Role"
                class={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                  user()?.role === 'STORE_ADMIN' ? 'bg-white shadow-xs text-emerald-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Owner
              </button>
              <button
                onClick={() => switchRole('SUPER_ADMIN')}
                title="Switch to Super Admin Role"
                class={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                  user()?.role === 'SUPER_ADMIN' ? 'bg-white shadow-xs text-purple-700' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SuperAdmin
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
