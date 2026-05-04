import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { InboxAPI } from '../../api/services';
import { Colors, Spacing, Typography } from '../../utils/theme';
import { formatDistanceToNow } from '../../utils/dateUtils';

export default function InboxScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const res = await InboxAPI.getConversations();
      setConversations(res.data.conversations || []);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const refresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const renderConversation = ({ item }) => {
    const otherUser = item.other_user;
    const latest = item.latest_message;
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('Chat', { conversationId: item.id, user: otherUser })}
        activeOpacity={0.82}
      >
        <ProfileAvatar user={otherUser} size={54} openStory={false} />
        <View style={styles.rowText}>
          <View style={styles.rowTop}>
            <Text style={styles.username}>{otherUser?.username}</Text>
            {latest?.created_at ? <Text style={styles.time}>{formatDistanceToNow(latest.created_at)}</Text> : null}
          </View>
          <Text style={[styles.preview, item.unread_count > 0 && styles.unreadPreview]} numberOfLines={1}>
            {latest?.body || 'Start the conversation'}
          </Text>
        </View>
        {item.unread_count > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{item.unread_count}</Text></View> : null}
      </TouchableOpacity>
    );
  };

  if (loading) return <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1 }} />;

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderConversation}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="paper-plane-outline" size={46} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>Open a profile and tap Message to start a DM.</Text>
        </View>
      }
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  rowText: { flex: 1, marginLeft: Spacing.md },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  username: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  time: { fontSize: Typography.xs, color: Colors.textSecondary },
  preview: { marginTop: 4, fontSize: Typography.sm, color: Colors.textSecondary },
  unreadPreview: { color: Colors.textPrimary, fontWeight: '600' },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: Colors.white, fontSize: Typography.xs, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 90, paddingHorizontal: Spacing.xl },
  emptyTitle: { marginTop: Spacing.md, fontSize: Typography.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { marginTop: 6, textAlign: 'center', fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },
});
