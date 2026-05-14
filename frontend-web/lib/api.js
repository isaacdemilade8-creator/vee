'use client';

const DEFAULT_API_URL = 'https://vee-production-76c2.up.railway.app/api';
export const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, '');
const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');
const TOKEN_KEY = 'vee_web_token';

export function normalizeMediaUrl(url) {
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
}

export const tokenStore = {
  get() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  remove() {
    window.localStorage.removeItem(TOKEN_KEY);
  }
};

async function request(path, options = {}) {
  const token = tokenStore.get();
  const isForm = options.body instanceof FormData;
  const headers = {
    Accept: 'application/json',
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body || {})
  }),
  delete: (path) => request(path, { method: 'DELETE' })
};

export const AuthAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
};

export const PostAPI = {
  getFeed: (page = 1) => api.get(`/posts/feed?page=${page}`),
  getOne: (postId) => api.get(`/posts/${postId}`),
  create: (payload) => {
    if (payload.media) {
      const form = new FormData();
      form.append('media', payload.media);
      if (payload.caption) form.append('caption', payload.caption);
      form.append('post_type', payload.post_type || 'media');
      form.append('media_type', payload.media_type || payload.media?.type?.split('/')?.[0] || 'image');
      return api.post('/posts', form);
    }
    return api.post('/posts', payload);
  },
  delete: (postId) => api.delete(`/posts/${postId}`),
  repost: (postId) => api.post(`/posts/${postId}/repost`),
  share: (postId, channel = 'web') => api.post(`/posts/${postId}/share`, { channel }),
  like: (postId) => api.post(`/posts/${postId}/like`),
  markViewed: (postId) => api.post(`/posts/${postId}/view`)
};

export const CommentAPI = {
  getAll: (postId, page = 1) => api.get(`/posts/${postId}/comments?page=${page}`),
  add: (postId, body) => api.post(`/posts/${postId}/comments`, { body })
};

export const DiscoveryAPI = {
  search: (query, page = 1) => api.get(`/discover/search?q=${encodeURIComponent(query)}&page=${page}`),
  categories: () => api.get('/discover/categories'),
  categoryPosts: (category, page = 1) => api.get(`/discover/categories/${category}/posts?page=${page}`)
};

export const UserAPI = {
  getProfile: (username) => api.get(`/users/${username}`),
  getMyProfile: () => api.get('/profile'),
  getUserPosts: (username, page = 1) => api.get(`/users/${username}/posts?page=${page}`),
  search: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`)
};

export const InboxAPI = {
  getConversations: () => api.get('/conversations'),
  start: (username) => api.post('/conversations', { username }),
  getMessages: (conversationId, page = 1) => api.get(`/conversations/${conversationId}/messages?page=${page}`),
  send: (conversationId, body) => api.post(`/conversations/${conversationId}/messages`, { body })
};
