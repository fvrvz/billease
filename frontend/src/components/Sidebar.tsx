import { Component, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart, Receipt, Package, BookOpen, Tag, Settings,
  ShieldCheck, LogOut, ExternalLink, ChevronRight, Store
} from 'lucide-solid';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: Component<{ class?: string }>;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { id: 'pos', label: 'POS Billing', shortcut: 'F2', icon: ShoppingCart },
  { id: 'sales', label: 'Sales & Bills', icon: Receipt },
  { id: 'products', label: 'Inventory', icon: Package },
  { id: 'khata', label: 'Khata / Udhaar', icon: BookOpen },
  { id: 'coupons', label: 'Coupons & Loyalty', icon: Tag },
  { id: 'settings', label: 'Store Settings', icon: Settings, adminOnly: true },
  { id: 'superadmin', label: 'Super Admin', icon: ShieldCheck, superAdminOnly: true },
];

export const Sidebar: Component<SidebarProps> = (props) => {
  const { user, tenant, isSuperAdmin, isStoreAdmin, logout } = useAuth();

  const roleBadgeClass = () => {
    const role = user()?.role;
    if (role === 'SUPER_ADMIN') return 'bg-purple-100 text-purple-700';
    if (role === 'STORE_ADMIN') return 'bg-emerald-100 text-emerald-700';
    return 'bg-slate-100 text-slate-600';
  };

  const roleLabel = () => {
    const role = user()?.role;
    if (role === 'SUPER_ADMIN') return 'Super Admin';
    if (role === 'STORE_ADMIN') return 'Store Owner';
    return 'Cashier';
  };

  const isVisible = (item: NavItem) => {
    if (item.superAdminOnly) return isSuperAdmin();
    if (item.adminOnly) return isStoreAdmin() || isSuperAdmin();
    return true;
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside class="w-60 shrink-0 bg-slate-900 flex flex-col h-full shadow-xl select-none z-20 overflow-hidden">

      {/* Brand */}
      <div class="px-5 py-5 border-b border-slate-800">
        <div class="flex items-center gap-3">
          <Show
            when={tenant()?.logoUrl}
            fallback={
              <div class="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow shrink-0">
                <Store class="w-5 h-5 text-white" />
              </div>
            }
          >
            <div class="w-9 h-9 rounded-xl bg-white border border-slate-700/50 p-1 flex items-center justify-center overflow-hidden shadow shrink-0">
              <img
                src={tenant()?.logoUrl}
                alt="Logo"
                class="max-w-full max-h-full object-contain"
              />
            </div>
          </Show>
          <div class="min-w-0">
            <p class="text-white font-bold text-sm leading-tight truncate">
              {tenant()?.name || 'Billease'}
            </p>
            <p class="text-slate-400 text-[11px] truncate">
              {tenant()?.city ? `${tenant()?.city} · ` : ''}{tenant()?.hasGst ? 'GST Registered' : 'Unregistered'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Show when={isVisible(item)}>
            <button
              onClick={() => props.setActiveTab(item.id)}
              class={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                props.activeTab === item.id
                  ? item.superAdminOnly
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon class="w-4 h-4 shrink-0" />
              <span class="flex-1 text-left">{item.label}</span>
              {item.shortcut && (
                <kbd class={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  props.activeTab === item.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'
                }`}>{item.shortcut}</kbd>
              )}
              <Show when={props.activeTab === item.id}>
                <ChevronRight class="w-3.5 h-3.5 opacity-70" />
              </Show>
            </button>
          </Show>
        ))}

        {/* Swagger Docs Link */}
        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <ExternalLink class="w-4 h-4 shrink-0" />
          <span class="flex-1 text-left">API Docs</span>
          <span class="text-[10px] bg-indigo-900 text-indigo-300 px-1.5 py-0.5 rounded font-mono">Swagger</span>
        </a>
      </nav>

      {/* User Panel + Logout */}
      <div class="p-3 border-t border-slate-800">
        <div class="bg-slate-800 rounded-xl p-3 mb-2">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm shrink-0">
              {user()?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-white text-xs font-semibold truncate">{user()?.fullName}</p>
              <span class={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${roleBadgeClass()}`}>
                {roleLabel()}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 text-sm font-medium transition-all"
        >
          <LogOut class="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
