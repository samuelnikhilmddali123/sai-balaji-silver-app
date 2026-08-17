import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Paths } from 'expo-file-system';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { useNavigation } from '@react-navigation/native';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Sparkles,
  Tag,
} from 'lucide-react-native';
import { useCart } from '../context/CartContext';
import api, { getProductImageUrl } from '../services/api';

export const CartScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    effectiveCartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalQuantity,
    isWholesale,
    itemsToWholesale,
    WHOLESALE_MOQ,
    subtotal,
    savings,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');

  // Financial Calculations
  const gstTax = Math.round(subtotal * 0.03); // 3% Silver GST Tax
  const shippingFee = subtotal > 10000 || subtotal === 0 ? 0 : 350;
  const grandTotal = subtotal + gstTax + shippingFee;

  // MOQ Progress Bar (Max 100%)
  const progressPercent = Math.min(100, Math.round((totalQuantity / WHOLESALE_MOQ) * 100));

  const handleWhatsAppOrder = async () => {
    let message = `*SAI BALAJI SILVERWORKS - ENQUIRY & ORDER DETAILS*\n`;
    message += `-------------------------\n`;
    message += `*Mode*: ${isWholesale ? 'WHOLESALE B2B QUOTE' : 'RETAIL ORDER'}\n`;
    message += `*Total Items*: ${totalQuantity} item(s)\n\n`;

    message += `*SELECTED PRODUCTS & PHOTOS*:\n\n`;
    effectiveCartItems.forEach((item, index) => {
      const imgUrl = getProductImageUrl(item.product);
      message += `*Item ${index + 1}: ${item.product.title}*\n`;
      message += `• SKU: ${item.product.sku || `SBS-PA-${item.product.id}`}\n`;
      message += `• Purity: ${item.product.silver_purity || '925/999'}\n`;
      message += `• Weight: ${item.product.weight_g}g\n`;
      message += `• Qty: ${item.quantity} x ₹${item.effectivePrice.toLocaleString('en-IN')} = ₹${item.itemSubtotal.toLocaleString('en-IN')}\n`;
      if (imgUrl) {
        message += `Product Photo:\n${imgUrl}\n`;
      }
      message += `\n`;
    });

    message += `-------------------------\n`;
    message += `*FINANCIAL SUMMARY*:\n`;
    message += `• Subtotal: ₹${subtotal.toLocaleString('en-IN')}\n`;
    message += `• GST (3% Silver Tax): ₹${gstTax.toLocaleString('en-IN')}\n`;
    message += `• Shipping: ${shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}\n`;
    message += `• *GRAND TOTAL*: ₹${grandTotal.toLocaleString('en-IN')}\n\n`;

    message += `-------------------------\n`;
    message += `*DELIVERY ADDRESS & CUSTOMER INFO*:\n`;
    message += `• Name: ${customerName.trim() || 'Not Provided'}\n`;
    message += `• Phone: ${customerPhone.trim() || 'Not Provided'}\n`;
    message += `• Shipping Address: ${shippingAddress.trim() || 'Not Provided'}\n`;
    if (companyName.trim()) message += `• Company: ${companyName.trim()}\n`;
    if (gstin.trim()) message += `• GSTIN: ${gstin.trim()}\n`;

    // Attempt Native Image File Sharing first so the actual photo is sent in WhatsApp
    const firstItem = effectiveCartItems[0];
    const firstImgUrl = firstItem ? getProductImageUrl(firstItem.product) : null;

    if (firstImgUrl) {
      try {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          const fileExt = firstImgUrl.toLowerCase().endsWith('.webp') ? '.webp' : '.jpg';
          const cacheDir = (FileSystem as any).cacheDirectory || Paths.cache.uri;
          const localUri = `${cacheDir}/product_order_${Date.now()}${fileExt}`;
          const downloadRes = await FileSystem.downloadAsync(firstImgUrl, localUri);

          await Sharing.shareAsync(downloadRes.uri, {
            mimeType: fileExt === '.webp' ? 'image/webp' : 'image/jpeg',
            dialogTitle: 'Share Product Image & Order Details to WhatsApp',
            UTI: 'public.jpeg',
          });
          return;
        }
      } catch (err) {
        console.log('Native image share error, falling back to direct WhatsApp URL:', err);
      }
    }

    const whatsappUrl = `https://wa.me/919121266269?text=${encodeURIComponent(message)}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('WhatsApp Unavailable', 'Unable to open WhatsApp on your device.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckout = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter your Full Name and Phone Number');
      return;
    }

    setLoading(true);
    setCheckoutSuccess(null);

    try {
      if (isWholesale) {
        // Wholesale Quote Submission
        const response = await api.post('/wholesale/quote', {
          company_name: companyName.trim() || customerName.trim(),
          contact_person: customerName.trim(),
          phone: customerPhone.trim(),
          gstin: gstin.trim() || '',
          product_requirements: `Cart Wholesale Quote for ${totalQuantity} items`,
          items: effectiveCartItems.map((i) => ({
            product_id: i.product.id,
            title: i.product.title,
            quantity: i.quantity,
            unit_price: i.effectivePrice,
          })),
          estimated_total: grandTotal,
        });

        const data = response.data;
        setCheckoutSuccess(
          `Wholesale Quote Submitted! Ref ID: ${data.quote_id || data.id || 'SBS-QT-1002'}`
        );
        clearCart();
      } else {
        // Retail Order Submission
        const response = await api.post('/orders', {
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          shipping_address: shippingAddress.trim() || 'Default Address',
          items: effectiveCartItems.map((i) => ({
            product_id: i.product.id,
            title: i.product.title,
            quantity: i.quantity,
            price: i.effectivePrice,
          })),
          grand_total: grandTotal,
        });

        const data = response.data;
        setCheckoutSuccess(
          `Retail Order Placed Successfully! Order #: ${data.order_number || data.id || 'SBS-ORD-5001'}`
        );
        clearCart();
      }
    } catch (error: any) {
      console.error('Checkout Error:', error?.response?.data || error.message);
      const detail = error?.response?.data?.detail || 'Failed to process checkout';
      Alert.alert('Checkout Failed', detail);
    } finally {
      setLoading(false);
    }
  };

  // Empty Cart View
  if (effectiveCartItems.length === 0 && !checkoutSuccess) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <ShoppingBag color="#C5A059" size={48} />
        </View>
        <Text style={styles.emptyTitle}>Your Shopping Bag is Empty</Text>
        <Text style={styles.emptySub}>Explore our fine silver collections and add items to your cart.</Text>
        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={() => navigation.navigate('Categories')}
          activeOpacity={0.8}
        >
          <Text style={styles.exploreBtnText}>EXPLORE SILVER COLLECTIONS</Text>
          <ArrowRight color="#1A1918" size={16} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F6F6' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title Header */}
        <View style={styles.cartHeaderRow}>
          <View style={styles.cartTitleBox}>
            <ShoppingBag color="#C5A059" size={20} />
            <Text style={styles.screenHeader}>Your Shopping Bag</Text>
          </View>
        </View>

        {/* MOQ PROGRESS BANNER CARD */}
        <View style={styles.moqCard}>
          <View style={styles.moqHeaderRow}>
            <View style={styles.cartTypeBadge}>
              <ShoppingBag color="#FFFFFF" size={12} />
              <Text style={styles.cartTypeBadgeText}>
                {isWholesale ? 'WHOLESALE CART' : 'RETAIL CART'}
              </Text>
            </View>

            <Text style={styles.moqCountText}>
              {totalQuantity} / {WHOLESALE_MOQ} Items
            </Text>
          </View>

          {/* Progress Bar Container */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>

          {/* Progress Note */}
          <View style={styles.progressNoteRow}>
            <Sparkles color="#C5A059" size={14} />
            {isWholesale ? (
              <Text style={styles.progressNoteText}>
                🎉 Wholesale Pricing Unlocked! ({savings > 0 ? `Saved ₹${savings.toLocaleString()}` : 'Wholesale Rates Applied'})
              </Text>
            ) : (
              <Text style={styles.progressNoteText}>
                Add <Text style={{ fontWeight: 'bold', color: '#1A1918' }}>{itemsToWholesale} more item(s)</Text> to unlock Wholesale Pricing (MOQ: 5)
              </Text>
            )}
          </View>
        </View>

        {/* CART ITEMS LIST */}
        <View style={styles.itemsList}>
          {effectiveCartItems.map((item) => (
            <View key={item.product.id} style={styles.itemCard}>
              <Image
                source={{ uri: getProductImageUrl(item.product) }}
                style={styles.itemImg}
              />

              <View style={styles.itemDetails}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.product.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeFromCart(item.product.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 color="#A0AEC0" size={18} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemMeta}>
                  SKU: {item.product.sku || `SBS-PA-${item.product.id}`} | {item.product.weight_g}g
                </Text>

                <Text style={styles.unitPrice}>
                  ₹{item.effectivePrice.toLocaleString('en-IN')} / unit
                </Text>

                <View style={styles.itemFooterRow}>
                  {/* Quantity Counter Pill */}
                  <View style={styles.qtyPill}>
                    <TouchableOpacity
                      style={styles.qtyPillBtn}
                      onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      <Minus color="#666666" size={12} />
                    </TouchableOpacity>

                    <Text style={styles.qtyPillVal}>{item.quantity}</Text>

                    <TouchableOpacity
                      style={styles.qtyPillBtn}
                      onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      <Plus color="#666666" size={12} />
                    </TouchableOpacity>
                  </View>

                  {/* Item Subtotal */}
                  <Text style={styles.itemSubtotalVal}>
                    ₹{item.itemSubtotal.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* SUCCESS CARD IF ORDER PLACED */}
        {checkoutSuccess ? (
          <View style={styles.successCard}>
            <CheckCircle2 color="#276749" size={32} />
            <Text style={styles.successText}>{checkoutSuccess}</Text>
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => {
                setCheckoutSuccess(null);
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.continueBtnText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* DELIVERY ADDRESS & CUSTOMER INFO FORM */}
            <View style={styles.addressCard}>
              <Text style={styles.addressCardTitle}>Delivery Address & Customer Info</Text>

              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={customerName}
                onChangeText={setCustomerName}
              />

              <Text style={styles.formLabel}>Phone Number (WhatsApp preferred) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. +91 98765 00000"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={customerPhone}
                onChangeText={setCustomerPhone}
              />

              <Text style={styles.formLabel}>Complete Shipping Address *</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="House/Flat No., Street, Landmark, City, Pincode, State"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                value={shippingAddress}
                onChangeText={setShippingAddress}
              />

              {isWholesale && (
                <>
                  <Text style={styles.formLabel}>Company / Business Name</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Sai Silver Jewellers"
                    placeholderTextColor="#999"
                    value={companyName}
                    onChangeText={setCompanyName}
                  />

                  <Text style={styles.formLabel}>GSTIN Number (Optional)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="36AAAAA0000A1Z5"
                    placeholderTextColor="#999"
                    autoCapitalize="characters"
                    value={gstin}
                    onChangeText={setGstin}
                  />
                </>
              )}
            </View>

            {/* SUMMARY & CHECKOUT BAR */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({totalQuantity} items)</Text>
                <Text style={styles.summaryVal}>₹{subtotal.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>GST (3% Silver Tax)</Text>
                <Text style={styles.summaryVal}>₹{gstTax.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping Fee</Text>
                <Text style={styles.shippingFreeText}>
                  {shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalVal}>₹{grandTotal.toLocaleString('en-IN')}</Text>
              </View>

              {/* ORDER ON WHATSAPP BUTTON */}
              <TouchableOpacity
                style={styles.whatsappActionBtn}
                onPress={handleWhatsAppOrder}
                activeOpacity={0.85}
              >
                <MessageCircle color="#FFFFFF" size={20} />
                <Text style={styles.whatsappActionBtnText}>
                  ORDER {isWholesale ? 'WHOLESALE CART' : 'RETAIL CART'} ON WHATSAPP
                </Text>
              </TouchableOpacity>

              {/* DIRECT CHECKOUT BUTTON */}
              <TouchableOpacity
                style={styles.directCheckoutBtn}
                onPress={handleCheckout}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#1A1918" size="small" />
                ) : (
                  <Text style={styles.directCheckoutBtnText}>
                    {isWholesale ? 'SUBMIT B2B QUOTE REQUEST' : 'PLACE RETAIL ORDER DIRECTLY'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    backgroundColor: '#FAF9F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1918',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: '#C5A059',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exploreBtnText: {
    color: '#1A1918',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cartTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  screenHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  moqCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  moqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cartTypeBadge: {
    backgroundColor: '#1A1918',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cartTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  moqCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1918',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F0EFEA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1A1918',
    borderRadius: 4,
  },
  progressNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressNoteText: {
    fontSize: 11,
    color: '#666666',
  },
  itemsList: {
    gap: 12,
    marginBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    borderRadius: 20,
    padding: 12,
    gap: 12,
  },
  itemImg: {
    width: 85,
    height: 85,
    borderRadius: 14,
    backgroundColor: '#F7F6F2',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    flex: 1,
    marginRight: 6,
  },
  itemMeta: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  unitPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A1918',
    marginTop: 4,
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  qtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyPillBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyPillVal: {
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1918',
  },
  itemSubtotalVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1918',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    borderRadius: 20,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666666',
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1918',
  },
  shippingFreeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#276749',
  },
  divider: {
    height: 1,
    backgroundColor: '#E6E1DA',
    marginVertical: 12,
  },
  grandTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1918',
  },
  grandTotalVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D6A68',
  },
  whatsappActionBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  whatsappActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  directCheckoutBtn: {
    backgroundColor: '#2D6A68',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D6A68',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  directCheckoutBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  successCard: {
    backgroundColor: '#E6F4EA',
    borderWidth: 1.5,
    borderColor: '#276749',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  successText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C4532',
    textAlign: 'center',
  },
  continueBtn: {
    backgroundColor: '#2D6A68',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 6,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBF0F0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  addressCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
    marginTop: 8,
  },
  formInput: {
    backgroundColor: '#F4F7F7',
    borderWidth: 1,
    borderColor: '#EBF0F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
  },
  formTextArea: {
    height: 75,
    textAlignVertical: 'top',
  },
});
