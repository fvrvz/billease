import { Component, createSignal, onMount, For, Show } from 'solid-js';
import { useAuth } from '../context/AuthContext';
import { Invoice, SalesOverview, SoldItemStats } from '../types';
import { apiClient } from '../api/client';
import { downloadInvoicePdfLocally, shareInvoicePdf } from '../utils/pdfGenerator';
import {
  Receipt,
  TrendingUp,
  Search,
  Package,
  Eye,
  MessageCircle,
  FileDown,
  Banknote,
  QrCode,
  BookOpen,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-solid';

interface SalesLedgerProps {
  onSelectInvoice: (invoice: Invoice) => void;
}

export const SalesLedger: Component<SalesLedgerProps> = (props) => {
  const { tenant, token } = useAuth();

  const [invoices, setInvoices] = createSignal<Invoice[]>([]);
  const [overview, setOverview] = createSignal<SalesOverview>({
    totalSales: 0,
    totalInvoices: 0,
    totalItemsSold: 0,
    cashSales: 0,
    upiSales: 0,
    khataSales: 0,
    cardSales: 0,
    splitSales: 0,
    pendingSales: 0,
    pendingInvoices: 0
  });
  const [soldItems, setSoldItems] = createSignal<SoldItemStats[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [activeTab, setActiveTab] = createSignal<'bills' | 'items'>('bills');
  const [searchQuery, setSearchQuery] = createSignal('');
  const [paymentFilter, setPaymentFilter] = createSignal('ALL');
  const [statusFilter, setStatusFilter] = createSignal<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');

  const loadData = async () => {
    const t = tenant();
    if (!t) return;
    setLoading(true);
    try {
      const [invList, ovData, soldData] = await Promise.all([
        apiClient.listInvoices(t.id, token()),
        apiClient.getSalesOverview(t.id, token()),
        apiClient.getSoldItems(t.id, token())
      ]);
      setInvoices(invList);
      setOverview(ovData);
      setSoldItems(soldData);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaymentDone = async (inv: Invoice) => {
    const t = tenant();
    if (!t) return;
    const res = await apiClient.updateInvoicePaymentStatus(t.id, inv.id, token(), {
      paymentStatus: 'COMPLETED'
    });
    if (res) {
      await loadData();
    }
  };

  onMount(() => {
    loadData();
  });

  const filteredInvoices = () => {
    let list = invoices();
    const q = searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(i =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        (i.customerName && i.customerName.toLowerCase().includes(q)) ||
        (i.customerPhone && i.customerPhone.includes(q))
      );
    }
    if (paymentFilter() !== 'ALL') {
      list = list.filter(i => i.paymentMode === paymentFilter());
    }
    if (statusFilter() !== 'ALL') {
      list = list.filter(i => (i.paymentStatus || 'COMPLETED') === statusFilter());
    }
    return list;
  };

  const filteredSoldItems = () => {
    let list = soldItems();
    const q = searchQuery().trim().toLowerCase();
    if (q) {
      list = list.filter(it => it.productName.toLowerCase().includes(q));
    }
    return list;
  };

  const handleDownloadPdf = (inv: Invoice) => {
    const t = tenant();
    downloadInvoicePdfLocally(inv, {
      name: t?.name,
      legalName: t?.legalName,
      address: t?.address,
      city: t?.city,
      phone: t?.phone,
      gstin: t?.gstin,
      hasGst: t?.hasGst,
    });
  };

  const handleSharePdf = (inv: Invoice) => {
    const t = tenant();
    shareInvoicePdf(
      inv,
      {
        name: t?.name,
        legalName: t?.legalName,
        address: t?.address,
        city: t?.city,
        phone: t?.phone,
        gstin: t?.gstin,
        hasGst: t?.hasGst,
      },
      inv.customerPhone
    );
  };

  const paymentBadge = (mode: string) => {
    switch (mode) {
      case 'CASH':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'UPI':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'CREDIT_KHATA':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CARD':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div class="space-y-6">
      
      {/* Top Header */}
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt class="w-7 h-7 text-emerald-600" />
            Sales & Bills Ledger
          </h1>
          <p class="text-sm text-slate-500 mt-1">
            Track total revenue, examine sold products, reprint bills, and send WhatsApp copies.
          </p>
        </div>

        <button
          onClick={loadData}
          class="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw class={`w-3.5 h-3.5 ${loading() ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Revenue */}
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div class="text-2xl font-black text-slate-900">
            ₹{overview().totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p class="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp class="w-3.5 h-3.5" /> All-time completed revenue
          </p>
        </div>

        {/* Pending Payments / Unpaid Bills */}
        <div class="bg-amber-50/60 p-5 rounded-2xl border border-amber-200/80 shadow-xs">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Bills</span>
            <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock class="w-4 h-4" />
            </div>
          </div>
          <div class="text-2xl font-black text-amber-900">
            ₹{overview().pendingSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p class="text-[11px] text-amber-700 font-medium mt-1">
            {overview().pendingInvoices} unpaid / pending bill{overview().pendingInvoices === 1 ? '' : 's'}
          </p>
        </div>

        {/* Total Invoices */}
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Bills</span>
            <div class="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Receipt class="w-4 h-4" />
            </div>
          </div>
          <div class="text-2xl font-black text-slate-900">
            {overview().totalInvoices}
          </div>
          <p class="text-[11px] text-slate-500 font-medium mt-1">
            Paid transactions
          </p>
        </div>

        {/* Total Items Sold */}
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Items Sold</span>
            <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Package class="w-4 h-4" />
            </div>
          </div>
          <div class="text-2xl font-black text-slate-900">
            {overview().totalItemsSold} <span class="text-sm font-semibold text-slate-400">units</span>
          </div>
          <p class="text-[11px] text-slate-500 font-medium mt-1">
            Across completed bills
          </p>
        </div>

        {/* Payment Modes Mini-Breakdown */}
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span class="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Completed Split</span>
          <div class="space-y-1.5 text-xs font-semibold">
            <div class="flex justify-between items-center text-emerald-800">
              <span class="flex items-center gap-1"><Banknote class="w-3.5 h-3.5" /> Cash:</span>
              <span>₹{overview().cashSales.toFixed(2)}</span>
            </div>
            <div class="flex justify-between items-center text-sky-800">
              <span class="flex items-center gap-1"><QrCode class="w-3.5 h-3.5" /> UPI:</span>
              <span>₹{overview().upiSales.toFixed(2)}</span>
            </div>
            <div class="flex justify-between items-center text-amber-800">
              <span class="flex items-center gap-1"><BookOpen class="w-3.5 h-3.5" /> Khata:</span>
              <span>₹{overview().khataSales.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Tabs Container */}
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Navigation & Search Bar */}
        <div class="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          
          {/* Sub-tabs */}
          <div class="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('bills')}
              class={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab() === 'bills'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Receipt class="w-4 h-4" />
              Bills & Invoices ({invoices().length})
            </button>
            <button
              onClick={() => setActiveTab('items')}
              class={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab() === 'items'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Package class="w-4 h-4" />
              All Sold Items ({soldItems().length})
            </button>
          </div>

          {/* Search & Filters */}
          <div class="flex items-center gap-2 flex-1 md:max-w-md justify-end">
            <div class="relative flex-1">
              <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeTab() === 'bills' ? 'Search by bill no, buyer, phone...' : 'Search sold product name...'}
                value={searchQuery()}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                class="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <Show when={activeTab() === 'bills'}>
              <select
                value={statusFilter()}
                onChange={(e) => setStatusFilter(e.currentTarget.value as 'ALL' | 'COMPLETED' | 'PENDING')}
                class="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="ALL">All Status</option>
                <option value="COMPLETED">Paid (Done)</option>
                <option value="PENDING">Pending</option>
              </select>

              <select
                value={paymentFilter()}
                onChange={(e) => setPaymentFilter(e.currentTarget.value)}
                class="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="ALL">All Modes</option>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CREDIT_KHATA">Khata</option>
                <option value="CARD">Card</option>
              </select>
            </Show>
          </div>

        </div>

        {/* Content View 1: Invoices / Bills Table */}
        <Show when={activeTab() === 'bills'}>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th class="py-3 px-4">Bill No</th>
                  <th class="py-3 px-4">Date & Time</th>
                  <th class="py-3 px-4">Buyer / Customer</th>
                  <th class="py-3 px-4">Items</th>
                  <th class="py-3 px-4">Payment</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4 text-right">Grand Total</th>
                  <th class="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <For each={filteredInvoices()} fallback={
                  <tr>
                    <td colspan="8" class="py-12 text-center text-slate-400">
                      <Receipt class="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p class="font-medium">No bills found</p>
                    </td>
                  </tr>
                }>
                  {(inv) => (
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="py-3 px-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                        <span class="block text-[10px] font-sans font-normal text-slate-400">
                          {inv.invoiceType === 'TAX_INVOICE' ? 'Tax Invoice' : 'Cash Memo'}
                        </span>
                      </td>

                      <td class="py-3 px-4 text-slate-600">
                        <div>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</div>
                        <div class="text-[10px] text-slate-400">
                          {new Date(inv.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td class="py-3 px-4">
                        <div class="font-bold text-slate-900">
                          {inv.customerName || <span class="text-slate-400 font-normal italic">Walk-in Buyer</span>}
                        </div>
                        <Show when={inv.customerPhone}>
                          <div class="text-[10px] text-slate-500 font-mono">
                            {inv.customerPhone}
                          </div>
                        </Show>
                      </td>

                      <td class="py-3 px-4 text-slate-600">
                        <span class="font-bold text-slate-800">{inv.items?.length || 0}</span> items
                        <Show when={inv.items && inv.items.length > 0}>
                          <span class="block text-[10px] text-slate-400 truncate max-w-[160px]" title={(inv.items || []).map(x => x.productName).join(', ')}>
                            {(inv.items || []).map(x => x.productName).join(', ')}
                          </span>
                        </Show>
                      </td>

                      <td class="py-3 px-4">
                        <span class={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${paymentBadge(inv.paymentMode)}`}>
                          {inv.paymentMode}
                        </span>
                      </td>

                      <td class="py-3 px-4">
                        <Show
                          when={inv.paymentStatus === 'PENDING'}
                          fallback={
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle class="w-3 h-3 text-emerald-600" />
                              DONE
                            </span>
                          }
                        >
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock class="w-3 h-3 text-amber-600 animate-pulse" />
                            PENDING
                          </span>
                        </Show>
                      </td>

                      <td class="py-3 px-4 text-right font-black text-slate-900 text-sm">
                        ₹{inv.grandTotal.toFixed(2)}
                      </td>

                      <td class="py-3 px-4">
                        <div class="flex items-center justify-center gap-1.5">
                          {/* Mark Done button if pending */}
                          <Show when={inv.paymentStatus === 'PENDING'}>
                            <button
                              onClick={() => handleMarkPaymentDone(inv)}
                              title="Mark Payment Done / Received"
                              class="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-emerald-500 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition-colors"
                            >
                              <CheckCircle class="w-3 h-3" />
                              Mark Done
                            </button>
                          </Show>

                          {/* View & Reprint Receipt */}
                          <button
                            onClick={() => props.onSelectInvoice(inv)}
                            title="View Thermal Receipt"
                            class="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition-colors"
                          >
                            <Eye class="w-3.5 h-3.5" />
                          </button>

                          {/* Download PDF Bill */}
                          <button
                            onClick={() => handleDownloadPdf(inv)}
                            title="Download PDF Bill"
                            class="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                          >
                            <FileDown class="w-3.5 h-3.5" />
                          </button>

                          {/* Share WhatsApp (PDF) */}
                          <button
                            onClick={() => handleSharePdf(inv)}
                            title={inv.customerPhone ? `Send PDF Bill to ${inv.customerPhone} on WhatsApp` : 'Share PDF Bill on WhatsApp'}
                            class="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                          >
                            <MessageCircle class="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>

        {/* Content View 2: All Sold Items Analytics */}
        <Show when={activeTab() === 'items'}>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th class="py-3 px-4">Product Name</th>
                  <th class="py-3 px-4 text-right">Units Sold</th>
                  <th class="py-3 px-4 text-right">Avg Rate</th>
                  <th class="py-3 px-4 text-right">Total Revenue</th>
                  <th class="py-3 px-4 text-center">Order Count</th>
                  <th class="py-3 px-4">Sales Share</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <For each={filteredSoldItems()} fallback={
                  <tr>
                    <td colspan="6" class="py-12 text-center text-slate-400">
                      <Package class="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p class="font-medium">No sold items recorded yet</p>
                    </td>
                  </tr>
                }>
                  {(item) => {
                    const sharePct = overview().totalSales > 0
                      ? Math.min(100, Math.round((item.totalRevenue / overview().totalSales) * 100))
                      : 0;

                    return (
                      <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-3 px-4 font-bold text-slate-900 break-words whitespace-normal max-w-xs">
                          {item.productName}
                        </td>
                        <td class="py-3 px-4 text-right font-mono font-bold text-slate-800">
                          {item.totalQuantity}
                        </td>
                        <td class="py-3 px-4 text-right font-mono text-slate-600">
                          ₹{Number(item.avgPrice).toFixed(2)}
                        </td>
                        <td class="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                          ₹{Number(item.totalRevenue).toFixed(2)}
                        </td>
                        <td class="py-3 px-4 text-center font-bold text-slate-600">
                          {item.ordersCount} bills
                        </td>
                        <td class="py-3 px-4 w-40">
                          <div class="flex items-center gap-2">
                            <div class="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                class="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${sharePct}%` }}
                              />
                            </div>
                            <span class="text-[10px] font-bold text-slate-500 w-8 text-right">
                              {sharePct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </div>
        </Show>

      </div>

    </div>
  );
};
