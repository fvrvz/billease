import { Component, createSignal, Show } from 'solid-js';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { POSRegister } from './components/POSRegister';
import { SalesLedger } from './components/SalesLedger';
import { ProductCatalog } from './components/ProductCatalog';
import { CustomerKhata } from './components/CustomerKhata';
import { CouponLoyalty } from './components/CouponLoyalty';
import { StoreSettings } from './components/StoreSettings';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { UpiQrModal } from './components/UpiQrModal';
import { Invoice } from './types';

const AppShell: Component = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Show when={isAuthenticated()} fallback={<LoginPage />}>
      <AuthenticatedApp />
    </Show>
  );
};

const AuthenticatedApp: Component = () => {
  const [activeTab, setActiveTab] = createSignal('pos');
  const [activeInvoice, setActiveInvoice] = createSignal<Invoice | null>(null);
  const [upiData, setUpiData] = createSignal<{ amount: number; upiUri: string } | null>(null);

  const openUpiModal = (amount: number, upiUri: string) => {
    setUpiData({ amount, upiUri });
  };

  return (
    <div class="flex h-screen w-screen overflow-hidden bg-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab()} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Page Body */}
        <main class="flex-1 overflow-y-auto p-4 lg:p-6">
          <Show when={activeTab() === 'pos'}>
            <POSRegister
              onBillGenerated={(inv) => setActiveInvoice(inv)}
              openUpiModal={openUpiModal}
            />
          </Show>

          <Show when={activeTab() === 'sales'}>
            <SalesLedger
              onSelectInvoice={(inv) => setActiveInvoice(inv)}
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
      </div>

      {/* Modals */}
      <Show when={activeInvoice()}>
        <ThermalReceiptModal
          invoice={activeInvoice()!}
          onClose={() => setActiveInvoice(null)}
        />
      </Show>

      <Show when={upiData()}>
        <UpiQrModal
          amount={upiData()!.amount}
          upiUri={upiData()!.upiUri}
          onClose={() => setUpiData(null)}
        />
      </Show>
    </div>
  );
};

export const App: Component = () => {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
};
