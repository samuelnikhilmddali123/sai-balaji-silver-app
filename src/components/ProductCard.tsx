import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Product } from '../types';
import { getProductImageUrl } from '../services/api';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  width?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, width }) => {
  const { addToCart } = useCart();

  const handleAdd = () => {
    addToCart(product, 1);
  };

  const categoryName = (product.category_slug || 'Silver Creation')
    .replace(/-/g, ' ')
    .toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.card, width ? { width } : undefined]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Product Image + Badges */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getProductImageUrl(product) }}
          style={styles.image}
        />

        {/* Purity Badge */}
        <View style={styles.purityBadge}>
          <Text style={styles.purityText}>
            ✦ {product.silver_purity || '925 STERLING'}
          </Text>
        </View>

        {/* Weight Badge */}
        {product.weight_g ? (
          <View style={styles.weightBadge}>
            <Text style={styles.weightText}>{product.weight_g}g</Text>
          </View>
        ) : null}
      </View>

      {/* Product Details */}
      <View style={styles.details}>
        <Text style={styles.categoryTag} numberOfLines={1}>
          {categoryName}
        </Text>

        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <Text style={styles.skuText} numberOfLines={1}>
          SKU: {product.sku || `SBS-PA-${product.id.toString().padStart(3, '0')}`}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.priceValue}>
            ₹{product.retail_price ? product.retail_price.toLocaleString('en-IN') : 'N/A'}
          </Text>

          {/* Add to Bag Round Teal Plus Button */}
          <TouchableOpacity
            style={styles.addPlusBtn}
            onPress={handleAdd}
            activeOpacity={0.85}
          >
            <Plus color="#FFFFFF" size={16} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBF0F0',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 145,
    backgroundColor: '#F4F7F7',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  purityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(35, 94, 91, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  purityText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  weightBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EBF0F0',
  },
  weightText: {
    color: '#2D6A68',
    fontSize: 9,
    fontWeight: '700',
  },
  details: {
    padding: 12,
  },
  categoryTag: {
    color: '#2D6A68',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    color: '#111827',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 17,
    height: 34,
  },
  skuText: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 2,
    marginBottom: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceValue: {
    color: '#2D6A68',
    fontSize: 15,
    fontWeight: '800',
  },
  addPlusBtn: {
    backgroundColor: '#2D6A68',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D6A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
