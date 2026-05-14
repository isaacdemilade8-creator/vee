import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { PostAPI } from '../../api/services';
import { Colors, BorderRadius, Spacing, Typography } from '../../utils/theme';
import { formatDistanceToNow } from '../../utils/dateUtils';

export default function PostAnalyticsScreen({ route }) {
  const { postId } = route.params;
  const tabBarHeight = useBottomTabBarHeight();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    PostAPI.analytics(postId)
      .then((res) => setAnalytics(res.data.analytics))
      .finally(() => setLoading(false));
  }, [postId]);

  if (loading) return <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1 }} />;
  if (!analytics) return null;

  const stats = [
    { label: 'Likes', value: analytics.likes, icon: 'heart' },
    { label: 'Comments', value: analytics.comments, icon: 'chatbubble' },
    { label: 'Shares', value: analytics.shares, icon: 'arrow-redo' },
    { label: 'Reposts', value: analytics.reposts, icon: 'repeat' },
    { label: 'Views', value: analytics.views, icon: 'eye' },
  ];

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + Spacing.xl }]}
      data={analytics.recent_comments || []}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <>
          <View style={styles.hero}>
            <Text style={styles.heroValue}>{analytics.engagements}</Text>
            <Text style={styles.heroLabel}>Total engagements</Text>
          </View>
          <View style={styles.grid}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Ionicons name={stat.icon} size={20} color={Colors.primary} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.sectionTitle}>Recent likers</Text>
          <View style={styles.likersRow}>
            {(analytics.recent_likers || []).map((user) => (
              <View key={user.id} style={styles.liker}>
                <ProfileAvatar user={user} size={42} openStory={false} />
                <Text style={styles.likerName} numberOfLines={1}>{user.username}</Text>
              </View>
            ))}
            {(analytics.recent_likers || []).length === 0 ? <Text style={styles.emptyText}>No likes yet.</Text> : null}
          </View>
          <Text style={styles.sectionTitle}>Recent comments</Text>
        </>
      }
      renderItem={({ item }) => (
        <View style={styles.commentRow}>
          <ProfileAvatar user={item.user} size={36} openStory={false} />
          <View style={styles.commentText}>
            <Text style={styles.commentUser}>{item.user?.username}</Text>
            <Text style={styles.commentBody}>{item.body}</Text>
            <Text style={styles.commentTime}>{formatDistanceToNow(item.created_at)}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No comments yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg },
  hero: { alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, marginBottom: Spacing.md },
  heroValue: { fontSize: 36, fontWeight: '800', color: Colors.textPrimary },
  heroLabel: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statCard: { width: '48%', backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  statValue: { fontSize: Typography.xxl, fontWeight: '800', color: Colors.textPrimary, marginTop: Spacing.sm },
  statLabel: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: Typography.base, fontWeight: '800', color: Colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.sm },
  likersRow: { flexDirection: 'row', gap: Spacing.md, minHeight: 62 },
  liker: { alignItems: 'center', width: 58 },
  likerName: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 4 },
  commentRow: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  commentText: { flex: 1, marginLeft: Spacing.sm },
  commentUser: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  commentBody: { fontSize: Typography.sm, color: Colors.textPrimary, marginTop: 2 },
  commentTime: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 4 },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.sm },
});
