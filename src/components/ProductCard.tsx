import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Heart } from 'lucide-react-native';
import { Product } from '../types';
import { getProductImageUrl } from '../services/api';
import { useWishlist } from '../context/WishlistContext';
import { useSilverRate } from '../context/SilverRateContext';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  width?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, width }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { calculateCurrentPrice } = useSilverRate();
  const inWishlist = isInWishlist(product.id);

  const categoryName = product.subcategory
    ? `${(product.category_slug || 'Silver').replace(/-/g, ' ').toUpperCase()} • ${product.subcategory.toUpperCase()}`
    : (product.category?.name || product.category_slug || 'SILVER DINING & TABLEWARE').replace(/-/g, ' ').toUpperCase();

  const formattedSku = product.sku || `SBS-DT-${product.id.toString().padStart(3, '0')}`;
  
  // Calculate live current price second-by-second tied to website silver rate
  const displayPrice = calculateCurrentPrice(product);

  const priceVal = displayPrice > 0
    ? displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : (product.retail_price ? product.retail_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A');

  return (
    <TouchableOpacity
      style={[styles.card, width ? { width } : undefined]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      {/* Product Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getProductImageUrl(product) }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Floating Heart / Wishlist Button */}
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          activeOpacity={0.8}
        >
          <Heart
            size={15}
            color={inWishlist ? '#E53E3E' : '#4A5568'}
            fill={inWishlist ? '#E53E3E' : 'none'}
          />
        </TouchableOpacity>
      </View>

      {/* Product Details */}
      <View style={styles.details}>
        {/* Category Tag */}
        <Text style={styles.categoryTag} numberOfLines={1}>
          {categoryName}
        </Text>

        {/* Product Title */}
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        {/* SKU Code */}
        <Text style={styles.skuText} numberOfLines={1}>
          SKU: {formattedSku}
        </Text>

        {/* Thin Divider Line */}
        <View style={styles.divider} />

        {/* Price Row with FROM & Live Badge */}
        <View style={styles.priceRow}>
          <View style={styles.fromRow}>
            <Text style={styles.fromText}>FROM</Text>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>
          </View>
          <Text style={styles.priceValue}>₹{priceVal}</Text>
        </View>

        {/* Full-width VIEW DETAILS Button */}
        <TouchableOpacity
          style={styles.viewDetailsBtn}
          onPress={onPress}
          activeOpacity={0.88}
        >
          <Text style={styles.viewDetailsText}>VIEW DETAILS</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
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
    aspectRatio: 3 / 2,
    backgroundColor: '#000000',
    position: 'relative',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  details: {
    padding: 12,
  },
  categoryTag: {
    color: '#B9A77A',
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    color: '#111111',
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 18,
    height: 36,
  },
  skuText: {
    color: '#888888',
    fontSize: 10.5,
    marginTop: 3,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#EAE6DF',
    marginVertical: 6,
  },
  priceRow: {
    marginVertical: 4,
  },
  fromRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  fromText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#777777',
    letterSpacing: 0.5,
  },
  liveBadge: {
    backgroundColor: '#FDF8EC',
    borderWidth: 1,
    borderColor: '#E8D4B0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B9A77A',
  },
  priceValue: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '800',
  },
  viewDetailsBtn: {
    backgroundColor: '#1A1918',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
