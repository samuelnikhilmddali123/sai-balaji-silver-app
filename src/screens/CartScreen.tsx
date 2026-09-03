import React, { useState, useEffect, useCallback } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { downloadAndSharePhoto, openWhatsAppDirect } from '../services/photoShare';
import { PhoneInputWithCountry } from '../components/PhoneInputWithCountry';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
  MapPin,
  Briefcase,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api, { orderApi, wholesaleApi, getProductImageUrl, getFullImageUrl } from '../services/api';

export const CartScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
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

  // Auto-populate customer & shipping address details from Auth Context & AsyncStorage
  const loadSavedAddress = async () => {
    try {
      const savedStr = await AsyncStorage.getItem('user_saved_address');
      let savedObj: any = null;
      if (savedStr) {
        try {
          savedObj = JSON.parse(savedStr);
        } catch (e) {}
      }

      const defaultName = user?.full_name || savedObj?.fullName || '';
      const defaultPhone = user?.phone || savedObj?.phone || '';

      const userStreet = user?.street_address || user?.street || savedObj?.street || '';
      const userCity = user?.city || savedObj?.city || '';
      const userState = user?.state || savedObj?.state || '';
      const userPincode = user?.pincode || savedObj?.pincode || '';

      let defaultAddress = user?.address || '';
      if (userStreet || userCity) {
        defaultAddress = [
          userStreet,
          userCity,
          userState ? `${userState}${userPincode ? ` - ${userPincode}` : ''}` : userPincode,
        ]
          .filter(Boolean)
          .join('\n');
      }

      const defaultCompany = user?.company_name || '';
      const defaultGstin = user?.gstin || '';

      if (defaultName) setCustomerName((prev) => (prev.trim() ? prev : defaultName));
      if (defaultPhone) setCustomerPhone((prev) => (prev.trim() ? prev : defaultPhone));
      if (defaultAddress) setShippingAddress((prev) => (prev.trim() ? prev : defaultAddress));
      if (defaultCompany) setCompanyName((prev) => (prev.trim() ? prev : defaultCompany));
      if (defaultGstin) setGstin((prev) => (prev.trim() ? prev : defaultGstin));
    } catch (err) {
      console.error('Error loading saved address in CartScreen:', err);
    }
  };

  useEffect(() => {
    loadSavedAddress();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadSavedAddress();
    }, [user])
  );

  // Financial Calculations
  const gstTax = Math.round(subtotal * 0.03); // 3% Silver GST Tax
  const shippingFee = subtotal > 10000 || subtotal === 0 ? 0 : 350;
  const grandTotal = subtotal + gstTax + shippingFee;

  // MOQ Progress Bar (Max 100%)
  const progressPercent = Math.min(100, Math.round((totalQuantity / WHOLESALE_MOQ) * 100));

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

    const name = customerName.trim() || user?.full_name || 'Customer';
    const phone = customerPhone.trim() || user?.phone || 'Not Provided';
    const address = shippingAddress.trim() || user?.address || 'Default Address';

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
    message += `• Name: ${name}\n`;
    message += `• Phone: ${phone}\n`;
    message += `• Shipping Address: ${address}\n`;
    if (companyName.trim()) message += `• Company: ${companyName.trim()}\n`;
    if (gstin.trim()) message += `• GSTIN: ${gstin.trim()}\n`;

    const firstItem = effectiveCartItems[0];
    const firstImgUrl = firstItem ? getProductImageUrl(firstItem.product) : '';

    // 1. Launch WhatsApp
    await openWhatsAppDirect(message, firstImgUrl);

    // 2. Post order/quote to backend and clear cart
    try {
      if (isWholesale) {
        const response = await api.post('/wholesale/quote', {
          user_id: user?.id,
          company_name: companyName.trim() || name,
          contact_person: name,
          phone: phone,
          email: user?.email || '',
          gstin: gstin.trim() || '',
          product_requirements: `WhatsApp B2B Quote for ${totalQuantity} items`,
          items: effectiveCartItems.map((i) => {
            const relImg = i.product.featured_image || (i.product.images && i.product.images[0]) || i.product.image_url || '';
            const fullImg = getFullImageUrl(relImg);
            return {
              product_id: i.product.id,
              title: i.product.title,
              product_name: i.product.title,
              product_sku: i.product.sku || `SBS-PA-${i.product.id}`,
              quantity: i.quantity,
              unit_price: i.effectivePrice,
              featured_image: relImg,
              image_url: relImg,
              image: relImg,
              full_image_url: fullImg,
              full_featured_image: fullImg,
            };
          }),
          estimated_total: grandTotal,
        });

        const data = response.data;
        const savedRecord = {
          id: data.quote_id || data.request_number || data.id || `SBS-QT-${Date.now()}`,
          order_number: data.request_number || data.quote_id || `SBS-QT-${Date.now()}`,
          user_id: user?.id,
          customer_name: name,
          customer_phone: phone,
          customer_email: user?.email || '',
          shipping_address: address,
          items: effectiveCartItems.map((i) => ({
            product_id: i.product.id,
            title: i.product.title,
            product_name: i.product.title,
            product_sku: i.product.sku || `SBS-PA-${i.product.id}`,
            quantity: i.quantity,
            unit_price: i.effectivePrice,
            subtotal: i.itemSubtotal,
            featured_image: i.product.featured_image || (i.product.images && i.product.images[0]) || '',
            image_url: i.product.featured_image || (i.product.images && i.product.images[0]) || '',
          })),
          grand_total: grandTotal,
          status: 'PENDING',
          created_at: new Date().toISOString(),
          order_type: 'wholesale' as const,
        };
        AsyncStorage.getItem('user_saved_orders').then((str) => {
          const list = str ? JSON.parse(str) : [];
          AsyncStorage.setItem('user_saved_orders', JSON.stringify([savedRecord, ...list]));
        }).catch(() => {});

        setCheckoutSuccess(
          `Wholesale Quote Submitted & Sent to WhatsApp! Ref ID: ${data.quote_id || data.request_number || data.id || 'SBS-QT-1002'}`
        );
      } else {
        const response = await api.post('/orders', {
          user_id: user?.id,
          customer_name: name,
          customer_phone: phone,
          customer_email: user?.email || '',
          shipping_address: address,
          items: effectiveCartItems.map((i) => {
            const relImg = i.product.featured_image || (i.product.images && i.product.images[0]) || i.product.image_url || '';
            const fullImg = getFullImageUrl(relImg);
            return {
              product_id: i.product.id,
              title: i.product.title,
              product_name: i.product.title,
              product_sku: i.product.sku || `SBS-PA-${i.product.id}`,
              quantity: i.quantity,
              price: i.effectivePrice,
              unit_price: i.effectivePrice,
              featured_image: relImg,
              image_url: relImg,
              image: relImg,
              full_image_url: fullImg,
              full_featured_image: fullImg,
            };
          }),
          grand_total: grandTotal,
        });

        const data = response.data;
        const savedRecord = {
          id: data.order_number || data.id || `SBS-ORD-${Date.now()}`,
          order_number: data.order_number || data.id || `SBS-ORD-${Date.now()}`,
          user_id: user?.id,
          customer_name: name,
          customer_phone: phone,
          customer_email: user?.email || '',
          shipping_address: address,
          items: effectiveCartItems.map((i) => ({
            product_id: i.product.id,
            title: i.product.title,
            product_name: i.product.title,
            product_sku: i.product.sku || `SBS-PA-${i.product.id}`,
            quantity: i.quantity,
            unit_price: i.effectivePrice,
            subtotal: i.itemSubtotal,
            featured_image: i.product.featured_image || (i.product.images && i.product.images[0]) || '',
            image_url: i.product.featured_image || (i.product.images && i.product.images[0]) || '',
          })),
          grand_total: grandTotal,
          status: 'Order Placed',
          created_at: new Date().toISOString(),
          order_type: 'retail' as const,
        };
        AsyncStorage.getItem('user_saved_orders').then((str) => {
          const list = str ? JSON.parse(str) : [];
          AsyncStorage.setItem('user_saved_orders', JSON.stringify([savedRecord, ...list]));
        }).catch(() => {});

        setCheckoutSuccess(
          `Retail Order Submitted & Sent to WhatsApp! Order #: ${data.order_number || data.id || 'SBS-ORD-5001'}`
        );
      }
    } catch (e) {
      const fallbackRecord = {
        id: `SBS-ORD-${Date.now()}`,
        order_number: `SBS-ORD-${Date.now()}`,
        user_id: user?.id,
        customer_name: name,
        customer_phone: phone,
        customer_email: user?.email || '',
        shipping_address: address,
        items: effectiveCartItems.map((i) => ({
          product_id: i.product.id,
          title: i.product.title,
          product_name: i.product.title,
          product_sku: i.product.sku || `SBS-PA-${i.product.id}`,
          quantity: i.quantity,
          unit_price: i.effectivePrice,
          subtotal: i.itemSubtotal,
          featured_image: i.product.featured_image || (i.product.images && i.product.images[0]) || '',
          image_url: i.product.featured_image || (i.product.images && i.product.images[0]) || '',
        })),
        grand_total: grandTotal,
        status: isWholesale ? 'PENDING' : 'Order Placed',
        created_at: new Date().toISOString(),
        order_type: isWholesale ? ('wholesale' as const) : ('retail' as const),
      };
      AsyncStorage.getItem('user_saved_orders').then((str) => {
        const list = str ? JSON.parse(str) : [];
        AsyncStorage.setItem('user_saved_orders', JSON.stringify([fallbackRecord, ...list]));
      }).catch(() => {});

      setCheckoutSuccess('Your Order has been submitted and sent to WhatsApp!');
    } finally {
      clearCart();
    }
  };

  const handleCheckout = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter your Full Name and Phone Number');
      return;
    }

    setLoading(true);
    setCheckoutSuccess(null);

    const itemsPayload = effectiveCartItems.map((i) => {
      const relImg = i.product.featured_image || (i.product.images && i.product.images[0]) || i.product.image_url || '';
      const fullImg = getFullImageUrl(relImg);
      return {
        product_id: i.product.id,
        title: i.product.title,
        product_name: i.product.title,
        product_sku: i.product.sku || `SBS-PA-${i.product.id}`,
        quantity: i.quantity,
        price: i.effectivePrice,
        unit_price: i.effectivePrice,
        featured_image: relImg,
        image_url: relImg,
        image: relImg,
        full_image_url: fullImg,
        full_featured_image: fullImg,
      };
    });

    try {
      if (isWholesale) {
        // Wholesale Quote Submission (POST /wholesale/requests or POST /wholesale/quote)
        const response = await wholesaleApi.submitRequest({
          company_name: companyName.trim() || customerName.trim(),
          gst_number: gstin.trim() || '',
          gstin: gstin.trim() || '',
          products: itemsPayload,
          note: `Cart Wholesale Quote for ${totalQuantity} items`,
          requirements: `Cart Wholesale Quote for ${totalQuantity} items`,
          contact_person: customerName.trim(),
          phone: customerPhone.trim(),
          email: user?.email || '',
          items: itemsPayload,
          user_id: user?.id,
        });

        const data = response?.data || {};
        const savedRecord = {
          id: data.quote_id || data.request_number || data.id || `SBS-QT-${Date.now()}`,
          order_number: data.request_number || data.quote_id || `SBS-QT-${Date.now()}`,
          user_id: user?.id,
          customer_name: customerName.trim() || user?.full_name || 'Wholesale Client',
          customer_phone: customerPhone.trim() || user?.phone || '',
          customer_email: user?.email || '',
          shipping_address: shippingAddress.trim() || 'Default Address',
          items: effectiveCartItems.map((i) => ({
            product_id: i.product.id,
            title: i.product.title,
            product_name: i.product.title,
            product_sku: i.product.sku || `SBS-PA-${i.product.id}`,
            quantity: i.quantity,
            unit_price: i.effectivePrice,
            subtotal: i.itemSubtotal,
            featured_image: i.product.featured_image || (i.product.images && i.product.images[0]) || '',
            image_url: i.product.featured_image || (i.product.images && i.product.images[0]) || '',
          })),
          grand_total: grandTotal,
          status: 'Order Accepted',
          created_at: new Date().toISOString(),
          order_type: 'wholesale' as const,
        };
        AsyncStorage.getItem('user_saved_orders').then((str) => {
          const list = str ? JSON.parse(str) : [];
          AsyncStorage.setItem('user_saved_orders', JSON.stringify([savedRecord, ...list]));
        }).catch(() => {});

        setCheckoutSuccess(
          `Wholesale Booking Submitted Successfully! Booking Ref #: ${savedRecord.order_number}`
        );
        clearCart();
      } else {
        // Retail Order Submission (POST /orders with { items, shipping_address, payment_method, total_amount })
        const response = await orderApi.createOrder({
          user_id: user?.id,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_email: user?.email || '',
          shipping_address: shippingAddress.trim() || 'Default Address',
          payment_method: 'COD_OR_WHATSAPP',
          total_amount: grandTotal,
          grand_total: grandTotal,
          items: itemsPayload,
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
          onPress={() => navigation.navigate('MainTabs', { screen: 'Categories' })}
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
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: Math.max(insets.bottom + 110, 110) }}
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
                resizeMode="contain"
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
                navigation.navigate('MainTabs', { screen: 'Home' });
              }}
            >
              <Text style={styles.continueBtnText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* DELIVERY ADDRESS & CUSTOMER INFO FORM */}
            <View style={styles.addressCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={[styles.addressCardTitle, { marginBottom: 0 }]}>Delivery Address & Customer Info</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E6F4EA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 }}>
                  <CheckCircle2 color="#276749" size={12} />
                  <Text style={{ color: '#276749', fontSize: 10, fontWeight: '700' }}>Auto-Filled</Text>
                </View>
              </View>

              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={customerName}
                onChangeText={setCustomerName}
              />

              <Text style={styles.formLabel}>Mobile Number (WhatsApp preferred) *</Text>
              <PhoneInputWithCountry
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="98765 43210"
                containerStyle={{ marginBottom: 12, backgroundColor: '#FFFFFF' }}
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

              {/* WHLESALE BOOKING VS RETAIL WHATSAPP BUTTON */}
              {isWholesale ? (
                <TouchableOpacity
                  style={styles.wholesaleBookingBtn}
                  onPress={handleCheckout}
                  disabled={loading}
                  activeOpacity={0.88}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Briefcase color="#FFFFFF" size={18} />
                      <Text style={styles.wholesaleBookingBtnText}>
                        SUBMIT WHOLESALE BOOKING
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.whatsappActionBtn, { marginBottom: 0 }]}
                  onPress={handleWhatsAppOrder}
                  activeOpacity={0.85}
                >
                  <MessageCircle color="#FFFFFF" size={20} />
                  <Text style={styles.whatsappActionBtnText}>
                    ORDER RETAIL CART ON WHATSAPP
                  </Text>
                </TouchableOpacity>
              )}
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
    width: 90,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#000000',
    padding: 3,
    resizeMode: 'contain',
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
    color: '#121767',
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
  wholesaleBookingBtn: {
    backgroundColor: '#121767',
    paddingVertical: 14,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#121767',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  wholesaleBookingBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  directCheckoutBtn: {
    backgroundColor: '#121767',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#121767',
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
    backgroundColor: '#121767',
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
