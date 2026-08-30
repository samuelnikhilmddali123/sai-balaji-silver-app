export interface SubCategoryItem {
  name: string;
  slug?: string;
  sub_subcategories?: string[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  subcategories?: (string | SubCategoryItem)[];
  subcategories_count?: number;
}

export interface ProductVariant {
  id?: number | string;
  size?: string;
  label?: string;
  name?: string;
  weight_g: number;
  retail_price?: number;
  price?: number;
  wholesale_price?: number;
  sku?: string;
  stock?: number;
  dimensions?: string;
  height?: string;
  diameter?: string;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  sku: string;
  category_id: number;
  category_slug: string;
  subcategory?: string;
  sub_subcategory?: string;
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
  image_url?: string;
  category?: Category;
  variants?: ProductVariant[];
  sizes?: ProductVariant[];
  selected_variant?: ProductVariant;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  photo_url?: string;
  firebase_uid?: string;
  phone?: string;
  company_name?: string;
  gstin?: string;
  address?: string;
  street_address?: string;
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

export interface OrderItem {
  id?: number;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  sku?: string;
  title?: string;
  unit_price: number;
  price?: number;
  quantity: number;
  subtotal?: number;
  featured_image?: string;
  image_url?: string;
  size?: string;
  measurement?: string;
  weight_g?: number;
  weight?: string;
  variant?: any;
}

export interface Order {
  id: number | string;
  order_number: string;
  user_id?: number;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  items: OrderItem[];
  subtotal?: number;
  tax_amount?: number;
  shipping_charge?: number;
  grand_total: number;
  status: string;
  created_at: string;
  order_type?: 'retail' | 'wholesale';
}

