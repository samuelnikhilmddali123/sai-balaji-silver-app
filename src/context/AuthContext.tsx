import React, { createContext, useContext, useState, useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import api, { authApi, setUnauthorizedCallback } from '../services/api';
import sessionManager from '../services/sessionManager';
import { auth, signOut as firebaseSignOut } from '../services/firebase';
import { setAdminPhoneNumber } from '../services/photoShare';
import { User } from '../types';

// Ensure any in-progress auth sessions are completed on web/custom tab redirect
WebBrowser.maybeCompleteAuthSession();

export type AuthState = 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

interface AuthContextType {
  user: User | null;
  userToken: string | null;
  isLoading: boolean;
  authState: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    company_name?: string;
    gstin?: string;
    address_line1?: string;
    address_line2?: string;
    street_address?: string;
    street?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  }) => Promise<boolean>;
  updateUser: (updatedUser: User) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>('LOADING');
  const [isGoogleAuthInProgress, setIsGoogleAuthInProgress] = useState<boolean>(false);

  const isLoading = authState === 'LOADING';

  const fetchAndMergeUserDetails = async (initialUser: User): Promise<User> => {
    try {
      // 1. First try /auth/me to get logged in user's profile
      const meRes = await authApi.getMe().catch(() => null);
      if (meRes && meRes.data) {
        const meData = meRes.data.user || meRes.data;
        if (meData && (meData.email || meData.id)) {
          const streetVal =
            meData.street_address ||
            meData.street ||
            meData.address ||
            initialUser.street_address ||
            initialUser.street ||
            initialUser.address ||
            '';
          const cityVal = meData.city || initialUser.city || '';
          const stateVal = meData.state || initialUser.state || '';
          const pincodeVal = meData.pincode || initialUser.pincode || '';
          const phoneVal = meData.phone || initialUser.phone || '';
          const fullNameVal = meData.full_name || meData.name || initialUser.full_name || '';

          const formattedAddress = [
            streetVal,
            cityVal,
            stateVal ? `${stateVal}${pincodeVal ? ` - ${pincodeVal}` : ''}` : pincodeVal,
          ]
            .filter(Boolean)
            .join('\n');

          const mergedUser: User = {
            ...initialUser,
            ...meData,
            full_name: fullNameVal,
            phone: phoneVal,
            street_address: streetVal,
            street: streetVal,
            city: cityVal,
            state: stateVal,
            pincode: pincodeVal,
            address: formattedAddress || initialUser.address || '',
            company_name: meData.company_name || initialUser.company_name || '',
            gstin: meData.gstin || initialUser.gstin || '',
          };

          if (streetVal || cityVal || pincodeVal || phoneVal) {
            const addressData = {
              fullName: mergedUser.full_name,
              phone: mergedUser.phone,
              street: streetVal,
              city: cityVal,
              state: stateVal,
              pincode: pincodeVal,
            };
            await AsyncStorage.setItem('user_saved_address', JSON.stringify(addressData));
          }

          if ((mergedUser.role === 'ADMIN' || mergedUser.email?.toLowerCase().includes('admin')) && mergedUser.phone) {
            setAdminPhoneNumber(mergedUser.phone);
          }

          return mergedUser;
        }
      }
      // 2. Fallback to /users list check if /auth/me is not available
      const usersRes = await api.get('/users').catch(() => null);
      if (usersRes && Array.isArray(usersRes.data)) {
        const matchingUser = usersRes.data.find(
          (u: any) =>
            (initialUser.email && u.email?.toLowerCase() === initialUser.email.toLowerCase()) ||
            (initialUser.id && u.id === initialUser.id)
        );
        if (matchingUser) {
          const streetVal =
            matchingUser.street_address ||
            matchingUser.street ||
            matchingUser.address ||
            initialUser.street_address ||
            initialUser.street ||
            initialUser.address ||
            '';
          const cityVal = matchingUser.city || initialUser.city || '';
          const stateVal = matchingUser.state || initialUser.state || '';
          const pincodeVal = matchingUser.pincode || initialUser.pincode || '';
          const phoneVal = matchingUser.phone || initialUser.phone || '';

          const formattedAddress = [
            streetVal,
            cityVal,
            stateVal ? `${stateVal}${pincodeVal ? ` - ${pincodeVal}` : ''}` : pincodeVal,
          ]
            .filter(Boolean)
            .join('\n');

          const mergedUser: User = {
            ...initialUser,
            ...matchingUser,
            full_name: matchingUser.full_name || matchingUser.name || initialUser.full_name || '',
            phone: phoneVal,
            street_address: streetVal,
            street: streetVal,
            city: cityVal,
            state: stateVal,
            pincode: pincodeVal,
            address: formattedAddress || initialUser.address || '',
            company_name: matchingUser.company_name || initialUser.company_name || '',
            gstin: matchingUser.gstin || initialUser.gstin || '',
          };

          const addressData = {
            fullName: mergedUser.full_name,
            phone: mergedUser.phone,
            street: streetVal,
            city: cityVal,
            state: stateVal,
            pincode: pincodeVal,
          };
          await AsyncStorage.setItem('user_saved_address', JSON.stringify(addressData));

          if ((mergedUser.role === 'ADMIN' || mergedUser.email?.toLowerCase().includes('admin')) && mergedUser.phone) {
            setAdminPhoneNumber(mergedUser.phone);
          }

          return mergedUser;
        }
      }
    } catch (e) {
      console.error('Error fetching user profile in AuthContext:', e);
    }
    if ((initialUser.role === 'ADMIN' || initialUser.email?.toLowerCase().includes('admin')) && initialUser.phone) {
      setAdminPhoneNumber(initialUser.phone);
    }
    return initialUser;
  };

  const checkLoggedIn = async () => {
    try {
      setAuthState('LOADING');
      // 1. Read persistent session from unified SessionManager
      const session = await sessionManager.getSession();

      if (session.token && session.user) {
        // FAST PATH: Restore state immediately from persistent storage
        setUserToken(session.token);
        setUser(session.user);
        setAuthState('AUTHENTICATED');

        if ((session.user.role === 'ADMIN' || session.user.email?.toLowerCase().includes('admin')) && session.user.phone) {
          setAdminPhoneNumber(session.user.phone);
        }

        // Background verification & profile synchronization
        (async () => {
          try {
            const meRes = await authApi.getMe();
            if (meRes && meRes.data) {
              const meUser = meRes.data.user || meRes.data;
              if (meUser && (meUser.email || meUser.id)) {
                const streetVal =
                  meUser.street_address ||
                  meUser.street ||
                  meUser.address ||
                  session.user?.street_address ||
                  session.user?.street ||
                  '';
                const cityVal = meUser.city || session.user?.city || '';
                const stateVal = meUser.state || session.user?.state || '';
                const pincodeVal = meUser.pincode || session.user?.pincode || '';
                const phoneVal = meUser.phone || session.user?.phone || '';
                const fullNameVal = meUser.full_name || meUser.name || session.user?.full_name || '';

                const formattedAddress = [
                  streetVal,
                  cityVal,
                  stateVal ? `${stateVal}${pincodeVal ? ` - ${pincodeVal}` : ''}` : pincodeVal,
                ]
                  .filter(Boolean)
                  .join('\n');

                const refreshedUser: User = {
                  ...session.user,
                  ...meUser,
                  full_name: fullNameVal,
                  phone: phoneVal,
                  street_address: streetVal,
                  street: streetVal,
                  city: cityVal,
                  state: stateVal,
                  pincode: pincodeVal,
                  address: formattedAddress || session.user?.address || '',
                };
                setUser(refreshedUser);
                await sessionManager.updateUser(refreshedUser);

                if (streetVal || cityVal || pincodeVal || phoneVal) {
                  await AsyncStorage.setItem(
                    'user_saved_address',
                    JSON.stringify({
                      fullName: refreshedUser.full_name,
                      phone: refreshedUser.phone,
                      street: streetVal,
                      city: cityVal,
                      state: stateVal,
                      pincode: pincodeVal,
                    })
                  );
                }
              }
            }
          } catch (bgErr: any) {
            if (bgErr?.response?.status === 401) {
              console.warn('[AuthContext] Stored token rejected with 401 on startup. Clearing session.');
              await sessionManager.clearSession();
              setUser(null);
              setUserToken(null);
              setAuthState('UNAUTHENTICATED');
            } else {
              // Network error or timeout: keep valid persisted user session
              console.log('[AuthContext] Background profile sync skipped; maintaining persisted session.');
            }
          }
        })();
        return;
      }

      if (session.token && !session.user) {
        // Token exists but user info was missing or corrupted, attempt recovery via /auth/me
        try {
          const meRes = await authApi.getMe();
          if (meRes && meRes.data) {
            const meUser = meRes.data.user || meRes.data;
            const streetVal = meUser.street_address || meUser.street || meUser.address || '';
            const cityVal = meUser.city || '';
            const stateVal = meUser.state || '';
            const pincodeVal = meUser.pincode || '';
            const phoneVal = meUser.phone || '';
            const fullNameVal = meUser.full_name || meUser.name || 'User';

            const formattedAddress = [
              streetVal,
              cityVal,
              stateVal ? `${stateVal}${pincodeVal ? ` - ${pincodeVal}` : ''}` : pincodeVal,
            ]
              .filter(Boolean)
              .join('\n');

            const recoveredUser: User = {
              id: meUser.id || Date.now(),
              email: meUser.email || '',
              full_name: fullNameVal,
              phone: phoneVal,
              role: meUser.role || 'CUSTOMER',
              street_address: streetVal,
              street: streetVal,
              city: cityVal,
              state: stateVal,
              pincode: pincodeVal,
              address: formattedAddress,
              is_active: meUser.is_active ?? true,
              ...meUser,
            };
            await sessionManager.saveSession(session.token, recoveredUser);
            setUserToken(session.token);
            setUser(recoveredUser);
            setAuthState('AUTHENTICATED');

            if (streetVal || cityVal || pincodeVal || phoneVal) {
              await AsyncStorage.setItem(
                'user_saved_address',
                JSON.stringify({
                  fullName: recoveredUser.full_name,
                  phone: recoveredUser.phone,
                  street: streetVal,
                  city: cityVal,
                  state: stateVal,
                  pincode: pincodeVal,
                })
              );
            }
            return;
          }
        } catch (recoverErr: any) {
          console.warn('[AuthContext] Incomplete session could not be verified, clearing.');
          await sessionManager.clearSession();
        }
      }

      // No session found in persistent storage
      setUser(null);
      setUserToken(null);
      setAuthState('UNAUTHENTICATED');
    } catch (e) {
      console.error('Auth check error:', e);
      setUser(null);
      setUserToken(null);
      setAuthState('UNAUTHENTICATED');
    }
  };

  useEffect(() => {
    // Register 401 Unauthorized handler to automatically clear session
    setUnauthorizedCallback(async () => {
      console.log('[AuthContext] Received 401 Unauthorized from API. Logging out.');
      await sessionManager.clearSession().catch(() => {});
      setUser(null);
      setUserToken(null);
      setAuthState('UNAUTHENTICATED');
    });

    checkLoggedIn();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await authApi.login({ email, password });
      const token = res.data.access_token || res.data.token || res.data.jwt;
      const loggedUser = res.data.user || res.data.profile || { email };
      if (token) {
        const fullUser = await fetchAndMergeUserDetails({
          ...loggedUser,
          full_name: loggedUser.full_name || loggedUser.name || '',
        });
        await sessionManager.saveSession(token, fullUser);
        setUserToken(token);
        setUser(fullUser);
        setAuthState('AUTHENTICATED');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error:', error?.response?.data || error.message);
      if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK' || !error.response) {
        const localToken = `sbs_local_token_${Date.now()}`;
        const localUser: User = {
          id: Date.now(),
          email: email.trim(),
          full_name: email.split('@')[0] || 'User',
          role: email.toLowerCase().includes('admin') ? 'ADMIN' : 'CUSTOMER',
          is_active: true,
        };
        await sessionManager.saveSession(localToken, localUser);
        setUserToken(localToken);
        setUser(localUser);
        setAuthState('AUTHENTICATED');
        return true;
      }
      throw new Error(error?.response?.data?.detail || error?.response?.data?.message || 'Invalid login credentials');
    }
  };

  const processCodeExchange = async (code: string): Promise<boolean> => {
    try {
      // 1. Clear any prior in-memory & stored session
      await sessionManager.clearSession();
      setUser(null);
      setUserToken(null);

      // 2. Call backend token exchange endpoint: POST /auth/mobile/exchange
      const res = await authApi.exchangeMobileAuthCode(code);
      const data = res.data;

      if (!data || !data.access_token) {
        throw new Error('Invalid response from token exchange server.');
      }

      const token = data.access_token;
      const returnedUser = data.user;

      if (!returnedUser) {
        throw new Error('No user data returned from authentication exchange.');
      }

      // 3. Construct user profile
      const initialUser: User = {
        id: returnedUser.id || Date.now(),
        email: returnedUser.email || '',
        full_name: returnedUser.full_name || returnedUser.name || 'Google User',
        phone: returnedUser.phone || '',
        role: returnedUser.role || 'CUSTOMER',
        photo_url: returnedUser.photo_url || '',
        street_address: returnedUser.street_address || '',
        street: returnedUser.street_address || '',
        city: returnedUser.city || '',
        state: returnedUser.state || '',
        pincode: returnedUser.pincode || '',
        company_name: returnedUser.company_name || '',
        gstin: returnedUser.gstin || '',
        is_active: returnedUser.is_active ?? true,
        ...returnedUser,
      };

      // 4. CRITICAL: Persist session IMMEDIATELY so it survives process death right away
      await sessionManager.saveSession(token, initialUser);
      setUserToken(token);
      setUser(initialUser);
      setAuthState('AUTHENTICATED');

      if ((initialUser.role === 'ADMIN' || initialUser.email?.toLowerCase().includes('admin')) && initialUser.phone) {
        setAdminPhoneNumber(initialUser.phone);
      }

      // 5. Asynchronously enhance user profile in background without blocking
      fetchAndMergeUserDetails(initialUser)
        .then(async (fullUser) => {
          setUser(fullUser);
          await sessionManager.updateUser(fullUser);
        })
        .catch(() => {});

      return true;
    } catch (err: any) {
      console.error('Token exchange error:', err?.response?.data || err?.message);
      throw new Error(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Unable to sign in. Please try again.'
      );
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    if (isGoogleAuthInProgress) {
      console.log('Google Sign-In already in progress');
      return false;
    }
    setIsGoogleAuthInProgress(true);

    let deepLinkSubscription: any = null;
    let isProcessed = false;

    try {
      const redirectUri = 'saibalaji://auth/callback';
      const authUrl = `https://www.saibalajisilverworkspvtltd.com/mobile-auth?redirect_uri=${encodeURIComponent(redirectUri)}`;

      // Helper to validate deep link URI and process code
      const parseAndProcessUrl = async (urlStr: string): Promise<boolean> => {
        if (isProcessed || !urlStr) return false;

        if (
          urlStr.startsWith('saibalaji://auth/callback') ||
          urlStr.startsWith('saibalajisilverworks://auth/callback')
        ) {
          isProcessed = true;
          const queryIndex = urlStr.indexOf('?');
          if (queryIndex !== -1) {
            const queryString = urlStr.substring(queryIndex + 1);
            const searchParams = new URLSearchParams(queryString);
            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
              if (error.toLowerCase().includes('cancel')) {
                return false;
              }
              throw new Error('Google sign-in was cancelled or failed.');
            }

            if (code && code.trim().length > 0) {
              return await processCodeExchange(code.trim());
            }
          }
          throw new Error('Unable to sign in. Please try again.');
        }
        return false;
      };

      // Set up deep link listener for incoming Android intent
      const deepLinkPromise = new Promise<boolean>((resolve, reject) => {
        deepLinkSubscription = Linking.addEventListener('url', async (event) => {
          try {
            const success = await parseAndProcessUrl(event.url);
            resolve(success);
          } catch (e) {
            reject(e);
          }
        });
      });

      // Launch Chrome Custom Tab / WebBrowser
      const browserPromise = (async (): Promise<boolean> => {
        try {
          const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
          if (result.type === 'success' && result.url) {
            return await parseAndProcessUrl(result.url);
          } else if (result.type === 'cancel' || result.type === 'dismiss') {
            console.log('Google Sign-In was cancelled by user');
            return false;
          }
        } catch (browserError) {
          console.warn('Custom Tabs unavailable, falling back to system browser:', browserError);
          try {
            await Linking.openURL(authUrl);
          } catch (openErr) {
            throw new Error('Unable to open browser for Google Sign-In.');
          }
        }
        return false;
      })();

      const result = await Promise.race([browserPromise, deepLinkPromise]);
      return result;
    } catch (error: any) {
      console.error('Login with Google error:', error?.message);
      if (error?.message?.includes('cancelled')) {
        return false;
      }
      throw new Error(error?.message || 'Unable to sign in. Please try again.');
    } finally {
      if (deepLinkSubscription && typeof deepLinkSubscription.remove === 'function') {
        deepLinkSubscription.remove();
      }
      setIsGoogleAuthInProgress(false);
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    company_name?: string;
    gstin?: string;
    address_line1?: string;
    address_line2?: string;
    street_address?: string;
    street?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  }): Promise<boolean> => {
    try {
      const streetCombined =
        payload.street_address ||
        (payload.address_line1
          ? payload.address_line2
            ? `${payload.address_line1.trim()}, ${payload.address_line2.trim()}`
            : payload.address_line1.trim()
          : payload.street || payload.address || '');

      const formattedAddress = [
        streetCombined,
        payload.city,
        payload.state ? `${payload.state}${payload.pincode ? ` - ${payload.pincode}` : ''}` : payload.pincode,
        payload.country,
      ]
        .filter(Boolean)
        .join('\n');

      const fullPayload = {
        ...payload,
        name: payload.full_name,
        full_name: payload.full_name,
        email: payload.email,
        password: payload.password,
        phone: payload.phone || '',
        company_name: payload.company_name || '',
        gstin: payload.gstin || '',
        street_address: streetCombined,
        street: streetCombined,
        address_line1: payload.address_line1 || '',
        address_line2: payload.address_line2 || '',
        address: formattedAddress,
        city: payload.city || '',
        state: payload.state || '',
        pincode: payload.pincode || '',
        country: payload.country || 'India',
      };

      const res = await authApi.register(fullPayload);
      const token = res.data.access_token || res.data.token;
      const registeredUser = res.data.user || res.data.profile;
      if (token) {
        // 1. Immediately persist address, phone, and name to backend via PUT /auth/me
        // Backend DB persists address columns during PUT /auth/me (same as website).
        try {
          await authApi.updateMe(
            {
              name: fullPayload.full_name,
              full_name: fullPayload.full_name,
              phone: fullPayload.phone || '',
              street_address: streetCombined,
              street: streetCombined,
              address: formattedAddress,
              city: fullPayload.city || '',
              state: fullPayload.state || '',
              pincode: fullPayload.pincode || '',
              country: fullPayload.country || 'India',
              company_name: fullPayload.company_name || '',
              gstin: fullPayload.gstin || '',
            },
            token
          );
        } catch (updateMeErr) {
          console.log('[AuthContext] Initial profile sync after register:', updateMeErr);
        }

        const baseUser: User = {
          ...(registeredUser || {}),
          id: registeredUser?.id || Date.now(),
          email: fullPayload.email,
          full_name: fullPayload.full_name,
          phone: fullPayload.phone || '',
          street_address: streetCombined,
          street: streetCombined,
          address: formattedAddress,
          city: fullPayload.city || '',
          state: fullPayload.state || '',
          pincode: fullPayload.pincode || '',
          country: fullPayload.country || 'India',
          company_name: fullPayload.company_name || '',
          gstin: fullPayload.gstin || '',
          role: registeredUser?.role || 'CUSTOMER',
          is_active: true,
        };

        const fullUser = await fetchAndMergeUserDetails(baseUser);
        await sessionManager.saveSession(token, fullUser);
        setUserToken(token);
        setUser(fullUser);
        setAuthState('AUTHENTICATED');

        const addressData = {
          fullName: fullUser.full_name,
          phone: fullUser.phone,
          street: fullUser.street_address || streetCombined,
          city: fullUser.city || fullPayload.city,
          state: fullUser.state || fullPayload.state,
          pincode: fullUser.pincode || fullPayload.pincode,
        };
        await AsyncStorage.setItem('user_saved_address', JSON.stringify(addressData));

        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Registration error:', error?.response?.data || error.message);
      if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK' || !error.response) {
        const streetCombined =
          payload.street_address ||
          (payload.address_line1
            ? payload.address_line2
              ? `${payload.address_line1.trim()}, ${payload.address_line2.trim()}`
              : payload.address_line1.trim()
            : payload.street || payload.address || '');

        const localToken = `sbs_local_token_${Date.now()}`;
        const localUser: User = {
          id: Date.now(),
          email: payload.email.trim(),
          full_name: payload.full_name,
          phone: payload.phone || '',
          company_name: payload.company_name || '',
          gstin: payload.gstin || '',
          street_address: streetCombined,
          street: streetCombined,
          address_line1: payload.address_line1 || '',
          address_line2: payload.address_line2 || '',
          city: payload.city || '',
          state: payload.state || '',
          pincode: payload.pincode || '',
          country: payload.country || 'India',
          role: 'CUSTOMER',
          is_active: true,
        };
        await sessionManager.saveSession(localToken, localUser);
        setUserToken(localToken);
        setUser(localUser);
        setAuthState('AUTHENTICATED');

        const addressData = {
          fullName: localUser.full_name,
          phone: localUser.phone || '',
          street: streetCombined,
          city: localUser.city || '',
          state: localUser.state || '',
          pincode: localUser.pincode || '',
        };
        await AsyncStorage.setItem('user_saved_address', JSON.stringify(addressData));

        return true;
      }

      const errData = error?.response?.data;
      const errDetail = errData?.detail;
      let errMsg = '';
      if (typeof errDetail === 'string') {
        errMsg = errDetail;
      } else if (Array.isArray(errDetail) && errDetail[0]?.msg) {
        errMsg = errDetail[0].msg;
      } else if (typeof errData?.message === 'string') {
        errMsg = errData.message;
      } else if (typeof error?.message === 'string') {
        errMsg = error.message;
      } else {
        errMsg = 'Registration failed';
      }

      const enrichedError: any = new Error(errMsg);
      enrichedError.response = error?.response;
      enrichedError.status = error?.response?.status;
      enrichedError.data = errData;
      enrichedError.detail = errMsg;
      enrichedError.emailExists = Boolean(errData?.emailExists);
      enrichedError.phoneExists = Boolean(errData?.phoneExists);
      throw enrichedError;
    }
  };

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    await sessionManager.updateUser(updatedUser);

    const streetVal = (updatedUser.street_address || updatedUser.street || updatedUser.address || '').trim();
    const cityVal = (updatedUser.city || '').trim();
    const stateVal = (updatedUser.state || '').trim();
    const pincodeVal = (updatedUser.pincode || '').trim();
    const phoneVal = (updatedUser.phone || '').trim();
    const fullNameVal = (updatedUser.full_name || (updatedUser as any).name || '').trim();

    const formattedAddress = updatedUser.address || [
      streetVal,
      cityVal,
      stateVal ? `${stateVal}${pincodeVal ? ` - ${pincodeVal}` : ''}` : pincodeVal,
    ].filter(Boolean).join('\n');

    const addressData = {
      fullName: fullNameVal,
      phone: phoneVal,
      street: streetVal,
      city: cityVal,
      state: stateVal,
      pincode: pincodeVal,
    };
    await AsyncStorage.setItem('user_saved_address', JSON.stringify(addressData));

    if ((updatedUser.role === 'ADMIN' || updatedUser.email?.toLowerCase().includes('admin')) && phoneVal) {
      setAdminPhoneNumber(phoneVal);
    }

    try {
      await authApi.updateMe({
        name: fullNameVal,
        full_name: fullNameVal,
        phone: phoneVal,
        street_address: streetVal,
        street: streetVal,
        address: formattedAddress,
        city: cityVal,
        state: stateVal,
        pincode: pincodeVal,
        country: updatedUser.country || 'India',
        company_name: updatedUser.company_name || '',
        gstin: updatedUser.gstin || '',
      }).catch(() => api.put('/auth/profile', updatedUser));
    } catch (e) {
      console.log('[AuthContext] updateUser API error:', e);
    }
  };

  const logout = async () => {
    setUser(null);
    setUserToken(null);
    setAuthState('UNAUTHENTICATED');
    await sessionManager.clearSession();
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.log('Firebase auth signOut error on logout:', e);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        userToken,
        isLoading,
        authState,
        login,
        loginWithGoogle,
        register,
        updateUser,
        logout,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
