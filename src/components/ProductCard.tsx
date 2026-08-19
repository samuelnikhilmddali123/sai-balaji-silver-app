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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E7E2',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 145,
    backgroundColor: '#F7F6F2',
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
    backgroundColor: 'rgba(17, 17, 17, 0.88)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E5E0',
  },
  weightText: {
    color: '#111111',
    fontSize: 9,
    fontWeight: '700',
  },
  details: {
    padding: 10,
  },
  categoryTag: {
    color: '#898985',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  title: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 17,
    height: 34,
  },
  skuText: {
    color: '#999995',
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
    color: '#111111',
    fontSize: 14,
    fontWeight: '800',
  },
  addPlusBtn: {
    backgroundColor: '#111111',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
});
