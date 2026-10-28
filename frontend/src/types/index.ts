export type Role = 'SUPER_ADMIN' | 'STORE_ADMIN' | 'MANAGER' | 'CASHIER';
export type InvoiceType = 'TAX_INVOICE' | 'RETAIL_BILL';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CREDIT_KHATA' | 'SPLIT';
export type DiscountType = 'PERCENTAGE' | 'FLAT';
export type KhataEntryType = 'BILL_CREDIT' | 'PAYMENT_RECEIVED' | 'ADJUSTMENT';

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  legalName?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  stateCode: string;
  hasGst: boolean;
  gstin?: string;
  isCompositionScheme: boolean;
  logoUrl?: string;
  bannerUrl?: string;
  invoicePrefix: string;
  invoiceFooter: string;
  thermalWidthMm: number;
  upiVpa?: string;
  upiPayeeName?: string;
  loyaltyPointsPer100: number;
  loyaltyPointValueRs: number;
  isActive: boolean;
}

export interface User {
  id: string;
  tenantId?: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: Role;
  isActive: boolean;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId?: string;
  name: string;
  barcode?: string;
  sku?: string;
  unit: string;
  hsnCode: string;
  gstRate: number;
  isPriceTaxInclusive: boolean;
  minStockAlert: number;
  isActive: boolean;
  currentStock: number;
  mrp: number;
  sellingPrice: number;
}

export interface ProductCreateInput {
  name: string;
  barcode?: string;
  sku?: string;
  unit?: string;
  hsnCode?: string;
  gstRate?: number;
  isPriceTaxInclusive?: boolean;
  mrp: number;
  costPrice?: number;
  sellingPrice: number;
  initialQuantity?: number;
  minStockAlert?: number;
  expiryDate?: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  gstin?: string;
  address?: string;
  creditLimit: number;
  currentDue: number;
  loyaltyPoints: number;
}

export interface CustomerCreateInput {
  name: string;
  phone: string;
  gstin?: string;
  address?: string;
  creditLimit?: number;
}

export interface Coupon {
  id: string;
  tenantId: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountCap?: number;
  validUntil?: string;
  usageCount: number;
  maxUsage: number;
  isActive: boolean;
}

export interface CouponCreateInput {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountCap?: number;
  validUntil?: string;
  maxUsage?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent: number;
}

export interface InvoiceItemInput {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  mrp?: number;
  discountPercent?: number;
  gstRate?: number;
}

export interface InvoiceCreateInput {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: InvoiceItemInput[];
  billDiscountPercent?: number;
  billDiscountAmount?: number;
  couponCode?: string;
  couponDiscountAmount?: number;
  redeemLoyaltyPoints?: number;
  paymentMode: PaymentMode;
  cashTendered?: number;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  tenantId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  mrp: number;
  discountPercent: number;
  discountAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  itemDiscountTotal: number;
  billDiscountPercent: number;
  billDiscountAmount: number;
  couponCode?: string;
  couponDiscountAmount: number;
  loyaltyPointsRedeemed: number;
  loyaltyDiscountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  cashTendered: number;
  changeReturned: number;
  cashierName?: string;
  notes?: string;
  createdAt: string;
  items?: InvoiceItem[];
}

export interface DecodedOidcClaims {
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  role?: string;
  roles?: string[];
  realm_access?: { roles?: string[] };
  tenant_id?: string;
  exp?: number;
  iat?: number;
  iss?: string;
}

export interface AuthForestTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    tenantId?: string;
    username: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: string;
    isActive: boolean;
  };
  tenant?: {
    id: string;
    name: string;
    [key: string]: unknown;
  };
}
