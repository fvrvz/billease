export interface DemoBooking {
  storeName: string;
  ownerName: string;
  phone: string;
  email: string;
  storeType: 'kirana' | 'supermarket' | 'pharmacy' | 'retail';
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}

export interface DemoProduct {
  id: string;
  name: string;
  mrp: number;
  sellingPrice: number;
  unit: string;
  gstRate: number;
  category: string;
}

export interface CartItem {
  product: DemoProduct;
  quantity: number;
}
