export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  subcategories?: string[];
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  sku: string;
  category_id: number;
  category_slug: string;
  subcategory?: string;
  silver_purity: string;
  weight_g: number;
  retail_price: number;
  wholesale_price?: number;
  description: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  stock: number;
  images?: string[];
  featured_image?: string;
  category?: Category;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  company_name?: string;
  gstin?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  role: 'CUSTOMER' | 'ADMIN';
  is_active: boolean;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type CartType = 'RETAIL' | 'WHOLESALE';

export interface EffectiveCartItem extends CartItem {
  effectivePrice: number;
  hasWholesalePrice: boolean;
  itemSubtotal: number;
}

export interface OrderPayload {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address: string;
  items: Array<{
    product_id: number;
    title: string;
    quantity: number;
    price: number;
  }>;
  grand_total: number;
}

export interface WholesaleQuotePayload {
  company_name: string;
  contact_person: string;
  phone: string;
  gstin?: string;
  product_requirements: string;
  items: Array<{
    product_id: number;
    title: string;
    quantity: number;
    unit_price: number;
  }>;
  estimated_total: number;
}
