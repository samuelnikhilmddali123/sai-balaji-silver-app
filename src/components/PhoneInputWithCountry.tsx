import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { ChevronDown, X, Check, Search } from 'lucide-react-native';

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  maxLength: number;
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  { code: '+91', name: 'India', flag: '🇮🇳', maxLength: 10 },
  { code: '+1', name: 'United States', flag: '🇺🇸', maxLength: 10 },
  { code: '+971', name: 'United Arab Emirates', flag: '🇦🇪', maxLength: 9 },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', maxLength: 10 },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', maxLength: 8 },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾', maxLength: 10 },
  { code: '+61', name: 'Australia', flag: '🇦🇺', maxLength: 9 },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', maxLength: 9 },
  { code: '+974', name: 'Qatar', flag: '🇶🇦', maxLength: 8 },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼', maxLength: 8 },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭', maxLength: 8 },
  { code: '+968', name: 'Oman', flag: '🇴🇲', maxLength: 8 },
  { code: '+1', name: 'Canada', flag: '🇨🇦', maxLength: 10 },
  { code: '+49', name: 'Germany', flag: '🇩🇪', maxLength: 11 },
  { code: '+33', name: 'France', flag: '🇫🇷', maxLength: 9 },
  { code: '+81', name: 'Japan', flag: '🇯🇵', maxLength: 10 },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿', maxLength: 9 },
  { code: '+27', name: 'South Africa', flag: '🇿🇦', maxLength: 9 },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰', maxLength: 9 },
  { code: '+977', name: 'Nepal', flag: '🇳🇵', maxLength: 10 },
];

interface PhoneInputWithCountryProps {
  value: string;
  onChangeText: (text: string) => void;
  countryCode?: string;
  onChangeCountryCode?: (code: string) => void;
  placeholder?: string;
  error?: boolean | string;
  editable?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  value,
  onChangeText,
  countryCode = '+91',
  onChangeCountryCode,
  placeholder = '98765 43210',
  error,
  editable = true,
  containerStyle,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeCountry =
    SUPPORTED_COUNTRIES.find((c) => c.code === countryCode) || SUPPORTED_COUNTRIES[0];

  const filteredCountries = SUPPORTED_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.includes(searchQuery)
  );

  const handleSelectCountry = (country: CountryInfo) => {
    if (onChangeCountryCode) {
      onChangeCountryCode(country.code);
    }
    setModalVisible(false);
    setSearchQuery('');
  };

  return (
    <>
      <View
        style={[
          styles.container,
          error ? styles.containerError : null,
          containerStyle,
        ]}
      >
        {/* COUNTRY SELECTOR BADGE */}
        <TouchableOpacity
          style={styles.countryBadge}
          onPress={() => setModalVisible(true)}
          disabled={!editable}
          activeOpacity={0.7}
        >
          <Text style={styles.flagText}>{activeCountry.flag}</Text>
          <Text style={styles.countryCodeText}>{activeCountry.code}</Text>
          <ChevronDown size={14} color="#666666" style={{ marginLeft: 2 }} />
        </TouchableOpacity>

        {/* VERTICAL DIVIDER */}
        <View style={styles.divider} />

        {/* PHONE NUMBER INPUT */}
        <TextInput
          style={styles.phoneInput}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          keyboardType="phone-pad"
          editable={editable}
          maxLength={activeCountry.maxLength + 2}
          value={value}
          onChangeText={(text) => {
            // Clean digits only
            const cleaned = text.replace(/[^\d\s]/g, '');
            onChangeText(cleaned);
          }}
        />
      </View>

      {/* COUNTRY SELECTION MODAL */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          setSearchQuery('');
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery('');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color="#1A1918" />
              </TouchableOpacity>
            </View>

            {/* SEARCH BAR */}
            <View style={styles.searchBarContainer}>
              <Search size={16} color="#888888" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search country or code..."
                placeholderTextColor="#999999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
            </View>

            {/* COUNTRY LIST */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item, index) => `${item.code}_${item.name}_${index}`}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.code === activeCountry.code && item.name === activeCountry.name;
                return (
                  <TouchableOpacity
                    style={[
                      styles.countryItem,
                      isSelected ? styles.countryItemSelected : null,
                    ]}
                    onPress={() => handleSelectCountry(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.itemFlag}>{item.flag}</Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCode}>{item.code}</Text>
                    {isSelected ? (
                      <Check size={18} color="#9E7E45" style={{ marginLeft: 8 }} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE6E1',
    borderRadius: 14,
    height: 50,
    marginBottom: 4,
    overflow: 'hidden',
  },
  containerError: {
    borderColor: '#DC2626',
    borderWidth: 1.2,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    height: '100%',
    gap: 6,
  },
  flagText: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1918',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E0DBD4',
    marginVertical: 'auto',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1918',
    height: '100%',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1918',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE6E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1A1918',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2EFEB',
    borderRadius: 8,
  },
  countryItemSelected: {
    backgroundColor: '#FAF8F5',
  },
  itemFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1918',
  },
  itemCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9E7E45',
  },
});
