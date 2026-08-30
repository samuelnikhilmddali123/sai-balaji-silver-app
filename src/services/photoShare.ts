import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Linking } from 'react-native';
import api from './api';

let cachedAdminPhone: string | null = null;

export const getAdminPhoneNumber = async (): Promise<string> => {
  try {
    const res = await api.get('/users');
    if (Array.isArray(res.data)) {
      const adminUser = res.data.find(
        (u: any) => u.role === 'ADMIN' || u.email?.toLowerCase().includes('admin')
      );
      if (adminUser && adminUser.phone) {
        let cleaned = adminUser.phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
          cleaned = `91${cleaned}`;
        }
        if (cleaned) {
          cachedAdminPhone = cleaned;
          return cleaned;
        }
      }
    }
  } catch (e) {
    console.error('Error fetching admin phone number from /users:', e);
  }
  return cachedAdminPhone || '919492664870';
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
    const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const localUri = `${cacheDir}product_${Date.now()}_${Math.floor(Math.random() * 1000)}.webp`;

    const downloadRes = await FileSystem.downloadAsync(imageUrl, localUri);
    return downloadRes.uri;
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
