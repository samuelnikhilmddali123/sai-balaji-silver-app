import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { EditAddressModal, AddressData } from './EditAddressModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const GlobalAddressModal: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [visible, setVisible] = useState(false);
  const [initialData, setInitialData] = useState<Partial<AddressData>>({});

  useEffect(() => {
    const checkAddressStatus = async () => {
      if (!user) {
        setVisible(false);
        return;
      }

      let savedStreet = '';
      let savedPhone = '';
      let savedCity = '';
      let savedState = '';
      let savedPincode = '';
      let savedName = '';

      try {
        const savedStr = await AsyncStorage.getItem('user_saved_address');
        if (savedStr) {
          const parsed = JSON.parse(savedStr);
          savedName = parsed.fullName || '';
          savedStreet = parsed.street || '';
          savedPhone = parsed.phone || '';
          savedCity = parsed.city || '';
          savedState = parsed.state || '';
          savedPincode = parsed.pincode || '';
        }
      } catch (e) {}

      const effectiveStreet = (
        user.street_address ||
        user.street ||
        user.address ||
        savedStreet
      ).trim();
      const effectivePhone = (user.phone || savedPhone).trim();
      const effectiveCity = (user.city || savedCity).trim();
      const effectiveState = (user.state || savedState).trim();
      const effectivePincode = (user.pincode || savedPincode).trim();

      // If user is missing any required address/contact detail, open setup modal!
      const isMissing =
        !effectiveStreet ||
        !effectivePhone ||
        !effectiveCity ||
        !effectivePincode;

      if (isMissing) {
        setInitialData({
          fullName: user.full_name || savedName || '',
          phone: effectivePhone,
          street: effectiveStreet,
          city: effectiveCity,
          state: effectiveState,
          pincode: effectivePincode,
        });
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    checkAddressStatus();
  }, [user]);

  const handleSave = async (data: AddressData) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      full_name: data.fullName,
      phone: data.phone,
      street_address: data.street,
      street: data.street,
      address: data.street,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    };

    await updateUser(updatedUser);
    setVisible(false);
  };

  if (!visible || !user) return null;

  return (
    <EditAddressModal
      visible={visible}
      onClose={() => setVisible(false)}
      onSave={handleSave}
      initialData={initialData}
    />
  );
};
