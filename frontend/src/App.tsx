import { Component, createSignal, Show } from 'solid-js';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { POSRegister } from './components/POSRegister';
import { ProductCatalog } from './components/ProductCatalog';
import { CustomerKhata } from './components/CustomerKhata';
import { CouponLoyalty } from './components/CouponLoyalty';
import { StoreSettings } from './components/StoreSettings';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { UpiQrModal } from './components/UpiQrModal';
import { Invoice } from './types';

const MainLayout: Component = () => {
  const { tenant } = useAuth();
  const [activeTab, setActiveTab] = createSignal('pos');

  // Modals state
  const [activeInvoice, setActiveInvoice] = createSignal<Invoice | null>(null);
  const [upiData, setUpiData] = createSignal<{ amount: number; upiUri: string } | null>(null);

  const openUpiModal = (amount: number, upiUri: string) => {
    setUpiData({ amount, upiUri });
  };

  return (
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Optional Store Top Banner */}
      <Show when={tenant()?.bannerUrl}>
        <div class="w-full h-24 overflow-hidden relative border-b border-slate-200">
          <img
            src={tenant()?.bannerUrl}
            alt="Store Banner"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-transparent flex items-center px-6">
            <h1 class="text-white text-xl font-black drop-shadow-md">
              {tenant()?.name}
            </h1>
          </div>
        </div>
      </Show>

      {/* Main Top Navbar */}
      <Navbar activeTab={activeTab()} setActiveTab={setActiveTab} />

      {/* Workspace Body */}
      <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Show when={activeTab() === 'pos'}>
          <POSRegister
            onBillGenerated={(inv) => setActiveInvoice(inv)}
            openUpiModal={openUpiModal}
          />
        </Show>

        <Show when={activeTab() === 'products'}>
          <ProductCatalog />
        </Show>

        <Show when={activeTab() === 'khata'}>
          <CustomerKhata />
        </Show>

        <Show when={activeTab() === 'coupons'}>
          <CouponLoyalty />
        </Show>

        <Show when={activeTab() === 'settings'}>
          <StoreSettings />
        </Show>

        <Show when={activeTab() === 'superadmin'}>
          <SuperAdminDashboard />
        </Show>
      </main>

      {/* Thermal Receipt Modal (Triggered on Bill creation) */}
      <Show when={activeInvoice()}>
        <ThermalReceiptModal
          invoice={activeInvoice()!}
          onClose={() => setActiveInvoice(null)}
        />
      </Show>

      {/* Dynamic UPI QR Modal (Triggered on UPI checkout) */}
      <Show when={upiData()}>
        <UpiQrModal
          amount={upiData()!.amount}
          upiUri={upiData()!.upiUri}
          onClose={() => setUpiData(null)}
        />
      </Show>

      {/* Compact Footer */}
      <footer class="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400">
        <span>Billease • Indian Retail & POS Engine • Built with Scala 3 & SolidJS</span>
      </footer>

    </div>
  );
};

export const App: Component = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};
