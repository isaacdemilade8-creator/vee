/**
 * hooks/useApi.js
 *
 * Generic hook to wrap any API call with loading + error state.
 */

import { useState, useCallback } from 'react';

export function useApi(apiFunc) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunc(...args);
      setData(response.data);
      return { success: true, data: response.data };
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Something went wrong.';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  return { data, loading, error, execute };
}

export function usePaginatedApi(apiFunc) {
  const [items, setItems]     = useState([]);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState(null);

  const loadMore = useCallback(async (...args) => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const response = await apiFunc(page, ...args);
      const { posts, users, comments, notifications, meta } = response.data;
      const newItems = posts || users || comments || notifications || [];
      setItems((prev) => (page === 1 ? newItems : [...prev, ...newItems]));
      setHasMore(meta?.has_more || page < (meta?.last_page || 1));
      setPage((p) => p + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, apiFunc]);

  const refresh = useCallback(async (...args) => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    setItems([]);
    try {
      const response = await apiFunc(1, ...args);
      const { posts, users, comments, notifications, meta } = response.data;
      const newItems = posts || users || comments || notifications || [];
      setItems(newItems);
      setHasMore(meta?.has_more || 1 < (meta?.last_page || 1));
      setPage(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refresh.');
    } finally {
      setRefreshing(false);
    }
  }, [apiFunc]);

  return { items, loading, refreshing, hasMore, error, loadMore, refresh, setItems };
}
