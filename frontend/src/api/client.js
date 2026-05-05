/**
 * api/client.js
 *
 * Central Axios instance with:
 *  - Base URL configuration
 *  - Auth token injection via request interceptor
 *  - Automatic 401 logout via response interceptor
 *  - Multipart form-data helper for file uploads
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — Change this to your Laravel server's IP/domain
// Use your machine's LAN IP when testing on a physical device (not localhost)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_PUBLIC_API_URL = 'https://vee-production-76c2.up.railway.app/api';

export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_PUBLIC_API_URL).replace(/\/$/, '');

const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

const TOKEN_KEY = 'auth_token';

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN HELPERS (SecureStore keeps the token encrypted on device)
// ─────────────────────────────────────────────────────────────────────────────

export const TokenStorage = {
  /** Save a token to encrypted device storage */
  async save(token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  /** Retrieve the stored token (or null if not set) */
  async get() {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  /** Remove the token (on logout) */
  async remove() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AXIOS INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 0, // Let long media uploads finish instead of aborting client-side.
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ───────────────────────────────────────────────────────
// Automatically attach the stored Bearer token to every request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await TokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ──────────────────────────────────────────────────────
// Handle 401 Unauthorized globally (token expired/revoked)
// The AuthContext will subscribe to this event to log the user out
let _onUnauthorized = null;

export const setUnauthorizedCallback = (callback) => {
  _onUnauthorized = callback;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response && error.config) {
      const method = (error.config.method || 'GET').toUpperCase();
      const url = `${error.config.baseURL || ''}${error.config.url || ''}`;
      error.message = `Network Error: ${method} ${url}`;
    }

    if (error.response?.status === 401 && _onUnauthorized) {
      _onUnauthorized();
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD HELPER
// Creates a multipart/form-data request body for image uploads
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a FormData object suitable for image upload.
 *
 * @param {string} imageUri     - Local file URI from image picker
 * @param {object} extraFields  - Additional text fields to include
 * @returns {FormData}
 */
export const normalizeMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  if (/^(media|storage)\//i.test(url)) return `${API_ORIGIN}/${url}`;

  try {
    const parsed = new URL(url);
    if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname)) {
      return `${API_ORIGIN}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return url;
  }

  return url;
};

export const buildFormData = (mediaInput, extraFields = {}, options = {}) => {
  const formData = new FormData();
  const mediaUri = typeof mediaInput === 'string' ? mediaInput : mediaInput?.uri;
  const fieldName = options.fieldName || 'media';
  const webFile = typeof mediaInput === 'object' ? mediaInput?.file : null;
  const explicitType = options.mediaType || (typeof mediaInput === 'object' ? mediaInput?.type : null);
  const explicitMimeType = typeof mediaInput === 'object' ? mediaInput?.mimeType : null;
  const explicitFileName = typeof mediaInput === 'object' ? mediaInput?.fileName : null;
  const extensionFromMime = explicitMimeType?.includes('quicktime') ? 'mov'
    : explicitMimeType?.includes('mp4') ? 'mp4'
      : explicitMimeType?.includes('webm') ? 'webm'
        : explicitMimeType?.includes('jpeg') ? 'jpg'
          : explicitMimeType?.split('/')?.[1];

  // Extract file extension from URI
  const uriPath = (mediaUri || '').split('?')[0];
  const extensionMatch = uriPath.match(/\.([a-zA-Z0-9]+)$/);
  const fallbackExtension = extensionFromMime || (explicitType === 'video' ? 'mp4' : 'jpg');
  const normalizedType = (extensionMatch?.[1] || fallbackExtension).toLowerCase();
  const isVideo = explicitType === 'video' || ['mp4', 'mov', 'webm', 'm4v', '3gp', '3gpp'].includes(normalizedType);

  const isWebFile = (typeof File !== 'undefined' && webFile instanceof File)
    || (typeof Blob !== 'undefined' && webFile instanceof Blob);

  if (isWebFile) {
    formData.append(fieldName, webFile, explicitFileName || webFile.name || `${explicitType || 'media'}.${fallbackExtension}`);
  } else if (mediaUri) {
    const isAudio = explicitType === 'audio' || ['mp3', 'm4a', 'wav', 'aac', 'ogg'].includes(normalizedType);
    formData.append(fieldName, {
      uri: mediaUri,
      name: explicitFileName && /\.[a-zA-Z0-9]+$/.test(explicitFileName)
        ? explicitFileName
        : `${isAudio ? 'audio' : isVideo ? 'video' : 'photo'}.${normalizedType}`,
      type: explicitMimeType || (isAudio
        ? `audio/${normalizedType === 'm4a' ? 'mp4' : normalizedType}`
        : isVideo
          ? `video/${normalizedType === 'mov' ? 'quicktime' : normalizedType}`
          : `image/${normalizedType === 'jpg' ? 'jpeg' : normalizedType}`),
    });
  }

  // Append extra fields (caption, bio, etc.)
  Object.entries(extraFields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, Array.isArray(value) || typeof value === 'object' ? JSON.stringify(value) : value);
    }
  });

  return formData;
};

export const uploadMultipart = async (path, mediaInput, extraFields = {}, options = {}) => {
  const mediaUri = typeof mediaInput === 'string' ? mediaInput : mediaInput?.uri;
  const fieldName = options.fieldName || 'media';
  const formData = buildFormData(mediaInput, extraFields, options);

  if (!mediaUri || Platform.OS === 'web') {
    return apiClient.post(path, formData);
  }

  const FileSystem = await import('expo-file-system/legacy');

  const token = await TokenStorage.get();
  const parameters = {};
  Object.entries(extraFields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      parameters[key] = Array.isArray(value) || typeof value === 'object' ? JSON.stringify(value) : String(value);
    }
  });

  let uploadResult;

  try {
    uploadResult = await FileSystem.uploadAsync(`${BASE_URL}${path}`, mediaUri, {
      fieldName,
      httpMethod: 'POST',
      mimeType: typeof mediaInput === 'object' ? mediaInput?.mimeType : undefined,
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      parameters,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (nativeUploadError) {
    return apiClient.post(path, formData);
  }

  let data = uploadResult.body;
  try {
    data = uploadResult.body ? JSON.parse(uploadResult.body) : null;
  } catch {
    // Keep the raw body when a server returns non-JSON.
  }

  const response = {
    data,
    headers: uploadResult.headers || {},
    status: uploadResult.status,
    statusText: String(uploadResult.status),
  };

  if (uploadResult.status >= 400) {
    const error = new Error(data?.message || `Upload failed with status ${uploadResult.status}`);
    error.response = response;
    throw error;
  }

  return response;
};

export default apiClient;
