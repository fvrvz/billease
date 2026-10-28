import {
  Tenant,
  Product,
  Customer,
  Coupon,
  Invoice,
  InvoiceItem,
  ProductCreateInput,
  CustomerCreateInput,
  CouponCreateInput,
  InvoiceCreateInput,
  InvoiceItemInput,
  LoginResponse,
  SalesOverview,
  SoldItemStats,
  SendWhatsappBillResponse
} from '../types';

const API_BASE = '/api';

export const apiClient = {
  async login(username: string, password: string): Promise<LoginResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) return (await res.json()) as LoginResponse;
    } catch (_) {}
    return null;
  },

  async getTenant(tenantId: string): Promise<Tenant> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}`);
      if (res.ok) return (await res.json()) as Tenant;
    } catch (_) {}
    return getFallbackTenant();
  },

  async updateTenant(tenantId: string, token: string, updates: Partial<Tenant>): Promise<Tenant> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      if (res.ok) return (await res.json()) as Tenant;
    } catch (_) {}
    const current = getFallbackTenant();
    const updated: Tenant = { ...current, ...updates };
    localStorage.setItem('billease_tenant', JSON.stringify(updated));
    return updated;
  },

  async listProducts(tenantId: string, query?: string): Promise<Product[]> {
    try {
      const q = query ? `?q=${encodeURIComponent(query)}` : '';
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/products${q}`);
      if (res.ok) return (await res.json()) as Product[];
    } catch (_) {}
    return getFallbackProducts(query);
  },

  async createProduct(tenantId: string, token: string, product: ProductCreateInput): Promise<Product> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(product)
      });
      if (res.ok) return (await res.json()) as Product;
    } catch (_) {}
    const newProduct: Product = {
      id: 'prod-' + Date.now(),
      tenantId,
      name: product.name,
      barcode: product.barcode || '',
      sku: product.sku || '',
      unit: product.unit || 'PCS',
      hsnCode: product.hsnCode || '',
      gstRate: product.gstRate || 0,
      isPriceTaxInclusive: product.isPriceTaxInclusive ?? true,
      minStockAlert: product.minStockAlert || 5,
      isActive: true,
      currentStock: product.initialQuantity || 0,
      mrp: product.mrp,
      sellingPrice: product.sellingPrice
    };
    const list = getFallbackProducts();
    list.unshift(newProduct);
    localStorage.setItem('billease_products', JSON.stringify(list));
    return newProduct;
  },

  async listCustomers(tenantId: string, token: string): Promise<Customer[]> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/customers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return (await res.json()) as Customer[];
    } catch (_) {}
    return getFallbackCustomers();
  },

  async createCustomer(tenantId: string, token: string, customer: CustomerCreateInput): Promise<Customer> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(customer)
      });
      if (res.ok) return (await res.json()) as Customer;
    } catch (_) {}
    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      tenantId,
      name: customer.name,
      phone: customer.phone,
      gstin: customer.gstin,
      address: customer.address,
      creditLimit: customer.creditLimit || 5000,
      currentDue: 0,
      loyaltyPoints: 0
    };
    const list = getFallbackCustomers();
    list.push(newCust);
    localStorage.setItem('billease_customers', JSON.stringify(list));
    return newCust;
  },

  async recordKhataPayment(tenantId: string, token: string, customerId: string, amount: number, paymentMethod: string, notes?: string): Promise<Customer> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/customers/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customerId, amount, paymentMethod, notes })
      });
      if (res.ok) return (await res.json()) as Customer;
    } catch (_) {}
    const list = getFallbackCustomers();
    const cust = list.find(c => c.id === customerId);
    if (cust) {
      cust.currentDue = Math.max(0, cust.currentDue - amount);
      localStorage.setItem('billease_customers', JSON.stringify(list));
      return cust;
    }
    throw new Error('Customer not found');
  },

  async listCoupons(tenantId: string, token: string): Promise<Coupon[]> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/coupons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return (await res.json()) as Coupon[];
    } catch (_) {}
    return getFallbackCoupons();
  },

  async createCoupon(tenantId: string, token: string, coupon: CouponCreateInput): Promise<Coupon> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(coupon)
      });
      if (res.ok) return (await res.json()) as Coupon;
    } catch (_) {}
    const newCoupon: Coupon = {
      id: 'coup-' + Date.now(),
      tenantId,
      code: coupon.code.toUpperCase(),
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountCap: coupon.maxDiscountCap,
      validUntil: coupon.validUntil,
      usageCount: 0,
      maxUsage: coupon.maxUsage || 1000,
      isActive: true
    };
    const list = getFallbackCoupons();
    list.unshift(newCoupon);
    localStorage.setItem('billease_coupons', JSON.stringify(list));
    return newCoupon;
  },

  async validateCoupon(tenantId: string, code: string, cartTotal: number): Promise<{ isValid: boolean; discountAmount: number; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, cartTotal })
      });
      if (res.ok) return (await res.json()) as { isValid: boolean; discountAmount: number; message: string };
    } catch (_) {}
    const coupons = getFallbackCoupons();
    const found = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
    if (!found) {
      return { isValid: false, discountAmount: 0, message: `Coupon '${code}' is invalid or expired` };
    }
    if (cartTotal < found.minOrderAmount) {
      return { isValid: false, discountAmount: 0, message: `Minimum order of ₹${found.minOrderAmount} required for coupon` };
    }
    let discount = found.discountType === 'FLAT' 
      ? Math.min(found.discountValue, cartTotal)
      : (cartTotal * found.discountValue) / 100;
    if (found.maxDiscountCap) {
      discount = Math.min(discount, found.maxDiscountCap);
    }
    discount = Math.round(discount * 100) / 100;
    return { isValid: true, discountAmount: discount, message: `Coupon applied! Saved ₹${discount}` };
  },

  async toggleCoupon(tenantId: string, couponId: string, token: string): Promise<Coupon | null> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/coupons/${couponId}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) return (await res.json()) as Coupon | null;
    } catch (_) {}
    // Offline fallback: toggle in localStorage
    const coupons = getFallbackCoupons();
    const idx = coupons.findIndex(c => c.id === couponId);
    if (idx >= 0) {
      coupons[idx] = { ...coupons[idx], isActive: !coupons[idx].isActive };
      localStorage.setItem('billease_coupons', JSON.stringify(coupons));
      return coupons[idx];
    }
    return null;
  },

  async createInvoice(tenantId: string, token: string, invoiceData: InvoiceCreateInput): Promise<Invoice> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(invoiceData)
      });
      if (res.ok) return (await res.json()) as Invoice;
    } catch (_) {}

    // Offline / Mock calculation
    const tenant = getFallbackTenant();
    const subtotal = invoiceData.items.reduce((acc: number, it: InvoiceItemInput) => acc + (it.unitPrice * it.quantity), 0);
    const itemDiscTotal = invoiceData.items.reduce((acc: number, it: InvoiceItemInput) => {
      const disc = (it.unitPrice * it.quantity * (it.discountPercent || 0)) / 100;
      return acc + disc;
    }, 0);
    const billDiscAmt = (invoiceData.billDiscountPercent && invoiceData.billDiscountPercent > 0)
      ? (subtotal * invoiceData.billDiscountPercent) / 100 
      : (invoiceData.billDiscountAmount || 0);
    const couponDiscAmt = invoiceData.couponDiscountAmount || 0;
    const loyaltyDiscAmt = (invoiceData.redeemLoyaltyPoints || 0) * tenant.loyaltyPointValueRs;

    const netBeforeRound = Math.max(0, subtotal - itemDiscTotal - billDiscAmt - couponDiscAmt - loyaltyDiscAmt);
    const grandTotal = Math.round(netBeforeRound);
    const roundOff = Math.round((grandTotal - netBeforeRound) * 100) / 100;

    const invItems: InvoiceItem[] = invoiceData.items.map((it: InvoiceItemInput, idx: number) => {
      const lineTotal = it.unitPrice * it.quantity * (1 - (it.discountPercent || 0)/100);
      const taxRate = tenant.hasGst ? (it.gstRate || 0) : 0;
      const divisor = 1 + (taxRate / 100);
      const taxable = Math.round((lineTotal / divisor) * 100) / 100;
      const tax = Math.round((lineTotal - taxable) * 100) / 100;
      const halfTax = Math.round((tax / 2) * 100) / 100;

      return {
        id: `item-${Date.now()}-${idx}`,
        invoiceId: 'inv-' + Date.now(),
        tenantId,
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unit: 'PCS',
        unitPrice: it.unitPrice,
        mrp: it.mrp || it.unitPrice,
        discountPercent: it.discountPercent || 0,
        discountAmount: (it.unitPrice * it.quantity * (it.discountPercent || 0)) / 100,
        gstRate: taxRate,
        cgstAmount: halfTax,
        sgstAmount: tax - halfTax,
        igstAmount: 0,
        totalAmount: lineTotal
      };
    });

    const totalCgst = invItems.reduce((acc: number, it: InvoiceItem) => acc + it.cgstAmount, 0);
    const totalSgst = invItems.reduce((acc: number, it: InvoiceItem) => acc + it.sgstAmount, 0);
    const totalTaxable = invItems.reduce((acc: number, it: InvoiceItem) => acc + (it.totalAmount - (it.cgstAmount + it.sgstAmount)), 0);

    const invoice: Invoice = {
      id: 'inv-' + Date.now(),
      tenantId,
      invoiceNumber: `${tenant.invoicePrefix}-${Math.floor(100000 + Math.random() * 900000)}`,
      invoiceType: tenant.hasGst ? 'TAX_INVOICE' : 'RETAIL_BILL',
      customerId: invoiceData.customerId,
      customerName: invoiceData.customerName,
      customerPhone: invoiceData.customerPhone,
      subtotal,
      itemDiscountTotal: itemDiscTotal,
      billDiscountPercent: invoiceData.billDiscountPercent || 0,
      billDiscountAmount: billDiscAmt,
      couponCode: invoiceData.couponCode,
      couponDiscountAmount: couponDiscAmt,
      loyaltyPointsRedeemed: invoiceData.redeemLoyaltyPoints || 0,
      loyaltyDiscountAmount: loyaltyDiscAmt,
      taxableAmount: totalTaxable,
      cgstAmount: totalCgst,
      sgstAmount: totalSgst,
      igstAmount: 0,
      roundOff,
      grandTotal,
      paymentMode: invoiceData.paymentMode,
      cashTendered: invoiceData.cashTendered || 0,
      changeReturned: Math.max(0, (invoiceData.cashTendered || 0) - grandTotal),
      cashierName: 'Counter Cashier',
      notes: invoiceData.notes,
      createdAt: new Date().toISOString(),
      items: invItems
    };

    // Update customer Udhaar if applicable
    if (invoiceData.customerId && invoiceData.paymentMode === 'CREDIT_KHATA') {
      const customers = getFallbackCustomers();
      const c = customers.find(x => x.id === invoiceData.customerId);
      if (c) {
        c.currentDue += grandTotal;
        localStorage.setItem('billease_customers', JSON.stringify(customers));
      }
    }

    // Deduct local product stock
    const prods = getFallbackProducts();
    invoiceData.items.forEach((it: InvoiceItemInput) => {
      const p = prods.find(x => x.id === it.productId);
      if (p) {
        p.currentStock = Math.max(0, p.currentStock - it.quantity);
      }
    });
    localStorage.setItem('billease_products', JSON.stringify(prods));

    // Save fallback invoice
    const savedInvoices = getFallbackInvoices();
    savedInvoices.unshift(invoice);
    localStorage.setItem('billease_invoices', JSON.stringify(savedInvoices));

    return invoice;
  },

  async listInvoices(tenantId: string, token: string): Promise<Invoice[]> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/invoices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return (await res.json()) as Invoice[];
    } catch (_) {}
    return getFallbackInvoices();
  },

  async getSalesOverview(tenantId: string, token: string): Promise<SalesOverview> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/sales/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return (await res.json()) as SalesOverview;
    } catch (_) {}
    const invs = getFallbackInvoices();
    const totalSales = invs.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalItems = invs.reduce((sum, inv) => sum + (inv.items?.reduce((s, it) => s + it.quantity, 0) || 0), 0);
    const cash = invs.filter(i => i.paymentMode === 'CASH').reduce((s, i) => s + i.grandTotal, 0);
    const upi = invs.filter(i => i.paymentMode === 'UPI').reduce((s, i) => s + i.grandTotal, 0);
    const khata = invs.filter(i => i.paymentMode === 'CREDIT_KHATA').reduce((s, i) => s + i.grandTotal, 0);
    const card = invs.filter(i => i.paymentMode === 'CARD').reduce((s, i) => s + i.grandTotal, 0);
    return {
      totalSales,
      totalInvoices: invs.length,
      totalItemsSold: totalItems,
      cashSales: cash,
      upiSales: upi,
      khataSales: khata,
      cardSales: card,
      splitSales: 0
    };
  },

  async getSoldItems(tenantId: string, token: string): Promise<SoldItemStats[]> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/sales/sold-items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) return (await res.json()) as SoldItemStats[];
    } catch (_) {}
    const invs = getFallbackInvoices();
    const itemMap = new Map<string, { qty: number; revenue: number; prices: number[]; count: number }>();
    invs.forEach(inv => {
      inv.items?.forEach(it => {
        const existing = itemMap.get(it.productName) || { qty: 0, revenue: 0, prices: [], count: 0 };
        existing.qty += it.quantity;
        existing.revenue += it.totalAmount;
        existing.prices.push(it.unitPrice);
        existing.count += 1;
        itemMap.set(it.productName, existing);
      });
    });
    return Array.from(itemMap.entries()).map(([productName, data]) => ({
      productName,
      totalQuantity: data.qty,
      totalRevenue: data.revenue,
      avgPrice: data.prices.length > 0 ? (data.prices.reduce((a, b) => a + b, 0) / data.prices.length) : 0,
      ordersCount: data.count
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);
  },

  async sendInvoiceWhatsapp(
    tenantId: string,
    invoiceId: string,
    token: string,
    phone: string,
    customMessage?: string
  ): Promise<SendWhatsappBillResponse> {
    try {
      const res = await fetch(`${API_BASE}/tenants/${tenantId}/invoices/${invoiceId}/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone, customMessage })
      });
      if (res.ok) return (await res.json()) as SendWhatsappBillResponse;
    } catch (_) {}
    const clean = phone.replace(/[^0-9]/g, '');
    const target = clean.length === 10 ? `91${clean}` : clean;
    const msg = customMessage || `🧾 Bill copy from Billease for invoice #${invoiceId}`;
    return {
      sent: true,
      whatsappUrl: `https://wa.me/${target}?text=${encodeURIComponent(msg)}`,
      message: `WhatsApp link ready for +${target}`
    };
  }
};

function getFallbackInvoices(): Invoice[] {
  const saved = localStorage.getItem('billease_invoices');
  if (saved) return JSON.parse(saved) as Invoice[];
  return [];
}

// Fallback seed data
function getFallbackTenant(): Tenant {
  const saved = localStorage.getItem('billease_tenant');
  if (saved) return JSON.parse(saved) as Tenant;
  return {
    id: 'a0000000-0000-0000-0000-000000000001',
    slug: 'shree-ganesh-supermarket',
    name: 'Shree Ganesh Supermarket',
    legalName: 'Shree Ganesh Retail Enterprises LLP',
    phone: '+91 98765 43210',
    email: 'contact@shreeganeshstore.com',
    address: 'Shop 4, MG Road, Shivaji Nagar',
    city: 'Pune',
    stateCode: '27',
    hasGst: true,
    gstin: '27ABCDE1234F1Z5',
    isCompositionScheme: false,
    logoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=120&h=120&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&h=300&fit=crop',
    invoicePrefix: 'SGS',
    invoiceFooter: 'Thank you for shopping with us! Visit again.',
    thermalWidthMm: 80,
    upiVpa: 'shreeganesh@upi',
    upiPayeeName: 'Shree Ganesh Supermarket',
    loyaltyPointsPer100: 1,
    loyaltyPointValueRs: 1,
    isActive: true
  };
}

function getFallbackProducts(query?: string): Product[] {
  const saved = localStorage.getItem('billease_products');
  let prods: Product[] = saved ? (JSON.parse(saved) as Product[]) : [
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      name: 'Parle-G Glucose Biscuit 100g',
      barcode: '8901719101014',
      sku: 'BIS-001',
      unit: 'PACK',
      hsnCode: '19053100',
      gstRate: 18,
      isPriceTaxInclusive: true,
      minStockAlert: 10,
      isActive: true,
      currentStock: 48,
      mrp: 10.00,
      sellingPrice: 10.00
    },
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      name: 'Tata Tea Gold 250g',
      barcode: '8901052002345',
      sku: 'BEV-001',
      unit: 'PACK',
      hsnCode: '09024020',
      gstRate: 5,
      isPriceTaxInclusive: true,
      minStockAlert: 5,
      isActive: true,
      currentStock: 18,
      mrp: 150.00,
      sellingPrice: 140.00
    },
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      name: 'Aashirvaad Shuddh Chakki Atta 5kg',
      barcode: '8901725121019',
      sku: 'GRC-001',
      unit: 'PACK',
      hsnCode: '11010000',
      gstRate: 5,
      isPriceTaxInclusive: true,
      minStockAlert: 8,
      isActive: true,
      currentStock: 12,
      mrp: 260.00,
      sellingPrice: 245.00
    },
    {
      id: 'd0000000-0000-0000-0000-000000000004',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      name: 'Dettol Original Soap 75g (Buy 3 Get 1)',
      barcode: '8901396312450',
      sku: 'HYG-001',
      unit: 'PACK',
      hsnCode: '34011110',
      gstRate: 18,
      isPriceTaxInclusive: true,
      minStockAlert: 6,
      isActive: true,
      currentStock: 22,
      mrp: 120.00,
      sellingPrice: 110.00
    },
    {
      id: 'd0000000-0000-0000-0000-000000000005',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      name: 'Tata Salt Vacuum Evaporated 1kg',
      barcode: '8901015000124',
      sku: 'GRC-002',
      unit: 'PACK',
      hsnCode: '25010010',
      gstRate: 0,
      isPriceTaxInclusive: true,
      minStockAlert: 15,
      isActive: true,
      currentStock: 35,
      mrp: 28.00,
      sellingPrice: 28.00
    }
  ];

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    return prods.filter(p => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q)));
  }
  return prods;
}

function getFallbackCustomers(): Customer[] {
  const saved = localStorage.getItem('billease_customers');
  if (saved) return JSON.parse(saved) as Customer[];
  return [
    {
      id: 'f0000000-0000-0000-0000-000000000001',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      name: 'Ramesh Bhai Shinde',
      phone: '+91 98220 12345',
      address: 'Flat 102, Shanti Heights',
      creditLimit: 5000,
      currentDue: 1250,
      loyaltyPoints: 45
    },
    {
      id: 'f0000000-0000-0000-0000-000000000002',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      name: 'Pooja Sharma',
      phone: '+91 97654 32109',
      address: 'B-14, Laxmi Park',
      creditLimit: 3000,
      currentDue: 0,
      loyaltyPoints: 120
    }
  ];
}

function getFallbackCoupons(): Coupon[] {
  const saved = localStorage.getItem('billease_coupons');
  if (saved) return JSON.parse(saved) as Coupon[];
  return [
    {
      id: '10000000-0000-0000-0000-000000000001',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      code: 'DIWALI50',
      discountType: 'FLAT',
      discountValue: 50,
      minOrderAmount: 500,
      maxDiscountCap: 50,
      usageCount: 14,
      maxUsage: 1000,
      isActive: true
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      tenantId: 'a0000000-0000-0000-0000-000000000001',
      code: 'SAVE10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 300,
      maxDiscountCap: 100,
      usageCount: 32,
      maxUsage: 500,
      isActive: true
    }
  ];
}
