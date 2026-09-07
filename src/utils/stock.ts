import { Product, ProductVariant } from '../types';

/**
 * Check if a specific product variant is out of stock.
 * If variant has explicit stock set, evaluates variant stock.
 * If parent product has in_stock === false or is_out_of_stock === true, marks as out of stock.
 */
export const isVariantOutOfStock = (variant?: ProductVariant | null, parentProduct?: Product | null): boolean => {
  if (!variant) return false;

  // Check explicit boolean/string in_stock toggle on variant
  if (variant.in_stock === false || (variant.in_stock as any) === 'false') return true;

  // Check explicit variant stock if defined
  if (variant.stock !== undefined && variant.stock !== null && !isNaN(Number(variant.stock))) {
    return Number(variant.stock) <= 0;
  }

  // Check parent product overall out of stock condition if variant stock is undefined
  if (parentProduct) {
    if (
      parentProduct.in_stock === false ||
      (parentProduct.in_stock as any) === 'false' ||
      (parentProduct as any).is_out_of_stock === true
    ) {
      return true;
    }
    if (
      parentProduct.stock !== undefined &&
      parentProduct.stock !== null &&
      Number(parentProduct.stock) <= 0
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Check if a product is completely out of stock across all of its active variants (or base stock).
 */
export const isProductFullyOutOfStock = (product?: Product | null): boolean => {
  if (!product) return false;

  // Explicit in_stock toggle or is_out_of_stock flag
  if (
    product.in_stock === false ||
    (product.in_stock as any) === 'false' ||
    (product as any).is_out_of_stock === true
  ) {
    return true;
  }

  const variantList = product.variants || product.sizes;
  if (Array.isArray(variantList) && variantList.length > 0) {
    const activeVariants = variantList.filter((v) => v.is_active !== false);
    if (activeVariants.length > 0) {
      return activeVariants.every((v) => isVariantOutOfStock(v, product));
    }
  }

  return product.stock !== undefined && product.stock !== null && Number(product.stock) <= 0;
};

/**
 * Get the first active and in-stock variant.
 * If all variants are out of stock, returns the first active variant (or fallback).
 */
export const getFirstInStockVariant = (
  variants?: ProductVariant[] | null,
  parentProduct?: Product | null
): ProductVariant | null => {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  const activeVariants = variants.filter((v) => v.is_active !== false);
  if (activeVariants.length === 0) return variants[0] || null;

  const inStock = activeVariants.find((v) => !isVariantOutOfStock(v, parentProduct));
  return inStock || activeVariants[0];
};

/**
 * Check if a specific item (product + selected variant) is out of stock.
 */
export const isCartItemOutOfStock = (product?: Product | null, selectedVariant?: ProductVariant | null): boolean => {
  if (!product) return false;

  if (
    product.in_stock === false ||
    (product.in_stock as any) === 'false' ||
    (product.stock !== undefined && Number(product.stock) <= 0 && (!product.variants || product.variants.length === 0))
  ) {
    return true;
  }

  if (selectedVariant) {
    return isVariantOutOfStock(selectedVariant, product);
  }

  return isProductFullyOutOfStock(product);
};
