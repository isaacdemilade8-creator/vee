/**
 * api/services.js
 *
 * All API call functions organized by domain.
 * Each function returns the full Axios response promise.
 * Error handling is done in the calling component/context.
 */

import apiClient, { buildFormData, uploadMultipart } from './client';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export const AuthAPI = {
  /** Register a new account */
  register: (data) => apiClient.post('/auth/register', data),

  /** Login with email/username and password */
  login: (data) => apiClient.post('/auth/login', data),

  /** Logout (revoke current token) */
  logout: () => apiClient.post('/auth/logout'),

  /** Get the currently authenticated user */
  me: () => apiClient.get('/auth/me'),
};

// ─────────────────────────────────────────────────────────────────────────────
// POST SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export const PostAPI = {
  /**
   * Get the personalized home feed (paginated).
   * @param {number} page - Page number (default 1)
   */
  getFeed: (page = 1) => apiClient.get(`/posts/feed?page=${page}`),

  /**
   * Get all posts in explore view (paginated).
   * @param {number} page - Page number
   */
  getAll: (page = 1) => apiClient.get(`/posts?page=${page}`),

  /** Get a single post by ID */
  getOne: (postId) => apiClient.get(`/posts/${postId}`),

  /**
   * Create a new post with an image.
   * @param {string} imageUri - Local image URI from image picker
   * @param {string} caption  - Optional caption text
   */
  create: (media = null, caption = null, extraFields = {}) => {
    if (!media) {
      return apiClient.post('/posts', { caption, ...extraFields });
    }

    return uploadMultipart('/posts', media, { caption, ...extraFields }, { mediaType: extraFields.media_type || extraFields.post_type });
  },

  /** Delete a post (owner only) */
  delete: (postId) => apiClient.delete(`/posts/${postId}`),
  repost: (postId) => apiClient.post(`/posts/${postId}/repost`),
  share: (postId, channel = 'system') => apiClient.post(`/posts/${postId}/share`, { channel }),
  markViewed: (postId) => apiClient.post(`/posts/${postId}/view`),
  votePoll: (postId, optionIndex) => apiClient.post(`/posts/${postId}/poll-vote`, { option_index: optionIndex }),
  analytics: (postId) => apiClient.get(`/posts/${postId}/analytics`),
};

// ─────────────────────────────────────────────────────────────────────────────
// LIKE SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export const LikeAPI = {
  /** Toggle like/unlike on a post */
  toggle: (postId) => apiClient.post(`/posts/${postId}/like`),

  /** Get users who liked a post */
  getLikers: (postId) => apiClient.get(`/posts/${postId}/likes`),
};

// ─────────────────────────────────────────────────────────────────────────────
// COMMENT SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export const CommentAPI = {
  /** Get all comments on a post (paginated) */
  getAll: (postId, page = 1) =>
    apiClient.get(`/posts/${postId}/comments?page=${page}`),

  /** Add a new comment to a post */
  add: (postId, body) =>
    apiClient.post(`/posts/${postId}/comments`, { body }),

  /** Delete a comment */
  delete: (postId, commentId) =>
    apiClient.delete(`/posts/${postId}/comments/${commentId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// USER / PROFILE SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export const UserAPI = {
  /** Get own profile */
  getMyProfile: () => apiClient.get('/profile'),

  /**
   * Update own profile (optional avatar image).
   * @param {object} data       - { full_name, bio, username }
   * @param {string} avatarUri  - Optional new avatar image URI
   */
  updateProfile: (data, avatar = null, coverPhoto = null) => {
    if (avatar || coverPhoto) {
      let formData = null;
      if (coverPhoto?.uri) {
        formData = buildFormData(avatar, data, { fieldName: 'avatar', mediaType: 'image' });
        const extension = (coverPhoto.uri.split('?')[0].match(/\.([a-zA-Z0-9]+)$/)?.[1] || 'jpg').toLowerCase();
        formData.append('cover_photo', {
          uri: coverPhoto.uri,
          name: coverPhoto.fileName || `cover.${extension}`,
          type: coverPhoto.mimeType || `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        });
      }
      if (avatar && !coverPhoto) {
        return uploadMultipart('/profile', avatar, data, { fieldName: 'avatar', mediaType: 'image' });
      }
      return apiClient.post('/profile', formData);
    }
    // No avatar change — use JSON
    return apiClient.post('/profile', data);
  },

  /** Get a user's public profile by username */
  getProfile: (username) => apiClient.get(`/users/${username}`),

  /** Get posts by a specific user */
  getUserPosts: (username, page = 1) =>
    apiClient.get(`/users/${username}/posts?page=${page}`),

  getUserReposts: (username, page = 1) =>
    apiClient.get(`/users/${username}/reposts?page=${page}`),

  /** Search users by query string */
  search: (query) =>
    apiClient.get(`/users/search?q=${encodeURIComponent(query)}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export const FollowAPI = {
  /** Toggle follow/unfollow for a user */
  toggle: (username) => apiClient.post(`/users/${username}/follow`),

  /** Get followers list */
  getFollowers: (username, page = 1) =>
    apiClient.get(`/users/${username}/followers?page=${page}`),

  /** Get following list */
  getFollowing: (username, page = 1) =>
    apiClient.get(`/users/${username}/following?page=${page}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export const NotificationAPI = {
  /** Get all notifications */
  getAll: (page = 1) => apiClient.get(`/notifications?page=${page}`),

  /** Mark all notifications as read */
  markAllRead: () => apiClient.post('/notifications/read-all'),

  /** Mark a specific notification as read */
  markRead: (id) => apiClient.post(`/notifications/${id}/read`),
};

export const InboxAPI = {
  getConversations: () => apiClient.get('/conversations'),
  start: (username) => apiClient.post('/conversations', { username }),
  getMessages: (conversationId, page = 1) =>
    apiClient.get(`/conversations/${conversationId}/messages?page=${page}`),
  send: (conversationId, body) =>
    apiClient.post(`/conversations/${conversationId}/messages`, { body }),
};

export const StoryAPI = {
  getAll: () => apiClient.get('/stories'),
  create: (media, caption = null) => {
    return uploadMultipart('/stories', media, { caption }, { mediaType: typeof media === 'object' ? media.type : undefined });
  },
  markViewed: (storyId) => apiClient.post(`/stories/${storyId}/view`),
  delete: (storyId) => apiClient.delete(`/stories/${storyId}`),
  getUserStories: (username) => apiClient.get(`/users/${username}/stories`),
};

export const DiscoveryAPI = {
  categories: () => apiClient.get('/discover/categories'),
  search: (query, page = 1) => apiClient.get(`/discover/search?q=${encodeURIComponent(query)}&page=${page}`),
  categoryPosts: (category, page = 1) => apiClient.get(`/discover/categories/${category}/posts?page=${page}`),
  hashtagPosts: (hashtag, page = 1) => apiClient.get(`/discover/hashtags/${hashtag}/posts?page=${page}`),
};
