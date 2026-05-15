import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { FollowAPI } from '../../api/services';
import { Colors, Spacing, Typography, useAppTheme } from '../../utils/theme';

export default function FollowListScreen({ route, navigation }) {
  const { username, type = 'followers' } = route.params || {};
  const { colors } = useAppTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const title = type === 'following' ? 'Following' : 'Followers';

  const loadUsers = useCallback(async (nextPage = 1, append = false) => {
    if (!username) return;
    if (nextPage === 1) setLoading(true);
    try {
      const request = type === 'following'
        ? FollowAPI.getFollowing(username, nextPage)
        : FollowAPI.getFollowers(username, nextPage);
      const res = await request;
      const key = type === 'following' ? 'following' : 'followers';
      const nextUsers = res.data[key] || [];
      setUsers((prev) => append ? [...prev, ...nextUsers] : nextUsers);
      setPage(res.data.meta?.current_page || nextPage);
      setHasMore((res.data.meta?.current_page || nextPage) < (res.data.meta?.last_page || nextPage));
    } catch (err) {
      Alert.alert('Could not load people', err.response?.data?.message || 'Try again in a moment.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type, username]);

  useEffect(() => {
    navigation.setOptions({ title });
    loadUsers(1, false);
  }, [loadUsers, navigation, title]);

  const refresh = () => {
    setRefreshing(true);
    loadUsers(1, false);
  };

  const loadMore = () => {
    if (!hasMore || loading) return;
    loadUsers(page + 1, true);
  };

  const openProfile = (item) => {
    navigation.navigate('UserProfile', { username: item.username });
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={() => openProfile(item)}
      activeOpacity={0.82}
    >
      <ProfileAvatar user={item} size={46} openStory={false} />
      <View style={styles.userInfo}>
        <Text style={[styles.username, { color: colors.textPrimary }]} numberOfLines={1}>{item.username}</Text>
        {item.full_name ? <Text style={[styles.fullName, { color: colors.textSecondary }]} numberOfLines={1}>{item.full_name}</Text> : null}
        {item.bio ? <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={1}>{item.bio}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  if (loading && users.length === 0) {
    return <ActivityIndicator size="large" color={colors.primary} style={[styles.loader, { backgroundColor: colors.background }]} />;
  }

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderUser}
      refreshing={refreshing}
      onRefresh={refresh}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      style={[styles.container, { backgroundColor: colors.background }]}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name={type === 'following' ? 'person-add-outline' : 'people-outline'} size={44} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No {title.toLowerCase()} yet</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>People will show up here when this list grows.</Text>
        </View>
      }
      ListFooterComponent={hasMore ? <ActivityIndicator color={colors.primary} style={styles.footerLoader} /> : null}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  userInfo: { flex: 1, marginLeft: Spacing.md },
  username: { fontSize: Typography.base, fontWeight: '800', color: Colors.textPrimary },
  fullName: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  bio: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 96, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: Typography.lg, fontWeight: '900', color: Colors.textPrimary, marginTop: Spacing.md },
  emptyText: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 18 },
  footerLoader: { paddingVertical: Spacing.lg },
});
