import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

let cachedAdminPhone: string | null = null;
export const DEFAULT_ADMIN_PHONE = '919492664870';

export const setAdminPhoneNumber = async (phone: string) => {
  if (!phone) return;
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  if (cleaned) {
    cachedAdminPhone = cleaned;
    await AsyncStorage.setItem('sbs_admin_phone', cleaned).catch(() => {});
    // Sync update to backend /settings
    api.put('/settings', { whatsapp_number: cleaned }).catch(() => {
      api.post('/settings', { whatsapp_number: cleaned }).catch(() => {});
    });
  }
};

export const getAdminPhoneNumber = async (forceRefresh: boolean = false): Promise<string> => {
  // 1. Fetch live admin WhatsApp number from backend /settings endpoint
  try {
    const res = await api.get('/settings').catch(() => null);
    if (res && res.data) {
      const data = res.data;
      const rawPhone =
        data.whatsapp_number ||
        data.whatsapp ||
        data.phone ||
        data.admin_phone ||
        data.contact_number ||
        data.mobile;
      if (rawPhone) {
        let cleaned = String(rawPhone).replace(/\D/g, '');
        if (cleaned.length === 10) {
          cleaned = `91${cleaned}`;
        }
        if (cleaned) {
          cachedAdminPhone = cleaned;
          await AsyncStorage.setItem('sbs_admin_phone', cleaned).catch(() => {});
          return cleaned;
        }
      }
    }
  } catch (e) {
    console.log('Error fetching admin phone from /settings:', e);
  }

  // 2. If user is authenticated as admin, try /users lookup
  try {
    const res = await api.get('/users').catch(() => null);
    if (res && Array.isArray(res.data)) {
      const adminUser = res.data.find(
        (u: any) => u.role === 'ADMIN' || u.email?.toLowerCase().includes('admin')
      );
      if (adminUser && adminUser.phone) {
        let cleaned = String(adminUser.phone).replace(/\D/g, '');
        if (cleaned.length === 10) {
          cleaned = `91${cleaned}`;
        }
        if (cleaned) {
          cachedAdminPhone = cleaned;
          await AsyncStorage.setItem('sbs_admin_phone', cleaned).catch(() => {});
          return cleaned;
        }
      }
    }
  } catch (e) {}

  // 3. Return memory cache if available and not forcing refresh
  if (!forceRefresh && cachedAdminPhone) {
    return cachedAdminPhone;
  }

  // 4. Return local persistent storage if available
  try {
    const stored = await AsyncStorage.getItem('sbs_admin_phone');
    if (stored) {
      cachedAdminPhone = stored;
      return stored;
    }
  } catch (e) {}

  return DEFAULT_ADMIN_PHONE;
};

export const openWhatsAppDirect = async (whatsappMessage: string, imageUrl?: string) => {
  const adminPhone = await getAdminPhoneNumber();

  if (imageUrl) {
    downloadProductPhoto(imageUrl).catch(() => {});
  }

  const encodedText = encodeURIComponent(whatsappMessage);
  const nativeUrl = `whatsapp://send?phone=${adminPhone}&text=${encodedText}`;
  const webUrl = `https://api.whatsapp.com/send?phone=${adminPhone}&text=${encodedText}`;

  try {
    const canOpen = await Linking.canOpenURL(nativeUrl);
    if (canOpen) {
      await Linking.openURL(nativeUrl);
      return;
    }
  } catch (e) {}

  try {
    await Linking.openURL(webUrl);
  } catch (e) {
    Alert.alert('WhatsApp Error', 'Could not open WhatsApp directly on this device.');
  }
};

export const downloadProductPhoto = async (imageUrl: string, title?: string): Promise<string | null> => {
  try {
    if (!imageUrl) return null;
    const filename = `product_${Date.now()}_${Math.floor(Math.random() * 1000)}.webp`;
    const targetFile = new File(Paths.cache, filename);
    const downloaded = await File.downloadFileAsync(imageUrl, targetFile);
    return downloaded.uri;
  } catch (error) {
    console.error('Error downloading product photo:', error);
    return null;
  }
};

export const downloadAndSharePhoto = async (
  imageUrl: string,
  title: string,
  whatsappMessage?: string
) => {
  try {
    if (!imageUrl) {
      if (whatsappMessage) {
        await openWhatsAppDirect(whatsappMessage);
      }
      return;
    }

    const localUri = await downloadProductPhoto(imageUrl, title);

    if (localUri) {
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(localUri, {
          mimeType: 'image/jpeg',
          dialogTitle: `Share ${title} Photo to WhatsApp`,
          UTI: 'public.webp',
        });
        return;
      }
    }

    if (whatsappMessage) {
      await openWhatsAppDirect(whatsappMessage);
    }
  } catch (error: any) {
    console.error('Photo share error:', error);
    if (whatsappMessage) {
      await openWhatsAppDirect(whatsappMessage);
    }
  }
};
