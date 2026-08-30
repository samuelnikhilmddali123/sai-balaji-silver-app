# Sai Balaji Silverworks - Mobile App & Backend Architecture

This documentation provides an in-depth analysis of how the **Sai Balaji Silverworks Expo React Native Mobile Application** connects to and communicates with its backend services.

---

## 📑 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Environment & Network Configuration](#2-environment--network-configuration)
3. [Dynamic IP Resolution Mechanism](#3-dynamic-ip-resolution-mechanism)
4. [Axios HTTP Client & Security Interceptors](#4-axios-http-client--security-interceptors)
5. [API Endpoint Modules](#5-api-endpoint-modules)
6. [Real-time Live Silver Rate Streaming](#6-real-time-live-silver-rate-streaming)
7. [Authentication & Firebase Integration](#7-authentication--firebase-integration)
8. [App State & Backend Data Synchronization](#8-app-state--backend-data-synchronization)
9. [WhatsApp & Admin Deep Linking](#9-whatsapp--admin-deep-linking)
10. [Local Development & Live Tunnel Setup](#10-local-development--live-tunnel-setup)

---

## 1. Architecture Overview

The application follows a decoupled client-server architecture:
* **Mobile Client**: Expo React Native (TypeScript) with `AsyncStorage`, Context API for local state management, and `axios` for HTTP/REST communications.
* **Backend Server**: RESTful API running on FastAPI / Python / Node (accessible on port `8000` under `/api/v1`).
* **Authentication**: JWT (JSON Web Tokens) with optional Firebase Google Sign-In credential exchange.
* **Media / Assets**: Served directly by the backend REST server (`/uploads` or static routes) and converted dynamically into full remote URLs by the app.

```
       +-------------------------------------------------------+
       |               Expo React Native Mobile App            |
       +-------------------------------------------------------+
        |                  |                 |                |
   Axios Client    EventSource (SSE)   Firebase SDK   AsyncStorage
 (Bearer JWT Auth) (Live Silver Rate) (Google Auth)  (Token/User Data)
        |                  |                 |                |
        v                  v                 v                v
+------------------+ +--------------+ +--------------+ +---------------+
| Backend API      | | Silver Rate  | | Firebase Auth| | Device Local  |
| /api/v1/*        | | /stream      | | Service      | | Storage       |
+------------------+ +--------------+ +--------------+ +---------------+
```

---

## 2. Environment & Network Configuration

The backend API base URL is specified in the `.env` file at the root of the project:

```env
# Backend API Base URL configuration for Expo App
EXPO_PUBLIC_API_URL=http://10.131.130.185:8000/api/v1

# Ngrok Authtoken for Live Tunneling
NGROK_AUTHTOKEN=3EZeGZR926Vvt7YsiV7fo95IdPG_7EjLv3YgfrxMcREY7yjbh
```

---

## 3. Dynamic IP Resolution Mechanism

Location: [`src/services/api.ts`](file:///c:/Users/Nikhil/Downloads/sai-balaji-silver-app/src/services/api.ts)

When running the mobile app on a physical device via **Expo Go** or a custom dev client, accessing `localhost` or `127.0.0.1` refers to the mobile phone itself, causing network request failures.

To resolve this seamlessly, `getBaseURL()` inspects the Expo host debugger IP at runtime and adapts the backend URL:

```typescript
const getBaseURL = () => {
  let url = process.env.EXPO_PUBLIC_API_URL || 'http://10.131.130.185:8000/api/v1';
  url = url.replace(/\/+$/, '');

  // Extract host IP from Expo debugger host (Expo Go / Dev Client)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.manifest as any)?.debuggerHost ||
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost;
  const hostIp = hostUri ? hostUri.split(':')[0] : null;

  // Swap localhost / 127.0.0.1 with the actual LAN IP of the host machine
  if (hostIp && !hostIp.includes('localhost') && !hostIp.includes('127.0.0.1')) {
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      url = url.replace(/localhost|127\.0\.0\.1/, hostIp);
    }
  } else if (url.includes('localhost') || url.includes('127.0.0.1')) {
    url = url.replace(/localhost|127\.0\.0\.1/, '10.131.130.185');
  }
  return url;
};

export const API_BASE_URL = getBaseURL();
```

### Media URL Resolution
Images stored as relative paths in the database (e.g., `/static/products/silver_coin.png`) are resolved using helper functions:
* `getFullImageUrl(url)`: Concatenates host domain with path.
* `getProductImageUrl(item)`: Extracts featured image from product objects and returns a fully formatted image URL.

---

## 4. Axios HTTP Client & Security Interceptors

Location: [`src/services/api.ts`](file:///c:/Users/Nikhil/Downloads/sai-balaji-silver-app/src/services/api.ts)

An instance of `axios` is configured with timeout and headers:

```typescript
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});
```

### 🔑 Request Interceptor (JWT Token Injection)
Every outgoing request automatically reads the JWT token from `AsyncStorage` and sets the `Authorization` header:

```typescript
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching token from storage:', error);
  }
  return config;
});
```

### ⚠️ Response Interceptor
Monitors network response codes (such as HTTP 530 proxy/tunnel errors) and warns developers if the backend server is unreachable.

---

## 5. API Endpoint Modules

Location: [`src/services/api.ts`](file:///c:/Users/Nikhil/Downloads/sai-balaji-silver-app/src/services/api.ts)

The API calls are organized into domain-specific modules:

### 👤 Authentication API (`authApi`)
| Function | HTTP Method & Path | Description |
| :--- | :--- | :--- |
| `register(payload)` | `POST /auth/register` | Registers user (name, email, password, phone, company, GSTIN). |
| `login(payload)` | `POST /auth/login` | Authenticates email & password, returns JWT token. |
| `googleAuth(payload)` | `POST /auth/google` | Exchanges Firebase Google ID Token for backend access token. |
| `getMe()` | `GET /auth/me` | Fetches currently authenticated user profile. |
| `updateMe(data)` | `PUT /auth/me` | Updates current user details (name, phone, address, GSTIN). |

### 💎 Catalog & Products API (`catalogApi`)
| Function | HTTP Method & Path | Description |
| :--- | :--- | :--- |
| `getCategories()` | `GET /categories` | Retrieves product categories. |
| `getProducts(params)` | `GET /products` | Fetches filtered & paginated product items. |
| `getProductDetail(id)` | `GET /products/:id` | Fetches detailed product info by ID or slug. |

### ❤️ Wishlist API (`wishlistApi`)
| Function | HTTP Method & Path | Description |
| :--- | :--- | :--- |
| `getWishlist()` | `GET /wishlist` | Gets user's server-saved wishlist items. |
| `toggleWishlist(productId)`| `POST /wishlist/toggle` | Toggles item in user wishlist. |
| `syncWishlist(ids)` | `POST /wishlist/sync` | Syncs guest local wishlist with backend upon login. |

### 📦 Orders & Checkout API (`orderApi`)
| Function | HTTP Method & Path | Description |
| :--- | :--- | :--- |
| `createOrder(orderData)` | `POST /orders` | Places customer order with shipping address & cart items. |
| `getMyOrders()` | `GET /orders/my-orders` | Fetches order history for logged-in user. |

### 📑 Wholesale & B2B Quotation API (`wholesaleApi`)
| Function | HTTP Method & Path | Description |
| :--- | :--- | :--- |
| `submitRequest(data)` | `POST /wholesale/requests` | Submits bulk B2B silver quotation request. |
| `getMyRequests()` | `GET /wholesale/my-requests` | Retrieves customer's quotation requests. |
| `getPdfUrl(id)` | `GET /quotations/:id/pdf` | Returns direct link to download quotation PDF. |

---

## 6. Real-time Live Silver Rate Streaming

Location: [`src/services/api.ts`](file:///c:/Users/Nikhil/Downloads/sai-balaji-silver-app/src/services/api.ts)

The app updates live silver prices in real-time using **Server-Sent Events (SSE)** with an automatic polling fallback:

```typescript
export const silverRateApi = {
  getLiveRate: () => api.get('/silver-rate'),
  subscribeStream: (onData: (data: any) => void, onError?: (err: any) => void) => {
    // 1. Attempts real-time streaming via EventSource (SSE) at GET /silver-rate/stream
    // 2. Automatically falls back to 15-second polling (GET /silver-rate) if SSE is unsupported
  }
};
```

---

## 7. Authentication & Firebase Integration

Location:
* [`src/services/firebase.ts`](file:///c:/Users/Nikhil/Downloads/sai-balaji-silver-app/src/services/firebase.ts)
* [`src/context/AuthContext.tsx`](file:///c:/Users/Nikhil/Downloads/sai-balaji-silver-app/src/context/AuthContext.tsx)

### Firebase + Google Sign-In Flow:
1. Mobile user clicks "Sign in with Google" in the app.
2. `@react-native-google-signin/google-signin` interacts with Google Play Services to obtain Google ID Token.
3. Firebase SDK authenticates using `GoogleAuthProvider.credential(idToken)`.
4. Firebase returns a `firebaseToken`, which is passed to the backend endpoint `POST /auth/google`.
5. Backend verifies the token and issues the application JWT token.

```
[Mobile App] ---> (Google Sign-In) ---> [Google Play Services]
     |                                          |
     |<------------- (Google ID Token) ---------+
     |
     v
[Firebase SDK] ---> (Credential Exchange) ---> (Firebase Token)
     |
     v
[Backend API] ---> (POST /auth/google) ---> [App JWT Token] ---> Saved in AsyncStorage
```

---

## 8. App State & Backend Data Synchronization

The app uses React Context providers to sync data between the local device and backend:

* **`AuthContext`** ([`src/context/AuthContext.tsx`](file:///c:/Users/Nikhil/Downloads/sai-balaji-silver-app/src/context/AuthContext.tsx)):
  * On launch (`checkLoggedIn`), reads stored JWT from `AsyncStorage`.
  * Calls `GET /auth/me` to refresh user details from the backend.
  * Merges profile address data with local storage (`user_saved_address`).
* **`CartContext`** ([`src/context/CartContext.tsx`](file:///c:/Users/Nikhil/Downloads/sai-balaji-silver-app/src/context/CartContext.tsx)):
  * Keeps items in local storage for guest browsing.
  * Transforms cart items into order payloads sent to `orderApi.createOrder`.
* **`WishlistContext`** ([`src/context/WishlistContext.tsx`](file:///c:/Users/Nikhil/Downloads/sai-balaji-silver-app/src/context/WishlistContext.tsx)):
  * Automatically syncs local favorites with `wishlistApi` when user logs in.

---

## 9. WhatsApp & Admin Deep Linking

Location: [`src/services/photoShare.ts`](file:///c:/Users/Nikhil/Downloads/sai-balaji-silver-app/src/services/photoShare.ts)

* **Dynamic Admin Phone Lookup**: Queries `GET /users` on the backend to dynamically find active `ADMIN` accounts and retrieve their phone numbers.
* **Direct Sharing**: Generates custom `whatsapp://send?phone=...` deep-links pre-populated with item titles, live rates, and custom quotation notes.

---

## 10. Local Development & Live Tunnel Setup

### Running Backend Locally
Ensure the backend server is running on port `8000`:
```bash
http://10.131.130.185:8000
```

### Starting App with Live Tunnel
To open the mobile app on any phone anywhere via Expo Go, execute:
```cmd
start_live_tunnel.bat
```
Or run directly via shell:
```bash
npx expo start --tunnel
```

---
*Created for Sai Balaji Silverworks Mobile App Documentation.*
