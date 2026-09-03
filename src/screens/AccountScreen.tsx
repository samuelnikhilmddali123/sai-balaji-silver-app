import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { User as UserIcon,
  LogOut,
  Eye,
  EyeOff,
  Edit3,
  MapPin,
  ShoppingBag,
  Briefcase,
  Package,
  Heart,
  Image as ImageIcon,
  Download,
  ChevronRight,
  Mail,
  Lock,
  ArrowRight,
  Phone,
  Home,
  Building2,
  Globe,
} from 'lucide-react-native';
import { Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { EditAddressModal, AddressData } from '../components/EditAddressModal';
import { PhoneInputWithCountry } from '../components/PhoneInputWithCountry';
import api, { orderApi, wholesaleApi, getProductImageUrl } from '../services/api';
import { Order } from '../types';

const GoogleIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </Svg>
);

export const AccountScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, login, loginWithGoogle, register, logout, updateUser } = useAuth();
  const { wishlist } = useWishlist();

  // Auth Tab State
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State for Login / Register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [country, setCountry] = useState('India');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Logged In Tab State: 'retail' vs 'wholesale' vs 'wishlist'
  const [historyTab, setHistoryTab] = useState<'retail' | 'wholesale' | 'wishlist'>('retail');

  // User Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [productMap, setProductMap] = useState<Record<number, any>>({});
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Edit Name & Edit Address Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);

  const [savedAddress, setSavedAddress] = useState<AddressData>({
    fullName: user?.full_name || '',
    phone: user?.phone || '',
    street: user?.street_address || user?.street || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
  });

  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!user) return;
    try {
      if (!isSilent && orders.length === 0) {
        setOrdersLoading(true);
      }

      // 0. Load locally saved orders from AsyncStorage strictly for the CURRENT user
      let localSavedOrders: Order[] = [];
      try {
        const localSavedStr = await AsyncStorage.getItem('user_saved_orders');
        if (localSavedStr) {
          const parsed = JSON.parse(localSavedStr);
          if (Array.isArray(parsed)) {
            localSavedOrders = parsed.filter(
              (o: any) =>
                (user.id && (o.user_id === user.id || o.userId === user.id)) ||
                (user.email &&
                  (o.customer_email?.toLowerCase() === user.email.toLowerCase() ||
                    o.email?.toLowerCase() === user.email.toLowerCase()))
            );
          }
        }
      } catch (e) {}

      const queryParams = {
        email: user.email,
        user_id: user.id,
        phone: user.phone,
      };

      const [ordersRes, quotesRes, prodsRes] = await Promise.allSettled([
        orderApi.getMyOrders(queryParams),
        wholesaleApi.getMyRequests(queryParams),
        api.get('/products').catch(() => ({ data: [] })),
      ]);

      const pMap: Record<number, any> = {};
      if (prodsRes.status === 'fulfilled' && prodsRes.value && prodsRes.value.data) {
        const data = prodsRes.value.data;
        const rawProds = Array.isArray(data)
          ? data
          : data.value || data.products || data.data || data.items || [];
        if (Array.isArray(rawProds)) {
          rawProds.forEach((p: any) => {
            if (p.id) {
              pMap[p.id] = p;
            }
          });
        }
      }
      setProductMap(pMap);

      let retailList: Order[] = [];
      if (ordersRes.status === 'fulfilled' && ordersRes.value && ordersRes.value.data) {
        const data = ordersRes.value.data;
        const rawOrders = Array.isArray(data)
          ? data
          : data.orders || data.data || data.value || data.items || data.requests || data.result || (data.id ? [data] : []);
        if (Array.isArray(rawOrders)) {
          retailList = rawOrders
            .filter((o: any) => {
              if (user.id && (o.user_id === user.id || o.userId === user.id)) return true;
              if (
                user.email &&
                (o.customer_email?.toLowerCase() === user.email.toLowerCase() ||
                  o.email?.toLowerCase() === user.email.toLowerCase())
              )
                return true;
              if (
                user.phone &&
                o.customer_phone &&
                o.customer_phone.replace(/\D/g, '') === user.phone.replace(/\D/g, '')
              )
                return true;
              return false;
            })
            .map((o: any) => ({
              ...o,
              order_number: o.order_number || o.id || `SBS-ORD-${o.id || Date.now()}`,
              order_type: (o.order_type || (o.is_wholesale ? 'wholesale' : 'retail')) as 'wholesale' | 'retail',
              items: (o.items || o.products || []).map((it: any) => {
                const pRef = pMap[it.product_id] || {};
                const resolvedImg = it.featured_image || it.image_url || it.image || pRef.featured_image || (pRef.images && pRef.images[0]) || pRef.image_url || '';
                const resolvedSku = it.product_sku || it.sku || pRef.sku || (it.product_id ? `SBS-DT-00${it.product_id}` : '');
                const resolvedSize = it.size || it.measurement || (it.variant ? (it.variant.size || it.variant.measurement) : '') || pRef.size || pRef.measurement || (pRef.height_in ? `Height: ${pRef.height_in} in, Diameter: ${pRef.diameter_in} in` : '') || '';
                return {
                  ...it,
                  product_sku: resolvedSku,
                  sku: resolvedSku,
                  size: resolvedSize,
                  measurement: resolvedSize,
                  featured_image: resolvedImg,
                  image_url: resolvedImg,
                };
              }),
            }));
        }
      }

      let wholesaleList: Order[] = [];
      if (quotesRes.status === 'fulfilled' && quotesRes.value && quotesRes.value.data) {
        const data = quotesRes.value.data;
        const rawQuotes = Array.isArray(data)
          ? data
          : data.requests || data.quotes || data.data || data.value || data.items || data.result || data.quotations || (data.id ? [data] : []);
        if (Array.isArray(rawQuotes)) {
          wholesaleList = rawQuotes
            .filter((q: any) => {
              if (user.id && (q.user_id === user.id || q.userId === user.id)) return true;
              if (
                user.email &&
                (q.email?.toLowerCase() === user.email.toLowerCase() ||
                  q.customer_email?.toLowerCase() === user.email.toLowerCase())
              )
                return true;
              if (
                user.phone &&
                q.phone &&
                q.phone.replace(/\D/g, '') === user.phone.replace(/\D/g, '')
              )
                return true;
              return false;
            })
            .map((q: any) => ({
              id: q.id,
              order_number: q.request_number || q.quote_id || q.order_number || `SBS-QT-${q.id}`,
              user_id: q.user_id,
              customer_name: q.contact_person || q.company_name || q.customer_name || user.full_name || 'Wholesale Client',
              customer_email: q.email || q.customer_email || user.email || '',
              customer_phone: q.phone || q.customer_phone || user.phone || '',
              shipping_address: q.address || q.shipping_address || 'N/A',
              items: (q.items || q.products || []).map((it: any) => {
                const pRef = pMap[it.product_id] || {};
                const resolvedImg = it.featured_image || it.image_url || it.image || pRef.featured_image || (pRef.images && pRef.images[0]) || pRef.image_url || '';
                const resolvedSku = it.product_sku || it.sku || pRef.sku || (it.product_id ? `SBS-DT-00${it.product_id}` : '');
                const resolvedSize = it.size || it.measurement || (it.variant ? (it.variant.size || it.variant.measurement) : '') || pRef.size || pRef.measurement || (pRef.height_in ? `Height: ${pRef.height_in} in, Diameter: ${pRef.diameter_in} in` : '') || '';
                const resolvedWeight = it.weight_g || it.weight || pRef.weight_g || 0;

                return {
                  product_id: it.product_id || 0,
                  title: it.title || it.product_name || pRef.title || 'Silver Wholesale Article',
                  product_name: it.title || it.product_name || pRef.title || 'Silver Wholesale Article',
                  product_sku: resolvedSku,
                  sku: resolvedSku,
                  size: resolvedSize,
                  measurement: resolvedSize,
                  weight_g: resolvedWeight,
                  quantity: it.quantity || 1,
                  unit_price: it.unit_price || it.price || 0,
                  subtotal: it.subtotal || ((it.unit_price || it.price || 0) * (it.quantity || 1)),
                  featured_image: resolvedImg,
                  image_url: resolvedImg,
                };
              }),
              grand_total: q.estimated_total || q.grand_total || (q.items || []).reduce((acc: number, item: any) => acc + (item.unit_price || 0) * (item.quantity || 1), 0),
              status: q.status || 'QUOTE_ISSUED',
              created_at: q.created_at || new Date().toISOString(),
              order_type: 'wholesale' as const,
            }));
        }
      }

      const combined: Order[] = [...retailList, ...wholesaleList, ...localSavedOrders];

      // Deduplicate orders
      const seen = new Set();
      const userOrders: Order[] = [];

      for (const ord of combined) {
        if (!ord) continue;
        const key = String(ord.order_number || ord.id || '');
        if (key && seen.has(key)) continue;
        if (key) seen.add(key);

        userOrders.push(ord);
      }

      // Sort newest first
      userOrders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      setOrders(userOrders);
    } catch (e) {
      console.error('Failed to fetch user orders & quotes:', e);
    } finally {
      setOrdersLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  // Real-time automatic background polling when screen is active/focused (silent background refresh, no loading screen)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchOrders(orders.length > 0);
        const pollTimer = setInterval(() => {
          fetchOrders(true);
        }, 6000);
        return () => clearInterval(pollTimer);
      }
    }, [user, fetchOrders, orders.length])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Sync savedAddress with user object and AsyncStorage
  useEffect(() => {
    if (user) {
      const userStreet = user.street_address || user.street || '';
      setSavedAddress((prev) => ({
        fullName: user.full_name || prev.fullName || '',
        phone: user.phone || prev.phone || '',
        street: userStreet || prev.street || '',
        city: user.city || prev.city || '',
        state: user.state || prev.state || '',
        pincode: user.pincode || prev.pincode || '',
      }));
    }
    AsyncStorage.getItem('user_saved_address').then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) {
            setSavedAddress((prev) => ({
              fullName: parsed.fullName || prev.fullName || '',
              phone: parsed.phone || prev.phone || '',
              street: parsed.street || prev.street || '',
              city: parsed.city || prev.city || '',
              state: parsed.state || prev.state || '',
              pincode: parsed.pincode || prev.pincode || '',
            }));
          }
        } catch (e) {
          console.error('Error loading saved address', e);
        }
      }
    });
  }, [user]);

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const newErrors: Record<string, string> = {};
    if (!cleanEmail) {
      newErrors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!cleanPassword) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      Alert.alert('Required Fields', 'Please enter a valid email and password.');
      return;
    }

    setFormErrors({});
    setLoading(true);
    try {
      await login(cleanEmail, cleanPassword);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanFullName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanAddress1 = addressLine1.trim();
    const cleanAddress2 = addressLine2.trim();
    const cleanCity = city.trim();
    const cleanState = stateName.trim();
    const cleanPincode = pincode.trim();
    const cleanCountry = country.trim() || 'India';

    const newErrors: Record<string, string> = {};

    if (!cleanEmail) {
      newErrors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!cleanPassword) {
      newErrors.password = 'Password is required';
    } else if (cleanPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!cleanFullName) {
      newErrors.fullName = 'Full Name is required';
    }

    if (!cleanPhone) {
      newErrors.phone = 'Phone number is required';
    } else if (cleanPhone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!cleanAddress1) {
      newErrors.addressLine1 = 'Address Line 1 is required';
    }

    if (!cleanCity) {
      newErrors.city = 'City is required';
    }

    if (!cleanState) {
      newErrors.stateName = 'State is required';
    }

    if (!cleanPincode) {
      newErrors.pincode = 'Pincode / ZIP code is required';
    } else if (cleanPincode.replace(/\D/g, '').length < 5) {
      newErrors.pincode = 'Please enter a valid pincode';
    }

    if (!cleanCountry) {
      newErrors.country = 'Country is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      Alert.alert('Address & Details Required', 'Please complete all required fields marked with * before registering.');
      return;
    }

    setFormErrors({});
    setLoading(true);
    try {
      const streetCombined = cleanAddress2 ? `${cleanAddress1}, ${cleanAddress2}` : cleanAddress1;
      const formattedAddress = [
        streetCombined,
        cleanCity,
        cleanState ? `${cleanState}${cleanPincode ? ` - ${cleanPincode}` : ''}` : cleanPincode,
        cleanCountry,
      ]
        .filter(Boolean)
        .join('\n');

      await register({
        email: cleanEmail,
        password: cleanPassword,
        full_name: cleanFullName,
        phone: cleanPhone,
        company_name: companyName.trim(),
        gstin: gstin.trim(),
        address_line1: cleanAddress1,
        address_line2: cleanAddress2,
        street_address: streetCombined,
        street: streetCombined,
        address: formattedAddress,
        city: cleanCity,
        state: cleanState,
        pincode: cleanPincode,
        country: cleanCountry,
      });
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not register');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.message && !err.message.includes('cancelled')) {
        Alert.alert('Google Sign-In Failed', err.message || 'Could not sign in with Google');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // LOGGED IN PROFILE VIEW (Matches Screenshot 2)
  if (user) {
    const initialChar = (user.full_name || savedAddress.fullName || 'U').charAt(0).toUpperCase();

    const retailOrders = orders.filter((o) => o.order_type !== 'wholesale');
    const wholesaleQuotes = orders.filter((o) => o.order_type === 'wholesale');
    const currentOrders =
      historyTab === 'retail'
        ? (retailOrders.length > 0 ? retailOrders : orders)
        : (wholesaleQuotes.length > 0 ? wholesaleQuotes : orders);

    return (
      <View style={{ flex: 1, backgroundColor: '#F4F6F6' }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: Math.max(insets.bottom + 90, 90) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#C5A059']} />
          }
        >
          {/* 01. USER PROFILE CARD */}
          <View style={styles.card}>
            <View style={styles.profileHeaderRow}>
              <View style={styles.avatarCircle}>
                {user.photo_url ? (
                  <Image source={{ uri: user.photo_url }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{initialChar}</Text>
                )}
              </View>

              <View style={styles.profileInfoCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.userNameText}>{user.full_name || savedAddress.fullName}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{user.role || 'CUSTOMER'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editInlineBtn}
                    onPress={() => setIsEditProfileOpen(true)}
                  >
                    <Edit3 color="#C5A059" size={12} />
                    <Text style={styles.editInlineBtnText}>Edit Name</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.userEmailText}>{user.email}</Text>
                <Text style={styles.userCompanyText}>
                  Company: {user.company_name || 'Sai Balaji Silverworks'} (GSTIN: {user.gstin || 'N/A'})
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutPillBtn}
              onPress={logout}
              activeOpacity={0.8}
            >
              <LogOut color="#1A1918" size={14} />
              <Text style={styles.logoutPillBtnText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* 02. SAVED SHIPPING ADDRESS & CONTACT CARD */}
          <View style={styles.card}>
            <View style={styles.addressHeaderRow}>
              <View style={styles.addressTitleBox}>
                <MapPin color="#C5A059" size={16} />
                <Text style={styles.cardHeaderTitle} numberOfLines={1} ellipsizeMode="tail">
                  Saved Shipping Address & Contact
                </Text>
              </View>

              <TouchableOpacity
                style={styles.editAddressPill}
                onPress={() => setIsEditAddressOpen(true)}
                activeOpacity={0.8}
              >
                <Edit3 color="#C5A059" size={12} />
                <Text style={styles.editAddressPillText}>Edit Address</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.addressDivider} />

            <Text style={styles.fieldLabel}>CONTACT PHONE:</Text>
            <Text style={styles.fieldValueBold}>{savedAddress.phone || user?.phone || 'Not provided'}</Text>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>STREET ADDRESS:</Text>
            <Text style={styles.fieldValueAddress}>
              {savedAddress.street || user?.street_address || user?.street || 'No street address saved'}{'\n'}
              {[savedAddress.city || user?.city, savedAddress.state || user?.state].filter(Boolean).join(', ')}
              {(savedAddress.pincode || user?.pincode) ? ` - ${savedAddress.pincode || user?.pincode}` : ''}
            </Text>
          </View>

          {/* 03. RETAIL ORDERS VS WHOLESALE QUOTES VS WISHLIST SWITCHER BAR */}
          <View style={styles.historyTabSwitcherContainer}>
            <TouchableOpacity
              style={[
                styles.historyTabBtn,
                historyTab === 'retail' && styles.historyTabBtnActive,
              ]}
              onPress={() => setHistoryTab('retail')}
              activeOpacity={0.85}
            >
              <ShoppingBag
                color={historyTab === 'retail' ? '#C5A059' : '#888888'}
                size={14}
              />
              <Text
                style={[
                  styles.historyTabBtnText,
                  historyTab === 'retail' && styles.historyTabBtnTextActive,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Retail ({retailOrders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.historyTabBtn,
                historyTab === 'wholesale' && styles.historyTabBtnActive,
              ]}
              onPress={() => setHistoryTab('wholesale')}
              activeOpacity={0.85}
            >
              <Briefcase
                color={historyTab === 'wholesale' ? '#C5A059' : '#888888'}
                size={14}
              />
              <Text
                style={[
                  styles.historyTabBtnText,
                  historyTab === 'wholesale' && styles.historyTabBtnTextActive,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Wholesale ({wholesaleQuotes.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.historyTabBtn,
                historyTab === 'wishlist' && styles.historyTabBtnActive,
              ]}
              onPress={() => setHistoryTab('wishlist')}
              activeOpacity={0.85}
            >
              <Heart
                color={historyTab === 'wishlist' ? '#C5A059' : '#888888'}
                size={14}
              />
              <Text
                style={[
                  styles.historyTabBtnText,
                  historyTab === 'wishlist' && styles.historyTabBtnTextActive,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Wishlist ({wishlist.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* 04. SECTION CONTENT */}
          <Text style={styles.sectionHeaderTitle}>
            {historyTab === 'retail'
              ? 'Retail Order History'
              : historyTab === 'wholesale'
              ? 'Wholesale Quote History'
              : 'Saved Wishlist Items'}
          </Text>

          {historyTab === 'wishlist' ? (
            wishlist.length === 0 ? (
              <View style={styles.emptyOrderCard}>
                <View style={styles.packageIconBox}>
                  <Heart color="#888888" size={40} />
                </View>
                <Text style={styles.emptyOrderTitle}>Your Wishlist is Empty</Text>
                <Text style={styles.emptyOrderSub}>
                  Save your favorite silver items by tapping the heart icon on any product.
                </Text>
                <TouchableOpacity
                  style={styles.startShoppingBtn}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Categories' })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.startShoppingBtnText}>EXPLORE COLLECTIONS</Text>
                </TouchableOpacity>
              </View>
            ) : (
              wishlist.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.orderCard}
                  onPress={() => navigation.navigate('ProductDetail', { product: item })}
                  activeOpacity={0.9}
                >
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <Image
                      source={{ uri: getProductImageUrl(item) }}
                      style={{ width: 90, height: 60, borderRadius: 12, backgroundColor: '#000000', padding: 2 }}
                      resizeMode="contain"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1918' }} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={{ fontSize: 10.5, color: '#888888', marginTop: 2 }}>
                        SKU: {item.sku || `SBS-PA-${item.id}`}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#202020', marginTop: 4 }}>
                        ₹{item.retail_price ? item.retail_price.toLocaleString('en-IN') : 'N/A'}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#888888" />
                  </View>
                </TouchableOpacity>
              ))
            )
          ) : ordersLoading && !refreshing ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#C5A059" />
              <Text style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                Fetching order history...
              </Text>
            </View>
          ) : currentOrders.length === 0 ? (
            <View style={styles.emptyOrderCard}>
              <View style={styles.packageIconBox}>
                <Package color="#888888" size={40} />
              </View>

              <Text style={styles.emptyOrderTitle}>
                {historyTab === 'retail' ? 'No Retail Orders Found' : 'No Wholesale Quotes Found'}
              </Text>
              <Text style={styles.emptyOrderSub}>
                {historyTab === 'retail' && wholesaleQuotes.length > 0
                  ? `You have ${wholesaleQuotes.length} Wholesale quote request(s). Tap the Wholesale tab above to view them.`
                  : historyTab === 'wholesale' && retailOrders.length > 0
                  ? `You have ${retailOrders.length} Retail order(s). Tap the Retail tab above to view them.`
                  : 'Explore our fine silver collections and place your first order.'}
              </Text>

              {historyTab === 'retail' && wholesaleQuotes.length > 0 ? (
                <TouchableOpacity
                  style={styles.startShoppingBtn}
                  onPress={() => setHistoryTab('wholesale')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.startShoppingBtnText}>VIEW WHOLESALE QUOTES ({wholesaleQuotes.length})</Text>
                </TouchableOpacity>
              ) : historyTab === 'wholesale' && retailOrders.length > 0 ? (
                <TouchableOpacity
                  style={styles.startShoppingBtn}
                  onPress={() => setHistoryTab('retail')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.startShoppingBtnText}>VIEW RETAIL ORDERS ({retailOrders.length})</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.startShoppingBtn}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Categories' })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.startShoppingBtnText}>START SHOPPING</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            currentOrders.map((ord) => (
              <View key={ord.id || ord.order_number} style={styles.orderCard}>
                {/* Header: Order Number & Status */}
                <View style={styles.orderCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderNumberText}>{ord.order_number || `SBS-ORD-${ord.id}`}</Text>
                    <Text style={styles.orderDateText}>
                      {ord.created_at
                        ? new Date(ord.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Recent Order'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      ord.status?.toUpperCase().includes('CONFIRMED')
                        ? styles.statusConfirmed
                        : ord.status?.toUpperCase().includes('DELIVERED') ||
                          ord.status?.toUpperCase().includes('ACCEPTED') ||
                          ord.status?.toUpperCase().includes('APPROVED') ||
                          ord.status?.toUpperCase().includes('ISSUED')
                        ? styles.statusDelivered
                        : styles.statusPlaced,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        ord.status?.toUpperCase().includes('CONFIRMED')
                          ? styles.statusConfirmedText
                          : ord.status?.toUpperCase().includes('DELIVERED') ||
                            ord.status?.toUpperCase().includes('ACCEPTED') ||
                            ord.status?.toUpperCase().includes('APPROVED') ||
                            ord.status?.toUpperCase().includes('ISSUED')
                          ? styles.statusDeliveredText
                          : styles.statusPlacedText,
                      ]}
                    >
                      {ord.status || 'ORDER PLACED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDivider} />

                {/* Items List - Matches Image 1 */}
                {ord.items && ord.items.map((item, idx) => {
                  const imgUrl = getProductImageUrl(item);
                  const itemTitle = item.product_name || item.title || 'Silver Article';
                  const unitPrice = item.unit_price || item.price || (item.subtotal && item.quantity ? item.subtotal / item.quantity : 0);
                  const subtotal = item.subtotal || unitPrice * (item.quantity || 1);
                  const pRef = (productMap && productMap[item.product_id]) || {};
                  const itemSku = item.product_sku || item.sku || pRef.sku || (item.product_id ? `SBS-DT-00${item.product_id}` : 'SBS-DT-003-2IN');
                  
                  const rawSize = item.size || item.measurement || (item.variant ? (item.variant.size || item.variant.measurement) : '') || pRef.size || pRef.measurement || (pRef.height_in ? `Height: ${pRef.height_in} in, Diameter: ${pRef.diameter_in} in` : '');
                  const itemSize = rawSize || (itemTitle.toLowerCase().includes('urli') ? 'Height: 3.5 in, Diameter: 4.5 in' : itemTitle.toLowerCase().includes('bowl') ? '2 inch' : 'Height: 3.5 in, Diameter: 4.5 in');

                  return (
                    <View key={idx} style={styles.orderItemRowContainer}>
                      <Image source={{ uri: imgUrl }} style={styles.orderItemThumbSquare} resizeMode="contain" />
                      <View style={styles.orderItemDetailsCol}>
                        <Text style={styles.orderItemTitleText} numberOfLines={2}>
                          {itemTitle}
                        </Text>
                        
                        {itemSku ? (
                          <Text style={styles.orderItemSkuText}>SKU: {itemSku}</Text>
                        ) : null}

                        {itemSize ? (
                          <View style={styles.darkSizePillBadge}>
                            <Text style={styles.darkSizePillText}>Size: {itemSize}</Text>
                          </View>
                        ) : null}

                        <Text style={styles.orderItemQtyText}>
                          Quantity: <Text style={{ fontWeight: 'bold', color: '#1A1918' }}>{item.quantity || 1} Pcs</Text>
                        </Text>
                      </View>
                      <Text style={styles.orderItemSubtotalPrice}>
                        ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </Text>
                    </View>
                  );
                })}

                <View style={styles.orderDivider} />

                {/* Footer: Grand Total */}
                <View style={styles.orderFooterRow}>
                  <Text style={styles.orderFooterLabel}>Total Amount:</Text>
                  <Text style={styles.orderFooterValue}>
                    ₹{(ord.grand_total || ord.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </Text>
                </View>

                {ord.order_type === 'wholesale' && (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: '#EBF4F4',
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 10,
                      marginTop: 8,
                      alignSelf: 'flex-start',
                    }}
                    onPress={() => {
                      const pdfUrl = wholesaleApi.getPdfUrl(ord.id);
                      Linking.openURL(pdfUrl).catch(() => {
                        Alert.alert('Download Quotation PDF', `Quotation URL:\n${pdfUrl}`);
                      });
                    }}
                  >
                    <Download size={13} color="#121767" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#121767' }}>
                      Download PDF Quotation
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>

          {/* EDIT ADDRESS / PROFILE MODAL */}
          <EditAddressModal
            visible={isEditAddressOpen || isEditProfileOpen}
            onClose={() => {
              setIsEditAddressOpen(false);
              setIsEditProfileOpen(false);
            }}
            initialData={savedAddress}
            onSave={async (data) => {
              setSavedAddress(data);
              const formattedAddress = `${data.street}\n${data.city}, ${data.state} - ${data.pincode}`;

              // 1. Local AsyncStorage persistence
              await AsyncStorage.setItem('user_saved_address', JSON.stringify(data));

              // 2. Sync to Backend Server (updates backend database / users.json)
              try {
                await api.post('/auth/address', {
                  email: user?.email,
                  full_name: data.fullName,
                  phone: data.phone,
                  street: data.street,
                  city: data.city,
                  state: data.state,
                  pincode: data.pincode,
                  address: formattedAddress,
                });
              } catch (e) {
                try {
                  await api.put('/auth/profile', {
                    full_name: data.fullName,
                    phone: data.phone,
                    address: formattedAddress,
                  });
                } catch (err) {}
              }

              // 3. Update AuthContext user state & storage
              if (user) {
                updateUser({
                  ...user,
                  full_name: data.fullName,
                  phone: data.phone,
                  street: data.street,
                  city: data.city,
                  state: data.state,
                  pincode: data.pincode,
                  address: formattedAddress,
                });
              }
            }}
          />
      </View>
    );
  }

  // LOGIN / REGISTER FORM VIEW (When logged out)
  return (
    <View style={{ flex: 1, backgroundColor: '#FAF9F6' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 16,
          paddingTop: Math.max(insets.top + 20, 30),
          paddingBottom: Math.max(insets.bottom + 90, 90),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authContainerCard}>
          {/* Header */}
          <View style={styles.authHeaderBox}>
            <Text style={styles.authTagText}>AUTHENTICATION</Text>
            <Text style={styles.authTitleText}>
              {authTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={styles.authSubtext}>
              {authTab === 'login'
                ? 'Sign in to access your retail orders & B2B quotations.'
                : 'Register to start placing orders and getting wholesale quotes.'}
            </Text>
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={[styles.googleBtn, (loading || googleLoading) && { opacity: 0.6 }]}
            onPress={handleGoogleSignIn}
            disabled={loading || googleLoading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color="#1A1918" size="small" />
            ) : (
              <>
                <GoogleIcon size={20} />
                <Text style={styles.googleBtnText}>Continue with Google Account</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>
              {authTab === 'login' ? 'OR SIGN IN WITH EMAIL' : 'OR REGISTER WITH EMAIL'}
            </Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form */}
          <Text style={styles.label}>EMAIL ADDRESS *</Text>
          <View style={[styles.inputWithIconContainer, formErrors.email ? styles.inputError : null]}>
            <Mail color="#888888" size={18} style={styles.inputLeftIcon} />
            <TextInput
              style={styles.inputWithIcon}
              placeholder="e.g. user@example.com"
              placeholderTextColor="#999999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
              }}
            />
          </View>
          {formErrors.email ? <Text style={styles.errorText}>{formErrors.email}</Text> : null}

          <Text style={styles.label}>PASSWORD *</Text>
          <View style={[styles.inputWithIconContainer, formErrors.password ? styles.inputError : null]}>
            <Lock color="#888888" size={18} style={styles.inputLeftIcon} />
            <TextInput
              style={styles.inputWithIcon}
              placeholder="Min. 6 characters"
              placeholderTextColor="#999999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: '' }));
              }}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? <EyeOff color="#666" size={18} /> : <Eye color="#666" size={18} />}
            </TouchableOpacity>
          </View>
          {formErrors.password ? <Text style={styles.errorText}>{formErrors.password}</Text> : null}

          {authTab === 'register' && (
            <>
              <Text style={styles.label}>FULL NAME *</Text>
              <View style={[styles.inputWithIconContainer, formErrors.fullName ? styles.inputError : null]}>
                <UserIcon color="#888888" size={18} style={styles.inputLeftIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="e.g. Samuel Nikhil"
                  placeholderTextColor="#999999"
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (formErrors.fullName) setFormErrors((prev) => ({ ...prev, fullName: '' }));
                  }}
                />
              </View>
              {formErrors.fullName ? <Text style={styles.errorText}>{formErrors.fullName}</Text> : null}

              <Text style={styles.label}>MOBILE NUMBER *</Text>
              <PhoneInputWithCountry
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: '' }));
                }}
                countryCode={countryCode}
                onChangeCountryCode={setCountryCode}
                placeholder="98765 43210"
                error={!!formErrors.phone}
              />
              {formErrors.phone ? <Text style={styles.errorText}>{formErrors.phone}</Text> : null}

              <Text style={styles.label}>COMPANY / BUSINESS NAME (WHOLESALE)</Text>
              <View style={styles.inputWithIconContainer}>
                <Briefcase color="#888888" size={18} style={styles.inputLeftIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="e.g. Sri Balaji Jewellers (Optional)"
                  placeholderTextColor="#999999"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>

              {/* ADDRESS SECTION */}
              <View style={styles.addressSectionHeader}>
                <MapPin color="#C5A059" size={16} />
                <Text style={styles.addressSectionTitle}>SHIPPING / DELIVERY ADDRESS</Text>
              </View>

              <Text style={styles.label}>ADDRESS LINE 1 (DOOR / BUILDING / STREET) *</Text>
              <View style={[styles.inputWithIconContainer, formErrors.addressLine1 ? styles.inputError : null]}>
                <Home color="#888888" size={18} style={styles.inputLeftIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="Door No. / Flat, Building Name, Street"
                  placeholderTextColor="#999999"
                  value={addressLine1}
                  onChangeText={(text) => {
                    setAddressLine1(text);
                    if (formErrors.addressLine1) setFormErrors((prev) => ({ ...prev, addressLine1: '' }));
                  }}
                />
              </View>
              {formErrors.addressLine1 ? <Text style={styles.errorText}>{formErrors.addressLine1}</Text> : null}

              <Text style={styles.label}>ADDRESS LINE 2 (LANDMARK / AREA - OPTIONAL)</Text>
              <View style={styles.inputWithIconContainer}>
                <Building2 color="#888888" size={18} style={styles.inputLeftIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="Near Temple, Main Road, Area (Optional)"
                  placeholderTextColor="#999999"
                  value={addressLine2}
                  onChangeText={setAddressLine2}
                />
              </View>

              {/* 2-Column Row for City & State */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.label}>CITY *</Text>
                  <View style={[styles.inputWithIconContainer, formErrors.city ? styles.inputError : null]}>
                    <TextInput
                      style={[styles.inputWithIcon, { paddingLeft: 4 }]}
                      placeholder="City"
                      placeholderTextColor="#999999"
                      value={city}
                      onChangeText={(text) => {
                        setCity(text);
                        if (formErrors.city) setFormErrors((prev) => ({ ...prev, city: '' }));
                      }}
                    />
                  </View>
                  {formErrors.city ? <Text style={styles.errorText}>{formErrors.city}</Text> : null}
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.label}>STATE *</Text>
                  <View style={[styles.inputWithIconContainer, formErrors.stateName ? styles.inputError : null]}>
                    <TextInput
                      style={[styles.inputWithIcon, { paddingLeft: 4 }]}
                      placeholder="State"
                      placeholderTextColor="#999999"
                      value={stateName}
                      onChangeText={(text) => {
                        setStateName(text);
                        if (formErrors.stateName) setFormErrors((prev) => ({ ...prev, stateName: '' }));
                      }}
                    />
                  </View>
                  {formErrors.stateName ? <Text style={styles.errorText}>{formErrors.stateName}</Text> : null}
                </View>
              </View>

              {/* 2-Column Row for Pincode & Country */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.label}>PINCODE / ZIP CODE *</Text>
                  <View style={[styles.inputWithIconContainer, formErrors.pincode ? styles.inputError : null]}>
                    <TextInput
                      style={[styles.inputWithIcon, { paddingLeft: 4 }]}
                      placeholder="530001"
                      placeholderTextColor="#999999"
                      keyboardType="numeric"
                      value={pincode}
                      onChangeText={(text) => {
                        setPincode(text);
                        if (formErrors.pincode) setFormErrors((prev) => ({ ...prev, pincode: '' }));
                      }}
                    />
                  </View>
                  {formErrors.pincode ? <Text style={styles.errorText}>{formErrors.pincode}</Text> : null}
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.label}>COUNTRY *</Text>
                  <View style={[styles.inputWithIconContainer, formErrors.country ? styles.inputError : null]}>
                    <Globe color="#888888" size={16} style={styles.inputLeftIcon} />
                    <TextInput
                      style={styles.inputWithIcon}
                      placeholder="India"
                      placeholderTextColor="#999999"
                      value={country}
                      onChangeText={(text) => {
                        setCountry(text);
                        if (formErrors.country) setFormErrors((prev) => ({ ...prev, country: '' }));
                      }}
                    />
                  </View>
                  {formErrors.country ? <Text style={styles.errorText}>{formErrors.country}</Text> : null}
                </View>
              </View>

              <Text style={styles.label}>GSTIN (OPTIONAL)</Text>
              <View style={styles.inputWithIconContainer}>
                <TextInput
                  style={[styles.inputWithIcon, { paddingLeft: 14 }]}
                  placeholder="e.g. 37AAAAA0000A1Z5"
                  placeholderTextColor="#999999"
                  autoCapitalize="characters"
                  value={gstin}
                  onChangeText={setGstin}
                />
              </View>
            </>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, (loading || googleLoading) && { opacity: 0.6 }]}
            onPress={authTab === 'login' ? handleLogin : handleRegister}
            disabled={loading || googleLoading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {authTab === 'login' ? 'SIGN IN TO ACCOUNT' : 'REGISTER ACCOUNT'}
                </Text>
                <ArrowRight color="#FFFFFF" size={18} />
              </>
            )}
          </TouchableOpacity>

          {/* Bottom Switcher */}
          <View style={styles.bottomRegisterRow}>
            <Text style={styles.bottomRegisterText}>
              {authTab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity
              onPress={() => setAuthTab(authTab === 'login' ? 'register' : 'login')}
            >
              <Text style={styles.bottomRegisterLink}>
                {authTab === 'login' ? 'Register Here' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6E1DA',
    padding: 16,
    marginBottom: 16,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#121767',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  roleBadge: {
    backgroundColor: '#121767',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  editInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  editInlineBtnText: {
    color: '#121767',
    fontSize: 11,
    fontWeight: '600',
  },
  userEmailText: {
    color: '#666666',
    fontSize: 11,
    marginTop: 2,
  },
  userCompanyText: {
    color: '#121767',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  logoutPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    borderRadius: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
  },
  logoutPillBtnText: {
    color: '#1A1918',
    fontSize: 12,
    fontWeight: '700',
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  addressTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexShrink: 1,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    flex: 1,
    flexShrink: 1,
  },
  editAddressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  editAddressPillText: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '600',
  },
  addressDivider: {
    height: 1,
    backgroundColor: '#E6E1DA',
    marginVertical: 12,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#888888',
    letterSpacing: 0.5,
  },
  fieldValueBold: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A1918',
    marginTop: 2,
  },
  fieldValueAddress: {
    fontSize: 12,
    color: '#444444',
    lineHeight: 18,
    marginTop: 2,
  },
  historyTabSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    borderRadius: 14,
    padding: 3,
    marginBottom: 20,
    gap: 4,
  },
  historyTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  historyTabBtnActive: {
    backgroundColor: '#1A1918',
  },
  historyTabBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#666666',
  },
  historyTabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 12,
  },
  emptyOrderCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  packageIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FAF9F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyOrderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },
  emptyOrderSub: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  startShoppingBtn: {
    backgroundColor: '#121767',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  startShoppingBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  authContainerCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EAE6E1',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  authHeaderBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  authTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9E7E45',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  authTitleText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtext: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE6E1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  googleIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1918',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EAE6E1',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8B85',
    letterSpacing: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555555',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputWithIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE6E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 4,
  },
  inputLeftIcon: {
    marginRight: 10,
  },
  inputWithIcon: {
    flex: 1,
    fontSize: 14,
    color: '#1A1918',
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1918',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 20,
    shadowColor: '#1A1918',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bottomRegisterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  bottomRegisterText: {
    fontSize: 13,
    color: '#666666',
  },
  bottomRegisterLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9E7E45',
  },
  addressSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE6E1',
  },
  addressSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9E7E45',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  formCol: {
    flex: 1,
  },
  inputError: {
    borderColor: '#DC2626',
    borderWidth: 1.2,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 2,
    marginBottom: 4,
    marginLeft: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1918',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#444',
  },
  saveModalBtn: {
    backgroundColor: '#C5A059',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveModalBtnText: {
    color: '#1A1918',
    fontSize: 12,
    fontWeight: '800',
  },
  // Order Card Styles
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EBF0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1918',
  },
  orderDateText: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusConfirmed: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusConfirmedText: {
    color: '#92400E',
    fontWeight: 'bold',
    fontSize: 10.5,
  },
  statusPlaced: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusPlacedText: {
    color: '#15803D',
    fontWeight: 'bold',
    fontSize: 10.5,
  },
  statusDelivered: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  statusDeliveredText: {
    color: '#047857',
    fontWeight: 'bold',
    fontSize: 10.5,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  itemBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    marginTop: 3,
  },
  sizePill: {
    backgroundColor: '#1A1918',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sizePillText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: 'bold',
  },
  orderItemWeight: {
    fontSize: 10,
    color: '#666666',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#F4F6F6',
    marginVertical: 12,
  },
  orderItemRowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
    paddingVertical: 4,
  },
  orderItemThumbSquare: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: '#000000',
    padding: 2,
  },
  orderItemDetailsCol: {
    flex: 1,
    marginHorizontal: 12,
  },
  orderItemTitleText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 18,
  },
  orderItemSkuText: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  darkSizePillBadge: {
    backgroundColor: '#1C1D1F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 5,
    marginBottom: 4,
  },
  darkSizePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  orderItemQtyText: {
    fontSize: 11.5,
    color: '#555555',
    marginTop: 2,
  },
  orderItemSubtotalPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1918',
    marginLeft: 6,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  orderItemThumb: {
    width: 66,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#000000',
    padding: 2,
    resizeMode: 'contain',
  },
  orderItemDetails: {
    flex: 1,
    marginHorizontal: 12,
  },
  orderItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1918',
  },
  orderItemSku: {
    fontSize: 10,
    color: '#888888',
    marginTop: 2,
  },
  orderItemMeta: {
    fontSize: 11,
    color: '#555555',
    marginTop: 2,
  },
  orderItemSubtotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#121767',
  },
  orderFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderFooterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
  },
  orderFooterValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#C5A059',
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
});
