import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ShoppingBag, Heart, ShieldCheck, CheckCircle2, MessageCircle, ArrowLeft, Download } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Product } from '../types';
import { getFullImageUrl } from '../services/api';
import { downloadAndSharePhoto, openWhatsAppDirect } from '../services/photoShare';

const { width } = Dimensions.get('window');

export const ProductDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const product: Product = route.params?.product;

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImg, setSelectedImg] = useState<string>(
    product?.featured_image || product?.images?.[0] || ''
  );

  if (!product) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Product not found.</Text>
      </View>
    );
  }

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    Alert.alert('Added to Cart', `${product.title} has been added to your cart.`);
  };

  const handleWhatsAppOrder = async () => {
    const imgUrl = getFullImageUrl(selectedImg || product.featured_image);
    let text = `*SAI BALAJI SILVERWORKS - PRODUCT ENQUIRY*\n`;
    text += `-------------------------\n\n`;
    text += `*Product*: ${product.title}\n`;
    text += `• SKU: ${product.sku || 'N/A'}\n`;
    text += `• Purity: ${product.silver_purity}\n`;
    text += `• Weight: ${product.weight_g} grams\n`;
    text += `• Quantity: ${quantity}\n`;
    text += `• Total Price: ₹${(product.retail_price * quantity).toLocaleString('en-IN')}\n`;
    if (imgUrl) {
      text += `Product Photo Link:\n${imgUrl}\n`;
    }
    text += `\nPlease guide me on availability, delivery address & payment details.`;

    await openWhatsAppDirect(text, imgUrl);
  };

  const handleSharePhotoOnly = async () => {
    const imgUrl = getFullImageUrl(selectedImg || product.featured_image);
    await downloadAndSharePhoto(imgUrl, product.title);
  };

  const topInset = Math.max(insets.top + 8, 40);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        
        {/* Gallery Image Display - Tapping photo downloads photo as JPEG & shares photo */}
        <TouchableOpacity
          style={styles.imageContainer}
          activeOpacity={0.9}
          onPress={handleSharePhotoOnly}
        >
          <Image source={{ uri: getFullImageUrl(selectedImg) }} style={styles.mainImage} />
          
          <View style={styles.imageOverlayBadge}>
            <Download color="#FFFFFF" size={12} />
            <Text style={styles.imageOverlayBadgeText}>Tap photo to download & send via WhatsApp</Text>
          </View>

          <TouchableOpacity
            style={[styles.backBtn, { top: topInset }]}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color="#1A1918" size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.wishlistBtn, { top: topInset }]}
            onPress={() => toggleWishlist(product)}
          >
            <Heart color={inWishlist ? '#E53E3E' : '#1A1918'} fill={inWishlist ? '#E53E3E' : 'none'} size={18} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Image Thumbnails if multiple */}
        {product.images && product.images.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled={true} style={styles.thumbScroll}>
            {product.images.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedImg(img)}
                style={[styles.thumbBox, selectedImg === img && styles.activeThumb]}
              >
                <Image source={{ uri: getFullImageUrl(img) }} style={styles.thumbImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product Meta */}
        <View style={styles.detailsContainer}>
          <View style={styles.purityRow}>
            <View style={styles.purityTag}>
              <ShieldCheck color="#C5A059" size={14} />
              <Text style={styles.purityTagText}>{product.silver_purity} Hallmarked Silver</Text>
            </View>
            <Text style={styles.skuText}>SKU: {product.sku}</Text>
          </View>

          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.weight}>Weight: {product.weight_g} grams</Text>

          {/* Price Box */}
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Retail Price</Text>
            <Text style={styles.priceValue}>₹{product.retail_price.toLocaleString()}</Text>
            <Text style={styles.priceSub}>Price inclusive of craftsmanship & hallmark certification. +3% GST at checkout.</Text>
          </View>

          {/* Specifications */}
          <View style={styles.specBox}>
            <Text style={styles.specTitle}>Product Specifications</Text>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Category:</Text>
              <Text style={styles.specVal}>{product.category_slug}</Text>
            </View>
            {product.subcategory && (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Subcategory:</Text>
                <Text style={styles.specVal}>{product.subcategory}</Text>
              </View>
            )}
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Availability:</Text>
              <Text style={[styles.specVal, { color: product.stock > 0 ? '#276749' : '#C53030' }]}>
                {product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descBox}>
            <Text style={styles.descTitle}>Description</Text>
            <Text style={styles.descText}>{product.description}</Text>
          </View>

          {/* Quantity Selector */}
          <View style={styles.qtyContainer}>
            <Text style={styles.qtyLabel}>Quantity:</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyVal}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={handleWhatsAppOrder}
        >
          <MessageCircle color="#25D366" size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addCartBtn}
          onPress={handleAddToCart}
        >
          <ShoppingBag color="#FFFFFF" size={18} />
          <Text style={styles.addCartText}>Add to Shopping Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F6',
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: '#111827',
  },
  imageContainer: {
    width: width,
    height: width * 0.9,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  wishlistBtn: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  thumbScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  thumbBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EBF0F0',
  },
  activeThumb: {
    borderColor: '#2D6A68',
    borderWidth: 2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: 20,
  },
  purityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  purityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2D6A68',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  purityTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  skuText: {
    color: '#6B7280',
    fontSize: 11,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  weight: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBF0F0',
    marginVertical: 16,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  priceLabel: {
    fontSize: 10,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D6A68',
    marginVertical: 2,
  },
  priceSub: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
  specBox: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBF0F0',
    marginBottom: 16,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  specTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  specLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  specVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  descBox: {
    marginBottom: 16,
  },
  descTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  descText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBF0F0',
    marginBottom: 20,
  },
  qtyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F4F7F7',
    borderWidth: 1,
    borderColor: '#2D6A68',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D6A68',
  },
  qtyVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
  },
  footerBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#EBF0F0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  whatsappBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#25D366',
  },
  addCartBtn: {
    flex: 1,
    height: 50,
    backgroundColor: '#2D6A68',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2D6A68',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addCartText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 25, 24, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  imageOverlayBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
