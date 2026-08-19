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
import { useNavigation } from '@react-navigation/native';
import {
  User as UserIcon,
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
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { EditAddressModal, AddressData } from '../components/EditAddressModal';
import api, { getProductImageUrl } from '../services/api';
import { Order } from '../types';

export const AccountScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, login, register, logout, updateUser } = useAuth();
  const { wishlist } = useWishlist();

  // Auth Tab State
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State for Login / Register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');

  // Logged In Tab State: 'retail' vs 'wholesale'
  const [historyTab, setHistoryTab] = useState<'retail' | 'wholesale'>('retail');

  // User Orders State
  const [orders, setOrders] = useState<Order[]>([]);
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

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      setOrdersLoading(true);

      const [ordersRes, quotesRes, prodsRes] = await Promise.allSettled([
        api.get('/orders'),
        api.get('/wholesale/requests'),
        api.get('/products'),
      ]);

      const prodMap: Record<number, string> = {};
      if (prodsRes.status === 'fulfilled' && prodsRes.value.data) {
        const data = prodsRes.value.data;
        const rawProds = Array.isArray(data) ? data : (data.value || data.products || []);
        rawProds.forEach((p: any) => {
          if (p.id) {
            prodMap[p.id] = p.featured_image || (p.images && p.images[0]) || p.image_url || '';
          }
        });
      }

      let retailList: Order[] = [];
      if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
        const data = ordersRes.value.data;
        const rawOrders = Array.isArray(data) ? data : (data.value || data.orders || []);
        retailList = rawOrders.map((o: any) => ({
          ...o,
          order_type: 'retail' as const,
          items: (o.items || []).map((it: any) => {
            const resolvedImg = it.featured_image || it.image_url || prodMap[it.product_id] || '';
            return {
              ...it,
              featured_image: resolvedImg,
              image_url: resolvedImg,
            };
          }),
        }));
      }

      let wholesaleList: Order[] = [];
      if (quotesRes.status === 'fulfilled' && quotesRes.value.data) {
        const data = quotesRes.value.data;
        const rawQuotes = Array.isArray(data) ? data : (data.value || data.data || []);
        wholesaleList = rawQuotes.map((q: any) => ({
          id: q.id,
          order_number: q.request_number || q.quote_id || `SBS-QT-${q.id}`,
          user_id: q.user_id,
          customer_name: q.contact_person || q.company_name || 'Wholesale Client',
          customer_email: q.email || q.customer_email || '',
          customer_phone: q.phone || q.customer_phone || '',
          shipping_address: q.address || 'N/A',
          items: (q.items || []).map((it: any) => {
            const resolvedImg = it.featured_image || it.image_url || prodMap[it.product_id] || '';
            return {
              product_id: it.product_id || 0,
              title: it.title || it.product_name || 'Silver Wholesale Article',
              product_name: it.title || it.product_name || 'Silver Wholesale Article',
              quantity: it.quantity || 1,
              unit_price: it.unit_price || it.price || 0,
              subtotal: (it.unit_price || it.price || 0) * (it.quantity || 1),
              featured_image: resolvedImg,
              image_url: resolvedImg,
            };
          }),
          grand_total: q.estimated_total || (q.items || []).reduce((acc: number, item: any) => acc + (item.unit_price || 0) * (item.quantity || 1), 0),
          status: q.status || 'PENDING',
          created_at: q.created_at || new Date().toISOString(),
          order_type: 'wholesale' as const,
        }));
      }

      const combined: Order[] = [...retailList, ...wholesaleList];

      const cleanUserEmail = user.email ? user.email.trim().toLowerCase() : '';
      const cleanUserPhone = user.phone ? user.phone.replace(/\D/g, '') : '';

      const userOrders = combined.filter((ord) => {
        // 1. Match by User ID
        if (user.id && ord.user_id && Number(ord.user_id) === Number(user.id)) return true;

        // 2. Match by Email
        const ordEmail = (ord.customer_email || '').trim().toLowerCase();
        if (cleanUserEmail && ordEmail && ordEmail === cleanUserEmail) return true;

        // 3. Match by Sanitized Phone Number
        const ordPhone = (ord.customer_phone || '').replace(/\D/g, '');
        if (cleanUserPhone && ordPhone && (ordPhone.endsWith(cleanUserPhone) || cleanUserPhone.endsWith(ordPhone))) return true;

        return false;
      });

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

    if (!cleanEmail || !cleanPassword) {
      Alert.alert('Required Fields', 'Please enter email and password');
      return;
    }
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

    if (!cleanEmail || !cleanPassword || !fullName.trim()) {
      Alert.alert('Required Fields', 'Please fill in Email, Password, and Full Name');
      return;
    }
    setLoading(true);
    try {
      await register({
        email: cleanEmail,
        password: cleanPassword,
        full_name: fullName.trim(),
        phone: phone.trim(),
        company_name: companyName.trim(),
        gstin: gstin.trim(),
      });
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not register');
    } finally {
      setLoading(false);
    }
  };

  // LOGGED IN PROFILE VIEW (Matches Screenshot 2)
  if (user) {
    const initialChar = (user.full_name || savedAddress.fullName || 'U').charAt(0).toUpperCase();

    const retailOrders = orders.filter((o) => o.order_type !== 'wholesale');
    const wholesaleQuotes = orders.filter((o) => o.order_type === 'wholesale');
    const currentOrders = historyTab === 'retail' ? retailOrders : wholesaleQuotes;

    return (
      <View style={{ flex: 1, backgroundColor: '#F4F6F6' }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 90 }}
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
                <Text style={styles.avatarText}>{initialChar}</Text>
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

          {/* 03. RETAIL ORDERS VS WHOLESALE QUOTES SWITCHER BAR */}
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
                Retail Orders ({retailOrders.length})
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
                Wholesale Quotes ({wholesaleQuotes.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* 04. ORDER HISTORY */}
          <Text style={styles.sectionHeaderTitle}>
            {historyTab === 'retail' ? 'Retail Order History' : 'Wholesale Quote History'}
          </Text>

          {ordersLoading && !refreshing ? (
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

              <Text style={styles.emptyOrderTitle}>No Orders Found</Text>
              <Text style={styles.emptyOrderSub}>
                Explore our fine silver collections and place your first order.
              </Text>

              <TouchableOpacity
                style={styles.startShoppingBtn}
                onPress={() => navigation.navigate('Categories')}
                activeOpacity={0.8}
              >
                <Text style={styles.startShoppingBtnText}>START SHOPPING</Text>
              </TouchableOpacity>
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
                      ord.status === 'Delivered'
                        ? styles.statusDelivered
                        : styles.statusPlaced,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        ord.status === 'Delivered'
                          ? styles.statusDeliveredText
                          : styles.statusPlacedText,
                      ]}
                    >
                      {ord.status || 'Order Placed'}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDivider} />

                {/* Items List */}
                {ord.items && ord.items.map((item, idx) => {
                  const imgUrl = getProductImageUrl(item);
                  const itemTitle = item.product_name || item.title || 'Silver Article';
                  const unitPrice = item.unit_price || (item.subtotal && item.quantity ? item.subtotal / item.quantity : 0);
                  const subtotal = item.subtotal || unitPrice * item.quantity;

                  return (
                    <View key={idx} style={styles.orderItemRow}>
                      <Image source={{ uri: imgUrl }} style={styles.orderItemThumb} />
                      <View style={styles.orderItemDetails}>
                        <Text style={styles.orderItemTitle} numberOfLines={2}>
                          {itemTitle}
                        </Text>
                        {item.product_sku ? (
                          <Text style={styles.orderItemSku}>SKU: {item.product_sku}</Text>
                        ) : null}
                        <Text style={styles.orderItemMeta}>
                          Qty: {item.quantity} × ₹{unitPrice.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <Text style={styles.orderItemSubtotal}>
                        ₹{subtotal.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  );
                })}

                <View style={styles.orderDivider} />

                {/* Footer: Grand Total */}
                <View style={styles.orderFooterRow}>
                  <Text style={styles.orderFooterLabel}>Total Amount Paid:</Text>
                  <Text style={styles.orderFooterValue}>
                    ₹{(ord.grand_total || ord.subtotal || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
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
    <View style={{ flex: 1, backgroundColor: '#F4F6F6' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authHeader}>
          <Text style={styles.authTag}>WELCOME TO SAI BALAJI</Text>
          <Text style={styles.authTitle}>Account Access</Text>
        </View>

        {/* Auth Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, authTab === 'login' && styles.activeTab]}
            onPress={() => setAuthTab('login')}
          >
            <Text style={[styles.tabText, authTab === 'login' && styles.activeTabText]}>
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, authTab === 'register' && styles.activeTab]}
            onPress={() => setAuthTab('register')}
          >
            <Text style={[styles.tabText, authTab === 'register' && styles.activeTabText]}>
              New Account
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="name@example.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password *</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
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

          {authTab === 'register' && (
            <>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 00000"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.label}>Company / Business Name (Wholesale Buyers)</Text>
              <TextInput
                style={styles.input}
                placeholder="Optional Business Name"
                placeholderTextColor="#999"
                value={companyName}
                onChangeText={setCompanyName}
              />

              <Text style={styles.label}>GSTIN (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Optional GSTIN Number"
                placeholderTextColor="#999"
                autoCapitalize="characters"
                value={gstin}
                onChangeText={setGstin}
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={authTab === 'login' ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1A1918" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {authTab === 'login' ? 'Sign In to Account' : 'Register Account'}
              </Text>
            )}
          </TouchableOpacity>
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
    backgroundColor: '#2D6A68',
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
    backgroundColor: '#2D6A68',
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
    color: '#2D6A68',
    fontSize: 11,
    fontWeight: '600',
  },
  userEmailText: {
    color: '#666666',
    fontSize: 11,
    marginTop: 2,
  },
  userCompanyText: {
    color: '#2D6A68',
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
    backgroundColor: '#2D6A68',
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
  authHeader: {
    padding: 24,
    backgroundColor: '#2D6A68',
    alignItems: 'center',
  },
  authTag: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  authTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#EBF0F0',
    borderRadius: 14,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#2D6A68',
    fontWeight: 'bold',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F4F7F7',
    borderWidth: 1,
    borderColor: '#EBF0F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7F7',
    borderWidth: 1,
    borderColor: '#EBF0F0',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtn: {
    backgroundColor: '#2D6A68',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#2D6A68',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
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
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPlaced: {
    backgroundColor: '#E0F2FE',
  },
  statusDelivered: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusPlacedText: {
    color: '#0369A1',
  },
  statusDeliveredText: {
    color: '#047857',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#F4F6F6',
    marginVertical: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  orderItemThumb: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#F4F6F6',
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
    color: '#2D6A68',
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
});
