import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { MapPin, User, Phone, ArrowRight } from 'lucide-react-native';

export interface AddressData {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface EditAddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: AddressData) => void;
  initialData?: Partial<AddressData>;
}

export const EditAddressModal: React.FC<EditAddressModalProps> = ({
  visible,
  onClose,
  onSave,
  initialData,
}) => {
  const [fullName, setFullName] = useState(initialData?.fullName || 'Samuel Nikhil');
  const [phone, setPhone] = useState(initialData?.phone || '+91 91212 66269');
  const [street, setStreet] = useState(
    initialData?.street || 'currency nagar SF1 dno 4/147'
  );
  const [city, setCity] = useState(initialData?.city || 'Hyderabad');
  const [stateName, setStateName] = useState(initialData?.state || 'Telangana');
  const [pincode, setPincode] = useState(initialData?.pincode || '500033');

  useEffect(() => {
    if (initialData) {
      if (initialData.fullName) setFullName(initialData.fullName);
      if (initialData.phone) setPhone(initialData.phone);
      if (initialData.street) setStreet(initialData.street);
      if (initialData.city) setCity(initialData.city);
      if (initialData.state) setStateName(initialData.state);
      if (initialData.pincode) setPincode(initialData.pincode);
    }
  }, [initialData]);

  const handleSave = () => {
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !street.trim() ||
      !city.trim() ||
      !stateName.trim() ||
      !pincode.trim()
    ) {
      Alert.alert(
        'Compulsory Address Details',
        'Please complete all required fields (Full Name, Phone, Street Address, City, State, Pincode) to save your profile.'
      );
      return;
    }

    onSave({
      fullName: fullName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Compulsory setup: prevent back button dismiss unless details are saved
        Alert.alert(
          'Address Required',
          'Please fill in your address and tap "SAVE DETAILS & CONTINUE".'
        );
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Icon */}
            <View style={styles.iconCircle}>
              <MapPin color="#C5A059" size={24} />
            </View>

            {/* Title & Tagline */}
            <Text style={styles.tagline}>PROFILE & DELIVERY SETUP</Text>
            <Text style={styles.modalTitle}>Welcome! Please Confirm Your Details</Text>
            <Text style={styles.modalSub}>
              Provide your name, phone number, and default shipping address for seamless ordering & quotations.
            </Text>

            {/* FULL NAME */}
            <Text style={styles.fieldLabel}>FULL NAME *</Text>
            <View style={styles.inputWithIcon}>
              <User color="#888888" size={16} />
              <TextInput
                style={styles.iconInput}
                placeholder="Full Name *"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* MOBILE / PHONE NUMBER */}
            <Text style={styles.fieldLabel}>MOBILE / PHONE NUMBER *</Text>
            <View style={styles.inputWithIcon}>
              <Phone color="#888888" size={16} />
              <TextInput
                style={styles.iconInput}
                placeholder="+91 98765 43210 *"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* STREET ADDRESS / DOOR NO. */}
            <Text style={styles.fieldLabel}>STREET ADDRESS / DOOR NO. *</Text>
            <TextInput
              style={styles.streetTextArea}
              placeholder="Door No. / Flat, Building Name, Street, Landmark... *"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={street}
              onChangeText={setStreet}
            />

            {/* 3-COLUMN ROW: CITY, STATE, PINCODE */}
            <View style={styles.threeColRow}>
              <View style={styles.colItem}>
                <Text style={styles.fieldLabel}>CITY *</Text>
                <TextInput
                  style={styles.smallInput}
                  placeholder="City *"
                  placeholderTextColor="#999"
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={styles.colItem}>
                <Text style={styles.fieldLabel}>STATE *</Text>
                <TextInput
                  style={styles.smallInput}
                  placeholder="State *"
                  placeholderTextColor="#999"
                  value={stateName}
                  onChangeText={setStateName}
                />
              </View>

              <View style={styles.colItem}>
                <Text style={styles.fieldLabel}>PINCODE *</Text>
                <TextInput
                  style={styles.smallInput}
                  placeholder="Pincode *"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={pincode}
                  onChangeText={setPincode}
                />
              </View>
            </View>

            {/* COMPULSORY SAVE BUTTON */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>SAVE DETAILS & CONTINUE</Text>
                <ArrowRight color="#FFFFFF" size={16} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 25, 24, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#C5A059',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FAF9F5',
    borderWidth: 1.5,
    borderColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tagline: {
    color: '#C5A059',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  modalTitle: {
    color: '#1A1918',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSub: {
    color: '#666666',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  fieldLabel: {
    alignSelf: 'flex-start',
    color: '#334155',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 10,
  },
  inputWithIcon: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  iconInput: {
    flex: 1,
    fontSize: 13,
    color: '#1A1918',
    padding: 0,
  },
  streetTextArea: {
    width: '100%',
    backgroundColor: '#FAF9F5',
    borderWidth: 1.5,
    borderColor: '#C5A059',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1A1918',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  threeColRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  colItem: {
    flex: 1,
  },
  smallInput: {
    backgroundColor: '#FAF9F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 12,
    color: '#1A1918',
  },
  actionRow: {
    width: '100%',
    marginTop: 24,
  },
  saveBtn: {
    width: '100%',
    backgroundColor: '#1A1918',
    paddingVertical: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
