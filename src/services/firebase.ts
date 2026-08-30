import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyANoA9l_iHEBEPhCmGJTSIj2kJUUBIBt8Q",
  authDomain: "sai-balajji.firebaseapp.com",
  projectId: "sai-balajji",
  storageBucket: "sai-balajji.firebasestorage.app",
  appId: "1:692516345900:android:0303872ae00016359ed989",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let authInstance;
try {
  // @ts-ignore
  const { getReactNativePersistence } = require('@firebase/auth');
  if (getReactNativePersistence) {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    authInstance = getAuth(app);
  }
} catch (e) {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export { GoogleAuthProvider, signInWithCredential, signOut };
export const WEB_CLIENT_ID = "692516345900-bbjqs67tsh994gukua8ffu5kdi59v9k3.apps.googleusercontent.com";
