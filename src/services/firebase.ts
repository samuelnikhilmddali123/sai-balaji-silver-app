import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyANoA9l_iHEBEPhCmGJTSIj2kJUUBIBt8Q",
  authDomain: "sai-balajji.firebaseapp.com",
  projectId: "sai-balajji",
  storageBucket: "sai-balajji.firebasestorage.app",
  appId: "1:692516345900:android:efd682a9176f8c6f9ed989",
};

// Initialize Firebase App safely
let app: any = null;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.log('Firebase initializeApp error:', e);
}

let authInstance: any = null;
if (app) {
  try {
    // @ts-ignore
    const { getReactNativePersistence } = require('firebase/auth');
    if (getReactNativePersistence && AsyncStorage) {
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      authInstance = getAuth(app);
    }
  } catch (initAuthErr) {
    try {
      authInstance = getAuth(app);
    } catch (getAuthErr) {
      console.log('Firebase getAuth fallback error:', getAuthErr);
    }
  }
}

export const auth = authInstance;
export { GoogleAuthProvider, signInWithCredential, signOut };
export const WEB_CLIENT_ID = "692516345900-bbjqs67tsh994gukua8ffu5kdi59v9k3.apps.googleusercontent.com";
export const IOS_CLIENT_ID = "692516345900-gmiiu37b38ugioudamgmmo7jeh6a7k9i.apps.googleusercontent.com";
