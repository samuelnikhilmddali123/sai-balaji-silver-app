import React, { createContext, useContext, useState, useEffect } from 'react';
import { silverRateApi } from '../services/api';
import { Product } from '../types';

export interface SilverRateStats {
  live_silver_rate: number;
  silver_999_rate: number;
  silver_999_kg: number;
  silver_925_rate: number;
  silver_925_kg: number;
  last_updated: string;
  isLive: boolean;
}

export interface PriceBreakdown {
  weight: number;
  silverRate: number;
  silverValue: number;
  makingCharge: number;
  wholesaleMakingCharge: number;
  makingChargeType: 'fixed' | 'per_gram' | 'percentage';
  finalPrice: number;
  wholesalePrice: number;
}

export interface SilverRateContextType {
  rateData: SilverRateStats;
  calculateDynamicPrice: (
    weightGrams: number,
    makingCharge: number,
    makingChargeType?: 'fixed' | 'per_gram' | 'percentage',
    purity?: string,
    wholesaleMakingCharge?: number
  ) => PriceBreakdown;
  calculateCurrentPrice: (target: Product | number | any, baseSilverRate?: number) => number;
  calculateWholesalePrice: (product: Product | any) => number;
}

const defaultStats: SilverRateStats = {
  live_silver_rate: 250.64,
  silver_999_rate: 250.64,
  silver_999_kg: 250640,
  silver_925_rate: 231.84,
  silver_925_kg: 231840,
  last_updated: new Date().toISOString(),
  isLive: true,
};

const SilverRateContext = createContext<SilverRateContextType>({
  rateData: defaultStats,
  calculateDynamicPrice: () => ({
    weight: 0,
    silverRate: 250.64,
    silverValue: 0,
    makingCharge: 0,
    wholesaleMakingCharge: 0,
    makingChargeType: 'fixed',
    finalPrice: 0,
    wholesalePrice: 0,
  }),
  calculateCurrentPrice: () => 0,
  calculateWholesalePrice: () => 0,
});

export const SilverRateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rateData, setRateData] = useState<SilverRateStats>(defaultStats);

  const fetchLiveRate = async () => {
    try {
      const res = await silverRateApi.getLiveRate();
      if (res && res.data) {
        const data = res.data;
        const liveRate = Number(data.live_silver_rate || data.silver_999_rate || data.rate_per_gram || data.rate || 250.64);
        const rate999 = Number(data.silver_999_rate || liveRate);
        const rate925 = Number(data.silver_925_rate || liveRate * 0.925);

        setRateData({
          live_silver_rate: liveRate,
          silver_999_rate: rate999,
          silver_999_kg: Number(data.silver_999_kg || Math.round(rate999 * 1000)),
          silver_925_rate: rate925,
          silver_925_kg: Number(data.silver_925_kg || Math.round(rate925 * 1000)),
          last_updated: data.last_updated || new Date().toISOString(),
          isLive: true,
        });
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveRate();
    const interval = setInterval(fetchLiveRate, 1000);
    return () => clearInterval(interval);
  }, []);

  const calculateDynamicPrice = (
    weightGrams: number,
    makingCharge: number,
    makingChargeType: 'fixed' | 'per_gram' | 'percentage' = 'fixed',
    purity: string = '925',
    wholesaleMakingCharge?: number
  ): PriceBreakdown => {
    const weight = parseFloat(String(weightGrams)) || 0;
    const mc = parseFloat(String(makingCharge)) || 0;
    const wmc =
      wholesaleMakingCharge !== undefined && wholesaleMakingCharge !== null
        ? parseFloat(String(wholesaleMakingCharge))
        : Math.round(mc * 0.75 * 100) / 100;

    const rate = rateData.live_silver_rate || 250.64;

    let purityFactor = 1.0;
    const purityStr = String(purity).toLowerCase();
    if (purityStr.includes('925') || purityStr.includes('sterling')) {
      purityFactor = 0.925;
    } else if (purityStr.includes('999') || purityStr.includes('fine')) {
      purityFactor = 1.0;
    }

    const silverValue = Math.round(weight * purityFactor * rate * 100) / 100;
    let calculatedMC = mc;
    let calculatedWMC = wmc;

    if (makingChargeType === 'per_gram') {
      calculatedMC = Math.round(mc * weight * 100) / 100;
      calculatedWMC = Math.round(wmc * weight * 100) / 100;
    } else if (makingChargeType === 'percentage') {
      calculatedMC = Math.round(((silverValue * mc) / 100) * 100) / 100;
      calculatedWMC = Math.round(((silverValue * wmc) / 100) * 100) / 100;
    }

    const finalPrice = Math.max(1, Math.round((silverValue + calculatedMC) * 100) / 100);
    const wholesalePrice = Math.max(1, Math.round((silverValue + calculatedWMC) * 100) / 100);

    return {
      weight,
      silverRate: rate,
      silverValue,
      makingCharge: calculatedMC,
      wholesaleMakingCharge: calculatedWMC,
      makingChargeType,
      finalPrice,
      wholesalePrice,
    };
  };

  const calculateCurrentPrice = (target: Product | number | any, baseSilverRate?: number): number => {
    if (typeof target === 'object' && target !== null) {
      // 1. Check if product has explicit active variants array from API
      if (Array.isArray(target.variants) && target.variants.length > 0) {
        const activeVariants = target.variants.filter((v: any) => v.is_active !== false);
        const sourceVariants = activeVariants.length > 0 ? activeVariants : target.variants;
        const lowestVariant = sourceVariants.reduce((min: any, v: any) => {
          const vPrice = calculateDynamicPrice(
            v.weight_g,
            v.making_charge,
            v.making_charge_type || 'fixed',
            target.silver_purity
          ).finalPrice;
          const minPrice = calculateDynamicPrice(
            min.weight_g,
            min.making_charge,
            min.making_charge_type || 'fixed',
            target.silver_purity
          ).finalPrice;
          return vPrice < minPrice ? v : min;
        }, sourceVariants[0]);

        return calculateDynamicPrice(
          lowestVariant.weight_g,
          lowestVariant.making_charge,
          lowestVariant.making_charge_type || 'fixed',
          target.silver_purity
        ).finalPrice;
      }

      // 2. Check if product has base_price / retail_price / price from database
      const baseP =
        typeof target.base_price === 'number' && target.base_price > 0
          ? target.base_price
          : typeof target.retail_price === 'number' && target.retail_price > 0
          ? target.retail_price
          : typeof target.price === 'number' && target.price > 0
          ? target.price
          : null;

      if (baseP !== null && !isNaN(baseP)) {
        const baseSR =
          typeof target.base_silver_rate === 'number'
            ? target.base_silver_rate
            : typeof target.current_silver_rate === 'number'
            ? target.current_silver_rate
            : 250.64;
        const diff = rateData.live_silver_rate - baseSR;
        return Math.max(1, Math.round((baseP + diff) * 100) / 100);
      }

      // 3. Dynamic weight calculation if base_price is absent
      if (typeof target.weight_g === 'number' && target.weight_g > 0) {
        return calculateDynamicPrice(
          target.weight_g,
          target.making_charges || target.making_charge || 0,
          target.making_charge_type || 'fixed',
          target.silver_purity
        ).finalPrice;
      }
    }

    const basePrice = target as number;
    if (!basePrice || isNaN(basePrice)) return 0;
    const sr = baseSilverRate !== undefined ? baseSilverRate : 250.64;
    const diff = rateData.live_silver_rate - sr;
    return Math.max(1, Math.round((basePrice + diff) * 100) / 100);
  };

  const calculateWholesalePrice = (product: Product | any): number => {
    const baseWP = product.wholesale_price || product.retail_price || 0;
    const baseSR =
      typeof product.base_silver_rate === 'number'
        ? product.base_silver_rate
        : typeof product.current_silver_rate === 'number'
        ? product.current_silver_rate
        : 250.64;
    if (!baseWP || isNaN(baseWP)) return 0;
    const diff = rateData.live_silver_rate - baseSR;
    return Math.max(1, Math.round((baseWP + diff) * 100) / 100);
  };

  return (
    <SilverRateContext.Provider
      value={{
        rateData,
        calculateDynamicPrice,
        calculateCurrentPrice,
        calculateWholesalePrice,
      }}
    >
      {children}
    </SilverRateContext.Provider>
  );
};

export const useSilverRate = () => useContext(SilverRateContext);
