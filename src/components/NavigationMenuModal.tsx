import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  Linking,
  Alert,
} from 'react-native';
import { X, TrendingUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMenu } from '../context/MenuContext';
import { getAdminPhoneNumber, DEFAULT_ADMIN_PHONE } from '../services/photoShare';

export const NavigationMenuModal: React.FC = () => {
  const { isMenuOpen, closeMenu } = useMenu();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [adminPhone, setAdminPhone] = useState<string>(DEFAULT_ADMIN_PHONE);

  useEffect(() => {
    if (isMenuOpen) {
      getAdminPhoneNumber(true)
        .then((p) => {
          if (p) setAdminPhone(p);
        })
        .catch(() => {});
    }
  }, [isMenuOpen]);

  const handleNavigate = (screenName: string) => {
    closeMenu();
    navigation.navigate('MainTabs', { screen: screenName });
  };

  return (
    <Modal
      visible={isMenuOpen}
      animationType="fade"
      transparent={false}
      onRequestClose={closeMenu}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9F8F3" />

        {/* TOP HEADER BAR */}
        <View style={styles.header}>
          <View style={styles.brandGroup}>
            <View style={styles.logoFrame}>
              <Image
                source={require('../../assets/logo.webp')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>SAI BALAJI</Text>
          </View>

          <TouchableOpacity
            onPress={closeMenu}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <X size={24} color="#202020" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* CENTER MENU NAVIGATION LINKS */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigate('Home')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>HOME</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigate('Categories')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>RETAIL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigate('Wholesale')}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>WHOLESALE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              navigation.navigate('About');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>ABOUT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              navigation.navigate('Contact');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>CONTACT</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              closeMenu();
              Linking.openURL('https://sbbullion.xyz/Liverates.html').catch(() => {
                Alert.alert('Live Rates', 'Opening SB Bullion Live Rates...');
              });
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.menuText, { color: '#B9A77A', fontWeight: '500' }]}>SB BULLION</Text>
              <View style={{ borderWidth: 1, borderColor: '#B9A77A', borderRadius: 4, padding: 2, backgroundColor: '#FAF8F5' }}>
                <TrendingUp size={15} color="#B9A77A" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* BOTTOM FOOTER */}
        <View style={styles.footer}>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.footerContent}
            onPress={() => {
              Linking.openURL(`tel:+${adminPhone}`).catch(() => {
                Alert.alert('Phone Call', `Call: +${adminPhone}`);
              });
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.footerMainText}>
              {adminPhone.startsWith('91') && adminPhone.length === 12
                ? `+91 ${adminPhone.slice(2, 7)} ${adminPhone.slice(7)}`
                : `+${adminPhone}`} • Tenali Atelier
            </Text>
            <Text style={styles.footerSubText}>100% NABL Hallmarked Silver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8F3',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoFrame: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  brandTitle: {
    fontSize: 19,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#202020',
    letterSpacing: 3,
    fontWeight: '400',
  },
  closeBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#EAE6DF',
    width: '100%',
  },
  menuContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  menuItem: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  menuText: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#2A2A2A',
    letterSpacing: 3.5,
    fontWeight: '400',
  },
  footer: {
    width: '100%',
  },
  footerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  footerMainText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#202020',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  footerSubText: {
    fontSize: 12,
    color: '#777777',
    letterSpacing: 0.2,
  },
});
