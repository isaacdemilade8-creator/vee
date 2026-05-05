/**
 * screens/main/NotificationsScreen.js
 * In-app notifications for likes, comments, follows.
 */
import React, { useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePaginatedApi } from '../../hooks/useApi';
import { NotificationAPI } from '../../api/services';
import { formatDistanceToNow } from '../../utils/dateUtils';
import { Colors, Typography, Spacing } from '../../utils/theme';

const ICON_MAP = {
  like:    { name: 'heart', color: Colors.error },
  comment: { name: 'chatbubble', color: Colors.info },
  follow:  { name: 'person-add', color: Colors.success },
};

export default function NotificationsScreen() {
  const { items, loading, refreshing, loadMore, refresh } = usePaginatedApi(NotificationAPI.getAll);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  const renderItem = ({ item }) => {
    const icon = ICON_MAP[item.data?.type] || { name: 'notifications', color: Colors.primary };
    return (
      <View style={[styles.row, !item.read && styles.unread]}>
        <View style={styles.iconWrapper}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.message}>{item.data?.message}</Text>
          <Text style={styles.time}>{formatDistanceToNow(item.created_at)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
    );
  };

  if (loading && items.length === 0) return <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1 }} />;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      style={styles.container}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No activity yet</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  unread: { backgroundColor: '#FFF5F7' },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  content: { flex: 1 },
  message: { fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 18 },
  time: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 3 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary, marginTop: Spacing.md },
});
