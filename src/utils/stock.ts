import { Product, ProductVariant } from '../types';

/**
 * Robust check if a raw value represents explicit false or out-of-stock
 */
const isExplicitlyOutOfStock = (val: any): boolean => {
  if (
    val === false ||
    val === 0 ||
    val === 'false' ||
    val === '0' ||
    val === '0.00' ||
    val === 'off' ||
    val === 'no' ||
    val === 'out_of_stock' ||
    val === 'OUT_OF_STOCK'
  ) {
    return true;
  }
  return false;
};

/**
 * Robust check if a stock quantity value is zero or negative
 */
const isStockZeroOrNegative = (stockVal: any): boolean => {
  if (stockVal === undefined || stockVal === null || stockVal === '') return false;
  const num = Number(stockVal);
  return !isNaN(num) && num <= 0;
};

/**
 * Check if a specific product variant is out of stock.
 * Checks parent product stock condition FIRST, then variant-level stock condition.
 */
export const isVariantOutOfStock = (variant?: ProductVariant | null, parentProduct?: Product | null): boolean => {
  if (!variant) return false;

  // 1. Check parent product overall out-of-stock condition first
  if (parentProduct) {
    if (
      isExplicitlyOutOfStock(parentProduct.in_stock) ||
      isExplicitlyOutOfStock((parentProduct as any).is_out_of_stock) ||
      (parentProduct as any).status === 'out_of_stock' ||
      (parentProduct as any).status === 'OUT_OF_STOCK' ||
      isExplicitlyOutOfStock((parentProduct as any).is_active === false ? false : undefined) ||
      isStockZeroOrNegative(parentProduct.stock)
    ) {
      return true;
    }
  }

  // 2. Check variant-level out-of-stock flags & stock quantity
  const rawVar = (variant as any).raw_variant || variant;

  if (
    isExplicitlyOutOfStock(variant.in_stock) ||
    isExplicitlyOutOfStock(rawVar.in_stock) ||
    isExplicitlyOutOfStock((variant as any).is_out_of_stock) ||
    isExplicitlyOutOfStock((rawVar as any).is_out_of_stock) ||
    (variant as any).status === 'out_of_stock' ||
    (variant as any).status === 'OUT_OF_STOCK' ||
    (rawVar as any).status === 'out_of_stock' ||
    (rawVar as any).status === 'OUT_OF_STOCK' ||
    isStockZeroOrNegative(variant.stock) ||
    isStockZeroOrNegative(rawVar.stock)
  ) {
    return true;
  }

  return false;
};

/**
 * Check if a product is completely out of stock across all of its active variants (or base stock).
 */
export const isProductFullyOutOfStock = (product?: Product | null): boolean => {
  if (!product) return false;

  // 1. Check direct parent product out-of-stock flags
  if (
    isExplicitlyOutOfStock(product.in_stock) ||
    isExplicitlyOutOfStock((product as any).is_out_of_stock) ||
    (product as any).status === 'out_of_stock' ||
    (product as any).status === 'OUT_OF_STOCK'
  ) {
    return true;
  }

  // 2. Check direct parent product stock quantity
  if (isStockZeroOrNegative(product.stock)) {
    return true;
  }

  // 3. Variant level check: If ALL active variants are out of stock
  const variantList = product.variants || (product as any).sizes;
  if (Array.isArray(variantList) && variantList.length > 0) {
    const activeVariants = variantList.filter(
      (v) => v.is_active !== false && (v as any).is_active !== 'false' && (v as any).is_active !== 0
    );
    if (activeVariants.length > 0) {
      return activeVariants.every((v) => isVariantOutOfStock(v, product));
    }
  }

  return false;
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
 * Check if a specific cart item (product + selected variant) is out of stock.
 */
export const isCartItemOutOfStock = (product?: Product | null, selectedVariant?: ProductVariant | null): boolean => {
  if (!product) return false;

  if (isProductFullyOutOfStock(product)) {
    return true;
  }

  if (selectedVariant) {
    return isVariantOutOfStock(selectedVariant, product);
  }

  return false;
};
