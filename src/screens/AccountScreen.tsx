import React, { useState, useEffect } from 'react';
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
import api from '../services/api';

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

  // Edit Name & Edit Address Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);

  const [savedAddress, setSavedAddress] = useState<AddressData>({
    fullName: user?.full_name || 'Nikhil Maddali',
    phone: user?.phone || '09121266269',
    street: '5-4-147 Currency nagar',
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    pincode: '520008',
  });

  // Load persisted user address from AsyncStorage on component mount
  useEffect(() => {
    AsyncStorage.getItem('user_saved_address').then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.street) {
            setSavedAddress(parsed);
          }
        } catch (e) {
          console.error('Error loading saved address', e);
        }
      }
    });
  }, []);

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

    return (
      <View style={{ flex: 1, backgroundColor: '#F4F6F6' }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                <MapPin color="#C5A059" size={18} />
                <Text style={styles.cardHeaderTitle}>Saved Shipping Address & Contact</Text>
              </View>

              <TouchableOpacity
                style={styles.editAddressPill}
                onPress={() => setIsEditAddressOpen(true)}
              >
                <Edit3 color="#C5A059" size={12} />
                <Text style={styles.editAddressPillText}>Edit Address</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.addressDivider} />

            <Text style={styles.fieldLabel}>CONTACT PHONE:</Text>
            <Text style={styles.fieldValueBold}>{savedAddress.phone || '09121266269'}</Text>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>STREET ADDRESS:</Text>
            <Text style={styles.fieldValueAddress}>
              {savedAddress.street || 'No street address saved'}{'\n'}
              {savedAddress.city || 'Vijayawada'}, {savedAddress.state || 'Andhra Pradesh'} - {savedAddress.pincode || '520008'}
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
              >
                Retail Orders (0)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.historyTabBtn,
                historyTab === 'wholesale' && styles.historyTabBtnActive,
              ]}
              onPress={() => setHistoryTab('wholesale')}
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
              >
                Wholesale Requests & Quotations (0)
              </Text>
            </TouchableOpacity>
          </View>

          {/* 04. ORDER HISTORY EMPTY STATE */}
          <Text style={styles.sectionHeaderTitle}>
            {historyTab === 'retail' ? 'Retail Order History' : 'Wholesale Quote History'}
          </Text>

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
  },
  addressTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  editAddressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E6E1DA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  historyTabBtnActive: {
    backgroundColor: '#1A1918',
  },
  historyTabBtnText: {
    fontSize: 11,
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
});
