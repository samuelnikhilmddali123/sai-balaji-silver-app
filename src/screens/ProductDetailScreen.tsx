import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  Platform,
  Linking,
  Share,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  Heart,
  Share2,
  ShieldCheck,
  Check,
  Sparkles,
  Truck,
  Factory,
  Copy,
  MessageCircle,
  Facebook,
  Instagram,
  X,
  ChevronRight,
  ShoppingBag,
  ArrowLeft,
  Info,
  RefreshCw,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useSilverRate } from '../context/SilverRateContext';
import { Product, ProductVariant } from '../types';
import { catalogApi, silverRateApi, getFullImageUrl } from '../services/api';
import { downloadAndSharePhoto, openWhatsAppDirect } from '../services/photoShare';

const { width } = Dimensions.get('window');

export interface MeasurementVariant {
  id: string;
  name: string;
  weight_g: number;
  height_in?: number | string;
  diameter_in?: number | string;
  making_charge?: number;
  making_type?: 'fixed' | 'per_gram' | 'percentage';
  making_value?: number;
  sku_suffix?: string;
}

// Default fallback measurement size variants matching luxury silver standards
const DEFAULT_MEASUREMENT_VARIANTS: MeasurementVariant[] = [
  { id: '2in', name: '2 inch', weight_g: 250, height_in: '3.5', diameter_in: '4.5', making_charge: 6250, sku_suffix: '-2IN' },
  { id: '3in', name: '3 inch', weight_g: 400, height_in: '4.2', diameter_in: '5.8', making_charge: 9800, sku_suffix: '-3IN' },
  { id: '4in', name: '4 inch', weight_g: 625, height_in: '5.5', diameter_in: '7.2', making_charge: 14800, sku_suffix: '-4IN' },
  { id: '6in', name: '6 inch', weight_g: 1000, height_in: '7.0', diameter_in: '9.5', making_charge: 23500, sku_suffix: '-6IN' },
  { id: '8in', name: '8 inch', weight_g: 1500, height_in: '9.2', diameter_in: '12.0', making_charge: 34500, sku_suffix: '-8IN' },
];

export const ProductDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const initialProduct: Product = route.params?.product;

  const [product, setProduct] = useState<Product>(initialProduct);
  const { cart, addToCart, updateQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [isLiveRateLoading, setIsLiveRateLoading] = useState<boolean>(false);

  // Active Gallery Image
  const [selectedImg, setSelectedImg] = useState<string>(
    initialProduct?.featured_image || initialProduct?.images?.[0] || ''
  );

  // Selected Measurement Variant
  const [activeVariant, setActiveVariant] = useState<MeasurementVariant>(DEFAULT_MEASUREMENT_VARIANTS[0]);

  // Active Bottom Tab State
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'purity' | 'care'>('desc');

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [copySuccessText, setCopySuccessText] = useState<boolean>(false);

  // Temporary Success state for Add To Bag button
  const [addSuccess, setAddSuccess] = useState<boolean>(false);

  // Fetch product detail from backend
  useEffect(() => {
    // Fetch full product details
    const prodIdOrSlug = initialProduct?.id || initialProduct?.slug || route.params?.idOrSlug;
    if (prodIdOrSlug) {
      catalogApi
        .getProductDetail(prodIdOrSlug)
        .then((res) => {
          if (res && res.data) {
            const fetched: Product = res.data.product || res.data;
            setProduct((prev) => ({ ...prev, ...fetched }));
            if (fetched.featured_image || (fetched.images && fetched.images.length > 0)) {
              setSelectedImg(fetched.featured_image || (fetched.images ? fetched.images[0] : ''));
            }
          }
        })
        .catch((err) => {
          console.log('Error fetching product detail:', err);
        });
    }
  }, [initialProduct]);

  if (!product) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Product not found.</Text>
      </View>
    );
  }

  const { rateData, calculateDynamicPrice } = useSilverRate();
  const inWishlist = isInWishlist(product.id);

  // Purity & Dynamic Price Calculation matching Web algorithm exactly
  const isFineSilver999 = product.silver_purity?.includes('999') || product.title?.includes('999');
  const purity = isFineSilver999 ? '999' : '925';
  const liveSilverRate = rateData.live_silver_rate || 250.64;
  const purityFactor = isFineSilver999 ? 1.0 : 0.925;

  // Available variants from product or default standard
  const availableVariants = useMemo<MeasurementVariant[]>(() => {
    const rawVariants = product.variants || (product as any).sizes;
    if (Array.isArray(rawVariants) && rawVariants.length > 0) {
      return rawVariants.map((v: any, index: number) => {
        const vWeight = parseFloat(String(v.weight_g || v.weight || product.weight_g || 250)) || 250;
        const vName = v.size || v.name || v.label || (v.dimensions ? v.dimensions : `${vWeight}g`);
        const vMaking = v.making_charge !== undefined ? parseFloat(String(v.making_charge)) : undefined;
        return {
          id: String(v.id || `v-${index}`),
          name: vName,
          weight_g: vWeight,
          height_in: v.height || v.height_in,
          diameter_in: v.diameter || v.diameter_in,
          making_charge: vMaking,
          making_type: v.making_type || 'fixed',
          sku_suffix: v.sku ? `-${v.sku}` : `-${index + 1}`,
        };
      });
    }
    return DEFAULT_MEASUREMENT_VARIANTS;
  }, [product]);

  const currentVariant = activeVariant || availableVariants[0];
  const currentWeight = currentVariant?.weight_g || product.weight_g || 250;

  const breakdown = calculateDynamicPrice(
    currentWeight,
    currentVariant.making_charge || Math.round(currentWeight * 25),
    currentVariant.making_type || 'fixed',
    purity
  );

  const rawProdPrice = product.retail_price || (product as any).price || (product as any).base_price;
  const silverValue = breakdown.silverValue;
  const makingCharge = breakdown.makingCharge;
  const finalCalculatedPrice = rawProdPrice && Number(rawProdPrice) > 0 ? Number(rawProdPrice) : breakdown.finalPrice;

  const currentSku = `${product.sku || 'SBS-DT-003'}${currentVariant.sku_suffix || ''}`;

  // Check if current variant is in cart
  const cartItem = cart.find(
    (item) =>
      item.product.id === product.id &&
      (item.product.selected_variant?.size === currentVariant.name ||
        item.product.selected_variant?.label === currentVariant.name)
  );
  const inCartQuantity = cartItem ? cartItem.quantity : 0;

  // Handlers
  const handleAddToCart = () => {
    const variantObj: ProductVariant = {
      size: activeVariant.name,
      label: activeVariant.name,
      weight_g: activeVariant.weight_g,
      retail_price: finalCalculatedPrice,
      price: finalCalculatedPrice,
      sku: currentSku,
      height: String(activeVariant.height_in || ''),
      diameter: String(activeVariant.diameter_in || ''),
    };

    const productWithVariant: Product = {
      ...product,
      sku: currentSku,
      weight_g: activeVariant.weight_g,
      retail_price: finalCalculatedPrice,
      selected_variant: variantObj,
    };

    addToCart(productWithVariant, 1);
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 2500);
  };

  const handleUpdateQty = (newQty: number) => {
    updateQuantity(product.id, newQty);
  };

  const { user } = useAuth();

  const handleWhatsAppOrder = async () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to your account to place orders or make inquiries via WhatsApp.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In / Register',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Account' }),
          },
        ]
      );
      return;
    }

    const imgUrl = getFullImageUrl(selectedImg || product.featured_image);
    let text = `*SAI BALAJI SILVERWORKS - LUXURY PRODUCT ENQUIRY*\n`;
    text += `------------------------------------\n\n`;
    text += `*Product*: ${product.title}\n`;
    text += `• Selected Measurement / Size: ${currentVariant.name} (${currentWeight}g)\n`;
    text += `• SKU: ${currentSku}\n`;
    text += `• Silver Purity: ${isFineSilver999 ? '999 Fine Silver' : '925 Sterling Silver'}\n`;
    text += `• Net Weight: ${currentWeight} grams\n`;
    text += `• Live Silver Rate: ₹${liveSilverRate.toFixed(1)}/g\n`;
    text += `• Making Charge: ₹${makingCharge.toLocaleString('en-IN')}\n`;
    text += `• Total Price: ₹${finalCalculatedPrice.toLocaleString('en-IN')}\n`;
    if (imgUrl) {
      text += `\nPhoto Link:\n${imgUrl}\n`;
    }
    text += `\nPlease confirm availability & courier options.`;

    await openWhatsAppDirect(text, imgUrl);
  };

  const handleCopyLink = () => {
    const url = `https://saibalajisilverworks.com/retail/${product.slug || product.id}`;
    if (Platform.OS === 'web') {
      try {
        navigator.clipboard.writeText(url);
      } catch (e) {}
    }
    setCopySuccessText(true);
    setTimeout(() => setCopySuccessText(false), 2000);
  };

  const topInset = Math.max(insets.top + 8, 40);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
        {/* TOP BREADCRUMB NAVIGATION BAR */}
        <View style={[styles.breadcrumbContainer, { paddingTop: 10 }]}>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}>
            <Text style={styles.breadcrumbText}>Home</Text>
          </TouchableOpacity>
          <ChevronRight size={12} color="#898985" />
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Categories' })}>
            <Text style={styles.breadcrumbText}>Retail</Text>
          </TouchableOpacity>
          <ChevronRight size={12} color="#898985" />
          <Text style={styles.breadcrumbActiveText} numberOfLines={1}>
            {product.title}
          </Text>
        </View>

        {/* MEDIA GALLERY SECTION */}
        <View style={styles.galleryWrapper}>
          {/* Main Image Container */}
          <View style={styles.mainImageFrame}>
            <Image
              source={{ uri: getFullImageUrl(selectedImg || product.featured_image) }}
              style={styles.mainImage}
              resizeMode="contain"
            />

            {/* Floating Action Buttons */}
            <View style={styles.floatingActions}>
              <TouchableOpacity
                style={styles.actionBtnCircle}
                onPress={() => toggleWishlist(product)}
                activeOpacity={0.8}
              >
                <Heart
                  size={18}
                  color={inWishlist ? '#E53E3E' : '#202020'}
                  fill={inWishlist ? '#E53E3E' : 'none'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnCircle}
                onPress={() => setIsShareModalOpen(true)}
                activeOpacity={0.8}
              >
                <Share2 size={18} color="#202020" />
              </TouchableOpacity>
            </View>

            {/* Back Button Overlay */}
            <TouchableOpacity
              style={styles.backBtnOverlay}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <ArrowLeft size={18} color="#202020" />
            </TouchableOpacity>
          </View>

          {/* Thumbnails Gallery */}
          {product.images && product.images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailRow}
            >
              {product.images.map((img, idx) => {
                const isSelected = selectedImg === img;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedImg(img)}
                    style={[styles.thumbBox, isSelected && styles.activeThumbBox]}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: getFullImageUrl(img) }} style={styles.thumbImage} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* RIGHT COLUMN - PRODUCT PRICING ENGINE & DETAILS */}
        <View style={styles.detailsSection}>
          {/* Badges Bar */}
          <View style={styles.badgeRow}>
            <View style={styles.purityBadge}>
              <Sparkles size={12} color="#C5A059" />
              <Text style={styles.purityBadgeText}>
                {isFineSilver999 ? '999 FINE SILVER' : '925 STERLING SILVER'}
              </Text>
            </View>

            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>Net: {currentWeight}g</Text>
            </View>

            {activeVariant.height_in && (
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>
                  Height: {activeVariant.height_in} in, Diameter: {activeVariant.diameter_in} in
                </Text>
              </View>
            )}
          </View>

          {/* Title & SKU */}
          <Text style={styles.titleText}>{product.title}</Text>
          <Text style={styles.skuText}>
            SKU: {currentSku} | {product.subcategory || product.category_slug || 'Silverware'}
          </Text>

          {/* DYNAMIC PRICE DISPLAY */}
          <View style={styles.priceContainer}>
            <View style={styles.priceHeaderRow}>
              <Text style={styles.priceCurrency}>₹</Text>
              <Text style={styles.priceMainText}>{finalCalculatedPrice.toLocaleString('en-IN')}</Text>
              <View style={styles.liveRateTag}>
                <RefreshCw size={10} color="#C5A059" style={{ marginRight: 4 }} />
                <Text style={styles.liveRateTagText}>Live Silver Rate</Text>
              </View>
            </View>

            {/* DYNAMIC PRICE BREAKDOWN BOX (3-Column Grid) */}
            <View style={styles.breakdownBox}>
              <View style={styles.breakdownCol}>
                <Text style={styles.breakdownLabel}>NET WEIGHT</Text>
                <Text style={styles.breakdownVal}>{currentWeight} g</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownCol}>
                <Text style={styles.breakdownLabel}>LIVE RATE</Text>
                <Text style={styles.breakdownVal}>₹{liveSilverRate.toFixed(1)}/g</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownCol}>
                <Text style={styles.breakdownLabel}>MAKING CHARGE</Text>
                <Text style={styles.breakdownVal}>₹{makingCharge.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          {/* MEASUREMENT / SIZE SELECTOR */}
          <View style={styles.measurementCard}>
            <View style={styles.measurementHeader}>
              <Text style={styles.measurementTitle}>SELECT MEASUREMENT / SIZE:</Text>
              <Text style={styles.activeMeasurementSubtitle}>
                {currentVariant.name}
                {currentVariant.name.toLowerCase().includes('g') ? '' : ` (${currentWeight}g)`}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.measurementScroll}
            >
              {availableVariants.map((variant) => {
                const isSelected = currentVariant.id === variant.id;
                // Calculate variant price dynamically
                const vWeight = variant.weight_g;
                const vSilverVal = vWeight * purityFactor * liveSilverRate;
                const vMaking = variant.making_charge !== undefined
                  ? variant.making_charge
                  : Math.round(vWeight * 25);
                const vFinalPrice = Math.round(vSilverVal + vMaking);

                const hasWeightInName = variant.name.toLowerCase().includes('g');
                const subText = hasWeightInName
                  ? `₹${vFinalPrice.toLocaleString('en-IN')}`
                  : `₹${vFinalPrice.toLocaleString('en-IN')} (${vWeight}g)`;

                return (
                  <TouchableOpacity
                    key={variant.id}
                    onPress={() => setActiveVariant(variant)}
                    style={[styles.measurementPill, isSelected && styles.activeMeasurementPill]}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.measurementPillTitle, isSelected && styles.activeMeasurementPillTitle]}>
                      {variant.name}
                    </Text>
                    <Text style={[styles.measurementPillSub, isSelected && styles.activeMeasurementPillSub]}>
                      {subText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Crafted Description Lead */}
          <Text style={styles.craftLeadText}>
            Exquisite handcrafted {product.title} by Sai Balaji Silverworks. Meticulously designed with authentic {isFineSilver999 ? '999 Fine Silver' : '925 Sterling Silver'} and a protective anti-tarnish luster.
          </Text>

          {/* BUYING ACTIONS BAR */}
          <View style={styles.buyingActionsRow}>
            {inCartQuantity > 0 ? (
              <View style={styles.inCartRow}>
                {/* Quantity Stepper */}
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleUpdateQty(inCartQuantity - 1)}
                  >
                    <Text style={styles.stepperBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValText}>{inCartQuantity}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => handleUpdateQty(inCartQuantity + 1)}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* View Cart Button */}
                <TouchableOpacity
                  style={styles.viewCartBtn}
                  onPress={() => navigation.navigate('Cart')}
                  activeOpacity={0.88}
                >
                  <ShoppingBag size={16} color="#FFFFFF" />
                  <Text style={styles.viewCartBtnText}>IN BAG (VIEW BAG)</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addBagBtn, addSuccess && styles.addBagBtnSuccess]}
                onPress={handleAddToCart}
                activeOpacity={0.88}
              >
                {addSuccess ? (
                  <>
                    <Check size={18} color="#FFFFFF" />
                    <Text style={styles.addBagBtnText}>ADDED TO BAG</Text>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} color="#FFFFFF" />
                    <Text style={styles.addBagBtnText}>ADD TO SHOPPING BAG</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Direct WhatsApp Inquiry Button */}
            <TouchableOpacity
              style={styles.whatsappActionBtn}
              onPress={handleWhatsAppOrder}
              activeOpacity={0.88}
            >
              <MessageCircle size={20} color="#25D366" />
            </TouchableOpacity>
          </View>

          {/* TRUST BADGES & GUARANTEES (3-Column Grid) */}
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <ShieldCheck size={20} color="#202020" style={{ marginBottom: 4 }} />
              <Text style={styles.trustItemTitle}>NABL Hallmarked</Text>
              <Text style={styles.trustItemSub}>100% Pure Silver</Text>
            </View>

            <View style={styles.trustDivider} />

            <View style={styles.trustItem}>
              <Truck size={20} color="#202020" style={{ marginBottom: 4 }} />
              <Text style={styles.trustItemTitle}>Insured Transit</Text>
              <Text style={styles.trustItemSub}>Safe Delivery</Text>
            </View>

            <View style={styles.trustDivider} />

            <View style={styles.trustItem}>
              <Factory size={20} color="#202020" style={{ marginBottom: 4 }} />
              <Text style={styles.trustItemTitle}>Direct Factory</Text>
              <Text style={styles.trustItemSub}>Tenali Unit</Text>
            </View>
          </View>

          {/* TABBED INFORMATION SECTION */}
          <View style={styles.tabsContainer}>
            {/* Tab Selector Header */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsHeaderScroll}>
              <TouchableOpacity
                style={[styles.tabHeaderBtn, activeTab === 'desc' && styles.activeTabHeaderBtn]}
                onPress={() => setActiveTab('desc')}
              >
                <Text style={[styles.tabHeaderBtnText, activeTab === 'desc' && styles.activeTabHeaderBtnText]}>
                  Description
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabHeaderBtn, activeTab === 'specs' && styles.activeTabHeaderBtn]}
                onPress={() => setActiveTab('specs')}
              >
                <Text style={[styles.tabHeaderBtnText, activeTab === 'specs' && styles.activeTabHeaderBtnText]}>
                  Specifications
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabHeaderBtn, activeTab === 'purity' && styles.activeTabHeaderBtn]}
                onPress={() => setActiveTab('purity')}
              >
                <Text style={[styles.tabHeaderBtnText, activeTab === 'purity' && styles.activeTabHeaderBtnText]}>
                  Purity Details
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabHeaderBtn, activeTab === 'care' && styles.activeTabHeaderBtn]}
                onPress={() => setActiveTab('care')}
              >
                <Text style={[styles.tabHeaderBtnText, activeTab === 'care' && styles.activeTabHeaderBtnText]}>
                  Care Guide
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.tabContentBox}>
              {activeTab === 'desc' && (
                <View>
                  <Text style={styles.tabBodyText}>
                    {product.description ||
                      `Crafted with supreme mastery in Tenali, this piece represents the pinnacle of South Indian silver smithing. Made from high-purity silver, it undergoes 18 steps of manual polishing and quality inspection.`}
                  </Text>
                  <Text style={[styles.tabBodyText, { marginTop: 10 }]}>
                    Every curve and engraving reflects generations of traditional artistry, designed to be cherished as a timeless family heirloom.
                  </Text>
                </View>
              )}

              {activeTab === 'specs' && (
                <View style={styles.specsGrid}>
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Silver Purity:</Text>
                    <Text style={styles.specVal}>{isFineSilver999 ? '999 Fine Silver (99.9%)' : '925 Sterling Silver (92.5%)'}</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Net Silver Weight:</Text>
                    <Text style={styles.specVal}>{currentWeight} grams</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Making Charge:</Text>
                    <Text style={styles.specVal}>₹{makingCharge.toLocaleString('en-IN')}</Text>
                  </View>
                  {activeVariant.height_in && (
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>Dimensions:</Text>
                      <Text style={styles.specVal}>Height {activeVariant.height_in} in, Diameter {activeVariant.diameter_in} in</Text>
                    </View>
                  )}
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>SKU Code:</Text>
                    <Text style={styles.specVal}>{currentSku}</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specKey}>Hallmarking:</Text>
                    <Text style={styles.specVal}>BIS NABL Laser Hallmarked</Text>
                  </View>
                </View>
              )}

              {activeTab === 'purity' && (
                <View>
                  <Text style={styles.tabBodyText}>
                    • Certified by NABL accredited testing laboratories under BIS Hallmarking standards.
                  </Text>
                  <Text style={styles.tabBodyText}>
                    • Tested via XRF Spectroscopic Analysis ensuring exact metal purity tolerances.
                  </Text>
                  <Text style={styles.tabBodyText}>
                    • Includes authentic hallmark certificate and laser engraving on the base of every artifact.
                  </Text>
                </View>
              )}

              {activeTab === 'care' && (
                <View>
                  <Text style={styles.tabBodyText}>
                    • Store in airtight velvet bags provided to prevent ambient sulfur oxidation.
                  </Text>
                  <Text style={styles.tabBodyText}>
                    • Wipe softly with pure microfiber cloth. Avoid abrasive detergents or hard chemical dips.
                  </Text>
                  <Text style={styles.tabBodyText}>
                    • Keep away from direct perfumes, hairsprays, and moisture exposure.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* SHARE MODAL OVERLAY */}
      <Modal
        visible={isShareModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsShareModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsShareModalOpen(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Product</Text>
              <TouchableOpacity onPress={() => setIsShareModalOpen(false)}>
                <X size={20} color="#202020" />
              </TouchableOpacity>
            </View>

            <View style={styles.shareOptionsGrid}>
              <TouchableOpacity style={styles.shareOptionBtn} onPress={handleCopyLink}>
                <View style={[styles.shareIconCircle, { backgroundColor: '#E2E8F0' }]}>
                  <Copy size={20} color="#202020" />
                </View>
                <Text style={styles.shareOptionText}>{copySuccessText ? 'Copied!' : 'Copy Link'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareOptionBtn} onPress={handleWhatsAppOrder}>
                <View style={[styles.shareIconCircle, { backgroundColor: '#DCFCE7' }]}>
                  <MessageCircle size={20} color="#16A34A" />
                </View>
                <Text style={styles.shareOptionText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOptionBtn}
                onPress={() => {
                  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    `https://saibalajisilverworks.com/retail/${product.slug || product.id}`
                  )}`;
                  Linking.openURL(url).catch(() => {});
                }}
              >
                <View style={[styles.shareIconCircle, { backgroundColor: '#DBEAFE' }]}>
                  <Facebook size={20} color="#2563EB" />
                </View>
                <Text style={styles.shareOptionText}>Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOptionBtn}
                onPress={() => {
                  handleCopyLink();
                  Linking.openURL('https://instagram.com').catch(() => {});
                }}
              >
                <View style={[styles.shareIconCircle, { backgroundColor: '#FCE7F3' }]}>
                  <Instagram size={20} color="#DB2777" />
                </View>
                <Text style={styles.shareOptionText}>Instagram</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F5',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F5',
  },
  notFoundText: {
    fontSize: 16,
    color: '#202020',
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 6,
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#777777',
    fontWeight: '500',
  },
  breadcrumbActiveText: {
    fontSize: 12,
    color: '#202020',
    fontWeight: '600',
    flex: 1,
  },
  galleryWrapper: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  mainImageFrame: {
    width: '100%',
    aspectRatio: 3 / 2,
    backgroundColor: '#000000',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  floatingActions: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'column',
    gap: 10,
  },
  actionBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  backBtnOverlay: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  thumbnailRow: {
    paddingTop: 12,
    gap: 10,
  },
  thumbBox: {
    width: 75,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#EAE6DF',
    backgroundColor: '#000000',
    padding: 2,
  },
  activeThumbBox: {
    borderColor: '#C5A059',
    borderWidth: 2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  detailsSection: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  purityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1A1918',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  purityBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pillBadge: {
    backgroundColor: '#F3EFE6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E0D8',
  },
  pillBadgeText: {
    fontSize: 10.5,
    color: '#555555',
    fontWeight: '600',
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#202020',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 28,
  },
  skuText: {
    fontSize: 11,
    color: '#777777',
    marginTop: 4,
    marginBottom: 16,
  },
  priceContainer: {
    marginBottom: 20,
  },
  priceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 12,
  },
  priceCurrency: {
    fontSize: 22,
    fontWeight: '700',
    color: '#202020',
  },
  priceMainText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#202020',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  liveRateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBF4E8',
    borderWidth: 1,
    borderColor: '#E8D4B0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginLeft: 8,
  },
  liveRateTagText: {
    fontSize: 11,
    color: '#B9A77A',
    fontWeight: '700',
  },
  breakdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  breakdownCol: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#EAE6DF',
  },
  breakdownLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#898985',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  breakdownVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202020',
  },
  measurementCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
    marginBottom: 20,
  },
  measurementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  measurementTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#202020',
    letterSpacing: 0.8,
  },
  activeMeasurementSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B9A77A',
  },
  measurementScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  measurementPill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE6DF',
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeMeasurementPill: {
    backgroundColor: '#1A1918',
    borderColor: '#1A1918',
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  measurementPillTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#202020',
    marginBottom: 4,
    textAlign: 'center',
  },
  activeMeasurementPillTitle: {
    color: '#FFFFFF',
  },
  measurementPillSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#667085',
    textAlign: 'center',
  },
  activeMeasurementPillSub: {
    color: '#E2C069',
    fontWeight: '700',
  },
  craftLeadText: {
    fontSize: 12.5,
    color: '#555555',
    lineHeight: 19,
    marginBottom: 20,
  },
  buyingActionsRow: {
    marginBottom: 24,
  },
  inCartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#202020',
  },
  stepperValText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202020',
    paddingHorizontal: 12,
  },
  viewCartBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#1A1918',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewCartBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  addBagBtn: {
    height: 52,
    backgroundColor: '#1A1918',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#1A1918',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  addBagBtnSuccess: {
    backgroundColor: '#276749',
  },
  addBagBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  whatsappActionBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#25D366',
    display: 'none', // Styled for footer/inline action if needed
  },
  trustGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 16,
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  trustItem: {
    flex: 1,
    alignItems: 'center',
  },
  trustDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#EAE6DF',
  },
  trustItemTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#202020',
    textAlign: 'center',
  },
  trustItemSub: {
    fontSize: 9.5,
    color: '#777777',
    textAlign: 'center',
    marginTop: 2,
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    overflow: 'hidden',
  },
  tabsHeaderScroll: {
    borderBottomWidth: 1,
    borderBottomColor: '#EAE6DF',
    paddingHorizontal: 8,
  },
  tabHeaderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabHeaderBtn: {
    borderBottomColor: '#C5A059',
  },
  tabHeaderBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#777777',
  },
  activeTabHeaderBtnText: {
    color: '#202020',
    fontWeight: '700',
  },
  tabContentBox: {
    padding: 18,
  },
  tabBodyText: {
    fontSize: 12.5,
    color: '#555555',
    lineHeight: 20,
  },
  specsGrid: {
    gap: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202020',
  },
  shareOptionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shareOptionBtn: {
    alignItems: 'center',
  },
  shareIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shareOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#202020',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F6F6',
  },
  specKey: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  specVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1918',
  },
});
