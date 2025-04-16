
export type UserRole = 'business' | 'affiliate' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface Business {
  id: string;
  userId: string;
  name: string;
  description: string;
  logoUrl?: string;
  products: Product[];
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  commissionRate: number;
  affiliates: string[]; // User IDs of affiliates who selected this product
}

export interface Affiliate {
  id: string;
  userId: string;
  bio: string;
  selectedProducts: string[]; // Product IDs
  referralLinks: ReferralLink[];
  earnings: number;
}

export interface ReferralLink {
  id: string;
  productId: string;
  affiliateId: string;
  code: string;
  clicks: number;
  conversions: number;
  createdAt: Date;
}

export interface Sale {
  id: string;
  productId: string;
  referralLinkId: string;
  amount: number;
  commissionAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface Withdrawal {
  id: string;
  affiliateId: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}
